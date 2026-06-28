package com.attijari.growth.service;

import com.attijari.growth.dto.request.PublicationRequest;
import com.attijari.growth.exception.BadRequestException;
import com.attijari.growth.exception.NotFoundException;
import com.attijari.growth.model.Publication;
import com.attijari.growth.model.ScoringEvent;
import com.attijari.growth.model.User;
import com.attijari.growth.repository.PublicationRepository;
import com.attijari.growth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PublicationService {

    private final PublicationRepository publicationRepository;
    private final UserRepository userRepository;
    private final ScoringService scoringService;

    private static final int REACTION_BONUS_THRESHOLD = 20;

    /**
     * US 1.3a – Entrepreneur submits a publication for editorial review
     */
    public Publication submitPublication(String authorId, PublicationRequest request) {
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new NotFoundException("Auteur non trouvé."));

        Publication publication = new Publication();
        publication.setAuthorId(authorId);
        publication.setAuthorName(author.getFirstName() + " " + author.getLastName());
        publication.setTitle(request.getTitle());
        publication.setContent(request.getContent());
        publication.setSector(request.getSector());
        publication.setStatus(Publication.PublicationStatus.PENDING_EDITORIAL);

        return publicationRepository.save(publication);
    }

    /**
     * US 1.3a Scenario 1 – CM approves a publication, grants +5 points
     */
    public Publication approvePublication(String publicationId, String cmUserId) {
        Publication publication = getById(publicationId);

        if (publication.getStatus() != Publication.PublicationStatus.PENDING_EDITORIAL) {
            throw new BadRequestException("Cette publication n'est pas en attente de validation.");
        }

        publication.setStatus(Publication.PublicationStatus.PUBLISHED);
        publication.setPublishedAt(LocalDateTime.now());
        publication.setUpdatedAt(LocalDateTime.now());
        publication = publicationRepository.save(publication);

        // Award +5 points on publication approval
        scoringService.applyScore(
            publication.getAuthorId(),
            ScoringEvent.ScoringEventType.PUBLICATION_APPROVED,
            5,
            publicationId,
            "Publication approuvée: " + publication.getTitle()
        );

        return publication;
    }

    /**
     * US 1.3a Scenario 2 – Member reacts to a publication
     * If reactions cross 20 from validated members → +10 bonus points (one-time)
     */
    public Publication reactToPublication(String publicationId, String userId) {
        Publication publication = getById(publicationId);

        if (publication.getStatus() != Publication.PublicationStatus.PUBLISHED) {
            throw new BadRequestException("Vous ne pouvez réagir qu'à une publication publiée.");
        }
        if (publication.getReactedUserIds().contains(userId)) {
            throw new BadRequestException("Vous avez déjà réagi à cette publication.");
        }

        publication.getReactedUserIds().add(userId);
        publication.setUpdatedAt(LocalDateTime.now());

        // Check bonus threshold: only once, exactly at 20 reactions
        if (publication.getReactionCount() == REACTION_BONUS_THRESHOLD
                && publication.getBonusPointsAwarded() == 0) {
            publication.setBonusPointsAwarded(10);
            publication = publicationRepository.save(publication);

            scoringService.applyScore(
                publication.getAuthorId(),
                ScoringEvent.ScoringEventType.PUBLICATION_BONUS,
                10,
                publicationId,
                "Bonus engagement: publication ayant reçu " + REACTION_BONUS_THRESHOLD + " réactions"
            );
        } else {
            publication = publicationRepository.save(publication);
        }

        return publication;
    }

    /**
     * US 1.3a Scenario 3 – Member reports plagiarism
     * After 3 distinct reports → content removed, -15 points
     */
    public Publication reportPlagiarism(String publicationId, String reporterUserId) {
        Publication publication = getById(publicationId);

        if (publication.getPlagiarismReporterIds().contains(reporterUserId)) {
            throw new BadRequestException("Vous avez déjà signalé cette publication.");
        }

        publication.getPlagiarismReporterIds().add(reporterUserId);

        if (publication.getPlagiarismReportCount() >= 3 && !publication.isPlagiarismValidated()) {
            publication.setPlagiarismValidated(true);
            publication.setStatus(Publication.PublicationStatus.REMOVED_PLAGIARISM);
            publication.setUpdatedAt(LocalDateTime.now());
            publication = publicationRepository.save(publication);

            // Deduct -15 points
            scoringService.applyScore(
                publication.getAuthorId(),
                ScoringEvent.ScoringEventType.PUBLICATION_PLAGIARISM,
                -15,
                publicationId,
                "Déduction pour contenu plagié confirmé: " + publication.getTitle()
            );
        } else {
            publication.setUpdatedAt(LocalDateTime.now());
            publication = publicationRepository.save(publication);
        }

        return publication;
    }

    /**
     * US 1.3b – CM archives a publication (hidden, not deleted)
     */
    public Publication archivePublication(String publicationId, String cmUserId, String reason) {
        if (reason == null || reason.isBlank()) {
            throw new BadRequestException("Une raison d'archivage est obligatoire.");
        }

        Publication publication = getById(publicationId);
        publication.setStatus(Publication.PublicationStatus.ARCHIVED);
        publication.setArchiveReason(reason);
        publication.setArchivedBy(cmUserId);
        publication.setArchivedAt(LocalDateTime.now());
        publication.setUpdatedAt(LocalDateTime.now());

        return publicationRepository.save(publication);
    }

    public Publication getById(String id) {
        return publicationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Publication non trouvée."));
    }

    public List<Publication> getPublishedPublications() {
        return publicationRepository.findByStatusOrderByPublishedAtDesc(Publication.PublicationStatus.PUBLISHED);
    }

    public List<Publication> getPendingPublications() {
        return publicationRepository.findByStatus(Publication.PublicationStatus.PENDING_EDITORIAL);
    }

    public List<Publication> getMyPublications(String authorId) {
        return publicationRepository.findByAuthorId(authorId);
    }
}
