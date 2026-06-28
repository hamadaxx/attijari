package com.attijari.growth.repository;

import com.attijari.growth.model.EntrepreneurProfile;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface EntrepreneurProfileRepository extends MongoRepository<EntrepreneurProfile, String> {
    Optional<EntrepreneurProfile> findByUserId(String userId);
    List<EntrepreneurProfile> findByStatus(EntrepreneurProfile.ProfileStatus status);
    List<EntrepreneurProfile> findByBusinessSector(String sector);
    List<EntrepreneurProfile> findByStatusAndBusinessSector(EntrepreneurProfile.ProfileStatus status, String sector);
    List<EntrepreneurProfile> findByStatusAndLastActivityAtBetween(
            EntrepreneurProfile.ProfileStatus status, LocalDateTime from, LocalDateTime to);
    List<EntrepreneurProfile> findByStatusAndIntelligenceScoreGreaterThanEqual(
            EntrepreneurProfile.ProfileStatus status, int minScore);
    Optional<EntrepreneurProfile> findByKybDossierId(String kybDossierId);
}
