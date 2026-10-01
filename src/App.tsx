import { BrowserRouter, Route, Routes } from 'react-router';
import { RequireAuth } from '@/components/RequireAuth.tsx';
import { FeedKeepAliveLayout } from '@/layouts/FeedKeepAliveLayout.tsx';
import { RootLayout } from '@/layouts/RootLayout.tsx';
import { LoginPage } from '@/pages/LoginPage.tsx';
import { OAuthCallbackPage } from '@/pages/OAuthCallbackPage.tsx';
import { PlaceholderPage } from '@/pages/PlaceholderPage.tsx';
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
            <Route path="/notifications" element={<PlaceholderPage title="알림" />} />
            <Route path="/admin" element={<PlaceholderPage title="관리자페이지" />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
