import React, { useState, useEffect } from 'react';
import { publicationApi } from '../../api';
import toast from 'react-hot-toast';
import { FileText, ThumbsUp, AlertTriangle, Plus, X } from 'lucide-react';

const STATUS_LABELS = {
  PENDING_EDITORIAL: { label: 'En attente de validation', class: 'badge-pending' },
  PUBLISHED:         { label: 'Publiée',                   class: 'badge-approved' },
  ARCHIVED:          { label: 'Archivée',                  class: 'badge-pending' },
  REMOVED_PLAGIARISM:{ label: 'Retirée (plagiat)',         class: 'badge-rejected' },
};

export default function PublicationsPage() {
  const [publications, setPublications] = useState([]);
  const [myPubs, setMyPubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState('feed');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', sector: '' });

  const SECTORS = ['Fintech','Agritech','Healthtech','Edtech','E-commerce','Logistique','Autre'];

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [feedRes, mineRes] = await Promise.all([
        publicationApi.getAll(),
        publicationApi.getMine(),
      ]);
      setPublications(feedRes.data);
      setMyPubs(mineRes.data);
    } catch {
      toast.error('Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.content.length < 100) {
      toast.error('Le contenu doit comporter au moins 100 caractères.');
      return;
    }
    setSaving(true);
    try {
      await publicationApi.submit(form);
      toast.success('Publication soumise ! Elle sera visible après validation éditoriale.');
      setShowForm(false);
      setForm({ title: '', content: '', sector: '' });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur.');
    } finally {
      setSaving(false);
    }
  };

  const handleReact = async (id) => {
    try {
      await publicationApi.react(id);
      toast.success('Réaction enregistrée !');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur.');
    }
  };

  const handleReport = async (id) => {
    if (!window.confirm('Signaler cette publication comme plagiat ?')) return;
    try {
      await publicationApi.reportPlagiarism(id);
      toast.success('Signalement enregistré.');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur.');
    }
  };

  const displayedPubs = tab === 'feed' ? publications : myPubs;

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Publications communautaires</h1>
          <p className="page-subtitle">Partagez vos expériences et gagnez en visibilité (+5 pts par publication validée)</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Nouvelle publication
        </button>
      </div>

      {/* New publication form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>Nouvelle publication</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>
              <X size={14} /> Annuler
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Titre *</label>
              <input className="form-input" placeholder="Titre de votre article ou retour d'expérience"
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
            </div>

            <div className="form-group">
              <label className="form-label">Secteur</label>
              <select className="form-select" value={form.sector}
                onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}>
                <option value="">Choisir un secteur</option>
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Contenu * (minimum 100 caractères)</label>
              <textarea className="form-textarea" style={{ minHeight: 160 }}
                placeholder="Partagez votre expérience, vos apprentissages, vos conseils…"
                value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} required />
              <span style={{ fontSize: 12, color: form.content.length < 100 ? 'var(--color-error)' : 'var(--color-success)' }}>
                {form.content.length} / 100 caractères minimum
              </span>
            </div>

            <div className="alert alert-info" style={{ fontSize: 13 }}>
              Votre publication sera soumise à validation éditoriale avant publication.
              Après validation : +5 pts. Après 20 réactions de membres : +10 pts supplémentaires.
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Soumission…' : 'Soumettre pour validation'}
            </button>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[
          { key: 'feed', label: `Fil communautaire (${publications.length})` },
          { key: 'mine', label: `Mes publications (${myPubs.length})` },
        ].map(t => (
          <button key={t.key} className={`btn btn-sm ${tab === t.key ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: 'var(--color-ink-muted)' }}>Chargement…</p>
      ) : displayedPubs.length === 0 ? (
        <div className="empty-state">
          <FileText size={40} />
          <p>{tab === 'feed' ? 'Aucune publication.' : 'Vous n\'avez pas encore publié.'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {displayedPubs.map(pub => {
            const statusConf = STATUS_LABELS[pub.status];
            return (
              <div key={pub.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    {pub.sector && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-brand)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {pub.sector}
                      </span>
                    )}
                    <h3 style={{ fontSize: 17, fontWeight: 700, marginTop: 4 }}>{pub.title}</h3>
                    <p style={{ fontSize: 13, color: 'var(--color-ink-muted)', marginTop: 2 }}>
                      Par {pub.authorName}
                      {pub.publishedAt && ` · ${new Date(pub.publishedAt).toLocaleDateString('fr-FR')}`}
                    </p>
                  </div>
                  {tab === 'mine' && statusConf && (
                    <span className={`badge ${statusConf.class}`}>{statusConf.label}</span>
                  )}
                </div>

                <p style={{ fontSize: 14, color: 'var(--color-ink)', lineHeight: 1.65, marginBottom: 16 }}>
                  {pub.content.length > 300 ? pub.content.substring(0, 300) + '…' : pub.content}
                </p>

                {pub.status === 'PUBLISHED' && tab === 'feed' && (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleReact(pub.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <ThumbsUp size={14} />
                      {pub.reactedUserIds?.length || 0} réaction{(pub.reactedUserIds?.length || 0) > 1 ? 's' : ''}
                      {pub.reactedUserIds?.length >= 20 && (
                        <span style={{ color: 'var(--color-success)', fontWeight: 700 }}> · Bonus atteint !</span>
                      )}
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleReport(pub.id)}
                      style={{ color: 'var(--color-ink-muted)', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <AlertTriangle size={13} /> Signaler
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
