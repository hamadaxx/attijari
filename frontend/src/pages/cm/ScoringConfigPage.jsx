import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { scoringConfigApi } from '../../api';
import toast from 'react-hot-toast';
import { Settings, CheckCircle, Clock, XCircle } from 'lucide-react';

const DEFAULT_TYPES = [
  { key: 'PROFILE_CREATED', label: 'Profil créé', default: 10 },
  { key: 'EVENT_ATTENDED', label: 'Événement assisté', default: 10 },
  { key: 'EVENT_ABSENCE_PENALTY', label: 'Pénalité absence (×3)', default: -5 },
  { key: 'PUBLICATION_APPROVED', label: 'Publication approuvée', default: 5 },
  { key: 'PUBLICATION_BONUS', label: 'Bonus publication (>20 réactions)', default: 10 },
  { key: 'PUBLICATION_PLAGIARISM', label: 'Pénalité plagiat', default: -15 },
  { key: 'VENTURE_STUDIO_DELIVERABLE', label: 'Livrable Venture Studio', default: 15 },
];

const STATUS_BADGE = {
  ACTIVE: { label: 'Active', color: '#16a34a' },
  PENDING_APPROVAL: { label: 'En attente', color: '#f59e0b' },
  DRAFT: { label: 'Brouillon', color: '#6b7280' },
  SUPERSEDED: { label: 'Remplacée', color: '#9ca3af' },
  REJECTED: { label: 'Rejetée', color: '#dc2626' },
  DEFAULT: { label: 'Par défaut', color: '#3b82f6' },
};

export default function ScoringConfigPage() {
  const [active, setActive] = useState(null);
  const [pending, setPending] = useState(null);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState('current'); // 'current' | 'propose' | 'history'
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm();

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [a, p, h] = await Promise.all([
        scoringConfigApi.getActive(),
        scoringConfigApi.getPending(),
        scoringConfigApi.getAll(),
      ]);
      setActive(a.data);
      setPending(p.status === 204 ? null : p.data);
      setHistory(h.data);
    } catch {
      toast.error('Erreur chargement configuration.');
    } finally {
      setLoading(false);
    }
  }

  async function onPropose(data) {
    const weights = {};
    DEFAULT_TYPES.forEach(({ key }) => {
      weights[key] = parseInt(data[key]) || 0;
    });
    try {
      const config = await scoringConfigApi.propose({
        weights,
        prequalificationThreshold: parseInt(data.threshold) || 50,
        justification: data.justification,
      });
      await scoringConfigApi.submitForApproval(config.data.id);
      toast.success('Configuration soumise pour approbation.');
      setTab('current');
      loadAll();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur lors de la soumission.');
    }
  }

  async function approve(configId) {
    try {
      await scoringConfigApi.approve(configId, { note: 'Approuvé' });
      toast.success('Configuration activée.');
      loadAll();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur: double regard requis (utilisateur différent).');
    }
  }

  async function reject(configId) {
    const note = window.prompt('Raison du rejet (obligatoire):');
    if (!note) return;
    try {
      await scoringConfigApi.reject(configId, { note });
      toast.success('Configuration rejetée.');
      loadAll();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur.');
    }
  }

  const weightsDisplay = active?.weights || active?.weights === undefined
    ? (active?.status === 'DEFAULT' ? DEFAULT_TYPES.reduce((m, t) => ({ ...m, [t.key]: t.default }), {}) : active?.weights)
    : null;

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Settings size={20} /> Grille de scoring
        </h1>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
          Configuration des poids de scoring et du seuil de pré-qualification
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #e5e7eb', paddingBottom: 0 }}>
        {[
          { key: 'current', label: 'Configuration actuelle' },
          { key: 'propose', label: 'Proposer une modification' },
          { key: 'history', label: 'Historique' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: tab === t.key ? 700 : 400,
            color: tab === t.key ? '#F8B618' : '#6b7280',
            borderBottom: tab === t.key ? '2px solid #F8B618' : '2px solid transparent',
            marginBottom: -1
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: '#9ca3af' }}>Chargement…</p>
      ) : tab === 'current' ? (
        <div>
          {/* Pending approval banner */}
          {pending && (
            <div style={{ background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: 8,
              padding: '14px 18px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: 13 }}>Configuration en attente d'approbation</strong>
                <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>Justification : {pending.justification}</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => approve(pending.id)} style={{
                  padding: '6px 14px', background: '#16a34a', color: 'white',
                  border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer'
                }}>Approuver</button>
                <button onClick={() => reject(pending.id)} style={{
                  padding: '6px 14px', background: '#dc2626', color: 'white',
                  border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer'
                }}>Rejeter</button>
              </div>
            </div>
          )}

          {/* Active weights table */}
          <div style={{ background: 'white', borderRadius: 10, padding: '20px 24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Poids actifs</h3>
                {active && (
                  <span style={{ fontSize: 11, color: STATUS_BADGE[active.status]?.color,
                    background: STATUS_BADGE[active.status]?.color + '20',
                    padding: '2px 8px', borderRadius: 10, marginTop: 4, display: 'inline-block' }}>
                    {STATUS_BADGE[active.status]?.label || active.status}
                  </span>
                )}
              </div>
              <div style={{ textAlign: 'right', fontSize: 13, color: '#6b7280' }}>
                <div>Seuil pré-qualification</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#111' }}>
                  {active?.prequalificationThreshold || 50} pts
                </div>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '8px 0', color: '#6b7280', fontWeight: 600 }}>Action</th>
                  <th style={{ textAlign: 'right', padding: '8px 0', color: '#6b7280', fontWeight: 600 }}>Points</th>
                </tr>
              </thead>
              <tbody>
                {DEFAULT_TYPES.map(({ key, label, default: def }) => {
                  const pts = (active?.weights || {})[key] ?? def;
                  return (
                    <tr key={key} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px 0', color: '#374151' }}>{label}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700,
                        color: pts > 0 ? '#16a34a' : pts < 0 ? '#dc2626' : '#6b7280' }}>
                        {pts > 0 ? '+' : ''}{pts}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : tab === 'propose' ? (
        <div style={{ background: 'white', borderRadius: 10, padding: '24px 28px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)', maxWidth: 560 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 0, marginBottom: 16 }}>
            Nouvelle proposition de grille
          </h3>
          <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 20 }}>
            La configuration sera soumise pour validation par un autre Admin (double regard obligatoire).
            Elle sera non-rétroactive : les scores existants ne seront pas recalculés.
          </p>

          <form onSubmit={handleSubmit(onPropose)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {DEFAULT_TYPES.map(({ key, label, default: def }) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <label style={{ fontSize: 13, flex: 1 }}>{label}</label>
                <input
                  type="number"
                  defaultValue={def}
                  {...register(key)}
                  style={{ width: 80, padding: '6px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, textAlign: 'right' }}
                />
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingTop: 8, borderTop: '1px solid #e5e7eb' }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Seuil pré-qualification (pts)</label>
              <input
                type="number" defaultValue={50}
                {...register('threshold', { required: true })}
                style={{ width: 80, padding: '6px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, textAlign: 'right' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Justification métier * (obligatoire pour piste d'audit)
              </label>
              <textarea
                {...register('justification', { required: true })}
                rows={3}
                placeholder="Expliquez pourquoi ces changements sont nécessaires…"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>

            <button type="submit" disabled={isSubmitting || !!pending} style={{
              padding: '10px', background: pending ? '#9ca3af' : '#E8543F', color: 'white',
              border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
              cursor: pending ? 'not-allowed' : 'pointer'
            }}>
              {pending ? 'Une proposition est déjà en attente' : isSubmitting ? 'Envoi…' : 'Proposer et soumettre'}
            </button>
          </form>
        </div>
      ) : (
        <div>
          {history.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: 14 }}>Aucun historique.</p>
          ) : history.map(c => (
            <div key={c.id} style={{ background: 'white', borderRadius: 8, padding: '14px 18px',
              marginBottom: 10, boxShadow: '0 1px 2px rgba(0,0,0,0.06)', fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontWeight: 600 }}>Seuil: {c.prequalificationThreshold} pts</span>
                <span style={{ fontSize: 11, color: STATUS_BADGE[c.status]?.color,
                  background: STATUS_BADGE[c.status]?.color + '20',
                  padding: '2px 8px', borderRadius: 10 }}>
                  {STATUS_BADGE[c.status]?.label || c.status}
                </span>
              </div>
              <div style={{ color: '#6b7280', fontSize: 12 }}>{c.justification}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
