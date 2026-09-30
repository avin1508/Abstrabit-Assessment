import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { PATHS } from './paths.js'
import ProtectedRoute from './ProtectedRoute.jsx'
import AppLayout from '../components/layout/AppLayout.jsx'
import WorkspaceProvider from '../context/WorkspaceProvider.jsx'
import AuthLayout from '../components/layout/AuthLayout.jsx'

// Pages are code-split; AuthLayout and AppLayout provide the Suspense fallbacks.
const LoginPage = lazy(() => import('../pages/LoginPage.jsx'))
const RegisterPage = lazy(() => import('../pages/RegisterPage.jsx'))
const DashboardPage = lazy(() => import('../pages/DashboardPage.jsx'))
const DocumentsPage = lazy(() => import('../pages/DocumentsPage.jsx'))
const ChatPage = lazy(() => import('../pages/ChatPage.jsx'))
const TasksPage = lazy(() => import('../pages/TasksPage.jsx'))
const ToolLogsPage = lazy(() => import('../pages/ToolLogsPage.jsx'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage.jsx'))

export default function AppRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to={PATHS.DASHBOARD} replace />} />

      <Route element={<AuthLayout />}>
        <Route path={PATHS.LOGIN} element={<LoginPage />} />
        <Route path={PATHS.REGISTER} element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route
          element={
            <WorkspaceProvider>
              <AppLayout />
            </WorkspaceProvider>
          }
        >
          <Route path={PATHS.DASHBOARD} element={<DashboardPage />} />
          <Route path={PATHS.DOCUMENTS} element={<DocumentsPage />} />
          <Route path={PATHS.CHAT} element={<ChatPage />} />
          <Route path={PATHS.TASKS} element={<TasksPage />} />
          <Route path={PATHS.TOOL_LOGS} element={<ToolLogsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
