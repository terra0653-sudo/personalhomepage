import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../supabaseClient.js'

// 예전 방식(에디터 도입 전 마크다운 텍스트 ![](주소))으로 저장된 로그를 위한 호환 처리.
// 새 에디터가 만든 HTML에는 이 문법이 나오지 않으므로 있는 경우에만 변환됩니다.
function upgradeLegacyImages(html) {
  if (!html) return html
  return html.replace(
    /!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/g,
    '<img src="$1" class="rte-image" alt="" />'
  )
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
          <Link to={`/character/${entry.characters.slug}/logs`}>
            ← {entry.characters.pair_name || entry.characters.name}
          </Link>
        ) : (
          <Link to="/logs">← 전체 로그</Link>
        )}
      </div>
      <h1 className="log-detail__title">{entry.title}</h1>
      <div className="log-detail__date">{new Date(entry.created_at).toLocaleDateString('ko-KR')}</div>
      {/* entry.content는 에디터(Tiptap)가 만든 HTML이라 그대로 렌더링합니다.
          예전 텍스트 방식으로 저장된 로그는 upgradeLegacyImages가 이미지로 변환해줍니다.
          로그는 본인만 작성하는 개인 공간이라 별도 살균(sanitize) 없이 표시해요. */}
      <div
        className="log-detail__content"
        dangerouslySetInnerHTML={{ __html: upgradeLegacyImages(entry.content) }}
      />
    </section>
  )
}
