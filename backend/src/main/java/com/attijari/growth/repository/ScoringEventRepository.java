package com.attijari.growth.repository;

import com.attijari.growth.model.ScoringEvent;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ScoringEventRepository extends MongoRepository<ScoringEvent, String> {
    List<ScoringEvent> findByUserIdOrderByOccurredAtDesc(String userId);
    List<ScoringEvent> findByUserIdAndType(String userId, ScoringEvent.ScoringEventType type);
    long countByUserIdAndType(String userId, ScoringEvent.ScoringEventType type);
}
