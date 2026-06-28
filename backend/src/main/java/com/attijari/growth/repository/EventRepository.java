package com.attijari.growth.repository;

import com.attijari.growth.model.Event;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface EventRepository extends MongoRepository<Event, String> {
    List<Event> findByStatus(Event.EventStatus status);
    List<Event> findByOrganizerId(String organizerId);
    List<Event> findByOrganizerIdAndStatus(String organizerId, Event.EventStatus status);
    List<Event> findByRegisteredUserIdsContaining(String userId);
    List<Event> findByAttendedUserIdsContaining(String userId);
    List<Event> findByNoShowUserIdsContaining(String userId);
}
