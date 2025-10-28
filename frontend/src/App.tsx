import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AuthGuard from '@components/Auth/AuthGuard';
import { initCSRF } from '@utils/csrf';

// Auth pages
import Welcome from './pages/Auth/Welcome';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import SelectAccountType from './pages/Auth/SelectAccountType';
import ProfileSetup from './pages/Auth/ProfileSetup';
import PaymentSetup from './pages/Auth/PaymentSetup';
import OAuthCallback from './pages/Auth/OAuthCallback';
import EmailVerification from './pages/Auth/EmailVerification';


// Organizer pages
import OrganizerDashboard from './pages/Organizer/Dashboard';
import CreateEvent from './pages/Organizer/CreateEvent';

// Guest pages
import Events from './pages/Guest/Events';

// Team pages

function App() {
  // Initialize CSRF protection on app load
  useEffect(() => {
    initCSRF();
  }, []);

  return (
  <AuthProvider>
    <Routes>

      {/* Public routes */}
      <Route path='/' element={<Welcome />} />
      <Route path='/login' element={<Login />} />
      <Route
        path='/select-account-type'
        element={<SelectAccountType />}
      />
      <Route path='/signup' element={<Signup />} />
      <Route path="/verify-email" element={<EmailVerification />} />



      {/* Protected routes - require authentication */}
      <Route path='/profile-setup' element={
        <AuthGuard allowedRoles={['guest', 'organizer', 'team']}>
          <ProfileSetup />
        </AuthGuard>
      } />
      <Route path='/payment-setup' element={
        <AuthGuard>
          <PaymentSetup />
        </AuthGuard>
      } />

      {/* OAuth callback routes */}
      <Route path='/oauth/google/callback' element={<OAuthCallback />} />

      {/* Organizer routes */}
      <Route path='/:username/dashboard' element={
        <AuthGuard allowedRoles={['organizer']}>
          <OrganizerDashboard />
        </AuthGuard>
      } />
      <Route path='/create-event' element={
        <AuthGuard allowedRoles={['organizer']}>
          <CreateEvent />
        </AuthGuard>
      } />


      {/* Guest routes */}
      <Route path='/events' element={
        <AuthGuard allowedRoles={['guest']}>
          <Events />
        </AuthGuard>} />


      {/* Team routes */}
      <Route path='/:username/home' element={<div>Team Home (Coming Soon)</div>} />

    </Routes>
  </AuthProvider>
  );
}

export default App;
