import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getWorkflows, getExecutions } from '../api/api'

const card = { background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }
const primaryBtn = { background: '#F97316', color: 'white', border: 'none', borderRadius: '9999px', padding: '8px 20px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }

export default function Home() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ totalWorkflows: 0, activeWorkflows: 0, totalExecutions: 0, failedExecutions: 0 })
  const [recentWorkflows, setRecentWorkflows] = useState([])
  const [recentExecutions, setRecentExecutions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [wRes, eRes] = await Promise.allSettled([getWorkflows(), getExecutions()])
      if (wRes.status === 'fulfilled') {
        const wData = wRes.value.data
        const arr = wData?.data?.workflows || wData?.workflows || []
        const workflows = Array.isArray(arr) ? arr : []
        setRecentWorkflows(workflows.slice(0, 5))
        setStats(prev => ({ ...prev, totalWorkflows: wData?.data?.total || workflows.length, activeWorkflows: workflows.filter(w => w.is_active).length }))
      }
      if (eRes.status === 'fulfilled') {
        const eData = eRes.value.data
        const arr = eData?.data?.executions || eData?.executions || eData?.data || []
        const executions = Array.isArray(arr) ? arr : []
        setRecentExecutions(executions.slice(0, 5))
        setStats(prev => ({ ...prev, totalExecutions: executions.length, failedExecutions: executions.filter(e => e.status === 'failed').length }))
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const statCards = [
    { label: 'Total Workflows', value: stats.totalWorkflows, color: '#F97316' },
    { label: 'Active Workflows', value: stats.activeWorkflows, color: '#16A34A' },
    { label: 'Total Executions', value: stats.totalExecutions, color: '#2563EB' },
    { label: 'Failed Executions', value: stats.failedExecutions, color: '#DC2626' },
  ]

  const statusColor = (s) => ({ completed: '#16A34A', failed: '#DC2626', running: '#2563EB', pending: '#D97706' }[s] || '#71717A')

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#18181B' }}>Dashboard</h2>
          <p style={{ fontSize: '14px', color: '#71717A', marginTop: '4px' }}>Welcome to FlowEngine — Workflow Automation System</p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {statCards.map((s) => (
          <div key={s.label} className="card-hover" style={{ ...card, borderBottom: '3px solid ' + s.color }}>
            <p style={{ fontSize: '13px', color: '#71717A', marginBottom: '8px' }}>{s.label}</p>
            <p style={{ fontSize: '32px', fontWeight: 700, color: '#18181B' }}>{loading ? '...' : s.value}</p>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <div className="card-hover" style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#18181B' }}>Recent Workflows</h3>
            <Link to="/workflows" className="link-hover" style={{ fontSize: '13px', color: '#F97316', textDecoration: 'none' }}>View all</Link>
          </div>
          {loading ? <p style={{ color: '#A1A1AA', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>Loading...</p>
            : recentWorkflows.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <p style={{ color: '#A1A1AA', fontSize: '14px', marginBottom: '16px' }}>No workflows yet</p>
                <Link to="/workflows/new" className="btn-primary-glow" style={primaryBtn}>Create Workflow</Link>
              </div>
            ) : recentWorkflows.map(w => (
              <div key={w.id || w._id} className="row-hover" onClick={() => navigate('/workflows/' + (w.id || w._id) + '/edit')}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F4F4F5', cursor: 'pointer' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: '#18181B' }}>{w.name}</p>
                  <p style={{ fontSize: '12px', color: '#71717A' }}>{w.steps?.length || 0} steps</p>
                </div>
                <span style={{ borderRadius: '9999px', padding: '2px 10px', fontSize: '11px', fontWeight: 500, background: w.is_active ? '#F0FDF4' : '#F4F4F5', color: w.is_active ? '#16A34A' : '#71717A' }}>
                  {w.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
        </div>
        <div className="card-hover" style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#18181B' }}>Recent Executions</h3>
            <Link to="/executions" className="link-hover" style={{ fontSize: '13px', color: '#F97316', textDecoration: 'none' }}>View all</Link>
          </div>
          {loading ? <p style={{ color: '#A1A1AA', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>Loading...</p>
            : recentExecutions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <p style={{ color: '#A1A1AA', fontSize: '14px', marginBottom: '16px' }}>No executions yet</p>
                <Link to="/workflows" className="btn-primary-glow" style={primaryBtn}>Execute a Workflow</Link>
              </div>
            ) : recentExecutions.map(e => (
              <div key={e.id || e._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F4F4F5' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: '#18181B' }}>{e.workflow_id}</p>
                  <p style={{ fontSize: '12px', color: '#71717A' }}>{new Date(e.createdAt).toLocaleString()}</p>
                </div>
                <span style={{ borderRadius: '9999px', padding: '2px 10px', fontSize: '11px', fontWeight: 500, background: '#F4F4F5', color: statusColor(e.status) }}>{e.status}</span>
              </div>
            ))}
        </div>
      </div>
      <div className="card-hover" style={card}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#18181B', marginBottom: '16px' }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link to="/workflows/new" className="btn-primary-glow" style={primaryBtn}>+ Create Workflow</Link>
          <Link to="/audit" className="btn-hover" style={{ ...primaryBtn, background: 'white', color: '#18181B', border: '1px solid #E4E4E7' }}>View Audit Log</Link>
          <Link to="/workflows" className="btn-hover" style={{ ...primaryBtn, background: 'white', color: '#18181B', border: '1px solid #E4E4E7' }}>All Workflows</Link>
        </div>
      </div>
    </div>
  )
}
