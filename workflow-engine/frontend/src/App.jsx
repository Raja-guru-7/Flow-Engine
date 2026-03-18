import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Home'
import WorkflowList from './pages/WorkflowList'
import WorkflowEditor from './pages/WorkflowEditor'
import ExecutionPage from './pages/ExecuteWorkflow'
import AuditLog from './pages/AuditLog'
import RuleEditor from './pages/RuleEditor'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="workflows" element={<WorkflowList />} />
        <Route path="workflows/new" element={<WorkflowEditor />} />
        <Route path="workflows/:id/edit" element={<WorkflowEditor />} />
        <Route path="workflows/:id/rules" element={<RuleEditor />} />
        <Route path="workflows/:id/execute" element={<ExecutionPage />} />
        <Route path="executions" element={<AuditLog />} />
        <Route path="audit" element={<AuditLog />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
