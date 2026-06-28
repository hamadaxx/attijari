package com.attijari.growth.service;

import com.attijari.growth.exception.NotFoundException;
import com.attijari.growth.model.EntrepreneurProfile;
import com.attijari.growth.model.Notification;
import com.attijari.growth.model.User;
import com.attijari.growth.repository.NotificationRepository;
import com.attijari.growth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    /**
     * US 2.2b Scenario 1 – When a startup crosses the pre-qualification threshold,
     * notify all Fund Managers whose sector interests match (or all if unfiltered).
     */
    public void notifyFundManagersThresholdCrossed(EntrepreneurProfile profile) {
        String companyName = profile.getCompanyName() != null
                ? profile.getCompanyName()
                : "Startup ID " + profile.getId();

        List<User> fundManagers = userRepository.findAll().stream()
                .filter(u -> u.getRoles().contains("ROLE_FUND_MANAGER"))
                .toList();

        for (User fm : fundManagers) {
            // US 2.2b Scenario 2: filter by sector interest if the FM has preferences set
            List<String> interests = fm.getSectorInterests();
            if (interests != null && !interests.isEmpty()
                    && !interests.contains(profile.getBusinessSector())) {
                continue;
            }

            Notification notification = Notification.thresholdCrossed(
                    fm.getId(), companyName, profile.getIntelligenceScore(), profile.getId());
            notificationRepository.save(notification);
            log.info("Threshold notification sent to fund manager {} for startup {}",
                    fm.getId(), profile.getId());
        }
    }

    /**
     * US 2.2b Scenario 3 – Returns notifications for a user,
     * auto-escalating those unread for more than 72 hours.
     */
    public List<Notification> getForUser(String userId) {
        List<Notification> notifications =
                notificationRepository.findByRecipientUserIdOrderByCreatedAtDesc(userId);

        LocalDateTime escalationCutoff = LocalDateTime.now().minusHours(72);
        boolean anyEscalated = false;

        for (Notification n : notifications) {
            if (!n.isRead() && !n.isEscalated()
                    && n.getCreatedAt().isBefore(escalationCutoff)) {
                n.setEscalated(true);
                anyEscalated = true;
            }
        }

        if (anyEscalated) {
            notificationRepository.saveAll(notifications);
        }

        return notifications;
    }

    public long countUnread(String userId) {
        return notificationRepository.countByRecipientUserIdAndRead(userId, false);
    }

    public Notification markAsRead(String notificationId, String userId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new NotFoundException("Notification introuvable."));

        if (!n.getRecipientUserId().equals(userId)) {
            throw new NotFoundException("Notification introuvable.");
        }

        n.setRead(true);
        n.setReadAt(LocalDateTime.now());
        return notificationRepository.save(n);
    }

    public void markAllAsRead(String userId) {
        List<Notification> unread =
                notificationRepository.findByRecipientUserIdAndRead(userId, false);
        unread.forEach(n -> {
            n.setRead(true);
            n.setReadAt(LocalDateTime.now());
        });
        notificationRepository.saveAll(unread);
    }
}
