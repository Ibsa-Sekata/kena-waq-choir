import { Suspense, lazy, ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { useAuth } from './contexts/AuthContext';

// ─── Lazy-loaded Public Pages ─────────────────────────────────────────────────
const HomePage = lazy(() => import('./pages/HomePage'));
const SongsPage = lazy(() => import('./pages/SongsPage'));
const MembersPage = lazy(() => import('./pages/MembersPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const GalleryPage = lazy(() => import('./pages/GalleryPage'));
const ContactJoinPage = lazy(() => import('./pages/ContactJoinPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// ─── Lazy-loaded Admin Pages ──────────────────────────────────────────────────
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const SongManagementPage = lazy(() => import('./pages/admin/SongManagementPage'));
const EventManagementPage = lazy(() => import('./pages/admin/EventManagementPage'));
const MemberManagementPage = lazy(() => import('./pages/admin/MemberManagementPage'));
const GalleryManagementPage = lazy(() => import('./pages/admin/GalleryManagementPage'));
const JoinApplicationsPage = lazy(() => import('./pages/admin/JoinApplicationsPage'));
const ContactSubmissionsPage = lazy(() => import('./pages/admin/ContactSubmissionsPage'));
const AboutManagementPage = lazy(() => import('./pages/admin/AboutManagementPage'));

// ─── Shared Layout Components ─────────────────────────────────────────────────
const Navbar = lazy(() => import('./components/Navbar'));
const Footer = lazy(() => import('./components/Footer'));
const AudioPlayer = lazy(() => import('./components/AudioPlayer'));

// ─── Auth Guard ───────────────────────────────────────────────────────────────

function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
}

// ─── Loading Fallback ─────────────────────────────────────────────────────────

function PageLoader() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        color: 'var(--color-gold)',
        fontSize: '1.1rem',
      }}
    >
      Loading…
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <>
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>

      <main>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/songs" element={<SongsPage />} />
            <Route path="/members" element={<MembersPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/contact" element={<ContactJoinPage />} />

            {/* Admin routes */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route
              path="/admin"
              element={
                <AuthGuard>
                  <AdminDashboard />
                </AuthGuard>
              }
            />
            <Route
              path="/admin/songs"
              element={
                <AuthGuard>
                  <SongManagementPage />
                </AuthGuard>
              }
            />
            <Route
              path="/admin/events"
              element={
                <AuthGuard>
                  <EventManagementPage />
                </AuthGuard>
              }
            />
            <Route
              path="/admin/members"
              element={
                <AuthGuard>
                  <MemberManagementPage />
                </AuthGuard>
              }
            />
            <Route path="/admin/gallery" element={<AuthGuard><GalleryManagementPage /></AuthGuard>} />
            <Route path="/admin/join-applications" element={<AuthGuard><JoinApplicationsPage /></AuthGuard>} />
            <Route path="/admin/contact-submissions" element={<AuthGuard><ContactSubmissionsPage /></AuthGuard>} />
            <Route path="/admin/about" element={<AuthGuard><AboutManagementPage /></AuthGuard>} />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>

      <Suspense fallback={null}>
        <Footer />
      </Suspense>

      {/* AudioPlayer is rendered OUTSIDE <Routes> so it persists across navigations */}
      <Suspense fallback={null}>
        <AudioPlayer />
      </Suspense>
    </>
  );
}
