import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { mentorApi } from '../../api';
import toast from 'react-hot-toast';
import { Calendar, Star, Clock, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUS_LABEL = {
  PENDING_CM_VALIDATION: { label: 'En attente CM', color: '#f59e0b' },
  UPCOMING: { label: 'À venir', color: '#3b82f6' },
  ONGOING: { label: 'En cours', color: '#10b981' },
  COMPLETED: { label: 'Terminé', color: '#6b7280' },
  CANCELLED: { label: 'Annulé', color: '#ef4444' },
};

export default function MentorEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => { loadEvents(); }, []);

  async function loadEvents() {
    try {
      const { data } = await mentorApi.getMyEvents();
      setEvents(data);
    } catch {
      toast.error('Erreur lors du chargement.');
    } finally {
      setLoading(false);
    }
  }

  async function proposeWebinar(data) {
    try {
      await mentorApi.proposeWebinar({
        title: data.title,
        description: data.description,
        type: 'WEBINAR',
        startDateTime: data.startDateTime,
        endDateTime: data.endDateTime,
      });
      toast.success('Webinar soumis pour validation par le Admin.');
      reset();
      setShowForm(false);
      loadEvents();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur lors de la soumission.');
    }
  }

  const renderStars = (rating) => {
    if (!rating) return <span style={{ color: '#9ca3af', fontSize: 12 }}>Non noté</span>;
    return (
      <span style={{ display: 'flex', gap: 2 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <Star key={n} size={13}
            fill={n <= Math.round(rating) ? '#f59e0b' : 'none'}
            stroke={n <= Math.round(rating) ? '#f59e0b' : '#d1d5db'}
          />
        ))}
        <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 4 }}>
          {rating.toFixed(1)}
        </span>
      </span>
    );
  };

  return (
    <div style={{ padding: '32px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Mes webinars</h1>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
            {events.length} événement{events.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#E8543F', color: 'white', border: 'none',
            borderRadius: 8, padding: '9px 16px', fontSize: 13,
            fontWeight: 600, cursor: 'pointer'
          }}
        >
          <Plus size={15} /> Proposer un webinar
        </button>
      </div>

      {/* Propose form modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div style={{
            background: 'white', borderRadius: 12, padding: '28px 32px',
            width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Proposer un webinar</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(proposeWebinar)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Titre *</label>
                <input
                  {...register('title', { required: 'Titre obligatoire' })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' }}
                />
                {errors.title && <p style={{ color: '#dc2626', fontSize: 11, marginTop: 4 }}>{errors.title.message}</p>}
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Description *</label>
                <textarea
                  {...register('description', { required: 'Description obligatoire' })}
                  rows={3}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Début *</label>
                  <input type="datetime-local"
                    {...register('startDateTime', { required: true })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Fin *</label>
                  <input type="datetime-local"
                    {...register('endDateTime', { required: true })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
                Le webinar sera soumis au Admin pour validation avant publication.
              </p>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '10px', background: '#E8543F', color: 'white',
                  border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer'
                }}
              >
                {isSubmitting ? 'Envoi…' : 'Soumettre'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Events list */}
      {loading ? (
        <p style={{ color: '#9ca3af', fontSize: 14 }}>Chargement…</p>
      ) : events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
          <Calendar size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p>Vous n'avez pas encore proposé de webinar.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {events.map(ev => {
            const statusInfo = STATUS_LABEL[ev.status] || { label: ev.status, color: '#6b7280' };
            return (
              <div key={ev.id} style={{
                background: 'white', borderRadius: 10, padding: '18px 22px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
              }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{ev.title}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{ev.description}</div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12, color: '#6b7280' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} />
                      {ev.startDateTime
                        ? format(new Date(ev.startDateTime), 'dd MMM yyyy HH:mm', { locale: fr })
                        : '—'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Star size={12} /> {renderStars(ev.mentorRating)}
                    </span>
                    <span>{ev.ratingCount} avis</span>
                  </div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 10px',
                  borderRadius: 20, background: statusInfo.color + '20',
                  color: statusInfo.color, whiteSpace: 'nowrap'
                }}>
                  {statusInfo.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
