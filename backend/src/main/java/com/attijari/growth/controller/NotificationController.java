package com.attijari.growth.controller;

import com.attijari.growth.model.Notification;
import com.attijari.growth.repository.UserRepository;
import com.attijari.growth.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    /** US 2.2b – All notifications for the authenticated user (auto-escalates stale ones) */
    @GetMapping
    public ResponseEntity<List<Notification>> getMyNotifications(
            @AuthenticationPrincipal UserDetails principal) {

        return ResponseEntity.ok(notificationService.getForUser(getUserId(principal)));
    }

    /** Unread count for notification badge */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal UserDetails principal) {

        long count = notificationService.countUnread(getUserId(principal));
        return ResponseEntity.ok(Map.of("count", count));
    }

    /** Mark a single notification as read */
    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<Notification> markAsRead(
            @PathVariable String notificationId,
            @AuthenticationPrincipal UserDetails principal) {

        return ResponseEntity.ok(notificationService.markAsRead(notificationId, getUserId(principal)));
    }

    /** Mark all as read */
    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(
            @AuthenticationPrincipal UserDetails principal) {

        notificationService.markAllAsRead(getUserId(principal));
        return ResponseEntity.ok().build();
    }

    private String getUserId(UserDetails principal) {
        return userRepository.findByEmail(principal.getUsername()).orElseThrow().getId();
    }
}
