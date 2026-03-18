import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getWorkflow, getSteps, getRules, createRule, updateRule, deleteRule } from '../api/api'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import Modal from '../components/Modal'

const card = { background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }
const primaryBtn = { background: '#F97316', color: 'white', border: 'none', borderRadius: '9999px', padding: '8px 20px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }
const secondaryBtn = { background: 'white', color: '#18181B', border: '1px solid #E4E4E7', borderRadius: '9999px', padding: '8px 20px', fontSize: '14px', cursor: 'pointer' }
const dangerBtn = { background: '#DC2626', color: 'white', border: 'none', borderRadius: '9999px', padding: '8px 20px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }
const inputStyle = { width: '100%', borderRadius: '12px', border: '1px solid #E4E4E7', background: '#FFFFFF', padding: '10px 16px', fontSize: '14px', color: '#18181B', outline: 'none' }
const labelStyle = { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500, color: '#374151' }
const thStyle = { padding: '10px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.05em' }
const tdStyle = { padding: '12px 16px', fontSize: '14px', color: '#18181B' }

export default function RuleEditor() {
  const { id } = useParams()
  const [workflow, setWorkflow] = useState(null)
  const [steps, setSteps] = useState([])
  const [activeStepId, setActiveStepId] = useState('')
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [rulesLoading, setRulesLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [ruleModal, setRuleModal] = useState(false)
  const [editingRule, setEditingRule] = useState(null)
  const [priority, setPriority] = useState(1)
  const [condition, setCondition] = useState('')
  const [nextStepId, setNextStepId] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => { loadData() }, [id])

  const loadData = async () => {
    try {
      setLoading(true)
      const [wRes, sRes] = await Promise.all([getWorkflow(id), getSteps(id)])
      const w = wRes.data.data || wRes.data
      const s = sRes.data.steps || sRes.data.data || sRes.data || []
      setWorkflow(w)
      const stepsArr = Array.isArray(s) ? s : []
      setSteps(stepsArr)
      if (stepsArr.length > 0) {
        setActiveStepId(stepsArr[0].id || stepsArr[0]._id)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load workflow')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeStepId) loadRules()
  }, [activeStepId])

  const loadRules = async () => {
    try {
      setRulesLoading(true)
      const res = await getRules(activeStepId)
      const data = res.data.rules || res.data.data || res.data || []
      setRules(Array.isArray(data) ? data : [])
    } catch {
      setRules([])
    } finally {
      setRulesLoading(false)
    }
  }

  const openAddRule = () => {
    setEditingRule(null)
    setPriority(rules.length + 1)
    setCondition('')
    setNextStepId('')
    setRuleModal(true)
  }

  const openEditRule = (rule) => {
    setEditingRule(rule)
    setPriority(rule.priority || 1)
    setCondition(rule.condition || '')
    setNextStepId(rule.next_step_id || '')
    setRuleModal(true)
  }

  const handleSaveRule = async () => {
    if (!condition.trim()) { setError('Condition is required'); return }
    try {
      setError('')
      const payload = {
        priority: Number(priority),
        condition: condition.trim(),
        next_step_id: nextStepId || null
      }
      if (editingRule) {
        await updateRule(editingRule.id || editingRule._id, payload)
        setSuccess('Rule updated!')
      } else {
        await createRule(activeStepId, payload)
        setSuccess('Rule added!')
      }
      setRuleModal(false)
      setTimeout(() => setSuccess(''), 3000)
      loadRules()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save rule')
    }
  }

  const confirmDeleteRule = async () => {
    if (!deleteTarget) return
    try {
      await deleteRule(deleteTarget.id || deleteTarget._id)
      setSuccess('Rule deleted!')
      setDeleteTarget(null)
      setTimeout(() => setSuccess(''), 3000)
      loadRules()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete rule')
      setDeleteTarget(null)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Link
          className="link-hover"
          to={`/workflows/${id}/edit`}
          style={{ fontSize: '14px', color: '#71717A', textDecoration: 'none' }}
        >
          ← Back to Workflow
        </Link>
        <h2 style={{ marginTop: '8px', fontSize: '24px', fontWeight: 600, color: '#18181B' }}>
          Rule Editor
        </h2>
        <p style={{ fontSize: '14px', color: '#71717A' }}>{workflow?.name}</p>
      </div>

      {success && (
        <div style={{ marginBottom: '16px', borderRadius: '12px', border: '1px solid #BBF7D0', background: '#F0FDF4', padding: '12px 16px', fontSize: '14px', fontWeight: 500, color: '#16A34A' }}>
          ✓ {success}
        </div>
      )}
      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {steps.length === 0 ? (
        <div style={{ ...card, padding: '64px 0', textAlign: 'center' }}>
          <span style={{ fontSize: '36px' }}>📐</span>
          <p style={{ marginTop: '12px', fontSize: '14px', color: '#A1A1AA' }}>
            No steps found. Add steps in the workflow editor first.
          </p>
        </div>
      ) : (
        <>
          {/* Step Tabs */}
          <div style={{ marginBottom: '24px', display: 'flex', gap: '4px', overflowX: 'auto', borderBottom: '1px solid #E4E4E7' }}>
            {steps.map((step) => {
              const stepId = step.id || step._id
              return (
                <button
                  key={stepId}
                  className="interactive"
                  onClick={() => setActiveStepId(stepId)}
                  style={{
                    flexShrink: 0, padding: '10px 16px', fontSize: '14px',
                    fontWeight: 500, border: 'none', cursor: 'pointer',
                    transition: 'all 0.15s',
                    ...(activeStepId === stepId
                      ? { background: '#F97316', color: 'white', borderRadius: '8px 8px 0 0' }
                      : { background: 'transparent', color: '#71717A', borderRadius: '8px 8px 0 0' })
                  }}
                >
                  {step.name}
                </button>
              )
            })}
          </div>

          {/* Rules Section */}
          <div className="card-hover" style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E4E4E7', padding: '16px 24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#18181B' }}>
                {steps.find((s) => (s.id || s._id) === activeStepId)?.name} — Rules
              </h3>
              <button className="btn-primary-glow" onClick={openAddRule} style={{ ...primaryBtn, padding: '8px 16px', fontSize: '12px' }}>
                + Add Rule
              </button>
            </div>

            {rulesLoading ? (
              <div style={{ padding: '32px', textAlign: 'center' }}>
                <LoadingSpinner />
              </div>
            ) : rules.length === 0 ? (
              <div style={{ padding: '48px 0', textAlign: 'center', fontSize: '14px', color: '#A1A1AA' }}>
                No rules yet. Add one to define execution routing.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #E4E4E7' }}>
                      <th style={thStyle}>#</th>
                      <th style={thStyle}>Condition</th>
                      <th style={thStyle}>Next Step</th>
                      <th style={thStyle}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...rules]
                      .sort((a, b) => (a.priority || 0) - (b.priority || 0))
                      .map((rule) => {
                        const isDefault = (rule.condition || '').toUpperCase() === 'DEFAULT'
                        const nextStep = steps.find((s) =>
                          (s.id || s._id) === rule.next_step_id
                        )
                        return (
                          <tr
                            key={rule.id || rule._id}
                            className="row-hover"
                            style={{
                              borderBottom: '1px solid #F4F4F5',
                              background: isDefault ? '#FFFBF5' : 'transparent',
                              fontStyle: isDefault ? 'italic' : 'normal'
                            }}
                          >
                            <td style={tdStyle}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '9999px', background: '#F4F4F5', fontSize: '12px', fontWeight: 500, color: '#71717A' }}>
                                {rule.priority}
                              </span>
                            </td>
                            <td style={tdStyle}>
                              <code style={{ borderRadius: '6px', background: '#F4F4F5', padding: '4px 8px', fontFamily: 'monospace', fontSize: '12px', color: '#18181B' }}>
                                {rule.condition}
                              </code>
                            </td>
                            <td style={{ ...tdStyle, color: '#71717A' }}>
                              {nextStep?.name || 'End Workflow'}
                            </td>
                            <td style={tdStyle}>
                              <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                  className="action-btn-hover"
                                  onClick={() => openEditRule(rule)}
                                  style={{ fontSize: '12px', color: '#F97316', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                                >
                                  Edit
                                </button>
                                <button
                                  className="action-btn-hover"
                                  onClick={() => setDeleteTarget(rule)}
                                  style={{ fontSize: '12px', color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="card-hover" style={{ ...card, marginTop: '24px', padding: '20px', background: '#FAFAFA' }}>
            <h4 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 600, color: '#18181B' }}>💡 Rule Tips</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#71717A' }}>
              <li>• Operators: <code style={{ fontFamily: 'monospace', color: '#18181B' }}>&amp;&amp; || === !== &gt; &lt; &gt;= &lt;=</code></li>
              <li>• String functions: <code style={{ fontFamily: 'monospace', color: '#18181B' }}>contains(field, 'value')</code>, <code style={{ fontFamily: 'monospace', color: '#18181B' }}>startsWith(field, 'prefix')</code></li>
              <li>• Use <code style={{ fontFamily: 'monospace', color: '#18181B' }}>DEFAULT</code> for the fallback rule</li>
              <li>• Lower priority number = evaluated first</li>
            </ul>
          </div>
        </>
      )}

      {/* Add/Edit Rule Modal */}
      <Modal
        isOpen={ruleModal}
        onClose={() => setRuleModal(false)}
        title={editingRule ? 'Edit Rule' : 'Add Rule'}
        footer={
          <>
            <button className="btn-hover" onClick={() => setRuleModal(false)} style={secondaryBtn}>Cancel</button>
            <button className="btn-primary-glow" onClick={handleSaveRule} style={primaryBtn}>Save Rule</button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Priority *</label>
            <input
              type="number" min="1"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Condition *</label>
            <input
              type="text"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              placeholder="amount > 100 && country === 'US'"
              style={{ ...inputStyle, fontFamily: 'monospace' }}
            />
            <p style={{ marginTop: '4px', fontSize: '11px', color: '#A1A1AA' }}>
              Use DEFAULT for fallback rule
            </p>
          </div>
          <div>
            <label style={labelStyle}>Next Step</label>
            <select
              value={nextStepId}
              onChange={(e) => setNextStepId(e.target.value)}
              style={inputStyle}
            >
              <option value="">End Workflow</option>
              {steps.map((s) => (
                <option key={s.id || s._id} value={s.id || s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Rule"
        footer={
          <>
            <button className="btn-hover" onClick={() => setDeleteTarget(null)} style={secondaryBtn}>Cancel</button>
            <button className="btn-hover" onClick={confirmDeleteRule} style={dangerBtn}>Delete</button>
          </>
        }
      >
        <p style={{ fontSize: '14px', color: '#71717A' }}>
          Are you sure you want to delete this rule? This cannot be undone.
        </p>
      </Modal>
    </div>
  )
}