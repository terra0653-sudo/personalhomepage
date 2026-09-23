import { useOutletContext } from 'react-router-dom'
import ChatLogSection from '../components/ChatLogSection.jsx'

export default function CharacterLogsPage() {
  const { character } = useOutletContext()
  return <ChatLogSection characterId={character.id} showForm title="채팅 로그" />
}
