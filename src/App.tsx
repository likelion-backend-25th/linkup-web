import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { RequireAdmin } from '@/components/RequireAdmin.tsx';
import { RequireAuth } from '@/components/RequireAuth.tsx';
import { AdminLayout } from '@/layouts/AdminLayout.tsx';
import { FeedKeepAliveLayout } from '@/layouts/FeedKeepAliveLayout.tsx';
import { RootLayout } from '@/layouts/RootLayout.tsx';
import { AdminMembersPage } from '@/pages/admin/AdminMembersPage.tsx';
import { AdminPaymentsPage } from '@/pages/admin/AdminPaymentsPage.tsx';
import { AdminReportsPage } from '@/pages/admin/AdminReportsPage.tsx';
import { LoginPage } from '@/pages/LoginPage.tsx';
import { OAuthCallbackPage } from '@/pages/OAuthCallbackPage.tsx';
import { PostCreatePage } from '@/pages/PostCreatePage.tsx';
import { PostDetailPage } from '@/pages/PostDetailPage.tsx';
import { FollowListPage } from '@/pages/FollowListPage.tsx';
import { ProfileEditPage } from '@/pages/ProfileEditPage.tsx';
import { ProfilePage } from '@/pages/ProfilePage.tsx';
import { SearchPage } from '@/pages/SearchPage.tsx';
import { SettingsPage } from '@/pages/SettingsPage.tsx';
import { SubscriptionsPage } from '@/pages/SubscriptionsPage.tsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
        <Route element={<RootLayout />}>
          <Route element={<FeedKeepAliveLayout />}>
            <Route index element={null} />
            <Route element={<RequireAuth />}>
              <Route path="/posts/new" element={<PostCreatePage />} />
              <Route path="/posts/:id/edit" element={<PostCreatePage />} />
            </Route>
            <Route path="/posts/:id" element={<PostDetailPage />} />
          </Route>
          <Route path="/members/:memberId/follows" element={<FollowListPage />} />
          <Route path="/members/:memberId" element={<ProfilePage />} />
          <Route element={<RequireAuth />}>
            <Route path="/search" element={<SearchPage />} />
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/edit" element={<ProfileEditPage />} />
            <Route path="/profile/follows" element={<FollowListPage />} />
            <Route element={<RequireAdmin />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="members" replace />} />
                <Route path="members" element={<AdminMembersPage />} />
                <Route path="reports" element={<AdminReportsPage />} />
                <Route path="payment" element={<AdminPaymentsPage />} />
              </Route>
            </Route>
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
