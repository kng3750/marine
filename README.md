# MARINER PATH

해기사의 승선경력을 해운·항만·조선, 협회, 공직, 공공기관, 교육·연구, 검사·검량, 법률·보험·선박금융 진로로 연결하는 정적 웹 플랫폼입니다.

## 제공 기능

- PDF 40~204쪽 기반 7개 분야, 74개 진로 데이터
- 직업 검색 및 분야·근무형태 필터
- 직업 상세와 단계별 성장경로
- 최대 3개 직업 비교
- 면허·경력·관심분야 기반 맞춤 추천
- 관심 진로 저장과 프로필 개인화
- 해양직업 용어사전
- 로컬 관리자: 추가·수정·삭제, JSON 가져오기·내보내기

## 로컬 실행

ES Modules를 사용하므로 파일을 직접 열지 말고 정적 웹 서버로 실행합니다.

```bash
npx serve .
```

## 배포

GitHub 저장소를 Vercel 프로젝트에 연결합니다. 프레임워크 프리셋은 `Other`, 프로젝트 루트는 저장소 루트로 설정하면 별도의 빌드 명령 없이 배포할 수 있습니다.

브랜치와 Pull Request는 Preview Deployment로, `main` 브랜치는 Production으로 배포하는 방식을 권장합니다.

## 관리자 영구 저장 설정

관리자 변경사항은 Vercel Function을 통해 GitHub의 `data/careers.json`에 커밋됩니다. 따라서 새로고침, 다른 기기 및 새 배포 후에도 공식 URL을 포함한 변경사항이 유지됩니다.

Vercel 프로젝트의 Settings > Environment Variables에 다음 값을 Production 범위로 설정하세요.

- `GITHUB_TOKEN`: 해당 저장소 Contents 읽기·쓰기 권한을 가진 fine-grained GitHub token
- `ADMIN_PASSWORD`: 관리자 저장 시 사용할 충분히 긴 비밀번호
- `GITHUB_REPO`: 기본값 `kng3750/marine`
- `GITHUB_BRANCH`: 기본값 `main`

토큰과 비밀번호는 저장소에 커밋하지 마세요. 환경변수를 설정하거나 변경한 후에는 Vercel에서 다시 배포해야 합니다.

관리자가 저장하면 GitHub 커밋과 연결된 Vercel 자동 배포가 발생할 수 있습니다. 쓰기 환경변수가 없으면 관리화면에 설정 필요 상태가 표시되고 저장을 차단합니다.
