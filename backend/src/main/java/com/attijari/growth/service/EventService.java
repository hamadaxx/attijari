package com.attijari.growth.service;

import com.attijari.growth.dto.request.EventRequest;
import com.attijari.growth.exception.BadRequestException;
import com.attijari.growth.exception.NotFoundException;
import com.attijari.growth.model.Event;
import com.attijari.growth.model.ScoringEvent;
import com.attijari.growth.model.User;
import com.attijari.growth.repository.EventRepository;
import com.attijari.growth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventService {

    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final ScoringService scoringService;

    // logger is provided by @Slf4j

    /**
     * Create an event (CM or Mentor)
     * If created by Mentor → requires CM validation (US 1.2b Scenario 1)
     */
    public Event createEvent(String organizerId, EventRequest request, boolean isMentor) {
        User organizer = userRepository.findById(organizerId)
                .orElseThrow(() -> new NotFoundException("Organisateur non trouvé."));

        Event event = new Event();
        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setType(request.getType());
        event.setOrganizerId(organizerId);
        event.setOrganizerName(organizer.getFirstName() + " " + organizer.getLastName());
        event.setStartDateTime(request.getStartDateTime());
        event.setEndDateTime(request.getEndDateTime());

        // Mentor-proposed webinars need CM approval before appearing
        if (isMentor) {
            event.setStatus(Event.EventStatus.PENDING_CM_VALIDATION);
        } else {
            event.setStatus(Event.EventStatus.UPCOMING);
            event.setCmValidated(true);
            event.setCmValidatedBy(organizerId);
        }

        return eventRepository.save(event);
    }

    /**
     * US 1.2b Scenario 1 – CM validates a mentor-proposed event
     */
    public Event validateEvent(String eventId, String cmUserId) {
        Event event = getById(eventId);
        if (event.getStatus() != Event.EventStatus.PENDING_CM_VALIDATION) {
            throw new BadRequestException("Cet événement n'est pas en attente de validation.");
        }
        event.setStatus(Event.EventStatus.UPCOMING);
        event.setCmValidated(true);
        event.setCmValidatedBy(cmUserId);
        event.setUpdatedAt(LocalDateTime.now());
        return eventRepository.save(event);
    }

    /**
     * US 1.2a – Entrepreneur registers for an event
     */
    public Event registerForEvent(String eventId, String userId) {
        Event event = getById(eventId);

        if (event.getStatus() != Event.EventStatus.UPCOMING) {
            throw new BadRequestException("Les inscriptions ne sont pas ouvertes pour cet événement.");
        }
        if (event.getRegisteredUserIds().contains(userId)) {
            throw new BadRequestException("Vous êtes déjà inscrit à cet événement.");
        }

        event.getRegisteredUserIds().add(userId);
        event.setUpdatedAt(LocalDateTime.now());
        return eventRepository.save(event);
    }

    /**
     * US 1.2a – Cancel registration
     */
    public Event cancelRegistration(String eventId, String userId) {
        Event event = getById(eventId);

        if (!event.getRegisteredUserIds().contains(userId)) {
            throw new BadRequestException("Vous n'êtes pas inscrit à cet événement.");
        }
        if (event.getStatus() != Event.EventStatus.UPCOMING) {
            throw new BadRequestException("Impossible d'annuler après le début de l'événement.");
        }

        event.getRegisteredUserIds().remove(userId);
        event.setUpdatedAt(LocalDateTime.now());
        return eventRepository.save(event);
    }

    /**
     * US 1.2a Scenario 1 & 2 – Confirm attendance after event ends
     * Grants +10 points to attendees, tracks no-shows
     */
    public void processEventAttendance(String eventId, List<String> attendedUserIds) {
        Event event = getById(eventId);
        event.setStatus(Event.EventStatus.COMPLETED);

        // Set replay expiry: 30 days (US 1.2a Scenario 3)
        event.setReplayExpiresAt(LocalDateTime.now().plusDays(30));

        for (String userId : event.getRegisteredUserIds()) {
            if (attendedUserIds.contains(userId)) {
                event.getAttendedUserIds().add(userId);
                // Award +10 points for attendance
                scoringService.applyScore(
                    userId,
                    ScoringEvent.ScoringEventType.EVENT_ATTENDED,
                    10,
                    eventId,
                    "Participation confirmée à l'événement: " + event.getTitle()
                );
            } else {
                event.getNoShowUserIds().add(userId);
                // Check for 3 consecutive no-shows across all events
                checkAndApplyNoShowPenalty(userId, eventId);
            }
        }

        event.setAttendedUserIds(attendedUserIds);
        event.setUpdatedAt(LocalDateTime.now());
        eventRepository.save(event);
    }

    /**
     * US 1.2a Scenario 2 – Apply -5 points after 3 no-shows
     */
    private void checkAndApplyNoShowPenalty(String userId, String eventId) {
        // Count total no-show events across all events for this user
        long noShowCount = eventRepository.findByNoShowUserIdsContaining(userId).size();

        if (noShowCount > 0 && noShowCount % 3 == 0) {
            scoringService.applyScore(
                userId,
                ScoringEvent.ScoringEventType.EVENT_ABSENCE_PENALTY,
                -5,
                eventId,
                "Pénalité pour 3 absences consécutives non justifiées"
            );
        }
    }

    public Event getById(String id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Événement non trouvé."));
    }

    public List<Event> getUpcomingEvents() {
        return eventRepository.findByStatus(Event.EventStatus.UPCOMING);
    }

    public List<Event> getUserRegistrations(String userId) {
        return eventRepository.findByRegisteredUserIdsContaining(userId);
    }

    public List<Event> getMentorEvents(String mentorId) {
        return eventRepository.findByOrganizerId(mentorId);
    }

    /**
     * US 1.2b Scenario 2 – Attendee rates a completed event (1-5).
     * One rating per user. Updates running average on the event and on the mentor's profile.
     * Checks for under-performing mentor (US 1.2b Scenario 3).
     */
    public Event rateEvent(String eventId, String userId, int rating) {
        Event event = getById(eventId);

        if (event.getStatus() != Event.EventStatus.COMPLETED) {
            throw new BadRequestException("Vous ne pouvez noter qu'un événement terminé.");
        }
        if (!event.getAttendedUserIds().contains(userId)) {
            throw new BadRequestException("Seuls les participants confirmés peuvent noter cet événement.");
        }
        if (event.getRatings().containsKey(userId)) {
            throw new BadRequestException("Vous avez déjà noté cet événement.");
        }

        event.getRatings().put(userId, rating);

        // Recompute average
        double avg = event.getRatings().values().stream()
                .mapToInt(Integer::intValue).average().orElse(0.0);
        event.setMentorRating(avg);
        event.setRatingCount(event.getRatings().size());
        event.setUpdatedAt(LocalDateTime.now());
        eventRepository.save(event);

        // Update mentor's overall profile rating
        updateMentorRating(event.getOrganizerId());

        return event;
    }

    /**
     * Recomputes the mentor's cumulative average rating from all their completed webinars.
     * Flags the mentor when their average < 3 on the last 3 consecutive events (US 1.2b Scenario 3).
     */
    private void updateMentorRating(String mentorId) {
        List<Event> mentorEvents = eventRepository.findByOrganizerIdAndStatus(
                mentorId, Event.EventStatus.COMPLETED);

        if (mentorEvents.isEmpty()) return;

        // Overall average
        double overallAvg = mentorEvents.stream()
                .filter(e -> e.getMentorRating() != null)
                .mapToDouble(Event::getMentorRating)
                .average().orElse(0.0);

        int totalRatings = mentorEvents.stream().mapToInt(Event::getRatingCount).sum();

        userRepository.findById(mentorId).ifPresent(mentor -> {
            mentor.setMentorAverageRating(overallAvg);
            mentor.setMentorRatingCount(totalRatings);

            // Check last 3 consecutive rated events for under-performance
            List<Event> lastThree = mentorEvents.stream()
                    .filter(e -> e.getMentorRating() != null && e.getMentorRating() > 0)
                    .sorted((a, b) -> b.getUpdatedAt().compareTo(a.getUpdatedAt()))
                    .limit(3)
                    .toList();

            boolean shouldFlag = lastThree.size() == 3
                    && lastThree.stream().allMatch(e -> e.getMentorRating() < 3.0);

            if (shouldFlag && !mentor.isMentorFlagged()) {
                mentor.setMentorFlagged(true);
                log.warn("Mentor {} flagged for under-performance (avg < 3 on last 3 events)", mentorId);
            }

            userRepository.save(mentor);
        });
    }
}
