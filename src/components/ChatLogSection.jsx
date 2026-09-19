import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../supabaseClient.js'

function LogEntry({ entry, showCharacter }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = entry.content && entry.content.length > 220

  return (
    <div className="log-entry">
      <div className="log-entry__meta">
        {showCharacter && entry.characters && (
          <Link className="log-entry__character" to={`/character/${entry.characters.slug}`}>
            {entry.characters.pair_name || entry.characters.name}
          </Link>
        )}
        {entry.platform && <span className="log-entry__platform">· {entry.platform}</span>}
        <span className="log-entry__date">
          {new Date(entry.created_at).toLocaleDateString('ko-KR')}
        </span>
      </div>
      <div className={`log-entry__content ${!expanded && isLong ? 'clamped' : ''}`}>
        {entry.content}
      </div>
      {isLong && (
        <button className="log-entry__toggle" onClick={() => setExpanded((v) => !v)}>
          {expanded ? '접기' : '더 보기'}
        </button>
      )}
    </div>
  )
}

/**
 * characterId가 있으면 해당 캐릭터의 로그만, 없으면 전체 로그를 보여줍니다.
 * showForm이 true면 새 로그 작성 폼도 함께 표시합니다 (characterId 필요).
 */
export default function ChatLogSection({ characterId, showForm = false, limit, title = '채팅 로그', viewAllTo }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ platform: '', content: '' })
  const [saving, setSaving] = useState(false)

  async function loadLogs() {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    setLoading(true)
    let query = supabase
      .from('chat_logs')
      .select('*, characters(slug, name, pair_name)')
      .order('created_at', { ascending: false })

    if (characterId) query = query.eq('character_id', characterId)
    if (limit) query = query.limit(limit)

    const { data, error } = await query
    if (!error) setLogs(data)
    setLoading(false)
  }

  useEffect(() => {
    loadLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterId])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.content) return
    setSaving(true)
    const { error } = await supabase
      .from('chat_logs')
      .insert([{ ...form, character_id: characterId }])
    setSaving(false)
    if (!error) {
      setForm({ platform: '', content: '' })
      loadLogs()
    } else {
      alert('저장에 실패했어요: ' + error.message)
    }
  }

  return (
    <section>
      <div className="section-heading">
        <h2>{title}</h2>
        {viewAllTo && <Link to={viewAllTo}>전체 보기</Link>}
      </div>

      {isSupabaseConfigured && showForm && characterId && (
        <form className="form-card" onSubmit={handleSubmit}>
          <h3>새 로그 남기기</h3>
          <div className="form-row">
            <input
              placeholder="플랫폼 (예: Character.AI, 자체 봇 등)"
              value={form.platform}
              onChange={(e) => setForm({ ...form, platform: e.target.value })}
            />
          </div>
          <div className="form-row">
            <textarea
              placeholder="대화 내용을 붙여넣으세요"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
          </div>
          <button className="btn" disabled={saving}>
            {saving ? '저장 중…' : '저장하기'}
          </button>
        </form>
      )}

      {loading && <p className="empty-state">불러오는 중…</p>}

      {!loading && logs.length === 0 && (
        <p className="empty-state">
          {isSupabaseConfigured ? '아직 남긴 로그가 없어요.' : 'Supabase 연결 후 로그가 이곳에 자동으로 쌓입니다.'}
        </p>
      )}

      {logs.map((entry) => (
        <LogEntry key={entry.id} entry={entry} showCharacter={!characterId} />
      ))}
    </section>
  )
}
