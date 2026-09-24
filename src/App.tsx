import { BrowserRouter, Route, Routes } from 'react-router';
import { RootLayout } from '@/layouts/RootLayout.tsx';
import { FeedPage } from '@/pages/FeedPage.tsx';
import { LoginPage } from '@/pages/LoginPage.tsx';
import { PlaceholderPage } from '@/pages/PlaceholderPage.tsx';
import { PostDetailPage } from '@/pages/PostDetailPage.tsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RootLayout />}>
          <Route path="/" element={<FeedPage />} />
          <Route path="/posts/new" element={<PlaceholderPage title="글쓰기" />} />
          <Route path="/posts/:id" element={<PostDetailPage />} />
          <Route path="/search" element={<PlaceholderPage title="검색" />} />
          <Route path="/notifications" element={<PlaceholderPage title="알림" />} />
          <Route path="/profile" element={<PlaceholderPage title="내프로필" />} />
          <Route path="/admin" element={<PlaceholderPage title="관리자페이지" />} />
          <Route path="/settings" element={<PlaceholderPage title="설정" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
