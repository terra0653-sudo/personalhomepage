import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../supabaseClient.js'

// 본문 안의 ![](이미지url) 형식을 실제 이미지로, 나머지는 줄바꿈 유지 텍스트로 변환합니다.
function renderLogContent(content) {
  const regex = /!\[[^\]]*\]\(([^)]+)\)/g
  const parts = []
  let lastIndex = 0
  let match
  let key = 0

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={key++} className="log-detail__text">
          {content.slice(lastIndex, match.index)}
        </span>
      )
    }
    parts.push(<img key={key++} className="log-detail__image" src={match[1]} alt="" loading="lazy" />)
    lastIndex = regex.lastIndex
  }

  if (lastIndex < content.length) {
    parts.push(
      <span key={key++} className="log-detail__text">
        {content.slice(lastIndex)}
      </span>
    )
  }

  return parts
}

export default function LogDetailPage() {
  const { id } = useParams()
  const [entry, setEntry] = useState(null)
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
      .from('chat_logs')
      .select('*, characters(slug, name, pair_name)')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true)
        } else {
          setEntry(data)
        }
        setLoading(false)
      })
  }, [id])

  if (!isSupabaseConfigured) {
    return <p className="empty-state">Supabase 연결 후 로그를 볼 수 있어요.</p>
  }

  if (loading) {
    return <p className="empty-state">불러오는 중…</p>
  }

  if (notFound) {
    return (
      <div className="empty-state">
        해당 로그를 찾을 수 없어요. <Link to="/">홈으로 돌아가기</Link>
      </div>
    )
  }

  return (
    <section className="log-detail">
      <div className="log-detail__back">
        {entry.characters ? (
          <Link to={`/character/${entry.characters.slug}`}>
            ← {entry.characters.pair_name || entry.characters.name}
          </Link>
        ) : (
          <Link to="/logs">← 전체 로그</Link>
        )}
      </div>
      <h1 className="log-detail__title">{entry.title}</h1>
      <div className="log-detail__date">{new Date(entry.created_at).toLocaleDateString('ko-KR')}</div>
      <div className="log-detail__content">{renderLogContent(entry.content || '')}</div>
    </section>
  )
}
