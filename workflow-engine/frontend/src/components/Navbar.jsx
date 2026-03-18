import { Link, useLocation } from 'react-router-dom'

const navLinks = [
  { to: '/', label: 'Dashboard', icon: '🏠' },
  { to: '/workflows', label: 'Workflows', icon: '📋' },
  { to: '/audit', label: 'Audit Log', icon: '📊' },
]

export default function Navbar() {
  const location = useLocation()

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <aside style={{
      position: 'fixed',
      left: 0,
      top: 0,
      width: '220px',
      height: '100vh',
      background: '#FFFFFF',
      borderRight: '1px solid #E4E4E7',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 40,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 12px' }}>
        <span style={{ fontSize: '18px', fontWeight: 700, color: '#18181B' }}>
          ⚡ FlowEngine
        </span>
      </div>

      {/* Create Button */}
      <div style={{ padding: '0 12px 16px' }}>
        <Link to="/workflows/new" className="btn-primary-glow" style={{
          display: 'block',
          background: '#F97316',
          color: 'white',
          borderRadius: '8px',
          padding: '10px 16px',
          fontSize: '14px',
          fontWeight: 500,
          textAlign: 'center',
          textDecoration: 'none',
        }}>
          + Create Workflow
        </Link>
      </div>

      {/* Divider */}
      <div style={{
        height: '1px',
        background: '#E4E4E7',
        margin: '0 12px 12px',
      }} />

      {/* Nav Links */}
      <nav style={{ flex: 1, padding: '0 8px' }}>
        {navLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={isActive(link.to) ? 'interactive' : 'nav-link-hover'}
            style={isActive(link.to) ? {
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 12px',
              borderRadius: '6px',
              background: '#FFF7ED',
              color: '#F97316',
              fontWeight: 500,
              fontSize: '14px',
              borderLeft: '3px solid #F97316',
              textDecoration: 'none',
              marginBottom: '2px',
            } : {
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 12px',
              borderRadius: '6px',
              color: '#71717A',
              fontSize: '14px',
              textDecoration: 'none',
              marginBottom: '2px',
            }}
          >
            <span style={{ fontSize: '16px' }}>{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid #E4E4E7',
        fontSize: '12px',
        color: '#A1A1AA',
      }}>
        v1.0.0
      </div>
    </aside>
  )
}
