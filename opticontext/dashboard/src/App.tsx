import React, { Suspense, Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase, toAuthUser } from './lib/supabase';
import type { AuthUser } from './lib/supabase';
import { ToastProvider } from './components/ui/Toast';
import { AppLayout } from './components/layout/AppLayout';
import { LandingLayout } from './components/layout/LandingLayout';
import { DocsLayout } from './components/layout/DocsLayout';

const Landing     = React.lazy(() => import('./pages/Landing'));
const Auth        = React.lazy(() => import('./pages/Auth'));
const AuthCallback = React.lazy(() => import('./pages/AuthCallback'));
const DocsHome    = React.lazy(() => import('./pages/docs/DocsHome'));
const Quickstart  = React.lazy(() => import('./pages/docs/Quickstart'));
const ToolRef     = React.lazy(() => import('./pages/docs/ToolRef'));
const ApiRef      = React.lazy(() => import('./pages/docs/ApiRef'));
const Troubleshooting = React.lazy(() => import('./pages/docs/Troubleshooting'));
const Dashboard   = React.lazy(() => import('./pages/dashboard/DashboardHome'));
const Settings    = React.lazy(() => import('./pages/dashboard/Settings'));

function PageLoading() {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(t);
  }, []);
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--base)',
        gap: 12,
        opacity: visible ? 1 : 0,
        transition: 'opacity 200ms ease',
      }}
      aria-label="Loading"
    >
      <span
        style={{
          fontFamily: "'Switzer', Inter, system-ui, sans-serif",
          fontWeight: 400,
          fontSize: '0.875rem',
          color: 'var(--text-muted)',
        }}
      >
        Connecting to OptiContext
      </span>
    </div>
  );
}

const queryClient = new QueryClient();

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'var(--base)', gap: 12, padding: 24, textAlign: 'center',
        }}>
          <h1 style={{ fontFamily: "'Zodiak', Georgia, serif", fontWeight: 400, fontSize: '1.5rem', color: 'var(--text-primary)' }}>
            Something went wrong
          </h1>
          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Please refresh the page or try again later.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function ProtectedRoute({ children, user }: { children: React.ReactNode; user: AuthUser | null }) {
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function PublicOnlyRoute({ children, user }: { children: React.ReactNode; user: AuthUser | null }) {
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(toAuthUser(session.user));
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <PageLoading />;

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <ErrorBoundary>
          <a href="#main-content" className="skip-to-content">Skip to content</a>
          <Suspense fallback={<PageLoading />}>
            <Routes>
              {/* Public routes */}
              <Route element={<LandingLayout />}>
                <Route path="/" element={<Landing />} />
                <Route element={<DocsLayout />}>
                  <Route path="/docs" element={<DocsHome />} />
                  <Route path="/docs/quickstart" element={<Quickstart />} />
                  <Route path="/docs/tools/:toolName" element={<ToolRef />} />
                  <Route path="/docs/api-reference" element={<ApiRef />} />
                  <Route path="/docs/troubleshooting" element={<Troubleshooting />} />
                </Route>
              </Route>

              {/* Auth callback (no route guard — handles redirect hash before session resolves) */}
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* Auth */}
              <Route path="/auth" element={
                <PublicOnlyRoute user={user}>
                  <Auth />
                </PublicOnlyRoute>
              } />

              {/* Route aliases */}
              <Route path="/signin" element={<Navigate to="/auth" replace />} />
              <Route path="/signup" element={<Navigate to="/auth" replace />} />
              <Route path="/docs/tools" element={<Navigate to="/docs" replace />} />

              {/* Dashboard (protected) */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute user={user}>
                    <AppLayout user={user} />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard user={user} />} />
                <Route path="settings" element={<Settings user={user} />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to={user ? '/dashboard' : '/'} replace />} />
            </Routes>
          </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}
