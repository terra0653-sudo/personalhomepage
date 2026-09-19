import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../supabaseClient.js'

export default function CharacterBanners() {
  const [characters, setCharacters] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    supabase
      .from('characters')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (!error) setCharacters(data)
        setLoading(false)
      })
  }, [])

  if (loading) return null

  if (characters.length === 0) {
    return (
      <p className="empty-state">
        {isSupabaseConfigured
          ? '아직 등록된 캐릭터가 없어요. Supabase characters 테이블에 추가해보세요.'
          : 'Supabase 연결 후 캐릭터 배너가 이곳에 표시됩니다.'}
      </p>
    )
  }

  return (
    <div className="character-banner-grid">
      {characters.map((c) => (
        <Link key={c.id} to={`/character/${c.slug}`} className="character-banner">
          {c.image_url && <img src={c.image_url} alt={c.name} />}
          <div className="character-banner__label">
            <span className="character-banner__pair">{c.pair_name || c.name}</span>
            <span className="character-banner__name">{c.name}</span>
          </div>
        </Link>
      ))}
    </div>
  )
}
