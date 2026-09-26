# 개인 기록보관소 (Netlify + Supabase 베이스)

AI 캐릭터 채팅 로그를 자동으로 쌓아두고, 커미션 이미지를 갤러리로 모아두는
개인 홈페이지 베이스입니다. React + Vite로 만들어졌고 Netlify에 그대로 배포할 수 있습니다.

## 1. 로컬에서 실행해보기

```bash
npm install
npm run dev
```

`http://localhost:5173` 에서 확인할 수 있습니다. (아직 Supabase를 연결하지 않아도
페이지는 뜨고, 로그/갤러리 자리에 "연결 후 표시됩니다" 안내만 보입니다.)

## 2. Supabase 프로젝트 만들기 (무료)

1. https://supabase.com 에서 새 프로젝트 생성
2. 왼쪽 메뉴 **SQL Editor** 로 이동, 아래 SQL을 붙여넣고 실행

```sql
-- 캐릭터(페어) 테이블 - 홈 화면 배너와 캐릭터별 페이지의 기준이 됩니다
create table characters (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,        -- URL에 쓰일 영문 슬러그, 예: 'aiden-luca'
  name text not null,               -- 캐릭터(또는 봇) 이름
  pair_name text,                   -- 배너에 크게 표시할 페어명, 예: '에이든 × 루카'
  image_url text,                   -- 배너/헤더에 쓸 이미지 URL
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 채팅 로그 테이블
create table chat_logs (
  id uuid primary key default gen_random_uuid(),
  character_id uuid references characters(id) on delete cascade,
  title text not null,
  content text not null,
  created_at timestamptz default now()
);

-- 커미션 갤러리 테이블
create table commissions (
  id uuid primary key default gen_random_uuid(),
  character_id uuid references characters(id) on delete cascade,
  image_url text not null,
  artist text,
  note text,
  created_at timestamptz default now()
);

-- 우선은 누구나 읽고 쓸 수 있게 열어둡니다 (개인 사이트용 최소 설정)
alter table characters enable row level security;
alter table chat_logs enable row level security;
alter table commissions enable row level security;

create policy "public read characters" on characters for select using (true);
create policy "public insert characters" on characters for insert with check (true);

create policy "public read logs" on chat_logs for select using (true);
create policy "public insert logs" on chat_logs for insert with check (true);

create policy "public read commissions" on commissions for select using (true);
create policy "public insert commissions" on commissions for insert with check (true);
```

### 캐릭터 추가하는 방법

지금은 캐릭터를 추가하는 화면(폼)을 따로 만들지 않았어요. Supabase 대시보드 →
**Table Editor** → `characters` 테이블에서 "Insert row"로 직접 추가하시면 됩니다.

| 컬럼 | 설명 |
|---|---|
| `slug` | URL에 쓰일 영문 소문자 (예: `aiden-luca`) → `/character/aiden-luca` |
| `name` | 캐릭터 이름 |
| `pair_name` | 배너에 크게 보일 페어명 (예: `에이든 × 루카`) |
| `image_url` | 배너/헤더 이미지 URL (Supabase Storage에 올린 이미지의 public URL을 써도 됩니다) |
| `sort_order` | 배너 정렬 순서 (작은 숫자가 먼저) |

캐릭터를 자주 추가하신다면, 나중에 "캐릭터 추가" 폼도 사이트에 붙여드릴 수 있어요.

> ⚠️ 위 정책은 "누구나 이 URL을 알면 글을 쓸 수 있는" 가장 단순한 설정입니다.
> 나만 쓰고 싶다면 나중에 Supabase Auth(이메일/매직링크 로그인)를 붙이고
> `insert` 정책을 `auth.uid() is not null` 조건으로 바꾸는 걸 추천해요.
> 이 부분은 필요해지면 다시 요청해주시면 붙여드릴게요.

3. **Storage** 메뉴에서 아래 두 버킷을 각각 생성 (둘 다 **Public bucket** 체크)
   - `gallery-images` — 커미션 갤러리용
   - `log-images` — 채팅 로그 본문에 삽입하는 이미지용
4. **Project Settings > API** 에서 `Project URL`과 `anon public` 키를 복사

## 3. 환경변수 설정

`.env.example`을 복사해서 `.env` 파일을 만들고 값을 채워주세요.

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=여기에_anon_public_키
```

`npm run dev`로 다시 실행하면 로그 작성 폼, 이미지 업로드가 실제로 동작합니다.

## 4. 홈 화면 꾸미기

레이아웃 코드를 건드릴 필요 없이 `src/siteConfig.js` 파일만 수정하면
이름, 소개 문구, 프로필 이미지, 링크 목록이 바뀝니다.

```js
export const siteConfig = {
  name: '...',
  handle: '@...',
  tagline: '...',
  bio: '...',
  avatarUrl: '...',
  links: [{ label: '...', url: '...' }],
}
```

색상/폰트를 바꾸고 싶으면 `src/index.css` 맨 위 `:root` 안의 변수들
(`--ink`, `--paper`, `--accent`, `--coral` 등)만 바꿔도 전체 톤이 바뀝니다.

## 5. Netlify에 배포하기

**방법 A. GitHub 연동 (추천)**
1. 이 폴더를 GitHub 저장소로 push
2. Netlify 대시보드 → "Add new site" → "Import an existing project" → 해당 저장소 선택
3. Build command: `npm run build`, Publish directory: `dist` (이미 `netlify.toml`에 설정되어 있어 자동 인식됨)
4. Netlify 사이트 설정 → **Environment variables** 에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 추가
5. Deploy

**방법 B. Netlify CLI로 바로 배포**
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```
CLI 사용 시에도 Netlify 사이트 설정에서 환경변수는 별도로 등록해야 합니다
(로컬 `.env`는 Netlify 서버에 자동으로 올라가지 않아요).

## 6. 게시판 형식 + 본문 이미지 삽입

로그 작성 폼에서 "플랫폼" 입력란을 없애고 **제목**을 받도록 바꿨어요. 목록은
제목만 나열되는 게시판 형식이고, 제목을 클릭하면 별도의 상세 페이지(`/log/:id`)로
이동해서 본문 전체를 볼 수 있어요. 갤러리는 기존처럼 그리드 형식 그대로 유지했습니다.
작성 폼의 "+ 이미지 삽입" 버튼을 누르면 이미지가 업로드되고, 커서가 있던 위치에
`![](이미지주소)` 형태로 자동 삽입되며, 상세 페이지에서는 그 자리에 실제 이미지로 표시됩니다.
(이미지는 갤러리와 같은 `gallery-images` 버킷의 `logs/` 폴더에 저장됩니다 — 새 버킷을
따로 만들지 않아도 돼요.)

**이미 테이블을 만드신 경우 반영해야 할 변경사항**

Supabase **Table Editor** → `chat_logs` 테이블에서:
1. `title` (text) 컬럼 추가 — 필수로 쓰려면 "Is Nullable" 체크 해제
2. 기존 `platform` 컬럼은 더 이상 쓰지 않아요. 삭제하거나 그냥 두셔도 무방합니다.

버킷은 기존에 만들어두신 `gallery-images` 그대로 쓰면 되고, 별도 정책 추가는 필요 없어요.

## 7. 로그 작성 서식 (볼드·이탤릭·취소선·글자 크기)

로그 작성 폼이 일반 textarea 대신 간단한 리치 텍스트 에디터로 바뀌었어요.
텍스트를 선택한 뒤 상단 툴바의 **B**(볼드) / *I*(이탤릭) / ~~S~~(취소선) 버튼을 누르거나,
"크기" 드롭다운에서 글자 크기를 고르면 바로 적용됩니다. 이미지 삽입 버튼도 같은 위치에 있어요.

내부적으로 본문은 HTML로 저장되고(`chat_logs.content`), 상세 페이지에서는 그 HTML을
그대로 렌더링해요. 로그는 본인만 작성하는 개인 공간이라 별도 보안 처리(sanitize)는
하지 않았으니, 이 사이트에 외부인이 글을 쓸 수 있게 열어두실 계획이라면 알려주세요 —
안전하게 걸러주는 처리를 추가해드릴게요.

> ⚠️ 이 기능을 적용하면 `package.json`의 의존성이 늘어나므로, 파일을 덮어쓰신 뒤
> 반드시 `npm install`을 다시 실행해주셔야 에디터가 정상 동작해요.

## 8. 로그 카테고리 (메인 스토리 / 서브 스토리)

로그를 "메인 스토리" / "서브 스토리" 두 카테고리로 나눠서 작성·필터링할 수 있어요.
작성 폼에서 제목 옆 드롭다운으로 카테고리를 고르고, 목록 위의 탭(전체 / 메인 스토리 /
서브 스토리)을 눌러 필터링할 수 있습니다. 각 로그 옆에는 카테고리 배지가 함께 표시돼요.

**이미 테이블을 만드신 경우 반영해야 할 변경사항**

Supabase **Table Editor** → `chat_logs` 테이블에서 `category` (text) 컬럼을 추가하세요.
- Default Value: `main` (메인 스토리로 기본 지정)
- 이미 등록된 로그들은 이 컬럼이 비어있을 텐데, 비어있으면 "전체" 탭에서만 보이고
  카테고리 배지 없이 표시돼요. 나중에 각 로그를 "수정"으로 열어서 카테고리를
  지정해주시면 정리됩니다.

카테고리 종류를 늘리거나 이름을 바꾸고 싶으면 `src/lib/logCategories.js` 파일의
배열 하나만 고치면 작성 폼·필터 탭·배지에 전부 반영돼요.

## 폴더 구조

```
src/
  siteConfig.js            ← 홈 화면 텍스트/링크 (여기부터 수정)
  index.css                ← 우주 테마 색상·폰트 등 디자인 토큰
  pages/
    Home.jsx               ← 메인 화면 (캐릭터 배너 + 최근 로그/커미션)
    CharacterPage.jsx       ← 캐릭터별 개별 페이지 (/character/:slug)
    ChatLogsPage.jsx        ← 전체 로그 아카이브 (/logs)
    GalleryPage.jsx         ← 전체 갤러리 아카이브 (/gallery)
    LogDetailPage.jsx       ← 로그 상세 페이지 (/log/:id, 본문+이미지)
  components/
    Nav.jsx                ← 상단 메뉴
    CharacterBanners.jsx   ← 홈 화면 캐릭터 배너 그리드
    ChatLogSection.jsx     ← 로그 목록+작성폼 (캐릭터별/전체 공용)
    GallerySection.jsx     ← 갤러리 그리드+업로드폼 (캐릭터별/전체 공용)
    RichTextEditor.jsx     ← 로그 작성용 리치 텍스트 에디터 (Tiptap)
  lib/
    fontSizeExtension.js   ← 에디터에 글자 크기 기능을 추가하는 확장
```

## 배너 동작 방식

`CharacterBanners`는 화면 크기에 따라 같은 데이터를 다르게 배치합니다.
- **PC (640px 초과)**: 세로(3:4) 카드가 그리드로 나열
- **모바일 (640px 이하)**: 가로(16:6) 배너가 세로로 쌓임

배너를 클릭하면 `/character/{slug}` 페이지로 이동하고, 그 페이지 안에서만
해당 캐릭터의 채팅 로그·갤러리를 작성/열람할 수 있습니다.

> ⚠️ 이전 버전에서 이미 로그/이미지를 등록하셨다면, 테이블 구조가
> `character_name`/`character` 텍스트 컬럼에서 `character_id`(캐릭터 테이블 참조)로
> 바뀌었어요. 데이터가 적다면 테이블을 지우고 위 SQL로 새로 만드는 게 가장 간단하고,
> 기존 데이터를 유지하고 싶으시면 말씀해주세요 — 마이그레이션 SQL을 따로 만들어드릴게요.
