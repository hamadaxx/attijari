package com.attijari.growth.repository;

import com.attijari.growth.model.ScoringConfig;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ScoringConfigRepository extends MongoRepository<ScoringConfig, String> {
    Optional<ScoringConfig> findByStatus(ScoringConfig.ScoringConfigStatus status);
    List<ScoringConfig> findAllByOrderByProposedAtDesc();
    List<ScoringConfig> findByProposedBy(String userId);
}
