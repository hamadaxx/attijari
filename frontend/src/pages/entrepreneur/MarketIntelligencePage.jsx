import React, { useState, useEffect, useCallback } from 'react';
import { marketApi } from '../../api';
import toast from 'react-hot-toast';
import { Globe, ExternalLink, Search, RefreshCw, AlertTriangle, ToggleLeft, ToggleRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const TABS = [
  {
    key: 'CONCURRENT',
    label: 'Concurrents',
    description: 'Startups et entreprises concurrentes sur votre marché',
    color: '#8b5cf6',
  },
  {
    key: 'FINANCEMENT',
    label: 'Financements',
    description: 'Levées de fonds, investisseurs, programmes seed et venture',
    color: '#F8B618',
  },
  {
    key: 'ACTUALITE',
    label: 'Actualités',
    description: 'Tendances économiques, technologiques et réglementaires',
    color: '#E8543F',
  },
];

export default function MarketIntelligencePage() {
  const [activeTab, setActiveTab] = useState('CONCURRENT');
  const [filtrerTunisie, setFiltrerTunisie] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [noApiKey, setNoApiKey] = useState(false);
  const [apiError, setApiError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchResults = useCallback(async (tab, tunisie, query, pageNum = 1, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setNoApiKey(false);
    setApiError('');
    try {
      const params = { categorie: tab, filtrerTunisie: tunisie, page: pageNum };
      if (query) params.q = query;
      const res = await marketApi.search(params);
      const newResults = res.data;
      setResults(prev => append ? [...prev, ...newResults] : newResults);
      setHasMore(newResults.length === 10);
      setPage(pageNum);
    } catch (err) {
      if (!append) setResults([]);
      const status = err.response?.status;
      if (status === 503) {
        setNoApiKey(true);
      } else {
        const msg = err.response?.data?.message || err.message || 'Erreur lors de la recherche.';
        setApiError(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Auto-fetch on tab or toggle change
  useEffect(() => {
    setActiveQuery('');
    setSearchInput('');
    setPage(1);
    fetchResults(activeTab, filtrerTunisie, '', 1, false);
  }, [activeTab, filtrerTunisie, fetchResults]);

  const handleSearch = (e) => {
    e.preventDefault();
    setActiveQuery(searchInput);
    setPage(1);
    fetchResults(activeTab, filtrerTunisie, searchInput, 1, false);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setActiveQuery('');
    setPage(1);
    fetchResults(activeTab, filtrerTunisie, '', 1, false);
  };

  const handleLoadMore = () => {
    fetchResults(activeTab, filtrerTunisie, activeQuery, page + 1, true);
  };

  const activeTabMeta = TABS.find(t => t.key === activeTab);

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1000, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Globe size={20} color="#E8543F" /> Veille Marché
        </h1>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
          Surveillance concurrentielle, financements et actualités — propulsé par Google Search
        </p>
      </div>

      {/* Controls bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 16, flexWrap: 'wrap' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, background: 'white', border: '1px solid #E5E0D8', borderRadius: 10, padding: 4 }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '7px 18px', borderRadius: 7, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: activeTab === tab.key ? 700 : 400,
                background: activeTab === tab.key ? tab.color : 'transparent',
                color: activeTab === tab.key ? 'white' : '#6b7280',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Toggle Tunisie */}
        <button
          onClick={() => setFiltrerTunisie(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: filtrerTunisie ? '#FEF8E8' : 'white',
            border: `1px solid ${filtrerTunisie ? '#F8B618' : '#E5E0D8'}`,
            borderRadius: 8, padding: '7px 14px', cursor: 'pointer',
            fontSize: 13, fontWeight: filtrerTunisie ? 600 : 400,
            color: filtrerTunisie ? '#92650a' : '#6b7280',
            transition: 'all 0.15s',
          }}
        >
          {filtrerTunisie
            ? <ToggleRight size={18} color="#F8B618" />
            : <ToggleLeft size={18} color="#d1d5db" />}
          Tunisie uniquement
        </button>
      </div>

      {/* Search box */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder={`Affiner la recherche "${activeTabMeta?.label}"…`}
            style={{
              width: '100%', padding: '9px 36px 9px 36px',
              border: '1.5px solid #E5E0D8', borderRadius: 8,
              fontSize: 13, background: 'white', boxSizing: 'border-box',
              outline: 'none',
            }}
          />
          {searchInput && (
            <button type="button" onClick={handleClearSearch}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex' }}>
              ×
            </button>
          )}
        </div>
        <button type="submit" disabled={loading}
          style={{
            padding: '9px 18px', background: '#E8543F', color: 'white',
            border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
            cursor: loading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            opacity: loading ? 0.7 : 1,
          }}>
          <Search size={14} /> Rechercher
        </button>
        <button type="button" onClick={() => fetchResults(activeTab, filtrerTunisie, activeQuery)}
          disabled={loading}
          title="Rafraîchir"
          style={{
            padding: '9px 12px', background: 'white', border: '1.5px solid #E5E0D8',
            borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center',
            color: '#6b7280',
          }}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </form>

      {/* Context line */}
      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: activeTabMeta?.color, display: 'inline-block' }} />
        {activeTabMeta?.description}
        {activeQuery && <span> · Recherche : <strong style={{ color: '#374151' }}>"{activeQuery}"</strong></span>}
        {filtrerTunisie && <span style={{ background: '#FEF8E8', color: '#92650a', padding: '1px 7px', borderRadius: 100, fontSize: 11, fontWeight: 700, marginLeft: 4 }}>🇹🇳 Tunisie</span>}
      </div>

      {/* Results */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
          <RefreshCw size={28} style={{ marginBottom: 12, opacity: 0.4, animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: 14 }}>Recherche en cours…</p>
        </div>
      ) : noApiKey ? (
        <div style={{
          background: '#FEF8E8', border: '1px solid #F8B618', borderRadius: 10,
          padding: '28px 32px', display: 'flex', gap: 16, alignItems: 'flex-start',
        }}>
          <AlertTriangle size={20} color="#F8B618" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>
              Google Search API non configurée
            </div>
            <div style={{ fontSize: 13, color: '#78350f', lineHeight: 1.7 }}>
              Pour activer la veille marché, configurez les variables d'environnement suivantes avant de démarrer le backend :
              <br />
              <code style={{ background: '#111111', color: '#F8B618', padding: '2px 8px', borderRadius: 4, fontSize: 12, display: 'inline-block', marginTop: 8 }}>
                GOOGLE_API_KEY=votre_clé &nbsp;&nbsp; GOOGLE_SEARCH_ENGINE_ID=votre_cx
              </code>
            </div>
          </div>
        </div>
      ) : apiError ? (
        <div style={{
          background: '#FEF2F2', border: '1px solid #E8543F', borderRadius: 10,
          padding: '28px 32px', display: 'flex', gap: 16, alignItems: 'flex-start',
        }}>
          <AlertTriangle size={20} color="#E8543F" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#991b1b', marginBottom: 4 }}>
              Erreur Veille Marché
            </div>
            <div style={{ fontSize: 13, color: '#7f1d1d' }}>{apiError}</div>
          </div>
        </div>
      ) : results.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
          <Globe size={36} style={{ marginBottom: 12, opacity: 0.25 }} />
          <p style={{ fontSize: 14 }}>Aucun résultat trouvé.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {results.map((item, i) => (
              <ResultCard key={item.id || i} item={item} accentColor={activeTabMeta?.color} />
            ))}
          </div>

          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                style={{
                  padding: '10px 32px',
                  background: 'white',
                  border: `1.5px solid ${activeTabMeta?.color}`,
                  borderRadius: 8,
                  color: activeTabMeta?.color,
                  fontSize: 13, fontWeight: 600,
                  cursor: loadingMore ? 'default' : 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  opacity: loadingMore ? 0.6 : 1,
                  transition: 'all 0.15s',
                }}
              >
                {loadingMore
                  ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Chargement…</>
                  : '↓ Voir plus de résultats'}
              </button>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function ResultCard({ item, accentColor }) {
  return (
    <div style={{
      background: 'white', borderRadius: 10, padding: '18px 22px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.07)', border: '1px solid #E5E0D8',
      display: 'flex', gap: 16, alignItems: 'flex-start',
      transition: 'box-shadow 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.10)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.07)'}
    >
      {/* Accent bar */}
      <div style={{ width: 3, borderRadius: 3, background: accentColor, alignSelf: 'stretch', flexShrink: 0 }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 15, fontWeight: 700, color: '#111111', textDecoration: 'none', lineHeight: 1.3, flex: 1 }}
            onMouseEnter={e => e.currentTarget.style.color = accentColor}
            onMouseLeave={e => e.currentTarget.style.color = '#111111'}
          >
            {item.title}
          </a>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 12, fontWeight: 600, color: accentColor,
              textDecoration: 'none', flexShrink: 0,
              padding: '4px 10px', border: `1px solid ${accentColor}20`,
              borderRadius: 6, background: accentColor + '10',
              whiteSpace: 'nowrap',
            }}
          >
            <ExternalLink size={11} /> Ouvrir
          </a>
        </div>

        {item.snippet && (
          <p style={{ fontSize: 13, color: '#5C5C5C', marginTop: 6, marginBottom: 8, lineHeight: 1.6 }}>
            {item.snippet}
          </p>
        )}

        <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 11, color: '#9ca3af' }}>
          {item.source && (
            <span style={{
              background: '#F9F8F5', border: '1px solid #E5E0D8',
              padding: '2px 8px', borderRadius: 100, fontWeight: 600, color: '#6b7280',
            }}>
              {item.source}
            </span>
          )}
          {item.dateAdded && (
            <span>
              {format(new Date(item.dateAdded), 'dd MMM yyyy HH:mm', { locale: fr })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
