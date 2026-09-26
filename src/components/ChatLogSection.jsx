import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../supabaseClient.js'
import RichTextEditor from './RichTextEditor.jsx'
import { LOG_CATEGORIES, getCategoryLabel } from '../lib/logCategories.js'

const BUCKET = 'gallery-images'

/**
 * characterId가 있으면 해당 캐릭터의 로그만, 없으면 전체 로그를 게시판 형식으로 보여줍니다.
 * showForm이 true면 새 로그 작성 폼도 함께 표시합니다 (characterId 필요).
 * limit이 있으면(홈 화면 미리보기) 카테고리 탭은 표시하지 않습니다.
 */
export default function ChatLogSection({ characterId, showForm = false, limit, title = '채팅 로그', viewAllTo }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')

  const [logTitle, setLogTitle] = useState('')
  const [category, setCategory] = useState(LOG_CATEGORIES[0].value)
  const [saving, setSaving] = useState(false)
  const [insertingImage, setInsertingImage] = useState(false)

  const editorRef = useRef(null) // Tiptap 에디터 인스턴스
  const contentRef = useRef('') // 에디터 HTML을 매 입력마다 저장 (리렌더 없이)
  const fileInputRef = useRef(null)

  async function loadLogs() {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    setLoading(true)
    let query = supabase
      .from('chat_logs')
      .select('id, title, category, created_at, characters(slug, name, pair_name)')
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
    const content = contentRef.current
    if (!logTitle || !content || content === '<p></p>') return

    setSaving(true)
    const { error } = await supabase
      .from('chat_logs')
      .insert([{ title: logTitle, content, category, character_id: characterId }])
    setSaving(false)

    if (!error) {
      setLogTitle('')
      contentRef.current = ''
      editorRef.current?.commands.clearContent()
      loadLogs()
    } else {
      alert('저장에 실패했어요: ' + error.message)
    }
  }

  async function handleImageInsert(e) {
    const file = e.target.files[0]
    if (!file || !editorRef.current) return
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
    editorRef.current.chain().focus().setImage({ src: publicUrlData.publicUrl }).run()

    setInsertingImage(false)
    e.target.value = ''
  }

  const visibleLogs =
    activeCategory === 'all' ? logs : logs.filter((entry) => entry.category === activeCategory)

  return (
    <section>
      <div className="section-heading">
        <h2>{title}</h2>
        {viewAllTo && <Link to={viewAllTo}>전체 보기</Link>}
      </div>

      {isSupabaseConfigured && showForm && characterId && (
        <form className="form-card" onSubmit={handleSubmit}>
          <div className="form-row">
            <input placeholder="글 제목" value={logTitle} onChange={(e) => setLogTitle(e.target.value)} />
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {LOG_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <RichTextEditor
            defaultValue=""
            placeholder="대화 내용을 붙여넣으세요"
            onReady={(editor) => (editorRef.current = editor)}
            onChange={(html) => (contentRef.current = html)}
          />

          <div className="form-actions">
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
            <button className="btn" disabled={saving}>
              {saving ? '저장 중…' : '저장하기'}
            </button>
          </div>
        </form>
      )}

      {!limit && (
        <div className="log-tabs">
          <button
            className={activeCategory === 'all' ? 'active' : ''}
            onClick={() => setActiveCategory('all')}
          >
            전체
          </button>
          {LOG_CATEGORIES.map((c) => (
            <button
              key={c.value}
              className={activeCategory === c.value ? 'active' : ''}
              onClick={() => setActiveCategory(c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {loading && <p className="empty-state">불러오는 중…</p>}

      {!loading && visibleLogs.length === 0 && (
        <p className="empty-state">
          {isSupabaseConfigured ? '아직 남긴 로그가 없어요.' : 'Supabase 연결 후 로그가 이곳에 자동으로 쌓입니다.'}
        </p>
      )}

      {visibleLogs.length > 0 && (
        <div className="log-board">
          {visibleLogs.map((entry) => (
            <Link key={entry.id} to={`/log/${entry.id}`} className="log-board__row">
              <span className="log-board__title">{entry.title}</span>
              <span className="log-board__meta">
                {entry.category && (
                  <span className="log-board__category-badge">{getCategoryLabel(entry.category)}</span>
                )}
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
