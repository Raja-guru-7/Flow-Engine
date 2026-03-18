import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getWorkflows, deleteWorkflow } from '../api/api'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

const primaryBtn = { background: '#F97316', color: 'white', border: 'none', borderRadius: '9999px', padding: '8px 20px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }
const card = { background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }

export default function WorkflowList() {
  const navigate = useNavigate()
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => { loadWorkflows() }, [])

  const loadWorkflows = async () => {
    try {
      setLoading(true)
      const res = await getWorkflows()
      const data = res.data
      const arr = data?.data?.workflows || data?.workflows || data?.data || []
      setWorkflows(Array.isArray(arr) ? arr : [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load workflows')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteWorkflow(id)
      setDeleteTarget(null)
      loadWorkflows()
    } catch (err) {
      setError('Failed to delete workflow')
    }
  }

  const filtered = workflows.filter(w => w.name?.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#18181B' }}>Workflows</h2>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {/* Search + List - same card la */}
      <div className="card-hover" style={card}>
        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Search workflows..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', borderRadius: '12px', border: '1px solid #E4E4E7', padding: '10px 16px', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ fontSize: '14px', color: '#A1A1AA', marginBottom: '16px' }}>
              {search ? 'No workflows match your search.' : 'No workflows yet.'}
            </p>
            {!search && <button className="btn-primary-glow" onClick={() => navigate('/workflows/new')} style={primaryBtn}>Create First Workflow</button>}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E4E4E7' }}>
                {['Name', 'Status', 'Steps', 'Version', 'Created', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#71717A', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(w => (
                <tr key={w.id || w._id} className="row-hover" style={{ borderBottom: '1px solid #F4F4F5' }}>
                  <td style={{ padding: '14px 12px' }}>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#18181B' }}>{w.name}</p>
                    <p style={{ fontSize: '12px', color: '#A1A1AA' }}>{w.id || w._id}</p>
                  </td>
                  <td style={{ padding: '14px 12px' }}>
                    <span style={{ borderRadius: '9999px', padding: '2px 10px', fontSize: '11px', fontWeight: 500, background: w.is_active ? '#F0FDF4' : '#F4F4F5', color: w.is_active ? '#16A34A' : '#71717A' }}>
                      {w.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 12px', fontSize: '14px', color: '#374151' }}>{w.steps?.length || 0}</td>
                  <td style={{ padding: '14px 12px', fontSize: '14px', color: '#374151' }}>v{w.version || 1}</td>
                  <td style={{ padding: '14px 12px', fontSize: '13px', color: '#71717A' }}>{new Date(w.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '14px 12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="action-btn-hover" onClick={() => navigate(`/workflows/${w.id || w._id}/edit`)}
                        style={{ fontSize: '13px', color: '#F97316', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Edit</button>
                      <button className="action-btn-hover" onClick={() => navigate(`/workflows/${w.id || w._id}/execute`)}
                        style={{ fontSize: '13px', color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Execute</button>
                      <button className="action-btn-hover" onClick={() => setDeleteTarget(w)}
                        style={{ fontSize: '13px', color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Confirm */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '400px', width: '90%' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#18181B', marginBottom: '12px' }}>Delete Workflow</h3>
            <p style={{ fontSize: '14px', color: '#71717A', marginBottom: '24px' }}>
              Are you sure you want to delete <strong style={{ color: '#18181B' }}>"{deleteTarget.name}"</strong>? This cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn-hover" onClick={() => setDeleteTarget(null)} style={{ background: 'white', color: '#18181B', border: '1px solid #E4E4E7', borderRadius: '9999px', padding: '8px 20px', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              <button className="btn-hover" onClick={() => handleDelete(deleteTarget.id || deleteTarget._id)} style={{ background: '#DC2626', color: 'white', border: 'none', borderRadius: '9999px', padding: '8px 20px', fontSize: '14px', cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}