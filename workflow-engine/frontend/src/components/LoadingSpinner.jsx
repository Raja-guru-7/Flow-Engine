export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '80px 0',
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '9999px',
        border: '3px solid #E4E4E7',
        borderTopColor: '#F97316',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ marginTop: '16px', fontSize: '14px', color: '#A1A1AA' }}>{message}</p>
    </div>
  )
}
