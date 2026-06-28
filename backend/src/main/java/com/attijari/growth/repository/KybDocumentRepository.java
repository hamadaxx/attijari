package com.attijari.growth.repository;

import com.attijari.growth.model.KybDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface KybDocumentRepository extends MongoRepository<KybDocument, String> {
}
