package com.attijari.growth.repository;

import com.attijari.growth.model.KybDossier;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface KybRepository extends MongoRepository<KybDossier, String> {
    Optional<KybDossier> findByUserId(String userId);
    Optional<KybDossier> findByProfileId(String profileId);
    List<KybDossier> findByStatusIn(List<KybDossier.KybStatus> statuses);
    List<KybDossier> findAllByOrderBySubmittedAtDesc();
}
