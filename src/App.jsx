import { Routes, Route } from 'react-router-dom'
import Nav from './components/Nav.jsx'
import Home from './pages/Home.jsx'
import ChatLogsPage from './pages/ChatLogsPage.jsx'
import GalleryPage from './pages/GalleryPage.jsx'
import CharacterPage from './pages/CharacterPage.jsx'
import LogDetailPage from './pages/LogDetailPage.jsx'
import { isSupabaseConfigured } from './supabaseClient.js'

export default function App() {
  return (
    <div className="layout">
      <Nav />

      {!isSupabaseConfigured && (
        <div className="setup-notice">
          Supabase가 아직 연결되지 않았어요. 프로젝트 루트에 <code>.env</code> 파일을 만들고{' '}
          <code>VITE_SUPABASE_URL</code>, <code>VITE_SUPABASE_ANON_KEY</code>를 채워주세요.
          자세한 방법은 README.md를 참고하세요.
        </div>
      )}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/logs" element={<ChatLogsPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/character/:slug" element={<CharacterPage />} />
        <Route path="/log/:id" element={<LogDetailPage />} />
      </Routes>

      <footer className="site-footer">직접 만든 기록보관소 · Netlify + Supabase</footer>
    </div>
  )
}
