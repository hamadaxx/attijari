import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ROLES = [
  { value: 'ENTREPRENEUR',      label: 'Entrepreneur' },
  { value: 'MENTOR',            label: 'Mentor / Expert' },
  { value: 'COMMUNITY_MANAGER', label: 'Community Manager' },
  { value: 'FUND_MANAGER',      label: 'Gestionnaire de Fonds Attijari' },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', phone: '', role: 'ENTREPRENEUR'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register(form);
      toast.success('Compte créé avec succès !');
      const role = user.roles?.[0] || '';
      if (role.includes('ENTREPRENEUR')) navigate('/profile');
      else if (role.includes('COMMUNITY_MANAGER')) navigate('/cm/dashboard');
      else if (role.includes('FUND_MANAGER')) navigate('/fund/dashboard');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création du compte.');
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>

      {/* ── Left panel: branding ─────────────────────────────────────────── */}
      <div style={{
        width: '38%',
        background: '#111111',
        display: 'flex',
        flexDirection: 'column',
        padding: '52px 44px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -80, right: -80,
          width: 320, height: 320, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(248,182,24,0.12) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, left: -60,
          width: 260, height: 260, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(232,84,63,0.10) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'auto' }}>
          <div style={{
            width: 42, height: 42, background: '#F8B618', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 900, color: '#111111', fontFamily: 'Georgia, serif',
            flexShrink: 0,
          }}>A</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'white', lineHeight: 1.2 }}>Growth Engine</div>
            <div style={{ fontSize: 9, color: '#F8B618', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 2 }}>Attijari Bank</div>
          </div>
        </div>

        {/* Tagline */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 0' }}>
          <h1 style={{ fontSize: 34, fontWeight: 800, color: 'white', lineHeight: 1.2, marginBottom: 16 }}>
            Rejoignez la<br />
            <span style={{ color: '#F8B618' }}>communauté</span>
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.75, maxWidth: 260 }}>
            Créez votre compte et bénéficiez de l'accompagnement Attijari Bank pour faire croître votre startup.
          </p>
        </div>

        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)' }}>
          © {new Date().getFullYear()} Attijari Bank — Confidentiel
        </div>
      </div>

      {/* ── Right panel: form ────────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        background: '#F9F8F5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 40px',
      }}>
        <div style={{ width: '100%', maxWidth: 460 }}>
          <div style={{
            height: 3,
            background: 'linear-gradient(90deg, #F8B618 0%, #E8543F 100%)',
            borderRadius: 3,
            marginBottom: 28,
          }} />

          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111111', marginBottom: 4 }}>Créer un compte</h2>
          <p style={{ fontSize: 14, color: '#888888', marginBottom: 24 }}>
            Accélérez votre startup avec Attijari Growth Engine
          </p>

          <div style={{
            background: 'white',
            borderRadius: 14,
            padding: '28px 28px 24px',
            boxShadow: '0 2px 20px rgba(0,0,0,0.07)',
            border: '1px solid #E5E0D8',
          }}>
            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Prénom</label>
                  <input className="form-input" placeholder="Prénom" value={form.firstName}
                    onChange={set('firstName')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Nom</label>
                  <input className="form-input" placeholder="Nom" value={form.lastName}
                    onChange={set('lastName')} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" placeholder="vous@example.com"
                  value={form.email} onChange={set('email')} required />
              </div>

              <div className="form-group">
                <label className="form-label">Téléphone</label>
                <input type="tel" className="form-input" placeholder="+216 XX XXX XXX"
                  value={form.phone} onChange={set('phone')} />
              </div>

              <div className="form-group">
                <label className="form-label">Mot de passe</label>
                <input type="password" className="form-input" placeholder="8 caractères minimum"
                  value={form.password} onChange={set('password')} required minLength={8} />
              </div>

              <div className="form-group">
                <label className="form-label">Votre rôle</label>
                <select className="form-select" value={form.role} onChange={set('role')}>
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '11px 20px', fontSize: 14.5 }}
              >
                {loading ? 'Création en cours…' : 'Créer mon compte'}
              </button>
            </form>

            <div className="divider" />
            <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--color-ink-muted)' }}>
              Déjà un compte ?{' '}
              <Link to="/login" style={{ color: '#E8543F', fontWeight: 600 }}>
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
