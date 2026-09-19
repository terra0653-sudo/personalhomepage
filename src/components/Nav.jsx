import { NavLink } from 'react-router-dom'
import { siteConfig } from '../siteConfig.js'

export default function Nav() {
  return (
    <nav className="site-nav">
      <NavLink to="/" className="site-nav__brand">
        {siteConfig.name}
      </NavLink>
      <ul className="site-nav__links">
        <li>
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            홈
          </NavLink>
        </li>
        <li>
          <NavLink to="/logs" className={({ isActive }) => (isActive ? 'active' : '')}>
            전체 로그
          </NavLink>
        </li>
        <li>
          <NavLink to="/gallery" className={({ isActive }) => (isActive ? 'active' : '')}>
            전체 갤러리
          </NavLink>
        </li>
      </ul>
    </nav>
  )
}
