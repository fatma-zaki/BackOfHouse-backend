import { MockAuthRouteGuard } from '@/features/auth/components/mock-auth-route-guard'
import { AdminLayout } from '@/layouts/admin/AdminLayout'
import { AnalyticsPage } from '@/pages/admin/analytics/analytics-page'
import { ApplicationsPage } from '@/pages/admin/applications/applications-page'
import { CompaniesPage } from '@/pages/admin/companies/companies-page'
import { ListingsPage } from '@/pages/admin/listings/listings-page'
import { OverviewPage } from '@/pages/admin/overview/overview-page'
import { ReportsPage } from '@/pages/admin/reports/reports-page'
import { SupplierRequestsPage } from '@/pages/admin/supplier-requests/supplier-requests-page'
import { UserDetailPage } from '@/pages/admin/users/user-detail-page'
import { UsersPage } from '@/pages/admin/users/users-page'
import { ClaimsImportsPage } from '@/pages/admin/claims-imports/claims-imports-page'
import { EventsPage } from '@/pages/admin/events/events-page'
import { AuditPage } from '@/pages/admin/audit/audit-page'
import { BroadcastsPage } from '@/pages/admin/broadcasts/broadcasts-page'
import { AnalystHomePage } from '@/pages/admin/home/analyst-home-page'
import { ModerationPage } from '@/pages/admin/moderation/moderation-page'
import { MyDeskPage } from '@/pages/admin/my-desk/my-desk-page'
import { MyQueuePage } from '@/pages/admin/my-queue/my-queue-page'
import { MyTicketsPage } from '@/pages/admin/my-tickets/my-tickets-page'
import { NewsPage } from '@/pages/admin/news/news-page'
import { SettingsPage } from '@/pages/admin/settings/settings-page'
import { SupportPage } from '@/pages/admin/support/support-page'
import { TeamPage } from '@/pages/admin/team/team-page'
import { RewardsPage } from '@/pages/admin/rewards/rewards-page'
import { VerificationPage } from '@/pages/admin/verification/verification-page'
import { LoginPage } from '@/pages/auth/login-page'
import { createBrowserRouter, Navigate } from 'react-router-dom'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/admin" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/admin',
    element: (
      <MockAuthRouteGuard>
        <AdminLayout />
      </MockAuthRouteGuard>
    ),
    children: [
      {
        index: true,
        element: <OverviewPage />,
      },
      {
        path: 'my-queue',
        element: <MyQueuePage />,
      },
      {
        path: 'my-desk',
        element: <MyDeskPage />,
      },
      {
        path: 'my-tickets',
        element: <MyTicketsPage />,
      },
      {
        path: 'home',
        element: <AnalystHomePage />,
      },
      {
        path: 'analytics',
        element: <AnalyticsPage />,
      },
      {
        path: 'reports',
        element: <ReportsPage />,
      },
      {
        path: 'listings',
        element: <ListingsPage />,
      },
      {
        path: 'applications',
        element: <ApplicationsPage />,
      },
      {
        path: 'supplier-requests',
        element: <SupplierRequestsPage />,
      },
      {
        path: 'users',
        element: <UsersPage />,
      },
      {
        path: 'users/:userId',
        element: <UserDetailPage />,
      },
      {
        path: 'companies',
        element: <CompaniesPage />,
      },
      {
        path: 'verification',
        element: <VerificationPage />,
      },
      {
        path: 'claims-imports',
        element: <ClaimsImportsPage />,
      },
      {
        path: 'events',
        element: <EventsPage />,
      },
      {
        path: 'news',
        element: <NewsPage />,
      },
      {
        path: 'rewards',
        element: <RewardsPage />,
      },
      {
        path: 'moderation',
        element: <ModerationPage />,
      },
      {
        path: 'support',
        element: <SupportPage />,
      },
      {
        path: 'broadcasts',
        element: <BroadcastsPage />,
      },
      {
        path: 'team',
        element: <TeamPage />,
      },
      {
        path: 'audit',
        element: <AuditPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <div>Not Found</div>,
  },
])
