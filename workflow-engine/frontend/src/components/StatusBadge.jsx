const statusStyles = {
  completed:    { background: '#DCFCE7', color: '#16A34A' },
  failed:       { background: '#FEE2E2', color: '#DC2626' },
  running:      { background: '#DBEAFE', color: '#2563EB' },
  in_progress:  { background: '#DBEAFE', color: '#2563EB' },
  cancelled:    { background: '#F4F4F5', color: '#71717A' },
  pending:      { background: '#FEF9C3', color: '#D97706' },
  active:       { background: '#DCFCE7', color: '#16A34A' },
  inactive:     { background: '#F4F4F5', color: '#71717A' },
  approval:     { background: '#F3E8FF', color: '#7C3AED' },
  notification: { background: '#DBEAFE', color: '#2563EB' },
  task:         { background: '#FEF3C7', color: '#D97706' },
}

const defaultStyle = { background: '#F4F4F5', color: '#71717A' }

export default function StatusBadge({ status }) {
  const normalized = (status || '').toLowerCase()
  const colors = statusStyles[normalized] || defaultStyle

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      borderRadius: '9999px',
      padding: '4px 12px',
      fontSize: '12px',
      fontWeight: 500,
      ...colors,
    }}>
      {status}
    </span>
  )
}
