import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../supabaseClient.js'

const BUCKET = 'gallery-images'

/**
 * characterId가 있으면 해당 캐릭터의 로그만, 없으면 전체 로그를 게시판 형식으로 보여줍니다.
 * showForm이 true면 새 로그 작성 폼도 함께 표시합니다 (characterId 필요).
 */
export default function ChatLogSection({ characterId, showForm = false, limit, title = '채팅 로그', viewAllTo }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', content: '' })
  const [saving, setSaving] = useState(false)
  const [insertingImage, setInsertingImage] = useState(false)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  async function loadLogs() {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    setLoading(true)
    let query = supabase
      .from('chat_logs')
      .select('id, title, created_at, characters(slug, name, pair_name)')
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
    if (!form.title || !form.content) return
    setSaving(true)
    const { error } = await supabase
      .from('chat_logs')
      .insert([{ ...form, character_id: characterId }])
    setSaving(false)
    if (!error) {
      setForm({ title: '', content: '' })
      loadLogs()
    } else {
      alert('저장에 실패했어요: ' + error.message)
    }
  }

  // 글 작성 중 커서 위치에 이미지를 업로드해서 마크다운 형식으로 삽입합니다.
  async function handleImageInsert(e) {
    const file = e.target.files[0]
    if (!file) return
    setInsertingImage(true)

    const fileExt = file.name.split('.').pop()
    const filePath = `logs/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(filePath, file)
    if (uploadError) {
      setInsertingImage(false)
      alert('이미지 업로드 실패: ' + uploadError.message)
      return
    }

    const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath)
    const imageTag = `\n![](${publicUrlData.publicUrl})\n`

    const textarea = textareaRef.current
    if (textarea && typeof textarea.selectionStart === 'number') {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      setForm((f) => ({
        ...f,
        content: f.content.slice(0, start) + imageTag + f.content.slice(end),
      }))
    } else {
      setForm((f) => ({ ...f, content: f.content + imageTag }))
    }

    setInsertingImage(false)
    e.target.value = ''
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
              placeholder="글 제목"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="form-row">
            <textarea
              ref={textareaRef}
              placeholder="대화 내용을 붙여넣으세요. '이미지 삽입' 버튼으로 커서 위치에 이미지를 넣을 수 있어요."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
          </div>
          <div className="form-row form-row--tools">
            <button
              type="button"
              className="btn btn--ghost"
              disabled={insertingImage}
              onClick={() => fileInputRef.current?.click()}
            >
              {insertingImage ? '삽입 중…' : '+ 이미지 삽입'}
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageInsert}
              style={{ display: 'none' }}
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

      {logs.length > 0 && (
        <div className="log-board">
          {logs.map((entry) => (
            <Link key={entry.id} to={`/log/${entry.id}`} className="log-board__row">
              <span className="log-board__title">{entry.title}</span>
              <span className="log-board__meta">
                {!characterId && entry.characters && (
                  <span className="log-board__character">
                    {entry.characters.pair_name || entry.characters.name}
                  </span>
                )}
                <span className="log-board__date">
                  {new Date(entry.created_at).toLocaleDateString('ko-KR')}
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
