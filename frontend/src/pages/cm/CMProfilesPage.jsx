import React, { useState, useEffect } from 'react';
import { profileApi } from '../../api';
import toast from 'react-hot-toast';
import { Users, CheckCircle, XCircle, MessageCircle, MapPin, Globe, Linkedin, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STAGE_LABEL = {
  IDEA:   { label: 'Idée',        color: '#8b5cf6' },
  MVP:    { label: 'MVP',         color: '#3b82f6' },
  GROWTH: { label: 'Croissance',  color: '#f59e0b' },
  SCALE:  { label: 'Scale',       color: '#10b981' },
};

export default function CMProfilesPage() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [infoReason, setInfoReason] = useState('');
  const [action, setAction] = useState(null); // null | 'reject' | 'info'

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const { data } = await profileApi.getPending();
      setProfiles(data);
    } catch {
      toast.error('Erreur lors du chargement des profils.');
    } finally {
      setLoading(false);
    }
  }

  function selectProfile(profile) {
    setSelected(profile);
    setAction(null);
    setRejectReason('');
    setInfoReason('');
  }

  async function handleValidate(profileAction, reason) {
    const payload = { action: profileAction };
    if (reason?.trim()) payload.reason = reason.trim();
    try {
      await profileApi.validate(selected.id, payload);
      const labels = { APPROVE: 'approuvé', REJECT: 'rejeté', REQUEST_INFO: 'mis en attente d\'info' };
      toast.success(`Profil ${labels[profileAction]}.`);
      setSelected(null);
      setAction(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur lors de la validation.');
    }
  }

  const pending = profiles.filter(p => p.status === 'PENDING_VALIDATION' || p.status === 'AWAITING_INFO');
  const isComplete = selected?.isSufficientlyComplete !== false
    && selected?.businessSector && selected?.developmentStage && selected?.priorityNeeds?.length > 0;

  return (
    <div style={{ padding: '32px 40px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Users size={20} /> Validation des profils
        </h1>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
          {pending.length} profil{pending.length !== 1 ? 's' : ''} en attente de validation
        </p>
      </div>

      {loading ? (
        <p style={{ color: '#9ca3af', fontSize: 14 }}>Chargement…</p>
      ) : pending.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
          <CheckCircle size={40} style={{ marginBottom: 12, opacity: 0.4, color: '#16a34a' }} />
          <p style={{ fontSize: 15, fontWeight: 600 }}>Aucun profil en attente.</p>
          <p style={{ fontSize: 13 }}>Tous les profils ont été traités.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '320px 1fr' : '1fr', gap: 20, alignItems: 'start' }}>

          {/* List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pending.map(profile => {
              const stage = STAGE_LABEL[profile.developmentStage] || { label: profile.developmentStage, color: '#6b7280' };
              const isAwaitingInfo = profile.status === 'AWAITING_INFO';
              return (
                <div
                  key={profile.id}
                  onClick={() => selectProfile(profile)}
                  style={{
                    background: 'white',
                    borderRadius: 10,
                    padding: '16px 18px',
                    boxShadow: selected?.id === profile.id
                      ? '0 0 0 2px #F8B618'
                      : '0 1px 3px rgba(0,0,0,0.08)',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {profile.companyName || '(sans nom)'}
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{profile.businessSector || '—'}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      {isAwaitingInfo && (
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: '#fef3c7', color: '#d97706' }}>
                          Info demandée
                        </span>
                      )}
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 10,
                        background: stage.color + '20', color: stage.color }}>
                        {stage.label}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>
                    Soumis le {profile.createdAt
                      ? format(new Date(profile.createdAt), 'dd MMM yyyy', { locale: fr })
                      : '—'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail panel */}
          {selected && (
            <div style={{
              background: 'white', borderRadius: 10, padding: '24px 28px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)', position: 'sticky', top: 20
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>
                    {selected.companyName || '(sans nom)'}
                  </h2>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {selected.businessSector && (
                      <Tag color="#3b82f6">{selected.businessSector}</Tag>
                    )}
                    {selected.developmentStage && (
                      <Tag color={STAGE_LABEL[selected.developmentStage]?.color || '#6b7280'}>
                        {STAGE_LABEL[selected.developmentStage]?.label || selected.developmentStage}
                      </Tag>
                    )}
                    {selected.status === 'AWAITING_INFO' && (
                      <Tag color="#f59e0b">Info demandée</Tag>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af', lineHeight: 1 }}
                >×</button>
              </div>

              {/* Completeness check */}
              {!isComplete && (
                <div style={{
                  background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8,
                  padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#c2410c'
                }}>
                  ⚠ Profil incomplet — secteur, stade ou besoins prioritaires manquants. Vous pouvez demander des informations complémentaires.
                </div>
              )}

              {/* Description */}
              {selected.companyDescription && (
                <Section label="Description">
                  <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: 0 }}>
                    {selected.companyDescription}
                  </p>
                </Section>
              )}

              {/* Details grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                <InfoField label="Secteur" value={selected.businessSector} />
                <InfoField label="Stade" value={STAGE_LABEL[selected.developmentStage]?.label || selected.developmentStage} />
                {selected.location && (
                  <InfoField label="Localisation" value={selected.location} icon={<MapPin size={12} />} />
                )}
              </div>

              {/* Priority needs */}
              {selected.priorityNeeds?.length > 0 && (
                <Section label="Besoins prioritaires">
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {selected.priorityNeeds.map(need => (
                      <Tag key={need} color="#8b5cf6">{need}</Tag>
                    ))}
                  </div>
                </Section>
              )}

              {/* Links */}
              {(selected.linkedinUrl || selected.websiteUrl) && (
                <Section label="Liens">
                  <div style={{ display: 'flex', gap: 12 }}>
                    {selected.linkedinUrl && (
                      <a href={selected.linkedinUrl} target="_blank" rel="noreferrer"
                        style={{ fontSize: 12, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                        <Linkedin size={13} /> LinkedIn <ExternalLink size={10} />
                      </a>
                    )}
                    {selected.websiteUrl && (
                      <a href={selected.websiteUrl} target="_blank" rel="noreferrer"
                        style={{ fontSize: 12, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                        <Globe size={13} /> Site web <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </Section>
              )}

              <div style={{ height: 1, background: '#e5e7eb', margin: '20px 0' }} />

              {/* Action area */}
              {action === null && (
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => handleValidate('APPROVE')}
                    disabled={!isComplete}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '10px', background: isComplete ? '#16a34a' : '#9ca3af', color: 'white',
                      border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      cursor: isComplete ? 'pointer' : 'not-allowed'
                    }}
                  >
                    <CheckCircle size={14} /> Approuver
                  </button>
                  <button
                    onClick={() => setAction('info')}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '10px', background: '#f3f4f6', color: '#374151',
                      border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    <MessageCircle size={14} /> Demander infos
                  </button>
                  <button
                    onClick={() => setAction('reject')}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '10px', background: '#fee2e2', color: '#dc2626',
                      border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    <XCircle size={14} /> Rejeter
                  </button>
                </div>
              )}

              {action === 'reject' && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, color: '#dc2626' }}>
                    Raison du rejet *
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    rows={3}
                    placeholder="Expliquez pourquoi ce profil est rejeté…"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #fca5a5', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', marginBottom: 10 }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleValidate('REJECT', rejectReason)}
                      disabled={!rejectReason.trim()}
                      style={{
                        flex: 1, padding: '9px', background: rejectReason.trim() ? '#dc2626' : '#9ca3af',
                        color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                        cursor: rejectReason.trim() ? 'pointer' : 'not-allowed'
                      }}
                    >
                      Confirmer le rejet
                    </button>
                    <button
                      onClick={() => setAction(null)}
                      style={{
                        padding: '9px 16px', background: '#f3f4f6', color: '#374151',
                        border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, cursor: 'pointer'
                      }}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              {action === 'info' && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, color: '#f59e0b' }}>
                    Informations demandées *
                  </label>
                  <textarea
                    value={infoReason}
                    onChange={e => setInfoReason(e.target.value)}
                    rows={3}
                    placeholder="Précisez quelles informations l'entrepreneur doit fournir…"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #fcd34d', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', marginBottom: 10 }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleValidate('REQUEST_INFO', infoReason)}
                      disabled={!infoReason.trim()}
                      style={{
                        flex: 1, padding: '9px', background: infoReason.trim() ? '#f59e0b' : '#9ca3af',
                        color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                        cursor: infoReason.trim() ? 'pointer' : 'not-allowed'
                      }}
                    >
                      Envoyer la demande
                    </button>
                    <button
                      onClick={() => setAction(null)}
                      style={{
                        padding: '9px 16px', background: '#f3f4f6', color: '#374151',
                        border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, cursor: 'pointer'
                      }}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Tag({ color, children }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 8px',
      borderRadius: 10, background: color + '20', color
    }}>
      {children}
    </span>
  );
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function InfoField({ label, value, icon }) {
  if (!value) return null;
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, color: '#374151', display: 'flex', alignItems: 'center', gap: 4 }}>
        {icon}{value}
      </div>
    </div>
  );
}
