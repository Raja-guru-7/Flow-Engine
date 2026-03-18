export default function ErrorMessage({ message, onDismiss }) {
  if (!message) return null

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: '12px',
      border: '1px solid #FECACA',
      background: '#FEE2E2',
      padding: '12px 16px',
      marginBottom: '16px',
    }}>
      <p style={{ fontSize: '14px', fontWeight: 500, color: '#DC2626' }}>{message}</p>
      {onDismiss && (
        <button
          className="btn-hover"
          onClick={onDismiss}
          style={{
            marginLeft: '16px',
            color: '#DC2626',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          ✕
        </button>
      )}
    </div>
  )
}
