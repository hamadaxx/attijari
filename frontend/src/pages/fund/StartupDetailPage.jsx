import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fundApi } from '../../api';
import toast from 'react-hot-toast';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function StartupDetailPage() {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fundApi.getStartupDetail(profileId),
      fundApi.getStartupScoreHistory(profileId),
    ]).then(([p, h]) => {
      setProfile(p.data);
      setHistory(h.data);
    }).catch(() => toast.error('Erreur lors du chargement.'))
      .finally(() => setLoading(false));
  }, [profileId]);

  if (loading) return <div style={{ padding: 40, color: '#9ca3af' }}>Chargement…</div>;
  if (!profile) return null;

  return (
    <div style={{ padding: '32px 40px', maxWidth: 800 }}>
      <button
        onClick={() => navigate(-1)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
          color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 24 }}
      >
        <ArrowLeft size={15} /> Retour
      </button>

      {/* Profile card */}
      <div style={{ background: 'white', borderRadius: 12, padding: '24px 28px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{profile.companyName || 'Startup'}</h2>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
              {profile.businessSector} · {profile.developmentStage} · {profile.location}
            </p>
          </div>
          <div style={{ background: '#fef9c3', color: '#92400e', borderRadius: 20,
            padding: '6px 16px', fontSize: 18, fontWeight: 800 }}>
            {profile.intelligenceScore} pts
          </div>
        </div>

        {profile.companyDescription && (
          <p style={{ marginTop: 16, fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
            {profile.companyDescription}
          </p>
        )}

        <div style={{ display: 'flex', gap: 24, marginTop: 16, fontSize: 13, color: '#6b7280' }}>
          {profile.priorityNeeds?.length > 0 && (
            <div>
              <strong>Besoins : </strong>
              {profile.priorityNeeds.join(', ')}
            </div>
          )}
          {profile.validatedAt && (
            <div>
              <strong>Validé le : </strong>
              {format(new Date(profile.validatedAt), 'dd MMM yyyy', { locale: fr })}
            </div>
          )}
        </div>
      </div>

      {/* Score history */}
      <div style={{ background: 'white', borderRadius: 12, padding: '24px 28px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 0, marginBottom: 16 }}>
          Historique des événements de scoring
        </h3>

        {history.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: 14 }}>Aucun événement de scoring.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.map(ev => (
              <div key={ev.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', background: '#f9fafb', borderRadius: 8, fontSize: 13
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Clock size={13} style={{ color: '#9ca3af', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{ev.description}</div>
                    <div style={{ color: '#9ca3af', fontSize: 11, marginTop: 2 }}>
                      {format(new Date(ev.occurredAt), 'dd MMM yyyy HH:mm', { locale: fr })}
                    </div>
                  </div>
                </div>
                <div style={{
                  fontWeight: 700, fontSize: 14,
                  color: ev.points > 0 ? '#16a34a' : ev.points < 0 ? '#dc2626' : '#6b7280',
                  display: 'flex', alignItems: 'center', gap: 4
                }}>
                  {ev.points > 0 ? <TrendingUp size={13} /> : ev.points < 0 ? <TrendingDown size={13} /> : <Minus size={13} />}
                  {ev.points > 0 ? '+' : ''}{ev.points}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
