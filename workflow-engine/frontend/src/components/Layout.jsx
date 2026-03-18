import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/workflows', label: 'Workflows', icon: '📋' },
    { path: '/audit', label: 'Audit Log', icon: '📊' },
  ]

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F9FAFB', fontFamily: 'system-ui, sans-serif' }}>
      <aside style={{ width: '220px', background: '#FFFFFF', borderRight: '1px solid #E4E4E7', display: 'flex', flexDirection: 'column', padding: '16px 12px', position: 'fixed', height: '100vh' }}>
        <div style={{ marginBottom: '24px', padding: '8px' }}>
          <span style={{ fontSize: '20px', fontWeight: 700, color: '#18181B', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#F97316' }}>⚡</span> FlowEngine
          </span>
        </div>
        <button className="btn-primary-glow" onClick={() => navigate('/workflows/new')} style={{ background: '#F97316', color: 'white', border: 'none', borderRadius: '9999px', padding: '10px 16px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', marginBottom: '16px', width: '100%' }}>
          + Create Workflow
        </button>
        <nav style={{ flex: 1 }}>
          {navItems.map(item => (
            <Link key={item.path} to={item.path} className={isActive(item.path) ? 'interactive' : 'nav-link-hover'} style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none', fontSize: '14px', fontWeight: 500,
              background: isActive(item.path) ? '#FFF7ED' : 'transparent',
              color: isActive(item.path) ? '#F97316' : '#71717A',
            }}>
              <span>{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>
        <div style={{ padding: '8px', fontSize: '12px', color: '#A1A1AA' }}>v1.0.0</div>
      </aside>
      <div style={{ marginLeft: '220px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ background: '#FFFFFF', borderBottom: '1px solid #E4E4E7', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '16px', fontWeight: 600, color: '#18181B', textTransform: 'capitalize' }}>
            {location.pathname.split('/')[1] || 'Dashboard'}
          </span>
          <button className="btn-hover" onClick={() => navigate('/workflows/new')} style={{ background: '#18181B', color: 'white', border: 'none', borderRadius: '9999px', padding: '8px 20px', fontSize: '14px', cursor: 'pointer' }}>
            + New Workflow
          </button>
        </header>
        <main style={{ flex: 1, padding: '32px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
