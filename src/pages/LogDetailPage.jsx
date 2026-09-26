import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../supabaseClient.js'
import { upgradeLegacyImages } from '../lib/legacyContent.js'
import RichTextEditor from '../components/RichTextEditor.jsx'

const BUCKET = 'gallery-images'

export default function LogDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [entry, setEntry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [insertingImage, setInsertingImage] = useState(false)

  const editorRef = useRef(null)
  const contentRef = useRef('')
  const fileInputRef = useRef(null)

  function loadEntry() {
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
  }

  useEffect(() => {
    loadEntry()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  function startEditing() {
    setEditTitle(entry.title)
    contentRef.current = upgradeLegacyImages(entry.content)
    setIsEditing(true)
  }

  function cancelEditing() {
    setIsEditing(false)
  }

  async function handleSave(e) {
    e.preventDefault()
    const content = contentRef.current
    if (!editTitle || !content || content === '<p></p>') return

    setSaving(true)
    const { error } = await supabase
      .from('chat_logs')
      .update({ title: editTitle, content })
      .eq('id', id)
    setSaving(false)

    if (!error) {
      setIsEditing(false)
      loadEntry()
    } else {
      alert('수정에 실패했어요: ' + error.message)
    }
  }

  async function handleDelete() {
    if (!confirm('이 로그를 삭제할까요? 되돌릴 수 없어요.')) return
    setDeleting(true)
    const { error } = await supabase.from('chat_logs').delete().eq('id', id)
    setDeleting(false)

    if (!error) {
      if (entry.characters) {
        navigate(`/character/${entry.characters.slug}/logs`)
      } else {
        navigate('/logs')
      }
    } else {
      alert('삭제에 실패했어요: ' + error.message)
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

  const backLink = entry.characters ? (
    <Link to={`/character/${entry.characters.slug}/logs`}>
      ← {entry.characters.pair_name || entry.characters.name}
    </Link>
  ) : (
    <Link to="/logs">← 전체 로그</Link>
  )

  if (isEditing) {
    return (
      <section className="log-detail">
        <div className="log-detail__back">{backLink}</div>

        <form className="form-card" onSubmit={handleSave}>
          <h3>로그 수정</h3>
          <div className="form-row">
            <input placeholder="글 제목" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
          </div>

          <RichTextEditor
            defaultValue={contentRef.current}
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
            <button type="button" className="btn btn--ghost" onClick={cancelEditing}>
              취소
            </button>
            <button className="btn" disabled={saving}>
              {saving ? '저장 중…' : '저장하기'}
            </button>
          </div>
        </form>
      </section>
    )
  }

  return (
    <section className="log-detail">
      <div className="log-detail__back">{backLink}</div>

      <div className="log-detail__header">
        <h1 className="log-detail__title">{entry.title}</h1>
        <div className="log-detail__tools">
          <button className="btn btn--ghost" onClick={startEditing}>
            수정
          </button>
          <button className="btn btn--danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? '삭제 중…' : '삭제'}
          </button>
        </div>
      </div>

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
