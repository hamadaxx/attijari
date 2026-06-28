import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileApi, publicationApi, kybApi } from '../../api';
import toast from 'react-hot-toast';
import {
  Users, FileText, CheckCircle, XCircle, MessageSquare,
  TrendingUp, Award, Clock, BarChart2, Shield, AlertTriangle,
  UserX, ArrowUpCircle, Zap
} from 'lucide-react';

const PRE_QUAL_THRESHOLD = 50;

const STAGE_META = {
  IDEA:   { label: 'Idée',       color: '#8b5cf6' },
  MVP:    { label: 'MVP',        color: '#3b82f6' },
  GROWTH: { label: 'Croissance', color: '#f59e0b' },
  SCALE:  { label: 'Scale',      color: '#10b981' },
};

export default function CMDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState({
    pendingProfiles: [], approvedProfiles: [], pendingPubs: [],
    inactiveProfiles: [], pendingKyb: [],
  });
  const [loading, setLoading] = useState(true);

  const [validating, setValidating] = useState(null);
  const [validationForm, setValidationForm] = useState({ action: '', reason: '' });
  const [archiving, setArchiving] = useState(null);
  const [archiveReason, setArchiveReason] = useState('');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [pendRes, approvedRes, pubsRes, inactiveRes, kybRes] = await Promise.all([
        profileApi.getPending(),
        profileApi.getApproved(),
        publicationApi.getPending(),
        profileApi.getInactive().catch(() => ({ data: [] })),
        kybApi.getPending().catch(() => ({ data: [] })),
      ]);
      setData({
        pendingProfiles:  pendRes.data,
        approvedProfiles: approvedRes.data,
        pendingPubs:      pubsRes.data,
        inactiveProfiles: inactiveRes.data,
        pendingKyb:       kybRes.data,
      });
    } catch {
      toast.error('Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (profileId) => {
    if (!validationForm.action) { toast.error('Choisissez une action.'); return; }
    if ((validationForm.action === 'REJECT' || validationForm.action === 'REQUEST_INFO') && !validationForm.reason.trim()) {
      toast.error('Une explication est obligatoire.'); return;
    }
    try {
      await profileApi.validate(profileId, validationForm);
      toast.success('Décision enregistrée.');
      setValidating(null);
      setValidationForm({ action: '', reason: '' });
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur.');
    }
  };

  const handleApprovePub = async (id) => {
    try {
      await publicationApi.approve(id);
      toast.success('Publication approuvée. +5 pts attribués.');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur.');
    }
  };

  const handleArchivePub = async (id) => {
    if (!archiveReason.trim()) { toast.error('La raison d\'archivage est obligatoire.'); return; }
    try {
      await publicationApi.archive(id, archiveReason);
      toast.success('Publication archivée.');
      setArchiving(null);
      setArchiveReason('');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur.');
    }
  };

  // ── Computed stats ────────────────────────────────────────────────────────
  const { pendingProfiles, approvedProfiles, pendingPubs, inactiveProfiles, pendingKyb } = data;
  const total = approvedProfiles.length;
  const preQualified = approvedProfiles.filter(p => p.intelligenceScore >= PRE_QUAL_THRESHOLD).length;
  const avgScore = total > 0 ? Math.round(approvedProfiles.reduce((s, p) => s + (p.intelligenceScore || 0), 0) / total) : 0;

  const flaggedPubs = pendingPubs.filter(p => (p.plagiarismReportCount || 0) > 0);

  // Daily workload = all pending actions
  const dailyLoad = pendingProfiles.length + pendingPubs.length + pendingKyb.length;

  const bySector = approvedProfiles.reduce((acc, p) => {
    const s = p.businessSector || 'Non renseigné';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  const sectorEntries = Object.entries(bySector).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const sectorMax = sectorEntries[0]?.[1] || 1;

  const byStage = approvedProfiles.reduce((acc, p) => {
    const s = p.developmentStage || 'IDEA';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Tableau de bord — Admin</h1>
          <p className="page-subtitle">Vue opérationnelle quotidienne</p>
        </div>
        {/* US-DASH-02: Daily load indicator */}
        <div style={{
          background: dailyLoad > 0 ? '#fff7ed' : '#f0fdf4',
          border: `1px solid ${dailyLoad > 0 ? '#fed7aa' : '#bbf7d0'}`,
          borderRadius: 10, padding: '12px 18px', textAlign: 'right'
        }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: dailyLoad > 0 ? '#f59e0b' : '#16a34a', lineHeight: 1 }}>
            {dailyLoad}
          </div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>actions requises aujourd'hui</div>
        </div>
      </div>

      {/* ── KPI row ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <KpiCard icon={Users}      label="Startups approuvées"  value={total}         color="#16a34a" />
        <KpiCard icon={Clock}      label="Profils en attente"   value={pendingProfiles.length} color="#E8543F" />
        <KpiCard icon={TrendingUp} label="Score SE moyen"       value={`${avgScore} pts`} color="#3b82f6" />
        <KpiCard icon={Award}      label="Pré-qualifiées (≥50)" value={preQualified}  color="#f59e0b" />
      </div>

      {/* ── Startup analytics ─────────────────────────────────────────── */}
      {!loading && total > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
          <div className="card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <BarChart2 size={15} color="#6b7280" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Répartition par secteur</span>
            </div>
            {sectorEntries.map(([sector, count]) => (
              <div key={sector} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: '#374151' }}>{sector}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280' }}>{count}</span>
                </div>
                <div style={{ height: 6, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(count / sectorMax) * 100}%`, background: '#E8543F', borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <TrendingUp size={15} color="#6b7280" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Répartition par stade</span>
            </div>
            {Object.entries(STAGE_META).map(([key, { label, color }]) => {
              const count = byStage[key] || 0;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={key} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                      <span style={{ fontSize: 12, color: '#374151' }}>{label}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280' }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height: 6, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4 }} />
                  </div>
                </div>
              );
            })}
            {/* Score buckets */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 16 }}>
              {[
                { label: '< 25 pts', filter: p => p.intelligenceScore < 25, color: '#ef4444' },
                { label: '25–49 pts', filter: p => p.intelligenceScore >= 25 && p.intelligenceScore < 50, color: '#f59e0b' },
                { label: '≥ 50 pts', filter: p => p.intelligenceScore >= 50, color: '#16a34a' },
              ].map(({ label, filter, color }) => (
                <div key={label} style={{ textAlign: 'center', background: color + '12', borderRadius: 8, padding: '8px 4px' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color }}>{approvedProfiles.filter(filter).length}</div>
                  <div style={{ fontSize: 10, color: '#6b7280' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── US-DASH-02: 4 work queues ─────────────────────────────────── */}
      <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: '#374151' }}>Files de travail prioritaires</h2>

      {loading ? <p style={{ color: '#9ca3af' }}>Chargement…</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

          {/* Queue 1: Profils à valider SLA 48h */}
          <QueueCard
            icon={Users} label="Profils à valider" count={pendingProfiles.length}
            sla="SLA 48h" color="#E8543F"
            onViewAll={() => navigate('/cm/profiles')}
          >
            {pendingProfiles.slice(0, 3).map(p => (
              <QueueItem key={p.id} onClick={() => navigate('/cm/profiles')}>
                <strong>{p.companyName || 'Profil sans nom'}</strong>
                <span>{p.businessSector || '—'}</span>
              </QueueItem>
            ))}
          </QueueCard>

          {/* Queue 2: Contenus signalés SLA 24h */}
          <QueueCard
            icon={AlertTriangle} label="Contenus signalés" count={flaggedPubs.length}
            sla="SLA 24h" color="#dc2626"
            onViewAll={() => navigate('/cm/publications')}
          >
            {flaggedPubs.slice(0, 3).map(p => (
              <QueueItem key={p.id} onClick={() => navigate('/cm/publications')}>
                <strong>{p.title}</strong>
                <span style={{ color: '#dc2626' }}>{p.plagiarismReportCount} signalement{p.plagiarismReportCount > 1 ? 's' : ''}</span>
              </QueueItem>
            ))}
            {flaggedPubs.length === 0 && (
              <div style={{ fontSize: 12, color: '#9ca3af', padding: '8px 0' }}>Aucun contenu signalé ✓</div>
            )}
          </QueueCard>

          {/* Queue 3: Membres inactifs 14-28j */}
          <QueueCard
            icon={UserX} label="Membres inactifs (14–28j)" count={inactiveProfiles.length}
            sla="À réactiver" color="#f59e0b"
            onViewAll={() => navigate('/cm/profiles')}
          >
            {inactiveProfiles.slice(0, 3).map(p => (
              <QueueItem key={p.id} onClick={() => navigate('/cm/profiles')}>
                <strong>{p.companyName || 'Profil sans nom'}</strong>
                <span style={{ color: '#9ca3af' }}>Score SE : {p.intelligenceScore} pts</span>
              </QueueItem>
            ))}
            {inactiveProfiles.length === 0 && (
              <div style={{ fontSize: 12, color: '#9ca3af', padding: '8px 0' }}>Aucun membre inactif ✓</div>
            )}
          </QueueCard>

          {/* Queue 4: Dossiers KYB en attente */}
          <QueueCard
            icon={Shield} label="Dossiers KYB en attente" count={pendingKyb.length}
            sla="SLA 48h ouvrées" color="#3b82f6"
            onViewAll={() => navigate('/cm/kyb')}
          >
            {pendingKyb.slice(0, 3).map(d => (
              <QueueItem key={d.id} onClick={() => navigate('/cm/kyb')}>
                <strong>{d.companyName}</strong>
                <span>{d.legalForm}</span>
              </QueueItem>
            ))}
            {pendingKyb.length === 0 && (
              <div style={{ fontSize: 12, color: '#9ca3af', padding: '8px 0' }}>Aucun dossier KYB en attente ✓</div>
            )}
          </QueueCard>
        </div>
      )}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' }}>
      <div style={{ width: 44, height: 44, flexShrink: 0, background: color + '18', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--color-ink-muted)', marginTop: 3 }}>{label}</div>
      </div>
    </div>
  );
}

function QueueCard({ icon: Icon, label, count, sla, color, onViewAll, children }) {
  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, background: color + '18', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={15} color={color} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{label}</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>{sla}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20, fontWeight: 900, color }}>{count}</span>
          {count > 0 && (
            <button onClick={onViewAll} style={{ fontSize: 11, padding: '3px 8px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 5, cursor: 'pointer', color: '#374151' }}>
              Voir tout
            </button>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {children}
      </div>
    </div>
  );
}

function QueueItem({ onClick, children }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 10px', borderRadius: 6, background: '#f9fafb',
      cursor: 'pointer', fontSize: 12, gap: 8,
    }}
    onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
    onMouseLeave={e => e.currentTarget.style.background = '#f9fafb'}
    >
      {children}
    </div>
  );
}
