// 에디터 도입 전, 텍스트 방식(마크다운 ![](주소))으로 저장된 로그를 위한 호환 처리.
// 새 에디터가 만든 HTML에는 이 문법이 나오지 않으므로 있는 경우에만 변환됩니다.
export function upgradeLegacyImages(html) {
  if (!html) return html
  return html.replace(
    /!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/g,
    '<img src="$1" class="rte-image" alt="" />'
  )
}
