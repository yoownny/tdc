package com.ssafy.backend.repository;

import com.ssafy.backend.entity.Genre;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface GenreRepository extends JpaRepository<Genre, Long> {
    Optional<Genre> findByName(String name);

    @Query(value = "SELECT * FROM genres ORDER BY RAND() LIMIT 1", nativeQuery = true) // MySQL 고유 함수 RAND()  -> JPQL에서 지원하지 않으므로 nativeQuery로 사용해야 함
    Optional<Genre> findRandomGenre();
}
