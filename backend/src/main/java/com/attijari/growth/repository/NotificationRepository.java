package com.attijari.growth.repository;

import com.attijari.growth.model.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByRecipientUserIdOrderByCreatedAtDesc(String userId);
    List<Notification> findByRecipientUserIdAndRead(String userId, boolean read);
    long countByRecipientUserIdAndRead(String userId, boolean read);
}
