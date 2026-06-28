import React, { useState, useEffect } from 'react';
import { kybApi } from '../../api';
import toast from 'react-hot-toast';
import { Shield, CheckCircle, XCircle, AlertTriangle, Clock, FileText, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUS_INFO = {
  SUBMITTED:     { label: 'Soumis',              color: '#3b82f6' },
  UNDER_REVIEW:  { label: 'En revue',            color: '#f59e0b' },
  APPROVED:      { label: 'Approuvé',            color: '#16a34a' },
  REJECTED:      { label: 'Rejeté',             color: '#dc2626' },
  INFO_REQUIRED: { label: 'Info requise',        color: '#f59e0b' },
};

export default function CMKybPage() {
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState(null); // null | 'approve' | 'reject' | 'info'
  const [notes, setNotes] = useState('');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => { load(); }, [showAll]);

  async function load() {
    setLoading(true);
    try {
      const res = showAll ? await kybApi.getAll() : await kybApi.getPending();
      setDossiers(res.data);
    } catch {
      toast.error('Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  }

  async function handleReview(reviewAction) {
    if ((reviewAction === 'REJECT' || reviewAction === 'INFO_REQUIRED') && !notes.trim()) {
      toast.error('Une explication est obligatoire.');
      return;
    }
    try {
      await kybApi.review(selected.id, { action: reviewAction, notes: notes.trim() || undefined });
      const labels = { APPROVE: 'approuvé', REJECT: 'rejeté', INFO_REQUIRED: 'mis en attente d\'info' };
      toast.success(`Dossier ${labels[reviewAction]}.`);
      setSelected(null);
      setAction(null);
      setNotes('');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur.');
    }
  }

  const pending = dossiers.filter(d => ['SUBMITTED', 'UNDER_REVIEW'].includes(d.status));

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield size={20} /> Revue KYB — Compliance
          </h1>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
            {pending.length} dossier{pending.length !== 1 ? 's' : ''} en attente · SLA 48h ouvrées
          </p>
        </div>
        <button
          onClick={() => setShowAll(!showAll)}
          style={{ fontSize: 12, padding: '6px 14px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer' }}
        >
          {showAll ? 'Voir en attente seulement' : 'Voir tous les dossiers'}
        </button>
      </div>

      {loading ? (
        <p style={{ color: '#9ca3af' }}>Chargement…</p>
      ) : dossiers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
          <CheckCircle size={40} style={{ marginBottom: 12, opacity: 0.4, color: '#16a34a' }} />
          <p>Aucun dossier KYB en attente.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '360px 1fr' : '1fr', gap: 20, alignItems: 'start' }}>

          {/* List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {dossiers.map(d => {
              const si = STATUS_INFO[d.status] || { label: d.status, color: '#6b7280' };
              return (
                <div
                  key={d.id}
                  onClick={() => { setSelected(d); setAction(null); setNotes(''); }}
                  style={{
                    background: 'white', borderRadius: 10, padding: '16px 18px', cursor: 'pointer',
                    boxShadow: selected?.id === d.id ? '0 0 0 2px #F8B618' : '0 1px 3px rgba(0,0,0,0.08)',
                    transition: 'box-shadow 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{d.companyName || '—'}</div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{d.legalForm} · {d.fiscalMatricule}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
                        Soumis le {d.submittedAt ? format(new Date(d.submittedAt), 'dd MMM yyyy', { locale: fr }) : '—'}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                      background: si.color + '20', color: si.color, whiteSpace: 'nowrap'
                    }}>
                      {si.label}
                    </span>
                  </div>
                  {d.startupActNumber && (
                    <div style={{ marginTop: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: '#dcfce7', color: '#16a34a' }}>
                        Startup Act (ANPE)
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Detail panel */}
          {selected && (
            <div style={{ background: 'white', borderRadius: 10, padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', position: 'sticky', top: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 4px' }}>{selected.companyName}</h2>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                    background: STATUS_INFO[selected.status]?.color + '20', color: STATUS_INFO[selected.status]?.color }}>
                    {STATUS_INFO[selected.status]?.label}
                  </span>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af' }}>×</button>
              </div>

              {/* Document files */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 8 }}>Pièces justificatives</div>
                {[
                  { key: 'ACTE_CONSTITUTION',   label: 'Acte de constitution' },
                  { key: 'MATRICULE_FISCAL',    label: 'Matricule fiscal INNORPI' },
                  { key: 'CIN_GERANT',          label: 'CIN du gérant' },
                  { key: 'JUSTIFICATIF_SIEGE',  label: 'Justificatif de siège' },
                ].map(({ key, label }) => {
                  const fileId   = selected.documentFileIds?.[key];
                  const fileName = selected.documentFileNames?.[key];
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {fileId
                          ? <CheckCircle size={13} color="#16a34a" />
                          : <XCircle size={13} color="#dc2626" />}
                        <span style={{ color: fileId ? '#374151' : '#9ca3af' }}>{label}</span>
                      </div>
                      {fileId && (
                        <button
                          onClick={async () => {
                            try {
                              const res = await kybApi.getDocument(fileId);
                              const url = URL.createObjectURL(res.data);
                              const a = document.createElement('a');
                              a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.click();
                              setTimeout(() => URL.revokeObjectURL(url), 5000);
                            } catch { toast.error('Impossible d\'ouvrir le document.'); }
                          }}
                          style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 5, padding: '2px 8px', fontSize: 11, cursor: 'pointer', color: '#374151', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Eye size={11} /> Ouvrir
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <InfoRow label="Forme juridique" value={selected.legalForm} />
                <InfoRow label="Matricule fiscal" value={selected.fiscalMatricule} />
                <InfoRow label="Représentant" value={selected.representativeFullName} />
                <InfoRow label="CIN" value={selected.representativeCin} />
                {selected.startupActNumber && <InfoRow label="N° ANPE" value={selected.startupActNumber} />}
                <InfoRow label="Siège social" value={selected.registeredAddress} />
              </div>

              <div style={{ height: 1, background: '#e5e7eb', margin: '16px 0' }} />

              {/* Action buttons */}
              {action === null && ['SUBMITTED', 'UNDER_REVIEW'].includes(selected.status) && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setAction('approve')} style={{ flex: 1, padding: '9px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <CheckCircle size={14} style={{ marginRight: 4 }} /> Approuver
                  </button>
                  <button onClick={() => setAction('info')} style={{ flex: 1, padding: '9px', background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Info requise
                  </button>
                  <button onClick={() => setAction('reject')} style={{ flex: 1, padding: '9px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <XCircle size={14} style={{ marginRight: 4 }} /> Rejeter
                  </button>
                </div>
              )}

              {action === 'approve' && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, color: '#16a34a' }}>Note interne (optionnelle)</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                    style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', marginBottom: 10 }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleReview('APPROVE')} style={{ flex: 1, padding: '9px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      Confirmer l'approbation (+20 pts)
                    </button>
                    <button onClick={() => setAction(null)} style={{ padding: '9px 14px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Annuler</button>
                  </div>
                </div>
              )}

              {(action === 'reject' || action === 'info') && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, color: action === 'reject' ? '#dc2626' : '#f59e0b' }}>
                    {action === 'reject' ? 'Motif de rejet *' : 'Informations demandées *'}
                  </label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Obligatoire — sera transmis à l'entrepreneur"
                    style={{ width: '100%', padding: '8px', borderRadius: 6, border: `1px solid ${action === 'reject' ? '#fca5a5' : '#fcd34d'}`, fontSize: 13, resize: 'vertical', boxSizing: 'border-box', marginBottom: 10 }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleReview(action === 'reject' ? 'REJECT' : 'INFO_REQUIRED')} disabled={!notes.trim()}
                      style={{ flex: 1, padding: '9px', background: action === 'reject' ? '#dc2626' : '#f59e0b', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: notes.trim() ? 'pointer' : 'not-allowed', opacity: notes.trim() ? 1 : 0.6 }}>
                      Confirmer
                    </button>
                    <button onClick={() => setAction(null)} style={{ padding: '9px 14px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Annuler</button>
                  </div>
                </div>
              )}

              {/* Audit log */}
              {selected.auditLog?.length > 0 && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #f3f4f6' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 8 }}>Journal d'audit</div>
                  {selected.auditLog.map((entry, i) => (
                    <div key={i} style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>
                      <strong>{entry.action}</strong> — {entry.timestamp ? new Date(entry.timestamp).toLocaleString('fr-FR') : ''}
                      {entry.note && ` : ${entry.note}`}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 13 }}>{value}</div>
    </div>
  );
}
