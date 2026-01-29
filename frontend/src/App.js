import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import DashboardLayout from '@/layouts/DashboardLayout';
import Dashboard from '@/pages/Dashboard';
import ChargingNetwork from '@/pages/ChargingNetwork';
import ChargingLocations from '@/pages/ChargingLocations';
import ChargePoints from '@/pages/ChargePoints';
import Sessions from '@/pages/Sessions';
import RFIDManagement from '@/pages/RFIDManagement';
import TariffManagement from '@/pages/TariffManagement';
import Accounts from '@/pages/Accounts';
import AssetManagement from '@/pages/AssetManagement';
import Configuration from '@/pages/Configuration';
import ReportsLogs from '@/pages/ReportsLogs';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="charging-network" element={<ChargingNetwork />} />
            <Route path="charging-locations" element={<ChargingLocations />} />
            <Route path="charge-points" element={<ChargePoints />} />
            <Route path="sessions" element={<Sessions />} />
            <Route path="rfid-management" element={<RFIDManagement />} />
            <Route path="tariff-management" element={<TariffManagement />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="asset-management" element={<AssetManagement />} />
            <Route path="configuration" element={<Configuration />} />
            <Route path="reports-logs" element={<ReportsLogs />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;