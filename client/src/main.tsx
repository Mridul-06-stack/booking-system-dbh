import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import BookingPage from './pages/BookingPage';
import HistoryPage from './pages/HistoryPage';
import AdminMachinesPage from './pages/admin/MachinesPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import StudentsPage from './pages/admin/StudentsPage';
import ScannerPage from './pages/admin/ScannerPage';
import SettingsPage from './pages/admin/SettingsPage';

import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/book" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin/settings" element={<ProtectedRoute adminOnly><SettingsPage /></ProtectedRoute>} />
          <Route path="/admin/machines" element={<ProtectedRoute adminOnly><AdminMachinesPage /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute adminOnly><AnalyticsPage /></ProtectedRoute>} />
          <Route path="/admin/students" element={<ProtectedRoute adminOnly><StudentsPage /></ProtectedRoute>} />
          <Route path="/admin/scanner" element={<ProtectedRoute adminOnly><ScannerPage /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);
