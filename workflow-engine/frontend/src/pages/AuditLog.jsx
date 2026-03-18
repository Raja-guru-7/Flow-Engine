import { useState, useEffect } from 'react'
import { getExecutions } from '../api/api'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

const card = { background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }
const statusColor = (s) => ({ completed: '#16A34A', failed: '#DC2626', running: '#2563EB', pending: '#D97706' }[s] || '#71717A')
const statusBg = (s) => ({ completed: '#F0FDF4', failed: '#FEF2F2', running: '#EFF6FF', pending: '#FFFBEB' }[s] || '#F4F4F5')

export default function AuditLog() {
  const [executions, setExecutions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => { loadExecutions() }, [])

  const loadExecutions = async () => {
    try {
      setLoading(true)
      const res = await getExecutions()
      const data = res.data
      const arr = Array.isArray(data) ? data : data?.executions || data?.data || []
      setExecutions(Array.isArray(arr) ? arr : [])
    } catch (err) {
      setError('Failed to load executions')
    } finally {
      setLoading(false)
    }
  }

  const filtered = executions.filter(e => {
    const matchSearch = e.workflow_id?.toLowerCase().includes(search.toLowerCase()) || e.id?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || e.status === statusFilter
    return matchSearch && matchStatus
  })

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#18181B' }}>Audit Log</h2>
          <p style={{ fontSize: '14px', color: '#71717A', marginTop: '4px' }}>All workflow execution history</p>
        </div>
        <button className="btn-hover" onClick={loadExecutions} style={{ background: 'white', color: '#18181B', border: '1px solid #E4E4E7', borderRadius: '9999px', padding: '8px 20px', fontSize: '14px', cursor: 'pointer' }}>
          ↻ Refresh
        </button>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {/* Filters */}
      <div style={{ ...card, marginBottom: '16px', padding: '16px', display: 'flex', gap: '12px' }}>
        <input
          type="text"
          placeholder="Search by workflow ID or execution ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, borderRadius: '12px', border: '1px solid #E4E4E7', padding: '10px 16px', fontSize: '14px' }}
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ borderRadius: '12px', border: '1px solid #E4E4E7', padding: '10px 16px', fontSize: '14px', cursor: 'pointer' }}
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="running">Running</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '16px' }}>
        {[
          { label: 'Total', value: executions.length, color: '#18181B' },
          { label: 'Completed', value: executions.filter(e => e.status === 'completed').length, color: '#16A34A' },
          { label: 'Failed', value: executions.filter(e => e.status === 'failed').length, color: '#DC2626' },
          { label: 'Running', value: executions.filter(e => e.status === 'running').length, color: '#2563EB' },
        ].map(s => (
          <div key={s.label} className="card-hover" style={{ ...card, padding: '16px', textAlign: 'center' }}>
            <p style={{ fontSize: '24px', fontWeight: 700, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: '12px', color: '#71717A' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card-hover" style={card}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ fontSize: '14px', color: '#A1A1AA' }}>No executions found.</p>
          </div>
        ) : (
          <div>
            {filtered.map(e => (
              <div key={e.id || e._id} style={{ borderBottom: '1px solid #F4F4F5' }}>
                <div
                  className="row-hover"
                  onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 0', cursor: 'pointer' }}
                >
                  <span style={{ fontSize: '16px' }}>{expanded === e.id ? '▼' : '▶'}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#18181B' }}>
                      Workflow: <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#374151' }}>{e.workflow_id}</span>
                    </p>
                    <p style={{ fontSize: '12px', color: '#A1A1AA', marginTop: '2px' }}>
                      ID: {e.id || e._id} · {new Date(e.createdAt).toLocaleString()} · Triggered by: {e.triggered_by || 'manual'}
                    </p>
                  </div>
                  <span style={{ borderRadius: '9999px', padding: '3px 12px', fontSize: '11px', fontWeight: 600, background: statusBg(e.status), color: statusColor(e.status) }}>
                    {e.status?.toUpperCase()}
                  </span>
                </div>

                {/* Expanded detail */}
                {expanded === e.id && (
                  <div style={{ padding: '0 0 16px 32px' }}>
                    {/* Input Data */}
                    {e.data && (
                      <div style={{ marginBottom: '12px' }}>
                        <p style={{ fontSize: '12px', fontWeight: 600, color: '#71717A', marginBottom: '6px' }}>INPUT DATA</p>
                        <pre style={{ fontSize: '12px', background: '#F9FAFB', padding: '10px', borderRadius: '8px', overflow: 'auto', color: '#374151' }}>
                          {JSON.stringify(e.data, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Execution Log */}
                    {e.execution_log?.length > 0 && (
                      <div>
                        <p style={{ fontSize: '12px', fontWeight: 600, color: '#71717A', marginBottom: '6px' }}>EXECUTION LOG</p>
                        {e.execution_log.map((log, i) => (
                          <div key={i} style={{ padding: '8px 10px', marginBottom: '4px', background: '#F9FAFB', borderRadius: '6px', borderLeft: `3px solid ${statusColor(log.status)}`, display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '13px', color: '#374151' }}>{log.step_id}</span>
                            <span style={{ fontSize: '11px', color: statusColor(log.status), fontWeight: 600 }}>{log.status}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Error */}
                    {e.error_message && (
                      <div style={{ padding: '10px', background: '#FEF2F2', borderRadius: '8px', border: '1px solid #FECACA' }}>
                        <p style={{ fontSize: '12px', fontWeight: 600, color: '#DC2626', marginBottom: '4px' }}>ERROR</p>
                        <p style={{ fontSize: '13px', color: '#991B1B' }}>{e.error_message}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
