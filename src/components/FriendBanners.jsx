import { siteConfig } from '../siteConfig.js'

// siteConfig.friends가 비어있으면 섹션 자체를 표시하지 않습니다.
export default function FriendBanners() {
  const friends = siteConfig.friends || []
  if (friends.length === 0) return null

  return (
    <section className="friend-section">
      <div className="section-heading">
        <h2>지인들의 홈페이지</h2>
      </div>
      <div className="friend-banner-grid">
        {friends.map((f) => (
          <a key={f.url} href={f.url} target="_blank" rel="noreferrer" className="friend-banner">
            {f.imageUrl && <img src={f.imageUrl} alt={f.name} />}
            <span className="friend-banner__name">{f.name}</span>
          </a>
        ))}
      </div>
    </section>
  )
}
