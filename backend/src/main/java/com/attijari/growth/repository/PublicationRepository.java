package com.attijari.growth.repository;

import com.attijari.growth.model.Publication;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface PublicationRepository extends MongoRepository<Publication, String> {
    List<Publication> findByStatus(Publication.PublicationStatus status);
    List<Publication> findByAuthorId(String authorId);
    List<Publication> findByStatusOrderByPublishedAtDesc(Publication.PublicationStatus status);
    long countByAuthorIdAndStatus(String authorId, Publication.PublicationStatus status);
}
