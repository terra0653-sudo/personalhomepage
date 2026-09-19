import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../supabaseClient.js'

const BUCKET = 'gallery-images'

/**
 * characterId가 있으면 해당 캐릭터의 이미지만, 없으면 전체를 보여줍니다.
 * showForm이 true면 업로드 폼도 함께 표시합니다 (characterId 필요).
 */
export default function GallerySection({ characterId, showForm = false, limit, title = '갤러리', viewAllTo }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ artist: '', note: '' })
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  async function loadItems() {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    setLoading(true)
    let query = supabase
      .from('commissions')
      .select('*, characters(slug, name, pair_name)')
      .order('created_at', { ascending: false })

    if (characterId) query = query.eq('character_id', characterId)
    if (limit) query = query.limit(limit)

    const { data, error } = await query
    if (!error) setItems(data)
    setLoading(false)
  }

  useEffect(() => {
    loadItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterId])

  async function handleUpload(e) {
    e.preventDefault()
    if (!file) return
    setUploading(true)

    const fileExt = file.name.split('.').pop()
    const filePath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(filePath, file)
    if (uploadError) {
      setUploading(false)
      alert('업로드 실패: ' + uploadError.message)
      return
    }

    const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath)

    const { error: insertError } = await supabase.from('commissions').insert([
      {
        image_url: publicUrlData.publicUrl,
        character_id: characterId,
        artist: form.artist,
        note: form.note,
      },
    ])

    setUploading(false)
    if (!insertError) {
      setForm({ artist: '', note: '' })
      setFile(null)
      e.target.reset()
      loadItems()
    } else {
      alert('저장 실패: ' + insertError.message)
    }
  }

  return (
    <section>
      <div className="section-heading">
        <h2>{title}</h2>
        {viewAllTo && <Link to={viewAllTo}>전체 보기</Link>}
      </div>

      {isSupabaseConfigured && showForm && characterId && (
        <form className="form-card" onSubmit={handleUpload}>
          <h3>커미션 추가하기</h3>
          <div className="form-row">
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
          </div>
          <div className="form-row">
            <input
              placeholder="작가"
              value={form.artist}
              onChange={(e) => setForm({ ...form, artist: e.target.value })}
            />
            <input
              placeholder="메모 (선택)"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>
          <button className="btn" disabled={uploading || !file}>
            {uploading ? '업로드 중…' : '업로드하기'}
          </button>
        </form>
      )}

      {loading && <p className="empty-state">불러오는 중…</p>}

      {!loading && items.length === 0 && (
        <p className="empty-state">
          {isSupabaseConfigured ? '아직 등록된 이미지가 없어요.' : 'Supabase 연결 후 이미지가 이곳에 표시됩니다.'}
        </p>
      )}

      <div className="gallery-grid">
        {items.map((item) => (
          <div className="gallery-item" key={item.id}>
            <img src={item.image_url} alt={item.characters?.name || 'commission'} loading="lazy" />
            {(item.characters || item.artist) && (
              <div className="gallery-item__caption">
                {!characterId && item.characters && (item.characters.pair_name || item.characters.name)}
                {!characterId && item.characters && item.artist ? ' · ' : ''}
                {item.artist}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
