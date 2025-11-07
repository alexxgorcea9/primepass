import React, { useEffect, Suspense } from 'react';
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
const OrganizerDashboard = React.lazy(() => import('./pages/Organizer/Dashboard'));
const CreateEvent = React.lazy(() => import('./pages/Organizer/CreateEvent'));
const EventDetails = React.lazy(() => import('./pages/Organizer/EventDetails'));
const QRScanPage = React.lazy(() => import('./pages/Organizer/QRScanPage'));
const RequestDetails = React.lazy(() => import('./pages/Organizer/RequestDetails'));

// Guest pages
const Events = React.lazy(() => import('./pages/Guest/Events'));

// Loading component for better UX
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

function App() {
  useEffect(() => {
    initCSRF();
  }, []);

  return (
    <AuthProvider>
      <Routes>
        {/* Public routes - NOT lazy */}
        <Route path='/' element={<Welcome />} />
        <Route path='/login' element={<Login />} />
        <Route path='/select-account-type' element={<SelectAccountType />} />
        <Route path='/signup' element={<Signup />} />
        <Route path="/verify-email" element={<EmailVerification />} />

        {/* Protected routes - NOT lazy (already authenticated) */}
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

        {/* OAuth callback */}
        <Route path='/oauth/google/callback' element={<OAuthCallback />} />

        {/* Organizer routes */}
        <Route path='/:username/dashboard' element={
          <AuthGuard allowedRoles={['organizer']}>
            <Suspense fallback={<PageLoader />}>
              <OrganizerDashboard />
            </Suspense>
          </AuthGuard>
        } />
        <Route path='/create-event' element={
          <AuthGuard allowedRoles={['organizer']}>
            <Suspense fallback={<PageLoader />}>
              <CreateEvent />
            </Suspense>
          </AuthGuard>
        } />
        <Route path='/:username/event/:event_id' element={
          <AuthGuard allowedRoles={['organizer']}>
            <Suspense fallback={<PageLoader />}>
              <EventDetails />
            </Suspense>
          </AuthGuard>
        } />
        <Route path='/:username/event/:event_id/scan-qr' element={
          <AuthGuard allowedRoles={['organizer']}>
            <Suspense fallback={<PageLoader />}>
              <QRScanPage />
            </Suspense>
          </AuthGuard>
        } />
        <Route path={'/:username/event/:event_id/scan-qr/:scan_id'} element={
          <AuthGuard allowedRoles={['organizer']}>
            <Suspense fallback={<PageLoader />}>
              <QRScanPage />
            </Suspense>
          </AuthGuard>
        } />
        <Route path='/:username/event/:event_id/request/:request_id' element={
          <AuthGuard allowedRoles={['organizer']}>
            <Suspense fallback={<PageLoader />}>
              <RequestDetails />
            </Suspense>
          </AuthGuard>
        } />

        {/* Guest routes */}
        <Route path='/events' element={
          <AuthGuard allowedRoles={['guest']}>
            <Suspense fallback={<PageLoader />}>
              <Events />
            </Suspense>
          </AuthGuard>
        } />

        {/* Team routes */}
        <Route path='/:username/home' element={
          <Suspense fallback={<PageLoader />}>
            <div>Team Home (Coming Soon)</div>
          </Suspense>
        } />
      </Routes>
    </AuthProvider>
  );
}

export default App;