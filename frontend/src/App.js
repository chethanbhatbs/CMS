import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import DashboardLayout from '@/layouts/DashboardLayout';
import Dashboard from '@/pages/Dashboard';

// CRM
import RetailUsers from '@/pages/CRM/RetailUsers';
import GroupUsers from '@/pages/CRM/GroupUsers';

// Charging Network
import ChargingLocations from '@/pages/ChargingLocations';
import LocationDetails from '@/pages/LocationDetails';
import ChargePoints from '@/pages/ChargePoints';

// Operations
import ChargingTransactions from '@/pages/Operations/ChargingTransactions';
import ActiveSessions from '@/pages/Operations/ActiveSessions';
import OnHoldTransactions from '@/pages/Operations/OnHoldTransactions';

// Remote Operations
import StartRemoteSession from '@/pages/RemoteOperations/StartRemoteSession';

// Monitoring
import ChargerLogs from '@/pages/Monitoring/ChargerLogs';
import AlarmSummary from '@/pages/Monitoring/AlarmSummary';
import ReportsLogs from '@/pages/ReportsLogs';

// Administration
import AdminUserManagement from '@/pages/Administration/AdminUserManagement';
import FranchiseManagement from '@/pages/Administration/FranchiseManagement';
import RoleManagement from '@/pages/Administration/RoleManagement';
import OEMManagement from '@/pages/Administration/OEMManagement';
import ChargerModelManagement from '@/pages/Administration/ChargerModelManagement';
import RFIDManagement from '@/pages/RFIDManagement';
import TariffManagement from '@/pages/TariffManagement';
import AssetManagement from '@/pages/AssetManagement';
import Configuration from '@/pages/Configuration';
import AccountTransactions from '@/pages/AccountTransactions';

// Charge Point Details
import ChargePointDetails from '@/pages/ChargePointDetails';

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
            
            {/* CRM */}
            <Route path="crm/retail-users" element={<RetailUsers />} />
            <Route path="crm/group-users" element={<GroupUsers />} />
            
            {/* Charging Network */}
            <Route path="charging-locations" element={<ChargingLocations />} />
            <Route path="charging-locations/:id" element={<LocationDetails />} />
            <Route path="charge-points" element={<ChargePoints />} />
            <Route path="charge-points/:id" element={<ChargePointDetails />} />
            
            {/* Operations */}
            <Route path="operations/transactions" element={<ChargingTransactions />} />
            <Route path="operations/active-sessions" element={<ActiveSessions />} />
            <Route path="operations/on-hold" element={<OnHoldTransactions />} />
            
            {/* Remote Operations */}
            <Route path="remote-operations/start-session" element={<StartRemoteSession />} />
            
            {/* Monitoring */}
            <Route path="monitoring/charger-logs" element={<ChargerLogs />} />
            <Route path="monitoring/alarms" element={<AlarmSummary />} />
            <Route path="monitoring/reports" element={<ReportsLogs />} />
            
            {/* Administration */}
            <Route path="admin/users" element={<AdminUserManagement />} />
            <Route path="admin/franchises" element={<FranchiseManagement />} />
            <Route path="admin/roles" element={<RoleManagement />} />
            <Route path="admin/oems" element={<OEMManagement />} />
            <Route path="admin/charger-models" element={<ChargerModelManagement />} />
            <Route path="admin/rfid" element={<RFIDManagement />} />
            <Route path="admin/tariffs" element={<TariffManagement />} />
            <Route path="admin/assets" element={<AssetManagement />} />
            <Route path="admin/configuration" element={<Configuration />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;