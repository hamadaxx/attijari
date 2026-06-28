import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form);
      toast.success('Bienvenue !');
      const role = user.roles?.[0] || '';
      if (role.includes('COMMUNITY_MANAGER')) navigate('/cm/dashboard');
      else if (role.includes('FUND_MANAGER')) navigate('/fund/dashboard');
      else if (role.includes('MENTOR')) navigate('/mentor/events');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Identifiants invalides.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>

      {/* ── Left panel: branding ─────────────────────────────────────────── */}
      <div style={{
        width: '44%',
        background: '#111111',
        display: 'flex',
        flexDirection: 'column',
        padding: '52px 48px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative glows */}
        <div style={{
          position: 'absolute', top: -100, right: -100,
          width: 380, height: 380, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(248,182,24,0.13) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -80, left: -80,
          width: 320, height: 320, borderRadius: '50%',
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
          <h1 style={{ fontSize: 38, fontWeight: 800, color: 'white', lineHeight: 1.15, marginBottom: 18 }}>
            Accélérateur<br />
            <span style={{ color: '#F8B618' }}>Startup</span>
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.48)', lineHeight: 1.75, maxWidth: 300 }}>
            La plateforme d'accompagnement et de suivi des startups innovantes de Tunisie.
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 36, marginTop: 48 }}>
            {[['100+', 'Startups'], ['Loi', '2017-01'], ['BCT', 'Partenaire']].map(([val, lbl]) => (
              <div key={lbl}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#F8B618', lineHeight: 1 }}>{val}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 4 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
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
        padding: '48px 40px',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Gold accent bar */}
          <div style={{
            height: 3,
            background: 'linear-gradient(90deg, #F8B618 0%, #E8543F 100%)',
            borderRadius: 3,
            marginBottom: 32,
          }} />

          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111111', marginBottom: 6 }}>Connexion</h2>
          <p style={{ fontSize: 14, color: '#888888', marginBottom: 28 }}>
            Accédez à votre espace personnalisé
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
              <div className="form-group">
                <label className="form-label">Adresse e-mail</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="vous@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mot de passe</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center', marginTop: 12, padding: '11px 20px', fontSize: 14.5 }}
              >
                {loading ? 'Connexion…' : 'Se connecter'}
              </button>
            </form>

            <div className="divider" />
            <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--color-ink-muted)' }}>
              Pas encore de compte ?{' '}
              <Link to="/register" style={{ color: '#E8543F', fontWeight: 600 }}>
                Créer un compte
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
