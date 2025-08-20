package com.ssafy.backend.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.backend.ai.dto.request.AiProblemRequestDto;
import com.ssafy.backend.ai.dto.request.AnswerCheckRequestDto;
import com.ssafy.backend.ai.dto.request.GmsApiRequestDto;
import com.ssafy.backend.ai.dto.request.QuestionRequestDto;
import com.ssafy.backend.ai.dto.response.AiProblemResponseDto;
import com.ssafy.backend.ai.dto.response.AiTodayProblemResponseDto;
import com.ssafy.backend.ai.dto.response.AnswerCheckResponseDto;
import com.ssafy.backend.ai.dto.response.GmsApiResponseDto;
import com.ssafy.backend.ai.dto.response.QuestionResponseDto;
import com.ssafy.backend.common.enums.SolveType;
import com.ssafy.backend.common.enums.Source;
import com.ssafy.backend.entity.Genre;
import com.ssafy.backend.entity.Problem;
import com.ssafy.backend.entity.ProblemGenre;
import com.ssafy.backend.entity.ProblemInfo;
import com.ssafy.backend.entity.User;
import com.ssafy.backend.entity.UserCreatedProblem;
import com.ssafy.backend.entity.UserSolvedProblem;
import com.ssafy.backend.exception.ErrorCode;
import com.ssafy.backend.exception.model.NotFoundException;
import com.ssafy.backend.memory.type.Difficulty;
import com.ssafy.backend.repository.GenreRepository;
import com.ssafy.backend.repository.ProblemGenreRepository;
import com.ssafy.backend.repository.ProblemInfoRepository;
import com.ssafy.backend.repository.ProblemRepository;
import com.ssafy.backend.repository.UserCreatedProblemRepository;
import com.ssafy.backend.repository.UserRepository;
import com.ssafy.backend.repository.UserSolvedProblemRepository;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiProblemService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final ProblemRepository problemRepository;
    private final AiProblemRedisService aiProblemRedisService;
    private final GenreRepository genreRepository;
    private final ProblemGenreRepository problemGenreRepository;
    private final ProblemInfoRepository problemInfoRepository;
    private final UserRepository userRepository;
    private final UserCreatedProblemRepository userCreatedProblemRepository;
    private final UserSolvedProblemRepository userSolvedProblemRepository;

    @Value("${gms.api.key}")
    private String apiKey;

    @Value("${gms.api.base-url}")
    private String baseUrl;

    @Value("${gms.api.model}")
    private String model;

    public AiProblemResponseDto generateAiProblem(AiProblemRequestDto request) {
        try {
            // 프롬프트 생성
            String prompt = createPrompt(request.getGenres());

            // GMS API 요청 생성
            GmsApiRequestDto gmsRequest = createGmsRequest(prompt);

            // API 호출
            GmsApiResponseDto gmsResponse = callGmsApi(gmsRequest);

            // 응답 파싱
            return parseAiResponse(gmsResponse, request.getGenres());

        } catch (Exception e) {
            log.error("AI 문제 생성 실패: {}", e.getMessage(), e);
            throw new RuntimeException("AI 문제 생성 중 오류가 발생했습니다.");
        }
    }

    private String createPrompt(List<String> genres) {
        return String.format(
                "다음 장르에 맞는 이야기식 스무고개 문제를 생성해주세요: %s\n\n" +
                        "이야기식 스무고개는 흥미로운 상황을 제시하고 그 이유나 배경을 맞히는 추리 게임입니다.\n" +
                        "플레이어들은 예/아니오로 답할 수 있는 질문을 통해 숨겨진 진실을 찾아야 합니다.\n\n" +
                        "요구사항:\n" +
                        "1. 제목은 호기심을 자극하는 간단한 문구로 작성\n" +
                        "2. 상황 설명은 3-5문장으로 구성하되, 마지막에는 반드시 의문을 제기하는 질문으로 마무리\n" +
                        "   (예: '왜 그랬을까요?', '어떻게 가능했을까요?', '무엇이 문제였을까요?' 등)\n" +
                        "3. 정답은 상황의 핵심 포인트와 숨겨진 배경을 구체적으로 설명\n" +
                        "4. 장르에 맞는 분위기와 소재를 활용하되, 진부하지 않은 창의적인 설정 사용\n" +
                        "5. 난이도별 특징:\n" +
                        "   - EASY: 비교적 단순한 반전, 일반적인 상식으로 추론 가능\n" +
                        "   - NORMAL: 중간 수준의 사고력 필요, 여러 가지 가능성 고려 필요\n" +
                        "   - HARD: 복잡한 배경지식이나 다단계 추론 필요\n\n" +
                        "JSON 형식으로 답변해주세요:\n" +
                        "{\n" +
                        "  \"title\": \"문제 제목\",\n" +
                        "  \"content\": \"상황 설명 (의문형 질문으로 마무리)\",\n" +
                        "  \"answer\": \"상세한 정답 설명\",\n" +
                        "  \"difficulty\": \"EASY|NORMAL|HARD 중 하나\"\n" +
                        "}",
                String.join(", ", genres)
        );
    }

    private GmsApiRequestDto createGmsRequest(String prompt) {
        GmsApiRequestDto.Message systemMessage = new GmsApiRequestDto.Message("system",
                "당신은 이야기식 스무고개 문제를 만드는 전문가입니다. " +
                        "다양한 소재와 창의적인 상황을 활용하여 흥미롭고 독창적인 문제를 만들어주세요. " +
                        "진부한 설정보다는 참신하고 예상치 못한 반전이 있는 문제를 선호합니다.");
        GmsApiRequestDto.Message userMessage = new GmsApiRequestDto.Message("user", prompt);

        return new GmsApiRequestDto(model, List.of(systemMessage, userMessage), 1000, 0.9);
    }

    private GmsApiResponseDto callGmsApi(GmsApiRequestDto request) {
        return webClient.post()
                .uri(baseUrl + "/v1/chat/completions")
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(GmsApiResponseDto.class)
                .block();
    }

    private AiProblemResponseDto parseAiResponse(GmsApiResponseDto gmsResponse, List<String> genres) {
        try {
            String content = gmsResponse.getChoices().get(0).getMessage().getContent();

            // JSON 부분만 추출 (```json ``` 제거)
            String jsonContent = content;
            if (content.contains("```json")) {
                jsonContent = content.substring(content.indexOf("```json") + 7, content.lastIndexOf("```"));
            } else if (content.contains("```")) {
                jsonContent = content.substring(content.indexOf("```") + 3, content.lastIndexOf("```"));
            }

            // JSON 파싱
            JsonNode jsonNode = objectMapper.readTree(jsonContent.trim());

            return new AiProblemResponseDto(
                    jsonNode.get("title").asText(),
                    jsonNode.get("content").asText(),
                    jsonNode.get("answer").asText(),
                    genres,
                    Difficulty.valueOf(jsonNode.get("difficulty").asText())
            );

        } catch (Exception e) {
            log.error("AI 응답 파싱 실패: {}", e.getMessage(), e);
            throw new RuntimeException("AI 응답을 파싱하는 중 오류가 발생했습니다.");
        }
    }

    /**
     * 오늘의 AI 바거슾 문제 조회 (캐싱 포함)
     */
    @Transactional
    public Problem getTodayProblem() {
        // Redis 먼저 조회
        Problem cached = aiProblemRedisService.getTodayProblem();
        if (cached != null) return cached;

        // DB 조회 -> AI & isToday & 오늘 생성
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(23, 59, 59);
        Optional<Problem> todayProblem = problemRepository.findByIsTodayAndCreatedAtBetween(true, startOfDay, endOfDay);

        // 오늘 문제가 있으면 반환, 없으면 어제의 '오늘의 문제'를 찾아서 반환
        return todayProblem
            .or(problemRepository::findTopByIsTodayTrueOrderByCreatedAtDesc)
            .orElseThrow(() -> new NotFoundException(ErrorCode.AI_PROBLEM_NOT_FOUND)); // 둘 다 없으면 예외
    }

    /**
     * 오늘의 AI 바거슾 문제 생성 후 DB 저장
     */
    @Transactional
    public Problem generateAiTodayProblem() {
        // 랜덤 장르 하나 가져오기
        Genre randomGenre = genreRepository.findRandomGenre()
            .orElseThrow(() -> new IllegalStateException("생성 가능한 장르가 없습니다."));

        // 문제 생성
        AiProblemResponseDto aiProblemResponseDto = generateAiProblem(
            new AiProblemRequestDto(Collections.singletonList(randomGenre.getName()))
        );

        // 문제 본문, 제목, 정답 등을 저장
        Problem newProblem = Problem.builder()
            .creatorId(-1L) // todo; 오늘의 AI 문제 구분을 위한 flag
            .title(aiProblemResponseDto.getTitle())
            .content(aiProblemResponseDto.getContent())
            .answer(aiProblemResponseDto.getAnswer())
            .source(Source.AI)
            .isToday(true)
            .createdAt(LocalDateTime.now())
            .build();

        Problem saved = problemRepository.save(newProblem);

        // 난이도, 좋아요 수, 플레이 수 등 부가 정보 저장
        problemInfoRepository.save(ProblemInfo.builder()
            .id(saved.getId())
            .difficulty(Difficulty.NORMAL)
            .likes(0)
            .playCount(0)
            .successCount(0)
            .successRate(0.0)
            .build()
        );

        // 4. 유저-문제 생성 기록 저장
        // AI가 어떤 문제를 생성했는지 기록
        UserCreatedProblem createdProblem = UserCreatedProblem.builder()
            .userId(-1L)
            .problemId(saved.getId())
            .createdAt(LocalDateTime.now())
            .build();

        userCreatedProblemRepository.save(createdProblem);

        // 장르 매핑
        problemGenreRepository.save(ProblemGenre.builder()
            .problemId(saved.getId())
            .genreId(randomGenre.getId())
            .build()
        );

        return saved;
    }

    /**
     * AI 오늘의 바거슾 문제와 유저 히스토리 조회
     */
    @Transactional
    public AiTodayProblemResponseDto getTodayAiProblemHistory(Long userId) {
        // 오늘의 문제 조회
        Problem problem = getTodayProblem();

        // 유저 히스토리 조회
        Map<String, Object> userStats = aiProblemRedisService.getUserStats(problem.getId(), userId);

        // 유저 조회
        User user = userRepository.findByUserId(userId).orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        // 문제 푼 기록 조회
        Optional<UserSolvedProblem> userSolvedProblem = userSolvedProblemRepository.findByUserIdAndProblemId(userId, problem.getId());

        // 정답 여부 초기화
        boolean isWinner = false;

        // 유저가 처음으로 문제를 플레이한 경우
        if (userSolvedProblem.isEmpty()) {
            // 유저의 총 게임 참여 횟수 증가
            user.increaseTotalGames();

            // 유저가 푼 문제에 추가
            userSolvedProblemRepository.save(UserSolvedProblem.builder()
                .userId(userId)
                .problemId(problem.getId())
                .isWinner(false)
                .solvedAt(LocalDateTime.now())
                .solveType(SolveType.TODAY)
                .build());
            log.info("오늘의 AI 문제 푼 시도 추가 완료");
        }else { // 이미 시도했던 문제인 경우
            // 정답 여부 가져오기 -> todo; redis로 넘기기
            isWinner = userSolvedProblem.get().getIsWinner();
        }

        return AiTodayProblemResponseDto.from(problem, userStats, isWinner);
    }

    /**
     * AI 오늘의 바거슾 질문 처리
     */
    public QuestionResponseDto processQuestion(QuestionRequestDto request, Long userId) {
        try {
            log.info("질문 처리 시작 - problemId: {}, userQuestion: {}", request.getProblemId(), request.getUserQuestion());
            
            Problem problem = problemRepository.findById(request.getProblemId())
                    .orElseThrow(() -> new RuntimeException("문제를 찾을 수 없습니다."));
            
            log.info("문제 조회 완료 - title: {}, content: {}", problem.getTitle(), problem.getContent());
            
            String prompt = createQuestionPrompt(problem.getContent(), problem.getAnswer(), request.getUserQuestion());
            log.debug("생성된 프롬프트: {}", prompt);
            
            GmsApiRequestDto gmsRequest = createQuestionGmsRequest(prompt);
            GmsApiResponseDto gmsResponse = callGmsApi(gmsRequest);
            
            String response = gmsResponse.getChoices().get(0).getMessage().getContent().trim();
            log.info("AI 응답 원문: {}", response);
            
            // JSON 응답 파싱
            String finalResponse;
            String aiComment;
            try {
                // JSON 부분만 추출 (```json ``` 제거)
                String jsonContent = response;
                if (response.contains("```json")) {
                    jsonContent = response.substring(response.indexOf("```json") + 7, response.lastIndexOf("```"));
                } else if (response.contains("```")) {
                    jsonContent = response.substring(response.indexOf("```") + 3, response.lastIndexOf("```"));
                }
                
                JsonNode jsonNode = objectMapper.readTree(jsonContent.trim());
                finalResponse = jsonNode.get("answer").asText();
                aiComment = jsonNode.has("comment") ? jsonNode.get("comment").asText() : null;
                
            } catch (Exception e) {
                log.warn("JSON 파싱 실패, 기존 방식으로 처리: {}", e.getMessage());
                // 기존 방식으로 fallback
                if (response.contains("예")) {
                    finalResponse = "예";
                } else if (response.contains("아니오")) {
                    finalResponse = "아니오";
                } else {
                    finalResponse = "상관없음";
                }
                aiComment = null;
            }

            // Redis -> question history 추가 (AI comment 포함)
            aiProblemRedisService.addQuestion(problem.getId(), userId, request.getUserQuestion(), finalResponse, aiComment);

            log.info("최종 응답: {}, AI 코멘트: {}", finalResponse, aiComment);
            return new QuestionResponseDto(finalResponse, aiComment);
            
        } catch (Exception e) {
            log.error("질문 처리 실패: {}", e.getMessage(), e);
            throw new RuntimeException("질문 처리 중 오류가 발생했습니다.");
        }
    }

    /**
     * AI 오늘의 바거슾 정답 시도 처리
     */
    @Transactional
    public AnswerCheckResponseDto checkAnswer(AnswerCheckRequestDto request, Long userId) {
        try {
            log.info("정답 체크 시작 - problemId: {}, userAnswer: {}", request.getProblemId(), request.getUserAnswer());
            
            Problem problem = problemRepository.findById(request.getProblemId())
                    .orElseThrow(() -> new RuntimeException("문제를 찾을 수 없습니다."));

            log.info("정답 조회 완료 - answer: {}", problem.getAnswer());
            
            String prompt = createAnswerCheckPrompt(problem.getAnswer(), request.getUserAnswer());
            log.debug("생성된 프롬프트: {}", prompt);
            
            GmsApiRequestDto gmsRequest = createAnswerCheckGmsRequest(prompt);
            GmsApiResponseDto gmsResponse = callGmsApi(gmsRequest);
            
            String content = gmsResponse.getChoices().get(0).getMessage().getContent();
            log.info("AI 응답 원문: {}", content);
            
            // JSON 파싱
            JsonNode jsonNode = objectMapper.readTree(content.trim());
            int score = jsonNode.get("score").asInt();
            boolean isCorrect = jsonNode.get("is_correct").asBoolean();
            String aiComment = jsonNode.has("comment") ? jsonNode.get("comment").asText() : null;
            
            String message = isCorrect ? "맞습니다" : "틀렸습니다";
            
            log.info("정답 체크 결과 - score: {}, isCorrect: {}, message: {}, comment: {}", score, isCorrect, message, aiComment);

            // Redis -> guess history 추가 (AI comment 포함)
            aiProblemRedisService.addGuessWithAiComment(problem.getId(), userId, request.getUserAnswer(), message, score, isCorrect, request.getComment(), aiComment);

            // 맞은 경우 처리
            if(isCorrect) {
                // todo; Redis에서 questions_count, guess_count 가져옴
//                Map<String, Object> userStats = aiProblemRedisService.getUserStats(problem.getId(), userId);
//                int questionCount = (Integer) userStats.get("question_count");
//                int guessCount = (Integer) userStats.get("guess_count");

                // User 통계 update
                User user = userRepository.findByUserId(userId).orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));
                if (user != null) {
                    // 게임 통계 업데이트
                    user.increaseTodayAiSolvedCount();
                    user.increaseWins();

                    userRepository.save(user);

                    // 유저가 푼 문제를 맞은 문제로 변경
                    UserSolvedProblem userSolvedProblem = userSolvedProblemRepository.findByUserIdAndProblemId(userId,
                        problem.getId()).orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND));
                    userSolvedProblem.markAsWinner();
                    userSolvedProblem.updateSolvedAt();

                    log.debug("사용자 통계 업데이트: userId={}, totalGames={}, wins={}",
                        userId, user.getTotalGames(), user.getWins());
                } else {
                    log.warn("통계 업데이트 실패 - 사용자를 찾을 수 없음: userId={}", userId);
                }
            }
            return new AnswerCheckResponseDto(score, isCorrect, message, aiComment);
            
        } catch (Exception e) {
            log.error("정답 체크 실패: {}", e.getMessage(), e);
            throw new RuntimeException("정답 체크 중 오류가 발생했습니다.");
        }
    }

    private String createQuestionPrompt(String problem, String answer, String userQuestion) {
        return String.format(
                "역할: 바다거북수프 게임의 출제자\n" +
                "문제: %s\n" +
                "정답: %s\n\n" +
                "사용자 질문: %s\n\n" +
                "다음과 같이 응답해주세요:\n" +
                "1. 답변: \"예\", \"아니오\", \"상관없음\" 중 하나\n" +
                "   - \"예\" (질문이 정답과 직접적으로 관련되고 맞는 경우)\n" +
                "   - \"아니오\" (질문이 틀렸거나 관련 없는 경우)\n" +
                "   - \"상관없음\" (정답과 무관한 질문인 경우)\n" +
                "2. 간단한 코멘트: 직접적인 정답을 알려주지 말고 사용자 질문에 관련된 정답에 대한 힌트를 한 문장으로\n\n" +
                "JSON 형식으로 응답:\n" +
                "{\"answer\": \"예/아니오/상관없음\", \"comment\": \"힌트나 설명\"}",
                problem, answer, userQuestion
        );
    }

    private String createAnswerCheckPrompt(String correctAnswer, String userAnswer) {
        return String.format(
                "정답: %s\n" +
                "사용자 답변: %s\n\n" +
                "두 답변의 의미가 같은지 판단하고 유사도를 0-100으로 점수화하세요.\n" +
                "80점 이상이면 정답으로 인정합니다.\n\n" +
                "다음과 같이 응답해주세요:\n" +
                "1. 점수: 0-100 유사도 점수\n" +
                "2. 정답 여부: 80점 이상이면 true\n" +
                "3. 간단한 코멘트: 직접적인 정답을 알려주지 말고 사용자 답변에 관련된 정답에 대한 힌트를 한 문장으로\n\n" +
                "JSON 형식으로 응답:\n" +
                "{\"score\": 85, \"is_correct\": true, \"comment\": \"피드백 내용\"}",
                correctAnswer, userAnswer
        );
    }

    private GmsApiRequestDto createQuestionGmsRequest(String prompt) {
        GmsApiRequestDto.Message systemMessage = new GmsApiRequestDto.Message("system",
                "당신은 바다거북수프 게임의 출제자입니다. " +
                "사용자의 질문에 대해 정확히 '예', '아니오', '상관없음' 중 하나로만 답변하세요.");
        GmsApiRequestDto.Message userMessage = new GmsApiRequestDto.Message("user", prompt);

        return new GmsApiRequestDto(model, List.of(systemMessage, userMessage), 50, 0.1);
    }

    private GmsApiRequestDto createAnswerCheckGmsRequest(String prompt) {
        GmsApiRequestDto.Message systemMessage = new GmsApiRequestDto.Message("system",
                "당신은 정답의 유사도를 판단하는 전문가입니다. " +
                "두 답변의 의미적 유사도를 정확히 판단하고 JSON 형식으로 응답하세요.");
        GmsApiRequestDto.Message userMessage = new GmsApiRequestDto.Message("user", prompt);

        return new GmsApiRequestDto(model, List.of(systemMessage, userMessage), 100, 0.1);
    }
}