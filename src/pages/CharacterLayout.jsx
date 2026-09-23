import { useEffect, useState } from 'react'
import { useParams, Link, NavLink, Outlet } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../supabaseClient.js'

export default function CharacterLayout() {
  const { slug } = useParams()
  const [character, setCharacter] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    setLoading(true)
    setNotFound(false)
    supabase
      .from('characters')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true)
        } else {
          setCharacter(data)
        }
        setLoading(false)
      })
  }, [slug])

  if (!isSupabaseConfigured) {
    return <p className="empty-state">Supabase 연결 후 캐릭터 페이지를 사용할 수 있어요.</p>
  }

  if (loading) {
    return <p className="empty-state">불러오는 중…</p>
  }

  if (notFound) {
    return (
      <div className="empty-state">
        해당 캐릭터를 찾을 수 없어요. <Link to="/">홈으로 돌아가기</Link>
      </div>
    )
  }

  return (
    <>
      <div className="character-header">
        {character.image_url && <img src={character.image_url} alt={character.name} />}
        <div className="character-header__label">
          <span className="character-header__pair">{character.pair_name || character.name}</span>
          <span className="character-header__name">{character.name}</span>
        </div>
      </div>

      <nav className="character-subnav">
        <NavLink to="logs" className={({ isActive }) => (isActive ? 'active' : '')}>
          채팅 로그
        </NavLink>
        <NavLink to="gallery" className={({ isActive }) => (isActive ? 'active' : '')}>
          갤러리
        </NavLink>
      </nav>

      {/* 하위 라우트(logs / gallery)에서 character를 쓸 수 있도록 context로 전달 */}
      <Outlet context={{ character }} />
    </>
  )
}
