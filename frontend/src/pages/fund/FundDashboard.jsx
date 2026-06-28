import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fundApi } from '../../api';
import toast from 'react-hot-toast';
import { TrendingUp, TrendingDown, Minus, Users, BarChart2, Search, Filter } from 'lucide-react';

const SECTORS = ['Fintech', 'Agritech', 'Healthtech', 'Edtech', 'E-commerce', 'Logistique', 'Autre'];

export default function FundDashboard() {
  const navigate = useNavigate();
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ sector: '', location: '', minScore: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.sector) params.sector = filters.sector;
      if (filters.location) params.location = filters.location;
      if (filters.minScore) params.minScore = parseInt(filters.minScore);
      const { data } = await fundApi.getPrequalifiedStartups(params);
      setStartups(data);
    } catch {
      toast.error('Erreur lors du chargement des startups.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const scoreTrend = (ev) => {
    if (ev > 0) return <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4 }}><TrendingUp size={14} />+{ev}</span>;
    if (ev < 0) return <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4 }}><TrendingDown size={14} />{ev}</span>;
    return <span style={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}><Minus size={14} />0</span>;
  };

  return (
    <div style={{ padding: '32px 40px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Startups pré-qualifiées</h1>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
          {startups.length} startup{startups.length !== 1 ? 's' : ''} au-dessus du seuil de pré-qualification
        </p>
      </div>

      {/* Filters */}
      <div style={{
        background: 'white', borderRadius: 10, padding: '16px 20px',
        marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
      }}>
        <Filter size={16} style={{ color: '#9ca3af', marginBottom: 8 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Secteur</label>
          <select
            value={filters.sector}
            onChange={e => setFilters(f => ({ ...f, sector: e.target.value }))}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}
          >
            <option value="">Tous</option>
            {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Localisation</label>
          <input
            placeholder="ex. Tunis"
            value={filters.location}
            onChange={e => setFilters(f => ({ ...f, location: e.target.value }))}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Score minimum</label>
          <input
            type="number" placeholder="50"
            value={filters.minScore}
            onChange={e => setFilters(f => ({ ...f, minScore: e.target.value }))}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, width: 90 }}
          />
        </div>

        <button
          onClick={load}
          style={{
            padding: '8px 16px', background: '#E8543F', color: 'white',
            border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6
          }}
        >
          <Search size={14} /> Filtrer
        </button>
      </div>

      {/* Startups grid */}
      {loading ? (
        <p style={{ color: '#9ca3af', fontSize: 14 }}>Chargement…</p>
      ) : startups.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
          <BarChart2 size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p>Aucune startup ne correspond aux critères de pré-qualification actuels.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {startups.map(s => (
            <div
              key={s.profileId}
              onClick={() => navigate(`/fund/startups/${s.profileId}`)}
              style={{
                background: 'white', borderRadius: 10, padding: '20px 22px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)', cursor: 'pointer',
                transition: 'box-shadow 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{s.companyName || 'N/A'}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                    {s.businessSector} · {s.developmentStage}
                  </div>
                </div>
                <div style={{
                  background: '#fef9c3', color: '#92400e', borderRadius: 20,
                  padding: '4px 10px', fontSize: 13, fontWeight: 700
                }}>
                  {s.intelligenceScore} pts
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#6b7280' }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>Tendance 90j</div>
                  {scoreTrend(s.scoreEvolution90Days)}
                </div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>Interactions</div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Users size={13} />{s.communityInteractionCount}
                  </span>
                </div>
                {s.location && (
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>Localisation</div>
                    <span>{s.location}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
