// 로그 카테고리 정의. 나중에 종류를 늘리고 싶으면 이 배열에만 추가하면
// 작성 폼, 목록 필터, 배지 표시에 모두 반영됩니다.
export const LOG_CATEGORIES = [
  { value: 'main', label: '메인 스토리' },
  { value: 'sub', label: '서브 스토리' },
]

export function getCategoryLabel(value) {
  return LOG_CATEGORIES.find((c) => c.value === value)?.label || ''
}
