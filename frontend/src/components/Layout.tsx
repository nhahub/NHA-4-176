import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ChefHat, History, Home, ImagePlus, LogOut, MoonStar, SunMedium, UserRound } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/foodads-logo.png';

const navItems = [
  { to: '/app', label: 'Dashboard', icon: Home, end: true },
  { to: '/app/generate', label: 'Generate', icon: ImagePlus },
  { to: '/app/history', label: 'History', icon: History },
  { to: '/app/restaurants', label: 'Restaurants', icon: ChefHat },
];

export function Layout() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="shell">
      <div className="container content">
        <div className="card-grid">
          <aside className="panel sidebar span-4">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img
                  src={logo}
                  alt="FoodAds AI logo"
                  style={{ width: 40, height: 40, borderRadius: 12, objectFit: 'cover', boxShadow: '0 10px 24px rgba(0,0,0,0.18)' }}
                />
                <div>
                  <div style={{ fontWeight: 700 }}>FoodAds AI</div>
                  <div className="muted" style={{ fontSize: 12 }}>Restaurant campaign studio</div>
                </div>
              </div>
              <button className="btn btn-secondary icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
                {theme === 'dark' ? <SunMedium size={16} /> : <MoonStar size={16} />}
              </button>
            </div>

            <nav className="grid" style={{ gap: 8 }}>
              {navItems.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Icon size={18} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="panel" style={{ marginTop: 18, padding: 18, background: 'rgba(255,255,255,0.03)' }}>
              <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                Workspace
              </div>
              <p style={{ margin: '10px 0 0', lineHeight: 1.6 }}>
                {location.pathname.includes('generate') ? 'Turn a food idea into a full campaign.' : 'Launch food marketing campaigns, fast.'}
              </p>
              <Link to="/app/generate" className="btn btn-primary" style={{ width: '100%', marginTop: 16 }}>
                New campaign
              </Link>
            </div>

            <div className="panel" style={{ marginTop: 18, padding: 16, background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div className="auth-avatar">
                  <UserRound size={17} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.displayName}
                  </div>
                  <div className="muted" style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.email}
                  </div>
                </div>
              </div>
              <button className="btn btn-secondary" style={{ width: '100%', marginTop: 14 }} onClick={logout}>
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </aside>

          <main className="span-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
