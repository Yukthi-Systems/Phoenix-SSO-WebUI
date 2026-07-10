import { Routes, Route, Navigate } from 'react-router-dom';

// Import Pages (to be implemented next)
import Login from '../pages/Login';
import ForgotPassword from '../pages/ForgotPassword';
import VerifyOtp from '../pages/VerifyOtp';
import MfaVerification from '../pages/MfaVerification';
import SessionCheck from '../pages/SessionCheck';
import SilentAuth from '../pages/SilentAuth';
import Logout from '../pages/Logout';
import ErrorPage from '../pages/ErrorPage';
import SessionExpired from '../pages/SessionExpired';
import Unauthorized from '../pages/Unauthorized';
import Success from '../pages/Success';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Session Entry Checking Route */}
      <Route path="/" element={<Navigate to="/session-check" replace />} />
      <Route path="/session-check" element={<SessionCheck />} />
      
      {/* Auth Entry Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/mfa-verification" element={<MfaVerification />} />
      <Route path="/silent-auth" element={<SilentAuth />} />
      <Route path="/logout" element={<Logout />} />
      <Route path="/success" element={<Success />} />
      
      {/* Feedback Routes */}
      <Route path="/error" element={<ErrorPage />} />
      <Route path="/session-expired" element={<SessionExpired />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      
      {/* Fallback Catch-all */}
      <Route path="*" element={<Navigate to="/session-check" replace />} />
    </Routes>
  );
}
