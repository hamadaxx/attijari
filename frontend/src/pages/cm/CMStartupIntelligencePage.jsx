import React, { useState, useEffect, useCallback } from 'react';
import { cmIntelligenceApi } from '../../api';
import toast from 'react-hot-toast';
import { Zap, ExternalLink, RefreshCw, AlertTriangle, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const SECTORS = [
  { key: 'ALL',        label: 'Toutes',      color: '#111111' },
  { key: 'FINTECH',    label: 'Fintech',     color: '#E8543F' },
  { key: 'HEALTHTECH', label: 'Healthtech',  color: '#9333ea' },
  { key: 'ECOMMERCE',  label: 'E-commerce',  color: '#F8B618' },
];

const NIVEAU_OPTIONS = [
  { value: '',       label: 'Tous les niveaux' },
  { value: 'ELEVE',  label: '🟢 Potentiel Élevé'  },
  { value: 'MOYEN',  label: '🟠 Potentiel Moyen'   },
  { value: 'FAIBLE', label: '🔴 Potentiel Faible'  },
];

const BADGE = {
  ELEVE:  { label: 'Élevé',  bg: '#dcfce7', color: '#16a34a', border: '#86efac' },
  MOYEN:  { label: 'Moyen',  bg: '#fff7ed', color: '#ea580c', border: '#fdba74' },
  FAIBLE: { label: 'Faible', bg: '#fef2f2', color: '#dc2626', border: '#fca5a5' },
};

export default function CMStartupIntelligencePage() {
  const [activeSector, setActiveSector] = useState('ALL');
  const [niveauFilter, setNiveauFilter] = useState('');
  const [results, setResults]           = useState([]);
  const [loading, setLoading]           = useState(false);
  const [loadingMore, setLoadingMore]   = useState(false);
  const [apiError, setApiError]         = useState('');
  const [noApiKey, setNoApiKey]         = useState(false);
  const [page, setPage]                 = useState(1);
  const [hasMore, setHasMore]           = useState(false);

  const doFetch = useCallback(async (sector, niveau, pageNum, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setApiError('');
    setNoApiKey(false);
    try {
      const params = { secteur: sector, page: pageNum };
      if (niveau) params.niveauPotentiel = niveau;
      const res = await cmIntelligenceApi.topStartups(params);
      const data = res.data;
      setResults(prev => append ? [...prev, ...data] : data);
      setHasMore(data.length === 10);
      setPage(pageNum);
    } catch (err) {
      if (!append) setResults([]);
      const status = err.response?.status;
      if (status === 503) setNoApiKey(true);
      else {
        const msg = err.response?.data?.message || 'Erreur lors de la recherche.';
        setApiError(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    doFetch(activeSector, niveauFilter, 1, false);
  }, [activeSector, niveauFilter, doFetch]);

  const activeMeta = SECTORS.find(s => s.key === activeSector);

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1000, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Zap size={20} color="#F8B618" /> Intelligence Startups Tunisie
        </h1>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
          Startups classées par score de potentiel — analyse automatique des signaux de croissance
        </p>
      </div>

      {/* Controls row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>

        {/* Sector tabs */}
        <div style={{ display: 'flex', gap: 6, flex: 1, flexWrap: 'wrap' }}>
          {SECTORS.map(s => (
            <button key={s.key} onClick={() => setActiveSector(s.key)}
              style={{
                padding: '7px 18px', borderRadius: 100, border: `1.5px solid ${activeSector === s.key ? s.color : '#E5E0D8'}`,
                cursor: 'pointer', fontSize: 13, fontWeight: activeSector === s.key ? 700 : 400,
                background: activeSector === s.key ? s.color : '#F9F8F5',
                color: activeSector === s.key ? 'white' : '#6b7280',
                transition: 'all 0.15s',
              }}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Niveau filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Filter size={13} color="#9ca3af" />
          <select
            value={niveauFilter}
            onChange={e => setNiveauFilter(e.target.value)}
            style={{
              padding: '7px 10px', borderRadius: 8, border: '1.5px solid #E5E0D8',
              fontSize: 13, background: 'white', color: '#374151', cursor: 'pointer', outline: 'none',
            }}
          >
            {NIVEAU_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Refresh */}
        <button onClick={() => doFetch(activeSector, niveauFilter, 1, false)} disabled={loading}
          style={{ padding: '7px 12px', background: 'white', border: '1.5px solid #E5E0D8', borderRadius: 100, cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Actualiser
        </button>
      </div>

      {/* Context bar */}
      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: activeMeta?.color, display: 'inline-block' }} />
        Secteur : <strong style={{ color: '#374151' }}>{activeMeta?.label}</strong>
        <span style={{ background: '#FEF8E8', color: '#92650a', padding: '1px 7px', borderRadius: 100, fontSize: 11, fontWeight: 700, marginLeft: 4 }}>🇹🇳 Tunisie</span>
        {results.length > 0 && <span style={{ marginLeft: 4 }}>{results.length} résultat{results.length > 1 ? 's' : ''} · triés par score</span>}
      </div>

      {/* States */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
          <RefreshCw size={28} style={{ marginBottom: 12, opacity: 0.4, animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: 14 }}>Analyse en cours…</p>
        </div>

      ) : noApiKey ? (
        <div style={{ background: '#FEF8E8', border: '1px solid #F8B618', borderRadius: 10, padding: '28px 32px', display: 'flex', gap: 16 }}>
          <AlertTriangle size={20} color="#F8B618" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#92400e', marginBottom: 4 }}>API non configurée</div>
            <div style={{ fontSize: 13, color: '#78350f' }}>Configurez <code style={{ background: '#111', color: '#F8B618', padding: '1px 6px', borderRadius: 4 }}>serper.api.key</code> dans application.properties.</div>
          </div>
        </div>

      ) : apiError ? (
        <div style={{ background: '#FEF2F2', border: '1px solid #E8543F', borderRadius: 10, padding: '24px 28px', display: 'flex', gap: 14 }}>
          <AlertTriangle size={18} color="#E8543F" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#991b1b', marginBottom: 4 }}>Erreur</div>
            <div style={{ fontSize: 13, color: '#7f1d1d' }}>{apiError}</div>
          </div>
        </div>

      ) : results.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
          <Zap size={36} style={{ marginBottom: 12, opacity: 0.2 }} />
          <p style={{ fontSize: 14 }}>Aucun résultat{niveauFilter ? ` pour le niveau "${NIVEAU_OPTIONS.find(o=>o.value===niveauFilter)?.label}"` : ''}</p>
        </div>

      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {results.map((item, i) => (
              <StartupCard key={item.id || i} item={item} index={i} accentColor={activeMeta?.color} />
            ))}
          </div>

          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <button
                onClick={() => doFetch(activeSector, niveauFilter, page + 1, true)}
                disabled={loadingMore}
                style={{
                  padding: '10px 32px', background: 'white',
                  border: `1.5px solid ${activeMeta?.color}`, borderRadius: 8,
                  color: activeMeta?.color, fontSize: 13, fontWeight: 600,
                  cursor: loadingMore ? 'default' : 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  opacity: loadingMore ? 0.6 : 1,
                }}>
                {loadingMore
                  ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Chargement…</>
                  : '↓ Voir plus de startups'}
              </button>
            </div>
          )}
        </>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */

const SITE_SUFFIXES = [
  /\s*[-|–]\s*Crunchbase.*$/i,
  /\s*[-|–]\s*F6S.*$/i,
  /\s*[-|–]\s*Wamda.*$/i,
  /\s*[-|–]\s*StartupBlink.*$/i,
  /\s*[-|–]\s*LinkedIn.*$/i,
  /\s*\|\s*Crunchbase.*$/i,
  /\s*\|\s*F6S.*$/i,
];

function extractStartupName(title) {
  if (!title) return title;
  let name = title;
  for (const p of SITE_SUFFIXES) name = name.replace(p, '');
  return name.trim() || title;
}

function getInitials(name) {
  return name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

/* ── StartupCard ──────────────────────────────────────────────────────────── */

function StartupCard({ item, index, accentColor }) {
  const name   = extractStartupName(item.title);
  const badge  = BADGE[item.niveauPotentiel] || BADGE.FAIBLE;
  const criteres = item.criteresDetectes || [];

  return (
    <div
      style={{
        background: 'white', borderRadius: 12, padding: '16px 20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.07)', border: '1px solid #E5E0D8',
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.10)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.07)'}
    >
      {/* Top row */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>

        {/* Logo */}
        <div style={{
          width: 44, height: 44, borderRadius: 10, flexShrink: 0,
          background: index < 3 ? `linear-gradient(135deg, ${accentColor}cc, ${accentColor}66)` : '#F9F8F5',
          border: `1.5px solid ${index < 3 ? accentColor + '40' : '#E5E0D8'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 800, color: index < 3 ? 'white' : '#9ca3af', letterSpacing: '-0.02em',
        }}>
          {getInitials(name) || (index + 1)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name + badge + score + link */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#111111' }}>{name}</span>

                {/* Niveau badge */}
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
                  background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`,
                }}>
                  {badge.label}
                </span>

                {/* Score */}
                <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280' }}>
                  Score : <span style={{ color: '#111111' }}>{item.score ?? 0}/100</span>
                </span>
              </div>

              {item.source && (
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{item.source}</div>
              )}
            </div>

            <a href={item.url} target="_blank" rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 12, fontWeight: 600, color: accentColor,
                textDecoration: 'none', flexShrink: 0,
                padding: '5px 12px', border: `1.5px solid ${accentColor}40`,
                borderRadius: 7, background: accentColor + '0f', whiteSpace: 'nowrap',
              }}>
              <ExternalLink size={11} /> Voir profil
            </a>
          </div>

          {/* Description */}
          {item.snippet && (
            <p style={{ fontSize: 13, color: '#5C5C5C', margin: '8px 0 0', lineHeight: 1.6 }}>
              {item.snippet}
            </p>
          )}
        </div>
      </div>

      {/* Criteria tags */}
      {criteres.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12, paddingTop: 10, borderTop: '1px solid #F3F0EB' }}>
          {criteres.map(c => (
            <span key={c} style={{
              fontSize: 11, fontWeight: 600, padding: '2px 9px',
              borderRadius: 100, background: '#F0FDF4',
              color: '#15803d', border: '1px solid #bbf7d0',
            }}>{c}</span>
          ))}
        </div>
      )}
    </div>
  );
}
