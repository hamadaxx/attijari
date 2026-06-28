import React, { useState, useEffect } from 'react';
import { publicationApi } from '../../api';
import toast from 'react-hot-toast';
import { FileText, CheckCircle, Archive, AlertTriangle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUS_INFO = {
  PENDING_EDITORIAL: { label: 'En attente', color: '#f59e0b', icon: Clock },
  PUBLISHED:         { label: 'Publiée',    color: '#16a34a', icon: CheckCircle },
  ARCHIVED:          { label: 'Archivée',   color: '#6b7280', icon: Archive },
  REMOVED_PLAGIARISM:{ label: 'Plagiat',    color: '#dc2626', icon: AlertTriangle },
};

export default function CMPublicationsPage() {
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const { data } = await publicationApi.getPending();
      setPublications(data);
    } catch {
      toast.error('Erreur lors du chargement des publications.');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(pub) {
    try {
      await publicationApi.approve(pub.id);
      toast.success(`"${pub.title}" approuvée et publiée.`);
      setSelected(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur lors de l\'approbation.');
    }
  }

  async function handleArchive(pub) {
    const reason = window.prompt('Raison de l\'archivage (obligatoire pour la piste d\'audit) :');
    if (!reason?.trim()) return;
    try {
      await publicationApi.archive(pub.id, reason.trim());
      toast.success(`"${pub.title}" archivée.`);
      setSelected(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur lors de l\'archivage.');
    }
  }

  const pending = publications.filter(p => p.status === 'PENDING_EDITORIAL');

  return (
    <div style={{ padding: '32px 40px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <FileText size={20} /> Modération des publications
        </h1>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
          {pending.length} publication{pending.length !== 1 ? 's' : ''} en attente de validation éditoriale
        </p>
      </div>

      {loading ? (
        <p style={{ color: '#9ca3af', fontSize: 14 }}>Chargement…</p>
      ) : pending.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
          <CheckCircle size={40} style={{ marginBottom: 12, opacity: 0.4, color: '#16a34a' }} />
          <p style={{ fontSize: 15, fontWeight: 600 }}>Aucune publication en attente.</p>
          <p style={{ fontSize: 13 }}>Toutes les publications ont été traitées.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1.4fr' : '1fr', gap: 20, alignItems: 'start' }}>
          {/* List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pending.map(pub => (
              <div
                key={pub.id}
                onClick={() => setSelected(pub)}
                style={{
                  background: 'white',
                  borderRadius: 10,
                  padding: '16px 20px',
                  boxShadow: selected?.id === pub.id
                    ? '0 0 0 2px #F8B618'
                    : '0 1px 3px rgba(0,0,0,0.08)',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {pub.title}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      par <strong>{pub.authorName || pub.authorId}</strong>
                      {pub.sector && <span> · {pub.sector}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                      Soumis le {pub.createdAt
                        ? format(new Date(pub.createdAt), 'dd MMM yyyy', { locale: fr })
                        : '—'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    {pub.plagiarismReportCount > 0 && (
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px',
                        borderRadius: 10, background: '#fee2e2', color: '#dc2626',
                        display: 'flex', alignItems: 'center', gap: 4
                      }}>
                        <AlertTriangle size={10} />
                        {pub.plagiarismReportCount} signalement{pub.plagiarismReportCount > 1 ? 's' : ''}
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: '#6b7280' }}>
                      {pub.reactionCount ?? 0} réaction{pub.reactionCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detail panel */}
          {selected && (
            <div style={{
              background: 'white', borderRadius: 10, padding: '24px 28px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)', position: 'sticky', top: 20
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 4px' }}>{selected.title}</h2>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    par <strong>{selected.authorName || selected.authorId}</strong>
                    {selected.sector && <span> · {selected.sector}</span>}
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#9ca3af', lineHeight: 1 }}
                >×</button>
              </div>

              {selected.plagiarismReportCount > 0 && (
                <div style={{
                  background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8,
                  padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#b91c1c',
                  display: 'flex', alignItems: 'center', gap: 8
                }}>
                  <AlertTriangle size={14} />
                  {selected.plagiarismReportCount} signalement{selected.plagiarismReportCount > 1 ? 's' : ''} de plagiat reçu{selected.plagiarismReportCount > 1 ? 's' : ''}
                </div>
              )}

              <div style={{
                background: '#f9fafb', borderRadius: 8, padding: '14px 16px',
                fontSize: 14, lineHeight: 1.7, color: '#374151',
                maxHeight: 300, overflowY: 'auto', marginBottom: 20,
                whiteSpace: 'pre-wrap', wordBreak: 'break-word'
              }}>
                {selected.content}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => handleApprove(selected)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '10px', background: '#16a34a', color: 'white',
                    border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  <CheckCircle size={15} /> Approuver
                </button>
                <button
                  onClick={() => handleArchive(selected)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '10px', background: '#f3f4f6', color: '#374151',
                    border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  <Archive size={15} /> Archiver
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
