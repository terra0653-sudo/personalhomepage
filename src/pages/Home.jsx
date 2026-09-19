import { siteConfig } from '../siteConfig.js'
import CharacterBanners from '../components/CharacterBanners.jsx'
import ChatLogSection from '../components/ChatLogSection.jsx'
import GallerySection from '../components/GallerySection.jsx'

export default function Home() {
  return (
    <>
      <div className="hero">
        {siteConfig.avatarUrl && <img className="hero__avatar" src={siteConfig.avatarUrl} alt={siteConfig.name} />}
        <div>
          <h1>{siteConfig.tagline}</h1>
          <div className="hero__handle">{siteConfig.handle}</div>
          <p>{siteConfig.bio}</p>
          <div className="hero__links">
            {siteConfig.links.map((link) => (
              <a key={link.url} href={link.url} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <section>
        <div className="section-heading">
          <h2>캐릭터</h2>
        </div>
        <CharacterBanners />
      </section>

      <ChatLogSection limit={3} title="최근 로그" viewAllTo="/logs" />
      <GallerySection limit={4} title="최근 커미션" viewAllTo="/gallery" />
    </>
  )
}
