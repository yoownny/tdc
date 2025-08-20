package com.ssafy.backend.repository;

import com.ssafy.backend.entity.UserSolvedProblem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserSolvedProblemRepository extends JpaRepository<UserSolvedProblem, Long> {
    
    List<UserSolvedProblem> findByUserId(Long userId);
    
    List<UserSolvedProblem> findByProblemId(Long problemId);
    
    Optional<UserSolvedProblem> findByUserIdAndProblemId(Long userId, Long problemId);
    
    long countByUserIdAndIsWinner(Long userId, Boolean isWinner);
}