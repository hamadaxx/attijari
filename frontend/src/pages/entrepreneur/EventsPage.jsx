import React, { useState, useEffect } from 'react';
import { eventApi } from '../../api';
import toast from 'react-hot-toast';
import { Calendar, Clock, Users, Video, BookOpen, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const TYPE_CONFIG = {
  WEBINAR:          { label: 'Webinar',        icon: Video,     color: '#7C3AED' },
  WORKSHOP:         { label: 'Atelier',         icon: BookOpen,  color: '#0369A1' },
  MENTORING_SESSION:{ label: 'Séance de mentorat', icon: UserCheck, color: '#047857' },
};

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(null);
  const [tab, setTab] = useState('upcoming'); // 'upcoming' | 'mine'

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsRes, regRes] = await Promise.all([
        eventApi.getUpcoming(),
        eventApi.getMyRegistrations(),
      ]);
      setEvents(eventsRes.data);
      setMyRegistrations(regRes.data);
    } catch {
      toast.error('Erreur lors du chargement.');
    } finally {
      setLoading(false);
    }
  };

  const isRegistered = (eventId) =>
    myRegistrations.some(e => e.id === eventId);

  const handleRegister = async (eventId) => {
    setRegistering(eventId);
    try {
      if (isRegistered(eventId)) {
        await eventApi.cancelRegistration(eventId);
        toast.success('Inscription annulée.');
      } else {
        await eventApi.register(eventId);
        toast.success('Inscription confirmée ! +10 pts vous seront attribués après participation.');
      }
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur.');
    } finally {
      setRegistering(null);
    }
  };

  const displayedEvents = tab === 'upcoming' ? events : myRegistrations;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Événements communautaires</h1>
        <p className="page-subtitle">
          Webinars, ateliers et séances de mentorat — chaque participation vous rapporte 10 points.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[
          { key: 'upcoming', label: `Tous les événements (${events.length})` },
          { key: 'mine',     label: `Mes inscriptions (${myRegistrations.length})` },
        ].map(t => (
          <button
            key={t.key}
            className={`btn btn-sm ${tab === t.key ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: 'var(--color-ink-muted)' }}>Chargement…</p>
      ) : displayedEvents.length === 0 ? (
        <div className="empty-state">
          <Calendar size={40} />
          <p>{tab === 'upcoming' ? 'Aucun événement à venir.' : "Vous n'êtes inscrit à aucun événement."}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {displayedEvents.map(event => {
            const typeConf = TYPE_CONFIG[event.type] || TYPE_CONFIG.WEBINAR;
            const TypeIcon = typeConf.icon;
            const registered = isRegistered(event.id);

            return (
              <div key={event.id} className="card" style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                {/* Type icon */}
                <div style={{
                  width: 44, height: 44,
                  background: typeConf.color + '15',
                  borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <TypeIcon size={20} color={typeConf.color} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{
                        fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.05em', color: typeConf.color, marginBottom: 4, display: 'block'
                      }}>
                        {typeConf.label}
                      </span>
                      <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{event.title}</h3>
                    </div>
                    {registered && (
                      <span className="badge badge-approved">Inscrit</span>
                    )}
                  </div>

                  {event.description && (
                    <p style={{ fontSize: 14, color: 'var(--color-ink-muted)', marginBottom: 12, lineHeight: 1.5 }}>
                      {event.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--color-ink-muted)' }}>
                      <Calendar size={13} />
                      {event.startDateTime
                        ? format(new Date(event.startDateTime), 'EEEE d MMMM yyyy', { locale: fr })
                        : '—'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--color-ink-muted)' }}>
                      <Clock size={13} />
                      {event.startDateTime
                        ? format(new Date(event.startDateTime), 'HH:mm')
                        : '—'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--color-ink-muted)' }}>
                      <Users size={13} />
                      {event.registeredUserIds?.length || 0} inscrits
                    </span>

                    <span style={{
                      fontSize: 12, fontWeight: 700,
                      color: 'var(--color-success)',
                      background: 'var(--color-success-bg)',
                      padding: '3px 10px', borderRadius: 100,
                      marginLeft: 'auto',
                    }}>
                      +10 pts de présence
                    </span>

                    <button
                      className={`btn btn-sm ${registered ? 'btn-ghost' : 'btn-primary'}`}
                      onClick={() => handleRegister(event.id)}
                      disabled={registering === event.id}
                    >
                      {registering === event.id ? '…' : registered ? "Annuler l'inscription" : "S'inscrire"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
