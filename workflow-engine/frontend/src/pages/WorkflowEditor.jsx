import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  getWorkflow, createWorkflow, updateWorkflow,
  getSteps, createStep, updateStep, deleteStep,
} from '../api/api'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import Modal from '../components/Modal'

const card = { background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }
const primaryBtn = { background: '#F97316', color: 'white', border: 'none', borderRadius: '9999px', padding: '8px 20px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', textDecoration: 'none' }
const secondaryBtn = { background: 'white', color: '#18181B', border: '1px solid #E4E4E7', borderRadius: '9999px', padding: '8px 20px', fontSize: '14px', cursor: 'pointer' }
const dangerBtn = { background: '#DC2626', color: 'white', border: 'none', borderRadius: '9999px', padding: '8px 20px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }
const inputStyle = { width: '100%', borderRadius: '12px', border: '1px solid #E4E4E7', background: '#FFFFFF', padding: '10px 16px', fontSize: '14px', color: '#18181B', boxSizing: 'border-box' }
const labelStyle = { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500, color: '#374151' }

// Waking up screen — shown after create while retrying
function WakingUpScreen({ onGiveUp }) {
  const [dots, setDots] = useState('.')
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const dotTimer = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 500)
    const countTimer = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => { clearInterval(dotTimer); clearInterval(countTimer) }
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '24px', textAlign: 'center' }}>
      <div style={{ width: '64px', height: '64px', borderRadius: '9999px', border: '4px solid #FED7AA', borderTopColor: '#F97316', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div>
        <p style={{ fontSize: '20px', fontWeight: 600, color: '#18181B', marginBottom: '8px' }}>✅ Workflow created!</p>
        <p style={{ fontSize: '14px', color: '#71717A', marginBottom: '4px' }}>Server is waking up{dots}</p>
        <p style={{ fontSize: '12px', color: '#A1A1AA' }}>This takes ~30 seconds on free tier ({elapsed}s)</p>
      </div>
      <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '12px', padding: '12px 20px', fontSize: '13px', color: '#92400E', maxWidth: '320px' }}>
        🔄 Auto-navigating to editor once ready...
      </div>
      <button onClick={onGiveUp} style={{ ...secondaryBtn, fontSize: '13px', color: '#71717A' }}>
        Go to Workflows List
      </button>
    </div>
  )
}

export default function WorkflowEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [name, setName] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [inputSchema, setInputSchema] = useState('{}')
  const [startStepId, setStartStepId] = useState('')
  const [steps, setSteps] = useState([])

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [jsonValid, setJsonValid] = useState(true)

  const [wakingUp, setWakingUp] = useState(false)
  const [pendingNewId, setPendingNewId] = useState(null)

  const [stepModal, setStepModal] = useState(false)
  const [editingStep, setEditingStep] = useState(null)
  const [stepName, setStepName] = useState('')
  const [stepType, setStepType] = useState('task')
  const [stepOrder, setStepOrder] = useState(1)
  const [stepMeta, setStepMeta] = useState('{}')
  const [stepSaving, setStepSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // ✅ On create page open — silently ping Render to wake it up
  useEffect(() => {
    if (!isEdit) {
      getWorkflow('warmup').catch(() => { })
    }
  }, [])

  useEffect(() => {
    if (isEdit) loadWorkflow()
  }, [id])

  // ✅ Retry loop after create — keeps trying until Render is awake
  useEffect(() => {
    if (!wakingUp || !pendingNewId) return
    let cancelled = false
    let attempts = 0
    const maxAttempts = 20

    const tryNavigate = async () => {
      if (cancelled) return
      try {
        const r = await getWorkflow(pendingNewId)
        if (r.data && !cancelled) {
          setWakingUp(false)
          navigate(`/workflows/${pendingNewId}/edit`)
        }
      } catch {
        attempts++
        if (attempts < maxAttempts && !cancelled) {
          setTimeout(tryNavigate, 3000)
        } else if (!cancelled) {
          setWakingUp(false)
          navigate('/workflows')
        }
      }
    }

    setTimeout(tryNavigate, 2000)
    return () => { cancelled = true }
  }, [wakingUp, pendingNewId])

  const loadWorkflow = async () => {
    try {
      setLoading(true)
      const res = await getWorkflow(id)
      const w = res.data.data || res.data
      setName(w.name || '')
      setIsActive(w.is_active !== false)
      setInputSchema(JSON.stringify(w.input_schema || {}, null, 2))
      setStartStepId(w.start_step_id || w.start_step || '')
      const stepsRes = await getSteps(id)
      const s = stepsRes.data.steps || stepsRes.data.data || stepsRes.data || []
      setSteps(Array.isArray(s) ? s : [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load workflow')
    } finally {
      setLoading(false)
    }
  }

  const validateJson = () => {
    try {
      JSON.parse(inputSchema)
      setJsonValid(true)
      return true
    } catch {
      setJsonValid(false)
      return false
    }
  }

  const handleSave = async () => {
    if (!name.trim()) { setError('Workflow name is required'); return }
    if (!validateJson()) { setError('Invalid JSON in input schema'); return }
    try {
      setSaving(true)
      setError('')
      const payload = {
        name: name.trim(),
        is_active: isActive,
        input_schema: JSON.parse(inputSchema),
        start_step_id: startStepId || undefined,
      }
      if (isEdit) {
        await updateWorkflow(id, payload)
        setSuccess('Workflow updated successfully')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const res = await createWorkflow(payload)
        const newId = res.data.data?._id || res.data._id || res.data.data?.id || res.data.id
        if (newId) {
          setPendingNewId(newId)
          setWakingUp(true)
        } else {
          setError('Workflow created but ID missing. Please edit from Workflows list.')
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save workflow')
    } finally {
      setSaving(false)
    }
  }

  const openAddStep = () => {
    setEditingStep(null); setStepName(''); setStepType('task')
    setStepOrder(steps.length + 1); setStepMeta('{}'); setError('')
    setStepModal(true)
  }

  const openEditStep = (step) => {
    setEditingStep(step); setStepName(step.name || '')
    setStepType(step.step_type || step.type || 'task')
    setStepOrder(step.order || 1)
    setStepMeta(JSON.stringify(step.metadata || {}, null, 2))
    setError(''); setStepModal(true)
  }

  const handleSaveStep = async () => {
    if (!stepName.trim()) { setError('Step name is required'); return }
    if (!isEdit) { setError('Save the workflow first to add steps'); return }
    let meta = {}
    try { meta = stepMeta.trim() ? JSON.parse(stepMeta) : {} }
    catch { setError('Invalid JSON in metadata field'); return }
    try {
      setStepSaving(true); setError('')
      const payload = { workflowId: id, name: stepName.trim(), type: stepType, order: Number(stepOrder), metadata: meta }
      if (editingStep) {
        await updateStep(editingStep.id || editingStep._id, payload)
        setSuccess('Step updated successfully')
      } else {
        await createStep(id, payload)
        setSuccess('Step added successfully')
      }
      setStepModal(false)
      setTimeout(() => setSuccess(''), 3000)
      const stepsRes = await getSteps(id)
      const s = stepsRes.data.steps || stepsRes.data.data || stepsRes.data || []
      setSteps(Array.isArray(s) ? s : [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save step')
    } finally { setStepSaving(false) }
  }

  const confirmDeleteStep = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      await deleteStep(deleteTarget.id || deleteTarget._id)
      setSuccess('Step deleted successfully')
      setDeleteTarget(null)
      setTimeout(() => setSuccess(''), 3000)
      const stepsRes = await getSteps(id)
      const s = stepsRes.data.steps || stepsRes.data.data || stepsRes.data || []
      setSteps(Array.isArray(s) ? s : [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete step')
      setDeleteTarget(null)
    } finally { setDeleting(false) }
  }

  if (loading) return <LoadingSpinner />
  if (wakingUp) return <WakingUpScreen onGiveUp={() => { setWakingUp(false); navigate('/workflows') }} />

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/workflows" className="link-hover" style={{ fontSize: '14px', color: '#71717A', textDecoration: 'none' }}>← Back</Link>
          <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#18181B' }}>{isEdit ? 'Edit Workflow' : 'Create Workflow'}</h2>
        </div>
        <button className="btn-primary-glow" onClick={handleSave} disabled={saving} style={{ ...primaryBtn, opacity: saving ? 0.5 : 1 }}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {success && (
        <div style={{ marginBottom: '16px', borderRadius: '12px', border: '1px solid #BBF7D0', background: '#F0FDF4', padding: '12px 16px', fontSize: '14px', fontWeight: 500, color: '#16A34A' }}>
          ✓ {success}
        </div>
      )}

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      <div style={{ marginTop: '16px', display: 'grid', gap: '24px', gridTemplateColumns: '3fr 2fr' }}>
        <div className="card-hover" style={card}>
          <h3 style={{ marginBottom: '20px', fontSize: '16px', fontWeight: 600, color: '#18181B' }}>Workflow Details</h3>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Name <span style={{ color: '#DC2626' }}>*</span></label>
            <input className="input-focus" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter workflow name" style={inputStyle} />
          </div>

          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>Active</label>
            <button onClick={() => setIsActive(!isActive)} style={{ position: 'relative', width: '44px', height: '24px', borderRadius: '9999px', border: 'none', background: isActive ? '#16A34A' : '#D1D5DB', cursor: 'pointer', transition: 'background 0.2s' }}>
              <span style={{ position: 'absolute', top: '2px', left: isActive ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '9999px', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
            </button>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>Input Schema (JSON)</label>
              <button className="action-btn-hover" onClick={validateJson} style={{ fontSize: '12px', fontWeight: 500, color: '#71717A', background: 'none', border: 'none', cursor: 'pointer' }}>Validate JSON</button>
            </div>
            <textarea className="input-focus" value={inputSchema} onChange={(e) => { setInputSchema(e.target.value); setJsonValid(true) }} rows={8}
              style={{ ...inputStyle, fontFamily: 'monospace', background: '#FAFAFA', borderColor: jsonValid ? '#E4E4E7' : '#DC2626', resize: 'vertical' }}
              placeholder='{"field": {"type": "string", "required": true}}' />
            {!jsonValid && <p style={{ marginTop: '4px', fontSize: '12px', color: '#DC2626' }}>Invalid JSON format</p>}
          </div>

          {isEdit && steps.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Start Step</label>
              <select value={startStepId} onChange={(e) => setStartStepId(e.target.value)} style={inputStyle}>
                <option value="">Select start step</option>
                {steps.map((s) => <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="card-hover" style={card}>
          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#18181B' }}>Steps</h3>
            {isEdit && <span style={{ fontSize: '12px', color: '#71717A' }}>{steps.length} step{steps.length !== 1 ? 's' : ''}</span>}
          </div>

          {!isEdit ? (
            <p style={{ padding: '24px 0', textAlign: 'center', fontSize: '14px', color: '#A1A1AA' }}>Save the workflow first to add steps.</p>
          ) : (
            <>
              {steps.length === 0 ? (
                <p style={{ padding: '24px 0', textAlign: 'center', fontSize: '14px', color: '#A1A1AA' }}>No steps yet. Add your first step.</p>
              ) : (
                <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[...steps].sort((a, b) => (a.order || 0) - (b.order || 0)).map((step, idx) => (
                    <div key={step.id || step._id} className="step-card-hover" style={{ display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '8px', border: '1px solid #E4E4E7', padding: '12px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '9999px', background: '#F4F4F5', fontSize: '12px', fontWeight: 500, color: '#71717A', flexShrink: 0 }}>{idx + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '14px', fontWeight: 500, color: '#18181B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{step.name}</p>
                        <span style={{ borderRadius: '9999px', background: '#F4F4F5', padding: '1px 8px', fontSize: '10px', fontWeight: 500, color: '#71717A', textTransform: 'capitalize' }}>{step.step_type || step.type || 'task'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <Link to={`/workflows/${id}/rules`} className="btn-hover" style={{ padding: '4px 8px', fontSize: '11px', fontWeight: 500, color: '#F97316', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '6px', textDecoration: 'none' }}>Rules</Link>
                        <button className="action-btn-hover" onClick={() => openEditStep(step)} style={{ padding: '4px', fontSize: '14px', color: '#71717A', background: 'none', border: 'none', cursor: 'pointer' }}>✏️</button>
                        <button className="action-btn-hover" onClick={() => setDeleteTarget(step)} style={{ padding: '4px', fontSize: '14px', color: '#71717A', background: 'none', border: 'none', cursor: 'pointer' }}>🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button className="dashed-btn-hover" onClick={openAddStep} style={{ width: '100%', borderRadius: '12px', border: '2px dashed #D1D5DB', background: 'transparent', padding: '10px', fontSize: '14px', fontWeight: 500, color: '#A1A1AA', cursor: 'pointer' }}>
                + Add Step
              </button>
            </>
          )}
        </div>
      </div>

      <Modal isOpen={stepModal} onClose={() => { setStepModal(false); setError('') }} title={editingStep ? 'Edit Step' : 'Add Step'}
        footer={<>
          <button className="btn-hover" onClick={() => { setStepModal(false); setError('') }} style={secondaryBtn}>Cancel</button>
          <button className="btn-primary-glow" onClick={handleSaveStep} disabled={stepSaving} style={{ ...primaryBtn, opacity: stepSaving ? 0.5 : 1 }}>{stepSaving ? 'Saving...' : 'Save'}</button>
        </>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Step Name <span style={{ color: '#DC2626' }}>*</span></label>
            <input type="text" value={stepName} onChange={(e) => setStepName(e.target.value)} placeholder="Enter step name" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Type</label>
            <select value={stepType} onChange={(e) => setStepType(e.target.value)} style={inputStyle}>
              <option value="task">Task</option>
              <option value="approval">Approval</option>
              <option value="notification">Notification</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Order <span style={{ color: '#DC2626' }}>*</span></label>
            <input type="number" min="1" value={stepOrder} onChange={(e) => setStepOrder(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Metadata (JSON, optional)</label>
            <textarea value={stepMeta} onChange={(e) => setStepMeta(e.target.value)} rows={3} style={{ ...inputStyle, fontFamily: 'monospace', background: '#FAFAFA', resize: 'vertical' }} placeholder='{"assignee_email": "manager@example.com"}' />
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Step"
        footer={<>
          <button className="btn-hover" onClick={() => setDeleteTarget(null)} style={secondaryBtn}>Cancel</button>
          <button className="btn-hover" onClick={confirmDeleteStep} disabled={deleting} style={{ ...dangerBtn, opacity: deleting ? 0.5 : 1 }}>{deleting ? 'Deleting...' : 'Delete'}</button>
        </>}>
        <p style={{ fontSize: '14px', color: '#71717A' }}>
          Are you sure you want to delete <strong style={{ color: '#18181B' }}>"{deleteTarget?.name}"</strong>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
