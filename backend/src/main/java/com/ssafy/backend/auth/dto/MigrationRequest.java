package com.ssafy.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class MigrationRequest {

    @NotNull(message = "게스트 사용자 ID는 필수입니다.")
    private Long guestUserId;

    @NotBlank(message = "소셜 ID는 필수입니다.")
    private String socialId;

    @NotBlank(message = "닉네임은 필수입니다.")
    private String newNickname;
}