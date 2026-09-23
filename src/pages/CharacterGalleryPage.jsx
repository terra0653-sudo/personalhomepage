import { useOutletContext } from 'react-router-dom'
import GallerySection from '../components/GallerySection.jsx'

export default function CharacterGalleryPage() {
  const { character } = useOutletContext()
  return <GallerySection characterId={character.id} showForm title="갤러리" />
}
