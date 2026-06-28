import React, { useState, useEffect } from 'react';
import { profileApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { User, Star, Clock, CheckCircle, AlertCircle, Info } from 'lucide-react';

const SECTORS = [
  'Fintech', 'Agritech', 'Healthtech', 'Edtech', 'E-commerce',
  'Logistique', 'Industrie', 'Services', 'Tourisme', 'Autre'
];

const STAGES = [
  { value: 'IDEA',   label: 'Idée' },
  { value: 'MVP',    label: 'MVP' },
  { value: 'GROWTH', label: 'Croissance' },
  { value: 'SCALE',  label: 'Mise à l\'échelle' },
];

const NEEDS = [
  'Financement', 'Mentorat', 'Réseau', 'Formation',
  'Recrutement', 'Développement produit', 'Marketing', 'Export'
];

const STATUS_CONFIG = {
  PENDING_VALIDATION: { label: 'En attente de validation',         class: 'badge-pending',  icon: Clock       },
  APPROVED:           { label: 'Profil validé',                     class: 'badge-approved', icon: CheckCircle },
  REJECTED:           { label: 'Profil rejeté',                     class: 'badge-rejected', icon: AlertCircle },
  AWAITING_INFO:      { label: 'Informations complémentaires requises', class: 'badge-info', icon: Info        },
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    businessSector: '', developmentStage: 'IDEA', priorityNeeds: [],
    companyName: '', companyDescription: '', location: '', linkedinUrl: '', websiteUrl: '',
  });

  useEffect(() => {
    loadProfile();
    profileApi.getScoreHistory().then(r => setScoreHistory(r.data)).catch(() => {});
  }, []);

  const loadProfile = async () => {
    try {
      const { data } = await profileApi.getMe();
      setProfile(data);
      setForm({
        businessSector:     data.businessSector     || '',
        developmentStage:   data.developmentStage   || 'IDEA',
        priorityNeeds:      data.priorityNeeds       || [],
        companyName:        data.companyName         || '',
        companyDescription: data.companyDescription  || '',
        location:           data.location            || '',
        linkedinUrl:        data.linkedinUrl         || '',
        websiteUrl:         data.websiteUrl          || '',
      });
    } catch {
      // No profile yet — show creation form
      setEditMode(true);
    } finally {
      setLoading(false);
    }
  };

  const toggleNeed = (need) => {
    setForm(f => ({
      ...f,
      priorityNeeds: f.priorityNeeds.includes(need)
        ? f.priorityNeeds.filter(n => n !== need)
        : [...f.priorityNeeds, need],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.businessSector || !form.developmentStage || form.priorityNeeds.length === 0) {
      toast.error('Secteur, stade et au moins un besoin sont obligatoires.');
      return;
    }
    setSaving(true);
    try {
      if (profile) {
        const { data } = await profileApi.updateMe(form);
        setProfile(data);
        toast.success('Profil mis à jour !');
      } else {
        const { data } = await profileApi.create(form);
        setProfile(data);
        toast.success('Profil créé ! Il sera visible après validation sous 48h.');
      }
      setEditMode(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="page-container">
      <p style={{ color: 'var(--color-ink-muted)' }}>Chargement…</p>
    </div>
  );

  const statusInfo = profile ? STATUS_CONFIG[profile.status] : null;

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Mon profil entrepreneur</h1>
          <p className="page-subtitle">Visibilité dans l'annuaire de la communauté Attijari</p>
        </div>
        {profile && !editMode && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="score-chip">
              <Star size={14} /> {profile.intelligenceScore} pts
            </span>
            {statusInfo && (
              <span className={`badge ${statusInfo.class}`}>
                <statusInfo.icon size={11} style={{ marginRight: 4 }} />
                {statusInfo.label}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Rejection message */}
      {profile?.status === 'REJECTED' && profile.rejectionReason && (
        <div className="alert alert-error" style={{ marginBottom: 24 }}>
          <strong>Raison du rejet :</strong> {profile.rejectionReason}
          <br />
          <small>Vous pouvez modifier votre profil et le re-soumettre.</small>
        </div>
      )}

      {/* Awaiting info */}
      {profile?.status === 'AWAITING_INFO' && profile.cmNotes && (
        <div className="alert alert-info" style={{ marginBottom: 24 }}>
          <strong>L'Admin demande :</strong> {profile.cmNotes}
        </div>
      )}

      <div className="grid-2" style={{ gap: 28, alignItems: 'start' }}>
        {/* Profile form/view */}
        <div className="card">
          {editMode ? (
            <form onSubmit={handleSubmit}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginBottom: 20 }}>
                {profile ? 'Modifier mon profil' : 'Créer mon profil'}
              </h3>

              <div className="form-group">
                <label className="form-label">Secteur d'activité *</label>
                <select className="form-select" value={form.businessSector}
                  onChange={e => setForm(f => ({ ...f, businessSector: e.target.value }))}>
                  <option value="">Sélectionner un secteur</option>
                  {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Stade de développement *</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {STAGES.map(s => (
                    <button
                      key={s.value} type="button"
                      className={`btn btn-sm ${form.developmentStage === s.value ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setForm(f => ({ ...f, developmentStage: s.value }))}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Besoins prioritaires * (sélectionner au moins 1)</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {NEEDS.map(n => (
                    <button
                      key={n} type="button"
                      className={`btn btn-sm ${form.priorityNeeds.includes(n) ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => toggleNeed(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="divider" />

              <div className="form-group">
                <label className="form-label">Nom de l'entreprise</label>
                <input className="form-input" placeholder="Ma Startup SAS"
                  value={form.companyName}
                  onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" placeholder="Décrivez votre projet en quelques lignes…"
                  value={form.companyDescription}
                  onChange={e => setForm(f => ({ ...f, companyDescription: e.target.value }))} />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Ville</label>
                  <input className="form-input" placeholder="Tunis"
                    value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">LinkedIn</label>
                  <input className="form-input" placeholder="linkedin.com/in/..."
                    value={form.linkedinUrl}
                    onChange={e => setForm(f => ({ ...f, linkedinUrl: e.target.value }))} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Sauvegarde…' : profile ? 'Mettre à jour' : 'Créer mon profil'}
                </button>
                {profile && (
                  <button type="button" className="btn btn-ghost" onClick={() => setEditMode(false)}>
                    Annuler
                  </button>
                )}
              </div>
            </form>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>
                  {profile?.companyName || `${user?.firstName} ${user?.lastName}`}
                </h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditMode(true)}>
                  Modifier
                </button>
              </div>

              <div style={{ display: 'grid', gap: 14 }}>
                <InfoRow label="Secteur" value={profile?.businessSector} />
                <InfoRow label="Stade" value={STAGES.find(s => s.value === profile?.developmentStage)?.label} />
                <InfoRow label="Besoins" value={profile?.priorityNeeds?.join(', ')} />
                {profile?.location && <InfoRow label="Ville" value={profile.location} />}
                {profile?.companyDescription && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Description</div>
                    <p style={{ fontSize: 14, color: 'var(--color-ink)', lineHeight: 1.6 }}>{profile.companyDescription}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Score history */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginBottom: 16 }}>
            Historique de score
          </h3>
          {scoreHistory.length === 0 ? (
            <div className="empty-state">
              <p>Vos points apparaîtront ici au fur et à mesure de vos activités.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {scoreHistory.map(event => (
                <div key={event.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px',
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{event.description}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-ink-muted)', marginTop: 2 }}>
                      {new Date(event.occurredAt).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </div>
                  </div>
                  <span style={{
                    fontWeight: 800,
                    fontSize: 15,
                    color: event.points >= 0 ? 'var(--color-success)' : 'var(--color-error)',
                  }}>
                    {event.points >= 0 ? '+' : ''}{event.points}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14 }}>{value}</div>
    </div>
  );
}
