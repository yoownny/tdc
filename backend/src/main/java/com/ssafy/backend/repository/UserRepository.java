package com.ssafy.backend.repository;

import com.ssafy.backend.common.enums.SocialProvider;
import com.ssafy.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findBySocialId(String socialId);

    Optional<User> findBySocialIdAndProvider(String socialId, SocialProvider provider);

    // 게스트 정리용
    List<User> findByProviderAndExpiresAtBefore(SocialProvider provider, LocalDateTime dateTime);
    
    boolean existsBySocialIdAndDeletedFalse(String socialId);
    
    boolean existsByNicknameAndDeletedFalse(String nickname);

    Optional<User> findByUserId(Long userId);

    List<User> findTop10ByOrderByTotalGamesDesc();

}
