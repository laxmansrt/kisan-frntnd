import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LangProvider } from './context/LangContext';

// Farmer pages
import LoginPage from './pages/farmer/LoginPage';
import RegisterPage from './pages/farmer/RegisterPage';
import DashboardPage from './pages/farmer/DashboardPage';
import CentersPage from './pages/farmer/CentersPage';
import NotificationsPage from './pages/farmer/NotificationsPage';
import FarmerLayout from './pages/farmer/FarmerLayout';

// Officer pages
import OfficerLoginPage from './pages/officer/OfficerLoginPage';
import OfficerLayout from './pages/officer/OfficerLayout';
import OfficerDashboardPage from './pages/officer/OfficerDashboardPage';
import OfficerQueuePage from './pages/officer/OfficerQueuePage';
import OfficerProcurePage from './pages/officer/OfficerProcurePage';
import OfficerPaymentPage from './pages/officer/OfficerPaymentPage';
import OfficerSlotsPage from './pages/officer/OfficerSlotsPage';
import OfficerAssistedRegisterPage from './pages/officer/OfficerAssistedRegisterPage';
import InstallPrompt from './components/InstallPrompt';

function FarmerPrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <LangProvider>
        <AuthProvider>
          <Routes>
            {/* Farmer routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<FarmerPrivateRoute><FarmerLayout /></FarmerPrivateRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="centers" element={<CentersPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
            </Route>

            {/* Officer routes */}
            <Route path="/officer/login" element={<OfficerLoginPage />} />
            <Route path="/officer" element={<OfficerLayout />}>
              <Route index element={<Navigate to="/officer/dashboard" replace />} />
              <Route path="dashboard" element={<OfficerDashboardPage />} />
              <Route path="queue" element={<OfficerQueuePage />} />
              <Route path="procure" element={<OfficerProcurePage />} />
              <Route path="payment" element={<OfficerPaymentPage />} />
              <Route path="slots" element={<OfficerSlotsPage />} />
              <Route path="assisted-register" element={<OfficerAssistedRegisterPage />} />
            </Route>
          </Routes>
          <InstallPrompt />
        </AuthProvider>
      </LangProvider>
    </BrowserRouter>
  );
}
