# Office Noise

React + TypeScript + Vite 정적 사무실 소리 웹앱입니다. 흰 바탕의 흑백 사무실 선화와 실제 녹음 24개를 사용합니다. 백엔드와 합성 음원은 없습니다.

## 실행

Node.js 22.12 이상이 필요합니다.

```bash
npm ci
npm run dev
```

표시되는 로컬 주소를 브라우저에서 엽니다. 파일을 더블클릭하는 `file://` 방식은 지원하지 않습니다.

```bash
npm test
npm run build
npm run preview
```

## 사용

- 흰 화면 중앙에 캐릭터와 책상만 표시합니다. 아래 버튼 또는 Space로 재생/일시정지하고 전체 볼륨을 조절합니다.
- 왼쪽 사람 아이콘: 여자(단발·긴머리), 남자(3가닥·짧은머리·상고머리)를 선택합니다. 선택은 브라우저에 저장됩니다.
- 오른쪽 **사무실 인원** 슬라이더: 1~8명(기본 4명). 1명당 최대 동시 재생 1개로 표시하고 실제 엔진에 적용합니다. 인원이 많으면 일상 작업음 간격이 짧아지며, 줄이면 초과 소리를 짧게 페이드아웃합니다. 인원 설정은 자동/직접 선택 모두 적용되고 브라우저에 저장됩니다.
- 오른쪽 조절 아이콘: **자동**은 기본 자연스러운 믹스를 적용하고, **직접 선택**은 소리 종류별 ON/OFF만 제공합니다. 음원 추가, 개별 볼륨, 파일 미리듣기는 없습니다.
- 패널은 X 또는 Escape로 닫습니다. 데스크톱에서는 둘 다 열 수 있고 모바일에서는 하나씩 엽니다. 패널을 닫아도 재생은 유지됩니다.
- 캐릭터는 전체 소리 재생 중이고 애니메이션이 ON일 때 타이핑·마우스·한숨 동작을 자동으로 이어갑니다. 재생 전과 일시정지 중에는 ON/OFF와 관계없이 기본 자세로 멈춥니다.
- 왼쪽 **애니메이션 ON/OFF**: 재생 중 ON이면 움직이고 OFF면 멈춥니다. 이 스위치는 소리를 끄지 않으며 선택은 브라우저에 저장됩니다.
- 전체 출력은 기존 버전 대비 1.6배(+4.1dB)로 올렸고 파일·카테고리별 상대적인 보정과 최종 compressor를 유지합니다.
- 캐릭터 이벤트의 스프라이트 동작은 기본으로 켜져 있습니다. 제거된 움직임 설정이나 사이트별 저장값 때문에 동작이 달라지지 않습니다. 패널 전환 효과는 시스템의 모션 줄이기를 따릅니다.
- 모바일 화면 잠금·절전 정책으로 중단되면 다시 재생을 눌러주세요.

## 음원과 설정

- `public/assets/sounds/`: 2026-10-02 다운로드 폴더에서 복사한 원본 파일 24개를 카테고리 폴더로 나누고 이름을 통일했습니다. 재인코딩하지 않았습니다.
- `src/data/sounds.ts`: 카테고리, 파일별 gain/트리밍, 빈도, 패닝, 기본값, 밀도 설정.
- `src/audio/OfficeEngine.ts`: Web Audio API 엔진.
- `src/data/characters.ts`: 다섯 캐릭터의 스프라이트 설정.
- `audio-analysis.json`: 파일별 길이, 채널, 피크, 활성 구간 RMS와 무음 경계 분석.
- `asset-sources.json`: 파일의 macOS 다운로드 메타데이터에서 확보한 실제 출처 URL.
- `SOUND_FILES.md` / `sound-file-map.json`: 통일한 이름 ↔ 원래 이름 대응표와 SHA256.
- `AUDIO_NOTES.md`: 재생 빈도와 음량 조정 기준.

새 음원을 `public/assets/sounds/`에 넣고 `sounds.ts`의 해당 `soundFiles`에 추가하면 소리 선택 목록과 랜덤 재생에 자동 반영됩니다. 새 카테고리도 같은 배열에 추가하면 됩니다. 진짜 팬/HVAC/문/서랍/재채기 파일은 이번 다운로드에 없어 만들지 않았습니다. 물 음원은 컵 내려놓기가 아닌 실제 물 마시는 소리로 분류했습니다.

음원 출처는 Mixkit 및 Pixabay입니다. 다운로드 메타데이터에는 개별 이용 허가 문서가 포함되어 있지 않아 재배포 허가 여부를 확정하지 않았습니다. 저장소를 공개할 때 원본 효과음의 개별 배포 조건을 확인하세요. 프로젝트 코드에 음원 소유권을 주장하는 일괄 라이선스는 붙이지 않았습니다.

## GitHub Pages 배포

1. 이 폴더의 내용을 GitHub 저장소 루트에 올립니다. `node_modules`와 `dist`는 제외합니다.
2. 저장소의 **Settings → Pages → Source**를 **GitHub Actions**로 설정합니다.
3. `main`에 push하거나 `Deploy to GitHub Pages` 워크플로를 수동 실행합니다.

워크플로가 저장소 이름에서 `/저장소명/` base path를 자동 계산합니다. `사용자명.github.io` 저장소는 `/`를 사용합니다. 커스텀 도메인은 Repository Variables에 `VITE_BASE_PATH=/`를 지정합니다. 로컬 기본값은 `./`입니다. 음원·이미지 경로 역시 `import.meta.env.BASE_URL`을 사용합니다.

[Vite 공식 GitHub Pages 배포 안내](https://vite.dev/guide/static-deploy.html#github-pages)를 기준으로 구성했습니다. 공개 저장소는 https://github.com/ilsong963/office-noise 이며 https://ilsong963.github.io/office-noise/ 에 배포되어 있습니다. main에 push하면 테스트와 빌드 후 자동 배포합니다.

## 검증

- 빌드 및 TypeScript 검사.
- 자동 테스트: 다운로드 도중 Pause, ON/OFF 전환 경쟁 상태, 재시작, 네트워크 재시도, 10분 가상 재생 밀도·겹침 시간 비율, 연속 음원 중복 방지, 강한 효과음 휴지기, 실제 파일 구성, 잘못된 저장값 복구, 재생 전 정지, 애니메이션 ON/OFF와 음원 독립성, 동작 중 일시정지·재개, 다운로드 중 OFF·일시정지·해제 경쟁 상태, 손 전환과 음원 시작 순서, 타이핑 중 마우스에서 손 떼기, 모션 중단 시 기본 자세 복귀, 초기 화면의 정지 상태와 애니메이션 설정 복구.
- 브라우저에서 실제 파일 24개 모두 로딩·재생 시작 확인, 랜덤 재생, 믹서 조작 및 모바일 화면 확인.

## 이미지

내장 ImageGen 도구로 제작했습니다. 원본 장면은 `public/assets/office-scene.jpg`, 3가닥 스프라이트는 `public/assets/office-poses-sheet.png`입니다. 머리 모양별 시트는 같은 폴더의 `office-female-bob.png`, `office-female-long.png`, `office-male-short.png`, `office-male-taper.png`입니다. 각각 4열 × 2행의 자세 프레임을 사용하며 이미지를 늘리거나 휘지 않습니다.

생성 프롬프트는 `IMAGE_PROMPT.txt`, `SPRITE_PROMPT.txt`, `CHARACTER_PROMPTS.txt`에 보관했습니다.
