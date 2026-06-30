import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  User, Users, Calendar, FileText, BarChart2,
  LogOut, Settings, TrendingUp, Shield, DollarSign
} from 'lucide-react';

const navByRole = {
  ENTREPRENEUR: [
    { to: '/profile',       icon: User,         label: 'Mon profil'       },
    { to: '/events',        icon: Calendar,     label: 'Événements'       },
    { to: '/publications',  icon: FileText,     label: 'Publications'     },
    { to: '/score',         icon: TrendingUp,   label: 'Mon Score SE'     },
    { to: '/financial',     icon: DollarSign,   label: 'Viabilité financière' },
    { to: '/kyb',           icon: Shield,       label: 'Dossier KYB'      },
  ],
  COMMUNITY_MANAGER: [
    { to: '/cm/dashboard',      icon: BarChart2, label: 'Tableau de bord'   },
    { to: '/cm/profiles',       icon: Users,     label: 'Profils en attente' },
    { to: '/cm/publications',   icon: FileText,  label: 'Modération'         },
    { to: '/cm/kyb',            icon: Shield,    label: 'Revue KYB'          },
    { to: '/cm/scoring',        icon: Settings,  label: 'Grille de scoring'  },
  ],
  FUND_MANAGER: [
    { to: '/fund/startups', icon: Users, label: 'Startups' },
  ],
  MENTOR: [
    { to: '/mentor/events', icon: Calendar, label: 'Mes webinars' },
  ],
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const role = user?.roles?.[0]?.replace('ROLE_', '') || 'ENTREPRENEUR';
  const navItems = navByRole[role] || navByRole.ENTREPRENEUR;

  const ROLE_LABELS = {
    ENTREPRENEUR: 'Entrepreneur',
    COMMUNITY_MANAGER: 'Admin',
    FUND_MANAGER: 'Gestionnaire de Fonds',
    MENTOR: 'Mentor',
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('');

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 256,
        background: '#111111',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        borderRight: '1px solid rgba(255,255,255,0.04)',
      }}>

        {/* Brand */}
        <div style={{ padding: '26px 20px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 12 }}>
            <div style={{
              width: 36, height: 36,
              background: '#F8B618',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: 18, color: '#111111',
              fontFamily: 'Georgia, serif',
              flexShrink: 0,
            }}>A</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                Growth Engine
              </div>
              <div style={{ fontSize: 9, color: '#F8B618', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 2 }}>
                Attijari Bank
              </div>
            </div>
          </div>

          {/* Role pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 100,
            padding: '3px 10px',
            fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            {ROLE_LABELS[role] || role.replace(/_/g, ' ')}
          </div>
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 16px 8px' }} />

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 10px' }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 8,
                marginBottom: 2,
                fontSize: 13.5,
                fontWeight: isActive ? 700 : 400,
                color: isActive ? '#111111' : 'rgba(255,255,255,0.52)',
                background: isActive ? '#F8B618' : 'transparent',
                textDecoration: 'none',
                transition: 'background 0.12s, color 0.12s',
              })}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User card + logout */}
        <div style={{ padding: '10px 10px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 8,
            marginBottom: 6,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #F8B618 0%, #E8543F 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800, color: 'white', flexShrink: 0,
            }}>
              {initials || '?'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.firstName} {user?.lastName}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              width: '100%', padding: '8px 12px',
              background: 'transparent', border: 'none',
              color: 'rgba(255,255,255,0.32)', fontSize: 13,
              cursor: 'pointer', borderRadius: 6,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#E8543F'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.32)'; }}
          >
            <LogOut size={14} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', background: 'var(--color-surface)' }}>
        {children}
      </main>
    </div>
  );
}
