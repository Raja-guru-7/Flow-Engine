import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getWorkflow, getSteps, executeWorkflow, getExecution } from '../api/api'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

const card = { background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }
const primaryBtn = { background: '#F97316', color: 'white', border: 'none', borderRadius: '9999px', padding: '10px 24px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }
const inputStyle = { width: '100%', borderRadius: '12px', border: '1px solid #E4E4E7', padding: '10px 16px', fontSize: '14px', color: '#18181B', boxSizing: 'border-box' }
const labelStyle = { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500, color: '#374151' }

const statusColor = (s) => ({ completed: '#16A34A', failed: '#DC2626', running: '#2563EB', pending: '#D97706' }[s] || '#71717A')
const statusBg = (s) => ({ completed: '#F0FDF4', failed: '#FEF2F2', running: '#EFF6FF', pending: '#FFFBEB' }[s] || '#F4F4F5')

export default function ExecutionPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [workflow, setWorkflow] = useState(null)
  const [inputData, setInputData] = useState('{\n  "amount": 250,\n  "country": "US",\n  "department": "Finance",\n  "priority": "High"\n}')
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [jsonValid, setJsonValid] = useState(true)

  useEffect(() => { loadWorkflow() }, [id])

  const loadWorkflow = async () => {
    try {
      setLoading(true)
      const res = await getWorkflow(id)
      const w = res.data?.data || res.data
      setWorkflow(w)
    } catch (err) {
      setError('Failed to load workflow')
    } finally {
      setLoading(false)
    }
  }

  const handleExecute = async () => {
    let parsed
    try { parsed = JSON.parse(inputData); setJsonValid(true) }
    catch { setJsonValid(false); setError('Invalid JSON in input data'); return }

    try {
      setExecuting(true)
      setError('')
      setResult(null)
      const res = await executeWorkflow(id, parsed)
      const data = res.data?.data || res.data
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Execution failed')
    } finally {
      setExecuting(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link to="/workflows" className="link-hover" style={{ fontSize: '14px', color: '#71717A', textDecoration: 'none' }}>← Back</Link>
        <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#18181B' }}>Execute Workflow</h2>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left: Input */}
        <div>
          <div className="card-hover" style={{ ...card, marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#18181B', marginBottom: '16px' }}>Workflow Info</h3>
            {workflow && (
              <>
                <p style={{ fontSize: '14px', fontWeight: 500, color: '#18181B', marginBottom: '4px' }}>{workflow.name}</p>
                <span style={{ borderRadius: '9999px', padding: '2px 10px', fontSize: '11px', fontWeight: 500, background: workflow.is_active ? '#F0FDF4' : '#F4F4F5', color: workflow.is_active ? '#16A34A' : '#71717A' }}>
                  {workflow.is_active ? 'Active' : 'Inactive'}
                </span>
                {workflow.steps && (
                  <div style={{ marginTop: '16px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 500, color: '#71717A', marginBottom: '8px' }}>STEPS ({workflow.steps.length})</p>
                    {workflow.steps.sort((a, b) => (a.order || 0) - (b.order || 0)).map((s, i) => (
                      <div key={s.id || s._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ width: '20px', height: '20px', borderRadius: '9999px', background: '#F4F4F5', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#71717A', fontWeight: 500 }}>{i + 1}</span>
                        <span style={{ fontSize: '13px', color: '#374151' }}>{s.name}</span>
                        <span style={{ fontSize: '10px', color: '#A1A1AA', textTransform: 'capitalize' }}>({s.step_type || s.type})</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="card-hover" style={card}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#18181B', marginBottom: '16px' }}>Input Data (JSON)</h3>
            <div style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
              <label style={labelStyle}>Payload</label>
              {!jsonValid && <span style={{ fontSize: '12px', color: '#DC2626' }}>Invalid JSON</span>}
            </div>
            <textarea
              className="input-focus"
              value={inputData}
              onChange={e => { setInputData(e.target.value); setJsonValid(true) }}
              rows={10}
              style={{ ...inputStyle, fontFamily: 'monospace', background: '#FAFAFA', resize: 'vertical', borderColor: jsonValid ? '#E4E4E7' : '#DC2626' }}
            />
            <button
              className="btn-primary-glow"
              onClick={handleExecute}
              disabled={executing || !workflow?.is_active}
              style={{ ...primaryBtn, marginTop: '16px', width: '100%', opacity: (executing || !workflow?.is_active) ? 0.5 : 1 }}
            >
              {executing ? '⚡ Executing...' : '▶ Execute Workflow'}
            </button>
            {!workflow?.is_active && (
              <p style={{ marginTop: '8px', fontSize: '12px', color: '#DC2626', textAlign: 'center' }}>Workflow is inactive. Enable it to execute.</p>
            )}
          </div>
        </div>

        {/* Right: Result */}
        <div className="card-hover" style={card}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#18181B', marginBottom: '16px' }}>Execution Result</h3>
          {executing && (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚡</div>
              <p style={{ fontSize: '14px', color: '#71717A' }}>Running workflow...</p>
            </div>
          )}
          {!executing && !result && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#A1A1AA' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>▶</div>
              <p style={{ fontSize: '14px' }}>Click Execute to run the workflow</p>
            </div>
          )}
          {result && (
            <div>
              {/* Status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <span style={{ borderRadius: '9999px', padding: '4px 14px', fontSize: '13px', fontWeight: 600, background: statusBg(result.status), color: statusColor(result.status) }}>
                  {result.status?.toUpperCase()}
                </span>
                <span style={{ fontSize: '13px', color: '#71717A' }}>ID: {result.id}</span>
              </div>

              {/* Current Step */}
              {result.current_step_id && (
                <div style={{ marginBottom: '16px', padding: '12px', background: '#F0F9FF', borderRadius: '8px', border: '1px solid #BAE6FD' }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#0369A1', marginBottom: '4px' }}>CURRENT STEP</p>
                  <p style={{ fontSize: '14px', color: '#0C4A6E' }}>{result.current_step_id}</p>
                </div>
              )}

              {/* Execution Log */}
              {result.execution_log?.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#71717A', marginBottom: '8px' }}>EXECUTION LOG</p>
                  {result.execution_log.map((log, i) => (
                    <div key={i} style={{ padding: '8px 12px', marginBottom: '6px', background: '#F9FAFB', borderRadius: '8px', borderLeft: `3px solid ${statusColor(log.status)}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#18181B' }}>{log.step_id}</span>
                        <span style={{ fontSize: '11px', color: statusColor(log.status), fontWeight: 600 }}>{log.status}</span>
                      </div>
                      {log.message && <p style={{ fontSize: '12px', color: '#71717A', marginTop: '2px' }}>{log.message}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Raw Result */}
              <details>
                <summary style={{ fontSize: '12px', fontWeight: 600, color: '#71717A', cursor: 'pointer', marginBottom: '8px' }}>RAW RESPONSE</summary>
                <pre style={{ fontSize: '11px', background: '#F9FAFB', padding: '12px', borderRadius: '8px', overflow: 'auto', color: '#374151' }}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
