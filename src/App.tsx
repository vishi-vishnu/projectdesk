/**
 * App routes.
 * - /login and /register are only for signed-out users.
 * - Everything else sits inside AppShell (sidebar + page) and needs an active account.
 * - Role-only pages are wrapped in RequireRole, and pages are lazy-loaded so each
 *   role only downloads the screens it uses.
 */
import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/context/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import { FullPageSpinner, GuestOnly, RequireAuth, RequireRole } from '@/components/layout/Guards'
import { Spinner } from '@/components/ui'
import { Login } from '@/pages/auth/Login'
import { Register } from '@/pages/auth/Register'
import { Dashboard } from '@/pages/Dashboard'
import { NotFound } from '@/pages/NotFound'

// Route-level code splitting: each role only downloads the screens it uses.
const TeamLayout = lazy(() => import('@/pages/team/TeamLayout').then((m) => ({ default: m.TeamLayout })))
const TeamOverview = lazy(() => import('@/pages/team/TeamOverview').then((m) => ({ default: m.TeamOverview })))
const ProposalTab = lazy(() => import('@/pages/team/ProposalTab').then((m) => ({ default: m.ProposalTab })))
const ReviewsTab = lazy(() => import('@/pages/team/ReviewsTab').then((m) => ({ default: m.ReviewsTab })))
const ReviewStagePage = lazy(() => import('@/pages/team/ReviewStagePage').then((m) => ({ default: m.ReviewStagePage })))
const DiscussionTab = lazy(() => import('@/pages/team/DiscussionTab').then((m) => ({ default: m.DiscussionTab })))
const ActivityTab = lazy(() => import('@/pages/team/ActivityTab').then((m) => ({ default: m.ActivityTab })))
const TeamsPage = lazy(() => import('@/pages/TeamsPage').then((m) => ({ default: m.TeamsPage })))
const ReviewQueue = lazy(() => import('@/pages/faculty/ReviewQueue').then((m) => ({ default: m.ReviewQueue })))
const CyclesPage = lazy(() => import('@/pages/coordinator/CyclesPage').then((m) => ({ default: m.CyclesPage })))
const PeoplePage = lazy(() => import('@/pages/coordinator/PeoplePage').then((m) => ({ default: m.PeoplePage })))
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })))

const PageFallback = () => (
  <div className="grid place-items-center py-24">
    <Spinner />
  </div>
)

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<FullPageSpinner />}>
          <Routes>
            <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
            <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />

            <Route element={<RequireAuth><AppShell /></RequireAuth>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="profile" element={<Suspense fallback={<PageFallback />}><ProfilePage /></Suspense>} />

              <Route path="teams" element={<RequireRole roles={['faculty', 'coordinator']}><Suspense fallback={<PageFallback />}><TeamsPage /></Suspense></RequireRole>} />
              <Route path="teams/:teamId" element={<Suspense fallback={<PageFallback />}><TeamLayout /></Suspense>}>
                <Route index element={<TeamOverview />} />
                <Route path="proposal" element={<ProposalTab />} />
                <Route path="reviews" element={<ReviewsTab />} />
                <Route path="reviews/:reviewId" element={<ReviewStagePage />} />
                <Route path="discussion" element={<DiscussionTab />} />
                <Route path="activity" element={<ActivityTab />} />
              </Route>

              <Route path="reviews" element={<RequireRole roles={['faculty']}><Suspense fallback={<PageFallback />}><ReviewQueue /></Suspense></RequireRole>} />
              <Route path="cycles" element={<RequireRole roles={['coordinator']}><Suspense fallback={<PageFallback />}><CyclesPage /></Suspense></RequireRole>} />
              <Route path="people" element={<RequireRole roles={['coordinator']}><Suspense fallback={<PageFallback />}><PeoplePage /></Suspense></RequireRole>} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: '!font-sans !text-[13.5px] !rounded-md !border-line !shadow-pop',
        }}
      />
    </AuthProvider>
  )
}
