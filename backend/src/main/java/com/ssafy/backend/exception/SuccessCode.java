package com.ssafy.backend.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

/**
 * 성공 응답 코드 및 메시지 관리
 */
@Getter
@RequiredArgsConstructor
public enum SuccessCode {

    // ===== 인증 관련 =====
    LOGIN_SUCCESS(HttpStatus.OK, "로그인에 성공했습니다."),
    LOGOUT_SUCCESS(HttpStatus.OK, "로그아웃되었습니다."),
    SIGNUP_SUCCESS(HttpStatus.CREATED, "회원가입이 완료되었습니다."),
    TOKEN_REFRESH_SUCCESS(HttpStatus.OK, "토큰이 갱신되었습니다."),

    // ===== 기본 CRUD 작업 =====
    CREATE_SUCCESS(HttpStatus.CREATED, "생성이 완료되었습니다."),
    UPDATE_SUCCESS(HttpStatus.OK, "수정이 완료되었습니다."),
    DELETE_SUCCESS(HttpStatus.OK, "삭제가 완료되었습니다."),

    // ===== 조회 작업 (데이터 중심이므로 선택적) =====
    GET_SUCCESS(HttpStatus.OK, "조회가 완료되었습니다."),

    // ===== 자주 사용되는 특정 작업들 =====
    NICKNAME_CHECK_SUCCESS(HttpStatus.OK, "사용 가능한 닉네임입니다."),

    // ===== 평가 관련 =====
    EVALUATION_COMPLETE(HttpStatus.OK, "평가가 완료되었습니다."),
    PROBLEM_SAVE_COMPLETE(HttpStatus.CREATED, "문제 저장이 완료되었습니다."),
    ALREADY_EVALUATED(HttpStatus.OK, "이미 평가했습니다."),

    // ===== AI 관련 =====
    AI_PROBLEM_GENERATE_SUCCESS(HttpStatus.CREATED, "AI 문제 생성 완료"),
    AI_TODAY_PROBLEM_HISTORY_SUCCESS(HttpStatus.OK, "AI 오늘의 문제 조회 완료"),
    AI_QUESTION_SUCCESS(HttpStatus.OK, "AI 질문 응답 완료"),
    AI_ANSWER_SUCCESS(HttpStatus.OK, "AI 정답 응답 완료")

    ;


    private final HttpStatus status;
    private final String message;
}