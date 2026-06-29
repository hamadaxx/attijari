import React, { useState, useEffect } from 'react';
import { financialApi } from '../../api';
import toast from 'react-hot-toast';
import { DollarSign, TrendingUp, Users, Clock, CheckCircle, AlertTriangle, Info } from 'lucide-react';

const FUNDING_STAGES = [
  { value: 'BOOTSTRAPPED', label: 'Bootstrapped (autofinancé)' },
  { value: 'PRE_SEED',     label: 'Pré-seed' },
  { value: 'SEED',         label: 'Seed' },
  { value: 'SERIES_A',     label: 'Série A' },
  { value: 'SERIES_B_PLUS',label: 'Série B+' },
];

const SCORE_COLOR = (s) => s >= 70 ? '#16a34a' : s >= 40 ? '#F8B618' : '#E8543F';
const SCORE_LABEL = (s) => s >= 70 ? 'Viabilité solide' : s >= 40 ? 'Viabilité modérée' : 'Viabilité faible';

// Mirror of the Java scoring logic — instant preview before save
function previewScore(form) {
  const rev  = parseFloat(form.monthlyRevenue)  || 0;
  const burn = parseFloat(form.monthlyBurnRate)  || 0;
  const runway = parseInt(form.runwayMonths)     || 0;
  const emp    = parseInt(form.employeeCount)    || 0;
  const funding = parseFloat(form.totalFundingRaised) || 0;
  const breakEven = form.breakEvenReached === true || form.breakEvenReached === 'true';

  let score = 0;
  if (rev > 0)       score += 10;
  if (rev > 5000)    score += 10;
  if (rev > 20000)   score += 10;
  if (rev > 0 && burn > 0 && rev > burn) score += 20;
  if (runway >= 3)   score += 10;
  if (runway >= 6)   score += 5;
  if (runway >= 12)  score += 5;
  if (emp >= 1)      score += 5;
  if (emp >= 5)      score += 5;
  if (funding > 0)   score += 5;
  if (breakEven)     score += 15;
  return Math.min(100, score);
}

const CRITERIA = [
  { label: 'CA > 0 TND/mois',           pts: 10 },
  { label: 'CA > 5 000 TND/mois',        pts: 10 },
  { label: 'CA > 20 000 TND/mois',       pts: 10 },
  { label: 'Rentable (CA > Burn rate)',   pts: 20 },
  { label: 'Runway ≥ 3 mois',            pts: 10 },
  { label: 'Runway ≥ 6 mois',            pts: 5  },
  { label: 'Runway ≥ 12 mois',           pts: 5  },
  { label: '≥ 1 employé',                pts: 5  },
  { label: '≥ 5 employés',               pts: 5  },
  { label: 'Financement levé > 0',        pts: 5  },
  { label: 'Point mort atteint',          pts: 15 },
];

export default function FinancialPage() {
  const [form, setForm] = useState({
    monthlyRevenue:     '',
    monthlyBurnRate:    '',
    runwayMonths:       '',
    totalFundingRaised: '',
    fundingStage:       'BOOTSTRAPPED',
    breakEvenReached:   false,
    employeeCount:      '',
  });
  const [existing, setExisting] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    financialApi.getMe()
      .then(res => {
        const fd = res.data?.financialData;
        if (fd) {
          setExisting(res.data);
          setForm({
            monthlyRevenue:     fd.monthlyRevenue     ?? '',
            monthlyBurnRate:    fd.monthlyBurnRate     ?? '',
            runwayMonths:       fd.runwayMonths        ?? '',
            totalFundingRaised: fd.totalFundingRaised  ?? '',
            fundingStage:       fd.fundingStage        || 'BOOTSTRAPPED',
            breakEvenReached:   fd.breakEvenReached    || false,
            employeeCount:      fd.employeeCount       ?? '',
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [field]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        monthlyRevenue:     parseFloat(form.monthlyRevenue)     || 0,
        monthlyBurnRate:    parseFloat(form.monthlyBurnRate)    || 0,
        runwayMonths:       parseInt(form.runwayMonths)         || null,
        totalFundingRaised: parseFloat(form.totalFundingRaised) || 0,
        fundingStage:       form.fundingStage,
        breakEvenReached:   form.breakEvenReached === true || form.breakEvenReached === 'true',
        employeeCount:      parseInt(form.employeeCount)        || 0,
      };
      const res = await financialApi.submit(payload);
      setExisting(res.data);
      toast.success('Données financières enregistrées !');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const liveScore   = previewScore(form);
  const savedScore  = existing?.financialViabilityScore ?? null;
  const color       = SCORE_COLOR(liveScore);

  if (loading) return <div style={{ padding: '32px 40px', color: '#9ca3af' }}>Chargement…</div>;

  return (
    <div style={{ padding: '32px 40px', maxWidth: 920, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <DollarSign size={20} /> Viabilité Financière
        </h1>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
          Renseignez vos indicateurs financiers pour obtenir votre score de viabilité (0–100 pts)
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

        {/* ── Form ─────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit}>
          <div style={{ background: 'white', borderRadius: 12, padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 16 }}>
            <SectionTitle icon={TrendingUp} label="Revenus & dépenses" />

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">CA mensuel moyen (TND)</label>
                <input className="form-input" type="number" min="0" placeholder="Ex : 15 000"
                  value={form.monthlyRevenue} onChange={set('monthlyRevenue')} required />
                <span style={{ fontSize: 11, color: '#9ca3af' }}>Chiffre d'affaires moyen sur les 3 derniers mois</span>
              </div>
              <div className="form-group">
                <label className="form-label">Burn rate mensuel (TND)</label>
                <input className="form-input" type="number" min="0" placeholder="Ex : 8 000"
                  value={form.monthlyBurnRate} onChange={set('monthlyBurnRate')} required />
                <span style={{ fontSize: 11, color: '#9ca3af' }}>Total des dépenses opérationnelles par mois</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={!!form.breakEvenReached} onChange={set('breakEvenReached')}
                  style={{ width: 15, height: 15, accentColor: '#E8543F' }} />
                Point mort (break-even) atteint
              </label>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>Vos revenus couvrent toutes vos charges fixes et variables</span>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 12, padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 16 }}>
            <SectionTitle icon={Clock} label="Trésorerie & financement" />

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Runway estimé (mois)</label>
                <input className="form-input" type="number" min="0" placeholder="Ex : 9"
                  value={form.runwayMonths} onChange={set('runwayMonths')} />
                <span style={{ fontSize: 11, color: '#9ca3af' }}>Combien de mois peut-on opérer avec la trésorerie actuelle</span>
              </div>
              <div className="form-group">
                <label className="form-label">Financement total levé (TND)</label>
                <input className="form-input" type="number" min="0" placeholder="Ex : 150 000"
                  value={form.totalFundingRaised} onChange={set('totalFundingRaised')} />
                <span style={{ fontSize: 11, color: '#9ca3af' }}>0 si entièrement bootstrapped</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Stade de financement</label>
              <select className="form-select" value={form.fundingStage} onChange={set('fundingStage')}>
                {FUNDING_STAGES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 12, padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 16 }}>
            <SectionTitle icon={Users} label="Équipe" />
            <div className="form-group">
              <label className="form-label">Nombre d'employés (fondateurs inclus)</label>
              <input className="form-input" type="number" min="0" placeholder="Ex : 3"
                value={form.employeeCount} onChange={set('employeeCount')} />
            </div>
          </div>

          <div style={{ padding: '12px 16px', background: '#FEF8E8', border: '1px solid #F8B618', borderRadius: 8, fontSize: 12, color: '#92650a', marginBottom: 20, display: 'flex', gap: 8 }}>
            <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            Ces données sont confidentielles et uniquement visibles par votre gestionnaire de fonds Attijari dans le cadre du programme Smart Financing.
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15 }}>
            {saving ? 'Enregistrement…' : existing?.financialData ? 'Mettre à jour mes données' : 'Soumettre mes données financières'}
          </button>
        </form>

        {/* ── Score panel ──────────────────────────────────────────────── */}
        <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Live score */}
          <div style={{ background: 'white', borderRadius: 12, padding: '22px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Aperçu du score
            </div>

            {/* Gauge circle */}
            <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 14px' }}>
              <svg viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="60" cy="60" r="50" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                <circle cx="60" cy="60" r="50" fill="none" stroke={color} strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - liveScore / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.4s ease, stroke 0.4s ease' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 30, fontWeight: 900, color, lineHeight: 1 }}>{liveScore}</span>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>/100</span>
              </div>
            </div>

            <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 4 }}>{SCORE_LABEL(liveScore)}</div>
            {savedScore !== null && savedScore !== liveScore && (
              <div style={{ fontSize: 11, color: '#9ca3af' }}>Score enregistré : {savedScore} pts</div>
            )}
            {savedScore !== null && savedScore === liveScore && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 11, color: '#16a34a', marginTop: 4 }}>
                <CheckCircle size={12} /> Score à jour
              </div>
            )}
          </div>

          {/* Criteria breakdown */}
          <div style={{ background: 'white', borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              Grille de notation
            </div>
            {CRITERIA.map(c => {
              const rev   = parseFloat(form.monthlyRevenue)     || 0;
              const burn  = parseFloat(form.monthlyBurnRate)    || 0;
              const runway = parseInt(form.runwayMonths)        || 0;
              const emp   = parseInt(form.employeeCount)        || 0;
              const fund  = parseFloat(form.totalFundingRaised) || 0;
              const be    = form.breakEvenReached === true || form.breakEvenReached === 'true';

              const achieved =
                c.label === 'CA > 0 TND/mois'            ? rev > 0 :
                c.label === 'CA > 5 000 TND/mois'         ? rev > 5000 :
                c.label === 'CA > 20 000 TND/mois'        ? rev > 20000 :
                c.label === 'Rentable (CA > Burn rate)'   ? (rev > 0 && burn > 0 && rev > burn) :
                c.label === 'Runway ≥ 3 mois'             ? runway >= 3 :
                c.label === 'Runway ≥ 6 mois'             ? runway >= 6 :
                c.label === 'Runway ≥ 12 mois'            ? runway >= 12 :
                c.label === '≥ 1 employé'                 ? emp >= 1 :
                c.label === '≥ 5 employés'                ? emp >= 5 :
                c.label === 'Financement levé > 0'         ? fund > 0 :
                c.label === 'Point mort atteint'           ? be : false;

              return (
                <div key={c.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '5px 0', borderBottom: '1px solid #f9f9f7', fontSize: 12,
                }}>
                  <span style={{ color: achieved ? '#374151' : '#c4c4c4', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10 }}>{achieved ? '✓' : '○'}</span>
                    {c.label}
                  </span>
                  <span style={{ fontWeight: 700, color: achieved ? '#16a34a' : '#c4c4c4', flexShrink: 0, marginLeft: 8 }}>
                    +{c.pts}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
      <Icon size={15} color="#E8543F" />
      <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
    </div>
  );
}
