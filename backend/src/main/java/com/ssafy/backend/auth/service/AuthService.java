package com.ssafy.backend.auth.service;

import com.ssafy.backend.common.enums.SocialProvider;
import com.ssafy.backend.config.jwt.JWTUtil;
import com.ssafy.backend.entity.Refresh;
import com.ssafy.backend.entity.User;
import com.ssafy.backend.exception.ErrorCode;
import com.ssafy.backend.exception.model.BadRequestException;
import com.ssafy.backend.exception.model.ConflictException;
import com.ssafy.backend.exception.model.NotFoundException;
import com.ssafy.backend.repository.RefreshRepository;
import com.ssafy.backend.repository.UserRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final JWTUtil jwtUtil;
    private final UserRepository userRepository;
    private final RefreshRepository refreshRepository;

    // 토큰 만료 시간 설정
    private long accessExpiration = 24 * 60 * 60 * 1000L; // 24시간
    private long refreshExpiration = 30 * 24 * 60 * 60 * 1000L; // 30일

    /**
     * 닉네임 중복 확인
     */
    public void checkNickname(String nickname) {
        if (userRepository.existsByNicknameAndDeletedFalse(nickname)) {
            throw new ConflictException(ErrorCode.NICKNAME_CONFLICT);
        }
    }

    /**
     * 게스트 사용자 조회 또는 생성
     */
    @Transactional
    public User getOrCreateGuestUser(String guestId) {
        // 기존 게스트 사용자 확인 (삭제된 것도 포함)
        Optional<User> existingUser = userRepository.findBySocialIdAndProvider(guestId, SocialProvider.guest);

        if (existingUser.isPresent()) {
            return existingUser.get();
        }

        // 신규 게스트 사용자 생성
        return createNewGuestUser(guestId);
    }

    /**
     * 새로운 게스트 사용자 생성
     */
    private User createNewGuestUser(String guestId) {
        String nickname = generateUniqueGuestNickname();

        User guestUser = User.builder()
                .socialId(guestId)
                .provider(SocialProvider.guest)
                .nickname(nickname)
                .createdAt(LocalDateTime.now())
                .deleted(false)
                .role("USER")
                .expiresAt(LocalDateTime.now().plusHours(24)) // 24시간 후 만료
                .build();

        return userRepository.save(guestUser);
    }

    /**
     * 숫자 2자리로 구분하는 게스트 닉네임 생성
     */
    private String generateUniqueGuestNickname() {
        String[] names = {
                "신비탐정", "용감수사관", "똑똑요원", "영리조사관",
                "날쌘수사꾼", "예리추리꾼", "침착해결꾼",
                "수사대장", "단서박사", "논리달인",
                "사건추적", "퍼즐헌터", "단서마스터"
        };

        String name = names[(int)(Math.random() * names.length)];

        // 00~99 랜덤 숫자 2자리
        int randomNumber = (int)(Math.random() * 100);
        String numberSuffix = String.format("%02d", randomNumber);

        return name + numberSuffix;
    }

    /**
     * 회원가입
     */
    public User join(String socialId, String nickname) {
        // 닉네임 중복 체크
        checkNickname(nickname);

        // 소셜 ID 중복 체크
        if (userRepository.existsBySocialIdAndDeletedFalse(socialId)) {
            throw new ConflictException(ErrorCode.USER_CONFLICT);
        }

        // User 생성시 Builder 패턴 사용
        User user = User.builder()
                .socialId(socialId)
                .provider(SocialProvider.google)
                .nickname(nickname)
                .createdAt(LocalDateTime.now())
                .deleted(false)
                .role("USER")
                .build();

        return userRepository.save(user);
    }

    /**
     * 토큰 생성 및 쿠키 설정을 위한 공통 메서드
     */
    @Transactional
    public HttpHeaders generateAuthTokens(User user, HttpServletResponse response) {
        Long userId = user.getUserId();
        String nickname = user.getNickname();
        String role = user.getRole();

        // JWT 생성
        String accessToken = jwtUtil.createJwt("access", userId, nickname, role, accessExpiration);
        String refreshToken = jwtUtil.createJwt("refresh", userId, nickname, role, refreshExpiration);

        // DB에 리프레시 토큰 저장
        saveRefreshToken(userId, refreshToken);

        // Access Token → Authorization 헤더로 설정
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken);

        // Refresh Token → HttpOnly 쿠키로 설정
        Cookie refreshCookie = new Cookie("refresh", refreshToken);
        refreshCookie.setMaxAge((int) (refreshExpiration / 1000)); // 30일
        refreshCookie.setPath("/api/auth");
        refreshCookie.setHttpOnly(true);
        refreshCookie.setSecure(true);
        refreshCookie.setAttribute("SameSite", "Strict");
        response.addCookie(refreshCookie);

        return headers;
    }

    /**
     * 리프레시 토큰을 DB에 저장하는 메서드
     */
    private void saveRefreshToken(Long userId, String refreshToken) {
        // 만료 시간 계산
        LocalDateTime expiryDate = LocalDateTime.ofInstant(
                Instant.now().plusMillis(refreshExpiration),
                ZoneId.systemDefault()
        );

        // 기존 토큰이 있는지 확인하고, 있으면 업데이트. 없으면 새로 생성
        Refresh refreshEntity = refreshRepository.findById(userId)
                .orElse(new Refresh());

        // 리프레시 토큰 정보 설정
        refreshEntity.setUserId(userId);
        refreshEntity.setRefresh(refreshToken);
        refreshEntity.setExpiryDate(expiryDate);

        // 저장
        refreshRepository.save(refreshEntity);
    }

    /**
     * 쿠키에서 refresh 토큰 추출
     */
    public String extractRefreshTokenFromCookies(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("refresh".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    /**
     * 리프레시 토큰 유효성 검증
     */
    public boolean validateRefreshToken(String refreshToken) {
        // refresh가 DB에 존재하는지 확인
        Optional<Refresh> refreshOpt = refreshRepository.findByRefresh(refreshToken);
        if (refreshOpt.isEmpty()) {
            return false;
        }

        // JWT 토큰 자체 유효성 검증
        if (!jwtUtil.validateToken(refreshToken)) {
            return false;
        }

        // 토큰 유형 확인
        if (!"refresh".equals(jwtUtil.getCategory(refreshToken))) {
            return false;
        }

        // DB 저장된 토큰 만료 시간 확인
        Refresh refresh = refreshOpt.get();
        return LocalDateTime.now().isBefore(refresh.getExpiryDate());
    }

    /**
     * refresh 토큰으로부터 사용자 ID를 조회
     */
    public Long getUserIdByRefreshToken(String refreshToken) {
        return refreshRepository.findByRefresh(refreshToken)
                .map(Refresh::getUserId)
                .orElse(-1L);
    }

    /**
     * logout - 리프레시 토큰 삭제
     */
    @Transactional
    public void logout(Long userId) {
        refreshRepository.deleteById(userId);
    }

    /**
     * 게스트를 정회원으로 마이그레이션
     */
    @Transactional
    public User migrateGuestToMember(Long guestUserId, String socialId, String newNickname) {
        // 1. 게스트 사용자 확인
        User guestUser = userRepository.findById(guestUserId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        if (!SocialProvider.guest.equals(guestUser.getProvider())) {
            throw new BadRequestException(ErrorCode.INVALID_MIGRATION);
        }

        // 2. 구글 계정 중복 확인
        if (userRepository.existsBySocialIdAndDeletedFalse(socialId)) {
            throw new BadRequestException(ErrorCode.USER_ALREADY_EXISTS);
        }

        // 3. 닉네임 중복 확인
        checkNickname(newNickname);

        // 4. 게스트 → 구글 사용자로 전환
        guestUser.setProvider(SocialProvider.google);
        guestUser.setSocialId(socialId);
        guestUser.setNickname(newNickname);
        guestUser.setExpiresAt(null); // 만료일 제거 (정회원은 만료되지 않음)

        log.info("게스트 마이그레이션 완료: userId={}, newNickname={}, socialId={}",
                guestUserId, newNickname, socialId);

        return userRepository.save(guestUser);
    }

    /**
     * 게스트 사용자 조회 (마이그레이션용)
     */
    public User findGuestUserById(Long guestUserId) {
        User user = userRepository.findById(guestUserId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        if (!SocialProvider.guest.equals(user.getProvider())) {
            throw new BadRequestException(ErrorCode.INVALID_MIGRATION);
        }

        return user;
    }
}