import React, { useState, useEffect } from 'react';
import { profileApi } from '../../api';
import toast from 'react-hot-toast';
import { TrendingUp, Award, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// US-SE-02 thresholds (v3 backlog Epic C)
const THRESHOLD_VENTURE = 50;
const THRESHOLD_FINANCING = 80;

const EVENT_LABELS = {
  PROFILE_CREATED:           { label: 'Profil créé',            color: '#3b82f6' },
  EVENT_ATTENDED:            { label: 'Événement assisté',      color: '#10b981' },
  EVENT_ABSENCE_PENALTY:     { label: 'Pénalité absence',       color: '#ef4444' },
  PUBLICATION_APPROVED:      { label: 'Publication approuvée',  color: '#8b5cf6' },
  PUBLICATION_BONUS:         { label: 'Bonus publication',       color: '#f59e0b' },
  PUBLICATION_PLAGIARISM:    { label: 'Pénalité plagiat',       color: '#dc2626' },
  VENTURE_STUDIO_DELIVERABLE:{ label: 'Livrable Venture Studio',color: '#0ea5e9' },
  KYB_VALIDATED:             { label: 'Dossier KYB validé',     color: '#16a34a' },
  KYB_STARTUP_ACT:           { label: 'Badge Startup Act (ANPE)',color: '#16a34a' },
};

const RECOMMENDED_ACTIONS = [
  { type: 'EVENT_ATTENDED',         label: 'Participer à un webinar',           pts: 10, icon: '📅' },
  { type: 'PUBLICATION_APPROVED',   label: 'Publier un article',                pts: 5,  icon: '✍️' },
  { type: 'KYB_VALIDATED',          label: 'Soumettre votre dossier KYB',       pts: 20, icon: '📋' },
  { type: 'VENTURE_STUDIO_DELIVERABLE', label: 'Compléter un livrable Venture Studio', pts: 15, icon: '🚀' },
];

export default function ScorePage() {
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([profileApi.getMe(), profileApi.getScoreHistory()])
      .then(([pRes, hRes]) => {
        setProfile(pRes.data);
        setHistory(hRes.data);
      })
      .catch(() => toast.error('Erreur de chargement.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '32px 40px', color: '#9ca3af' }}>Chargement…</div>;
  if (!profile) return null;

  const se = profile.intelligenceScore || 0;
  const recentTypes = new Set(history.slice(0, 10).map(e => e.type));

  // Gauge to next threshold
  const nextThreshold = se < THRESHOLD_VENTURE ? THRESHOLD_VENTURE : se < THRESHOLD_FINANCING ? THRESHOLD_FINANCING : null;
  const pctToNext = nextThreshold ? Math.min(100, Math.round((se / nextThreshold) * 100)) : 100;

  // Check inactivity (no events in last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const lastEvent = history[0];
  const isInactive = lastEvent ? new Date(lastEvent.occurredAt) < thirtyDaysAgo : history.length === 0;

  // Recommended actions = those the user hasn't done recently
  const recommended = RECOMMENDED_ACTIONS.filter(a => !recentTypes.has(a.type)).slice(0, 3);

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <TrendingUp size={20} /> Mon Score d'Engagement
        </h1>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
          Votre engagement communautaire reflété en points — mis à jour en temps réel
        </p>
      </div>

      {/* Inactivity banner */}
      {isInactive && (
        <div style={{
          background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8,
          padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10
        }}>
          <AlertTriangle size={16} color="#f59e0b" />
          <div style={{ fontSize: 13, color: '#92400e' }}>
            <strong>Score gelé</strong> — Aucune activité depuis plus de 30 jours. Participez à un événement ou publiez un article pour réactiver votre score.
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Score card */}
        <div style={{ background: 'white', borderRadius: 12, padding: '28px 32px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>Score d'Engagement total</div>
          <div style={{ fontSize: 56, fontWeight: 900, color: '#F8B618', lineHeight: 1, marginBottom: 4 }}>{se}</div>
          <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24 }}>points</div>

          {/* Thresholds */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <ThresholdBar se={se} threshold={THRESHOLD_VENTURE} label="Venture Studio" color="#8b5cf6" />
            <ThresholdBar se={se} threshold={THRESHOLD_FINANCING} label="Smart Financing" color="#f59e0b" />
          </div>
        </div>

        {/* KYB badge + recommended actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* KYB status */}
          <div style={{ background: 'white', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 8 }}>Conformité KYB</div>
            {profile.kybStatus === 'APPROVED' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={18} color="#16a34a" />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#16a34a' }}>KYB Vérifié</span>
                {profile.startupActCertified && (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#dcfce7', color: '#16a34a' }}>
                    Startup Act ✓
                  </span>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#6b7280' }}>
                {profile.kybStatus === 'NOT_SUBMITTED' || !profile.kybStatus
                  ? 'Dossier non soumis — requis pour Venture Studio et Smart Financing'
                  : profile.kybStatus === 'SUBMITTED' ? 'En cours de revue…'
                  : profile.kybStatus === 'REJECTED' ? 'Dossier rejeté — re-soumission requise'
                  : profile.kybStatus === 'INFO_REQUIRED' ? 'Informations complémentaires requises'
                  : profile.kybStatus}
              </div>
            )}
          </div>

          {/* Recommended actions */}
          <div style={{ background: 'white', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 12 }}>
              Actions recommandées (7 prochains jours)
            </div>
            {recommended.length === 0 ? (
              <div style={{ fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Award size={16} color="#16a34a" /> Excellent engagement ! Continuez ainsi.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recommended.map(a => (
                  <div key={a.type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: '#374151' }}>{a.icon} {a.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>+{a.pts} pts</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History */}
      <div style={{ background: 'white', borderRadius: 10, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginTop: 0, marginBottom: 16 }}>
          Historique des 20 derniers événements
        </h3>
        {history.length === 0 ? (
          <p style={{ fontSize: 13, color: '#9ca3af' }}>Aucun événement de scoring encore.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {history.slice(0, 20).map((ev, i) => {
              const meta = EVENT_LABELS[ev.type] || { label: ev.type, color: '#6b7280' };
              return (
                <div key={ev.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: i < Math.min(history.length, 20) - 1 ? '1px solid #f3f4f6' : 'none'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{meta.label}</span>
                    </div>
                    {ev.description && (
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2, marginLeft: 16 }}>{ev.description}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', align: 'center', gap: 16, flexShrink: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: ev.points >= 0 ? '#16a34a' : '#dc2626' }}>
                      {ev.points >= 0 ? '+' : ''}{ev.points} pts
                    </span>
                    <span style={{ fontSize: 11, color: '#9ca3af', minWidth: 80, textAlign: 'right' }}>
                      {ev.occurredAt ? format(new Date(ev.occurredAt), 'dd MMM', { locale: fr }) : '—'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ThresholdBar({ se, threshold, label, color }) {
  const reached = se >= threshold;
  const pct = Math.min(100, Math.round((se / threshold) * 100));
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: reached ? '#16a34a' : color }}>
          {reached ? '✓ Atteint' : `${se} / ${threshold} pts`}
        </span>
      </div>
      <div style={{ height: 7, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: reached ? '#16a34a' : color, borderRadius: 4, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}
