import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import DifficultySelect from "@/components/selects/DifficultySelect";
import GenreSelectionGroup from "@/components/selects/GenreSelectGroup";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle, Loader2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import type { SelectedProblem } from "@/types/problem/problem";
import { apiClient } from "@/services/api/apiClient";
import { useAuthStore } from "@/stores/authStore";
import { useNavigate } from "react-router-dom";
import { track } from "@amplitude/analytics-browser";
import { getKoreanTimestamp } from "@/utils/KoreanTimestamp";

interface CustomProblemFormProps {
  onSubmit: (problem: SelectedProblem) => void;
}

const CustomProblemForm = ({ onSubmit }: CustomProblemFormProps) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [answer, setAnswer] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<"EASY" | "NORMAL" | "HARD">("EASY");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState<string>("");
  const [dialogDesc, setDialogDesc] = useState<string>("");
  const [dialogCta, setDialogCta] = useState<string>("확인");
  const [showCancel, setShowCancel] = useState<boolean>(false);

  const { user } = useAuthStore();

  const openDialog = (opts: {
    title: string;
    desc: string;
    cta?: string;
    cancellable?: boolean;
  }) => {
    setDialogTitle(opts.title);
    setDialogDesc(opts.desc);
    setDialogCta(opts.cta ?? "확인");
    setShowCancel(!!opts.cancellable);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!user) {
      navigate("/signin");
      return;
    }

    track("problem_custom_create_attempted", {
      problem_title_length: title.length,
      problem_content_length: content.length,
      answer_length: answer.length,
      genres_count: genres.length,
      selected_difficulty: difficulty.toLowerCase(),
      timestamp: getKoreanTimestamp(),
    });

    const payload = {
      title,
      content,
      answer,
      genres,
      difficulty,
      creator: {
        id: user.userId,
        nickname: user.nickname,
      },
    };

    try {
      const createdProblem = await apiClient.post<SelectedProblem>("/problems/memory", payload);

      track("problem_custom_created", {
        problem_title_length: title.length,
        problem_content_length: content.length,
        answer_length: answer.length,
        genres_count: genres.length,
        selected_difficulty: difficulty.toLowerCase(),
        timestamp: getKoreanTimestamp(),
      });

      onSubmit({ ...createdProblem, problemType: "CUSTOM" });
    } catch (error) {
      track("problem_custom_create_failed", {
        error_reason: "api_error",
        problem_title_length: title.length,
        problem_content_length: content.length,
        timestamp: getKoreanTimestamp(),
      });
      console.error("문제 생성 실패:", error);
      openDialog({
        title: "문제 생성에 실패했어요",
        desc: "네트워크 또는 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      });
    }
  };

  const handleAIGenerate = async () => {
    if (genres.length === 0) {
      openDialog({
        title: "장르를 선택해주세요",
        desc: "AI 문제를 만들기 위해선선 최소 1개의 장르가 필요해요.",
      });
      return;
    }

    track("problem_ai_generate_attempted", {
      selected_genres: genres,
      timestamp: getKoreanTimestamp(),
    });

    setIsGeneratingAI(true);

    try {
      const response = await apiClient.post<{
        title: string;
        content: string;
        answer: string;
        genres: string[];
        difficulty: "EASY" | "NORMAL" | "HARD";
      }>("/ai/problems/generate", { genres });

      track("problem_ai_generated", {
        prompt_length: 0,
        generation_duration_seconds: 0,
        was_accepted: true,
        edit_attempts: 0,
        generated_difficulty: response.difficulty.toLowerCase(),
        timestamp: getKoreanTimestamp(),
      });

      setTitle(response.title);
      setContent(response.content);
      setAnswer(response.answer);
      setDifficulty(response.difficulty);

      openDialog({
        title: "AI가 문제를 생성했어요!",
        desc: "수정하고 싶은 부분이 있다면 수정한 뒤 게임을 진행해 주세요",
      });
    } catch (error) {
      track("problem_ai_generate_failed", {
        error_reason: "api_error",
        selected_genres: genres,
        timestamp: getKoreanTimestamp(),
      });

      console.error("AI 문제 생성 실패:", error);
      openDialog({
        title: "AI 문제 생성에 실패했어요",
        desc: "서버 응답에 문제가 있었어요. 잠시 후 다시 시도해보세요.",
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col">
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-black font-bold text-2xl font-ownglyph">{dialogTitle}</AlertDialogTitle>
            <AlertDialogDescription className="text-black text-sm">{dialogDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {showCancel && <AlertDialogCancel>취소</AlertDialogCancel>}
            <AlertDialogAction className="bg-gray hover:bg-gray"> {dialogCta} </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 px-6 py-4">
        <div className="flex items-center gap-2">
          <DifficultySelect value={difficulty} onValueChange={setDifficulty} />
          <GenreSelectionGroup selectedGenres={genres} onGenreChange={setGenres} required />
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  className="inline-flex items-center gap-1 cursor-pointer text-black hover:bg-point-200/50"
                  onClick={handleAIGenerate}
                  disabled={isGeneratingAI}
                >
                  {isGeneratingAI ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      AI 생성 중...
                    </>
                  ) : (
                    <>
                      AI 도움받기
                      <HelpCircle className="h-4 w-4 opacity-70" aria-hidden="true" />
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" align="center" className="max-w-xs leading-relaxed text-black">
                {genres.length === 0
                  ? "1개 이상의 장르를 선택한 후 AI 도움을 받을 수 있습니다!"
                  : "선택한 장르로 AI가 바다거북스프 문제를 생성해드려요!"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Input
          className="text-black py-4"
          placeholder="사건 제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Textarea
          className="text-black h-30"
          placeholder="사건 내용"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <Textarea placeholder="정답" value={answer} onChange={(e) => setAnswer(e.target.value)} />
      </div>

      <div className="sticky bottom-0 mt-auto bg-background/90 backdrop-blur px-6 py-4">
        <Button
          className="w-full text-white bg-gray hover:bg-gray mb-4"
          onClick={handleSubmit}
          disabled={!title || !content || !answer || genres.length === 0}
        >
          사건 작성 완료
        </Button>
      </div>
    </div>
  );
};

export default CustomProblemForm;