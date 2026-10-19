# TRADERS · 트레더

> 트레이더스 대용량 상품을 함께 소분하도록 사람을 모으고, 상품 추천과 투표를 할 수 있는 모바일 웹 프로토타입입니다. 화면은 정적 웹 파일로 제공하고, 로그인과 여러 사용자 간 데이터 공유는 Supabase를 사용합니다.

## 주요 기능

- 상품 카탈로그를 Supabase `products` 테이블에서 불러옵니다. 신선식품, 정육, 수산 상품과 카테고리별 탐색 및 검색을 지원합니다.
- 이메일과 비밀번호로 가입·로그인하고 마이페이지에서 모집 참여, 대기, 확정 예약을 확인할 수 있습니다.
- 상품별 소분 모집에 참여하면 현재 참여 수량을 공유합니다. 모집 정원이 모두 차기 전에는 예약이 확정되지 않고 QR도 발급되지 않습니다.
- 정원이 차면 참여자 예약이 확정되어 장바구니에서 QR을 확인할 수 있습니다.
- 마감된 상품은 대기 신청할 수 있습니다. 기존 참여자가 취소하거나 새 모집이 시작될 때 대기자가 빈 자리에 순서대로 참여합니다.
- 같은 상품의 새 모집을 시작할 수 있습니다.
- 커뮤니티에서 소분 희망 상품을 추천하고, 추천 목록에 좋아요 투표를 할 수 있습니다.
- 모집 현황은 화면이 열려 있을 때 약 7초 간격으로 새로고침합니다.

## 기술 구성

- HTML, CSS, 바닐라 JavaScript: 앱 화면과 동작
- Supabase Auth: 사용자 가입과 로그인
- Supabase Postgres 및 RPC: 상품, 모집, 예약, 대기열, 추천/투표 데이터
- GitHub Pages: 정적 파일 배포

별도의 자체 서버나 빌드 도구는 필요하지 않습니다. 실제 결제·매장 POS 연동은 포함되지 않으며, QR은 프로토타입의 예약 확인용입니다.

## 파일 안내

| 파일 | 용도 |
| --- | --- |
| `index.html` | 앱 화면의 진입점 |
| `style.css` | 모바일 화면과 컴포넌트 스타일 |
| `app.js` | 화면 전환, 인증, Supabase 데이터 동기화 및 예약 흐름 |
| `supabase-config.js` | Supabase 프로젝트 URL 및 브라우저 공개 키 설정 |
| `supabase-setup.sql` | 테이블, 권한 정책, RPC, 샘플 상품 및 모집 생성 |
| `preview.html` | 데스크톱에서 아이폰 프레임으로 확인하는 미리보기 |
| `qrcode.js` | 예약 QR 표시용 라이브러리 |

## Supabase 설정

1. Supabase 프로젝트를 준비합니다.
2. 대시보드의 **SQL Editor**에서 `supabase-setup.sql` 전체를 실행합니다. 상품 및 소분 데이터 구조, 커뮤니티 추천/투표 구조와 권한 정책을 만들고 샘플 상품을 등록합니다. 스크립트는 이미 존재하는 상품과 모집을 고려해 다시 실행할 수 있게 작성되어 있습니다.
3. `supabase-config.js`에서 `url`과 `anonKey`를 해당 프로젝트 값으로 설정합니다. 브라우저 코드에는 `anon` 또는 `publishable` 공개 키만 사용하세요. `service_role` 키는 절대 입력하거나 배포하지 마세요.
4. Supabase **Authentication → URL Configuration**에서 배포 도메인을 허용 URL로 등록합니다. 이메일 확인을 켜면 가입 확인 메일이 필요하고, 끄면 프로젝트 설정에 따라 가입 직후 로그인할 수 있습니다.
5. 앱을 새로고침하고 상품 목록이 표시되는지 확인합니다.

현재 공개 키는 클라이언트 앱에서 사용하도록 설계된 키입니다. 데이터 접근은 `supabase-setup.sql`의 RLS 정책과 RPC 권한으로 제한됩니다. 프로젝트를 교체할 때는 URL과 공개 키를 함께 바꾸고 SQL을 새 프로젝트에서 실행하세요.

## 로컬 실행

프로젝트 폴더에서 간단한 정적 HTTP 서버를 실행합니다.

```bash
python -m http.server 8000
```

그다음 브라우저에서 아래 주소를 엽니다.

- 앱: `http://localhost:8000/`
- 아이폰 프레임 미리보기: `http://localhost:8000/preview.html`

Python이 없다면 VS Code의 Live Server와 같은 정적 파일 서버를 사용해도 됩니다. HTML 파일을 직접 열 수도 있지만, 인증 리디렉션과 브라우저 보안 동작 확인에는 HTTP 주소를 권장합니다.

## GitHub Pages 배포

GitHub 저장소의 **Settings → Pages**에서 배포 소스를 `main` 브랜치의 저장소 루트로 설정합니다. `index.html`, `style.css`, `app.js`, `supabase-config.js`, `qrcode.js`, `manifest.json` 등 필요한 파일을 함께 커밋하고 푸시하면 Pages가 정적 사이트를 배포합니다. `preview.html`은 배포 후 `/preview.html` 경로에서 확인할 수 있습니다.

CSS나 JavaScript 파일을 바꾼 뒤 사용자 브라우저가 이전 파일을 캐시할 수 있으므로, 화면 리소스가 갱신되지 않으면 HTML의 리소스 URL 버전을 올리고 강력 새로고침으로 확인하세요.

## 사용자 데이터 흐름

```text
브라우저
  ├─ Supabase Auth: 가입 / 로그인
  ├─ products: 공개 상품 카탈로그
  ├─ share_rounds / share_orders: 모집 진행 / 사용자 예약
  ├─ share_waitlist: 상품 대기 신청
  └─ product_suggestions / suggestion_votes: 추천 / 투표
```

예약과 대기 데이터는 로그인한 사용자 계정에 연결됩니다. 모집 인원 변경, 정원 마감, 대기자 승격, 취소는 클라이언트에서 직접 임의 갱신하지 않고 SQL에 정의된 RPC로 처리합니다.
