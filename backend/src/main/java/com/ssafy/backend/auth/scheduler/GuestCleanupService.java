package com.ssafy.backend.auth.scheduler;

import com.ssafy.backend.common.enums.SocialProvider;
import com.ssafy.backend.entity.User;
import com.ssafy.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class GuestCleanupService {

    private final UserRepository userRepository;

    // 매일 새벽 3시에 만료된 게스트 데이터 정리
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void cleanupExpiredGuestUsers() {
        log.info("만료된 게스트 사용자 정리 시작");

        LocalDateTime now = LocalDateTime.now();

        // 만료된 게스트 사용자 조회
        List<User> expiredGuests = userRepository.findByProviderAndExpiresAtBefore(
                SocialProvider.guest, now);

        log.info("만료 대상 게스트 사용자 {}명 발견", expiredGuests.size());

        // 간단한 반복문으로 is_deleted 필드 수정
        expiredGuests.forEach(guest -> {
            try {
                guest.setDeleted(true);
                userRepository.save(guest);
                log.info("게스트 사용자 정리 완료: userId={}, nickname={}",
                        guest.getUserId(), guest.getNickname());
            } catch (Exception e) {
                log.error("게스트 사용자 정리 실패: userId={}", guest.getUserId(), e);
            }
        });

        log.info("만료된 게스트 사용자 정리 완료: {}명 정리", expiredGuests.size());
    }
}