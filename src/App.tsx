import { BrowserRouter, Route, Routes } from 'react-router';
import { RequireAuth } from '@/components/RequireAuth.tsx';
import { RootLayout } from '@/layouts/RootLayout.tsx';
import { FeedPage } from '@/pages/FeedPage.tsx';
import { LoginPage } from '@/pages/LoginPage.tsx';
import { OAuthCallbackPage } from '@/pages/OAuthCallbackPage.tsx';
import { PlaceholderPage } from '@/pages/PlaceholderPage.tsx';
import { PostCreatePage } from '@/pages/PostCreatePage.tsx';
import { PostDetailPage } from '@/pages/PostDetailPage.tsx';
import { ProfilePage } from '@/pages/ProfilePage.tsx';
import { SearchPage } from '@/pages/SearchPage.tsx';
import { SubscriptionsPage } from '@/pages/SubscriptionsPage.tsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
        <Route element={<RootLayout />}>
          <Route path="/" element={<FeedPage />} />
          <Route path="/posts/new" element={<PostCreatePage />} />
          <Route path="/posts/:id/edit" element={<PostCreatePage />} />
          <Route path="/posts/:id" element={<PostDetailPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route element={<RequireAuth />}>
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          <Route path="/notifications" element={<PlaceholderPage title="알림" />} />
          <Route path="/members/:memberId" element={<ProfilePage />} />
          <Route path="/admin" element={<PlaceholderPage title="관리자페이지" />} />
          <Route path="/settings" element={<PlaceholderPage title="설정" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
