# PWAS — Panel Wall Analysis System

## 프로젝트 개요
PSP/PPP 옹벽(프리스트레스 PC패널 + 소일네일/그라운드앵커 조합 기대기 옹벽)의
**기존 구조물 안전성·안정성 평가** 프로그램.
설계 프로그램이 아닌 **현장 진단·평가 전용** 도구.

**GitHub:** https://github.com/sjidok750-creator/rewall
**로컬:** D:/workclaude/rewall/

---

## 시스템 안전성 평가의 2축 구조 (핵심 개념)

PSP/PPP는 절토사면을 네일·앵커로 보강하고 PC패널로 면을 처리하는 **기대기 옹벽**이다.
패널은 자립하지 않으므로, 최종 안전성은 **두 축을 동시에** 만족해야 한다.

```
절토사면 + 네일/앵커 + PS패널 시스템
        │
        ├── ① 사면 안전성 (Geotechnical)
        │       "흙 전체가 무너지지 않는가?"
        │       → 전체안정 FS ≥ 1.5 (평상시), ≥ 1.1 (지진시)  [KDS 11 80 20 §4.4]
        │       → SLOPE/W·TALREN 등 외부 프로그램 결과를 수동 입력
        │
        └── ② 하중 전달 경로 안전성 (Structural)
                "힘이 흙→보강재→패널로 끊김 없이 전달되는가?"
                → 보강재 인발·인장  [KDS 11 70 15 §4.4·§4.5]
                → 두부→패널 펀칭전단·패널휨  [KDS 14 20 §22.7 / FHWA NHI-14-007 §5.4]
                → PC패널 단면 휨·전단·지압  [KDS 14 30 §4.2~4.3 / KDS 14 20 §4.6]
```

**패널의 이중 역할:**
- 면재(Facing): 토압을 받아 네일·앵커로 전달하는 수압판
- 분산판: 네일·앵커 두부력을 사면 전체에 고르게 전달

두 역할을 동시에 수행하므로, 패널은 외압(토압)과 집중하중(두부력) 양쪽을 모두 받는다.
이것이 C섹션(보강재→패널)과 D섹션(패널 단면)을 분리 검토하는 이유다.

**T_res(잔존력)의 연결 역할:**
T_res는 ①과 ② 두 축을 잇는 핵심 변수다.
- ①에서: SLOPE/W에 입력하는 보강재 기여력
- ②에서: 인발·인장·펀칭·휨 모든 구조검토의 작용하중

따라서 Phase 03에서 T_res를 정확히 산정하는 것이 전체 평가의 출발점이다.

---

## 기술 스택
- Frontend: React + TypeScript + Vite
- 계산: 순수 TS (NumPy 불필요)
- PDF: (추후) ReportLab 또는 pdfmake
- 스타일: CSS Variables (인라인 스타일, CSS 모듈 혼용)

---

## 엠블럼 / 브랜드 (Claude Palette)

```
색상
  --ink:   #1A1915   (배경·다크)
  --clay:  #D97757   (액센트 — 3번째 패널 바)
  --cream: #F0EEE5   (전경·밝은 텍스트)

마크: 4단 적층 패널이 P자 형성
  rect x10 y10 w44 h9  → cream (1단)
  rect x10 y21 w44 h9  → cream (2단)
  rect x10 y32 w28 h9  → clay  (3단 — 액센트)
  rect x10 y43 w14 h11 → cream (4단)

폰트
  워드마크:   Space Grotesk
  기술 텍스트: JetBrains Mono
  한글 UI:    Pretendard
```

---

## 앱 색상 시스템 (라이트 모드 고정)

```css
--bg-outer:   #ECEAE3   앱 외부 배경
--bg:         #F5F3EE   앱 메인 배경
--bg-panel:   #FDFCF9   패널·카드 배경
--bg-sidebar: #EFEDE7   사이드바 배경
--border:     #D8D4CC
--border-2:   #C4BFB5
--text-1:     #1A1915   주 텍스트
--text-2:     #4A4740   보조 텍스트
--text-3:     #8B857A   설명·레이블
--accent:     #D97757   강조색
--accent-bg:  #FDF3EE   강조 배경
--ok:         #2A7A4A
--warn:       #B8650A
--fail:       #C0392B
```

---

## UI 원칙 (feedback_design.md 기반)

- **다크모드 없음** — 라이트 모드 고정
- border-radius: 2~4px (공학 앱 느낌, 둥근 모서리 최소화)
- 그라디언트·광택·과도한 그림자 금지
- 최대 너비 1640px, 중앙 정렬
- KS 공학 도면 표준 준수
- 모든 계산식에 KDS 조항번호 명시 (예: KDS 11 80 20 4.3.1 식 (4.3-1))

---

## 평가 대상 공법

| 구분 | 전체 명칭 | 구성 | 적용 기준 |
|------|----------|------|---------|
| PSP | Prestressed Soil-nailed Panel | 소일네일(SD400 이형철근, 패시브) + PS패널 | KDS 11 80 20 + 11 70 15 |
| PPP | Prestressed Panel w/ Permanent anchor | 영구앵커(SWPC7B PC강연선, 액티브) + PS패널 | KDS 11 80 20 + 11 70 15 |
| 혼용 | PSP+PPP 구간별 병행 | 상단 PSP + 하단 PPP (단별 공법 상이) | 상동 |

**재료 분류 원칙 (Phase 01 공법 → 전 Phase 연동):**
- 소일네일: 이형철근(SD400), 패시브 보강재 → 초기긴장력 없음, Lift-off 불가, PS 6항 손실 미적용
- 영구앵커: PC강연선(SWPC7B 1860급), 액티브 보강재 → 초기긴장력 적용, Lift-off 실측 가능, PS 6항 손실 적용
- Phase 01에서 공법이 결정되면 Phase 02~04의 입력 필드·계산식이 자동 분기됨

---

## 평가 흐름 (6 Phase)

```
Phase 01 — 기본정보 수집
  공법분류(PSP/PPP/혼용) / 자료보유현황 / KDS버전 / 시공방법 / 단별 제원

Phase 02 — 현장조사  (입력값이지 프로그램이 조사하는 게 아님)
  외관조사 / 비파괴시험 / 코어채취 / Lift-off(앵커 전용) / 지반자료

Phase 03 — 입력값 확정
  단면·배근 / 재료강도 / PS잔존력(T_res) / 지반정수 / 보강재제원 / 하중
  ※ T_res 산정: 네일=Pd×(1-부식율), 앵커=T0×(1-Σ손실율) 또는 Lift-off 실측

Phase 04 — 안정성 검토  ← 핵심 계산 모듈 (2축 동시 검토)
  A. 전체안정     [KDS 11 80 20 §4.4]
     SLOPE/W 등 외부 프로그램 결과 수동 입력
     기준: 평상시 FS ≥ 1.5, 지진시 FS ≥ 1.1
  B. 자체파괴     [KDS 11 70 15 §4.4·§4.5]
     네일: 인발 FS ≥ 2.0, 인장 FS ≥ 1.67
     앵커: 인발 FS ≥ 2.5, 인장비 ≥ 1.0 [min(0.65fpu,0.80fpy)·A/T_res]
  C. 보강재→패널  [KDS 14 20 §22.7 + FHWA NHI-14-007 §5.4]
     펀칭전단 φVn/Vu ≥ 1.0 / 패널휨 φMn/Mu ≥ 1.0
  D. PC패널 단면  [KDS 14 30 §4.2~4.3 + KDS 14 20 §4.6]
     휨강도 φMn/Mu ≥ 1.0 / 전단강도 φVc/Vu ≥ 1.0 / 지압 fb,allow/fb ≥ 1.0

Phase 05 — 등급 판정
  항목별 FS + 외관등급 → 종합 a~e등급 → 보수보강 의견

Phase 06 — 출력
  화면 요약 + PDF 계산서 (KDS 조항 추적성 포함)
```

---

## 적용 설계기준

| 기준 | 내용 |
|------|------|
| KDS 11 80 20 : 2020 | 기대기옹벽 (전체안정 FS 기준) |
| KDS 11 70 15 : 2020 | 비탈면 보강공법 (네일·앵커 인발·인장) |
| KDS 14 20 : 2022 | 콘크리트구조 설계기준 (펀칭전단·지압) |
| KDS 14 30 : 2022 | 프리스트레스트 콘크리트 (PS강도·PS손실 6항) |
| FHWA NHI-14-007 | Soil Nail Wall Reference Manual (패널휨 하중모델) |
| 시설물 안전 세부지침해설서(옹벽) 2012 | 등급 판정 기준 |

---

## 안전율 기준 요약

| 항목 | 기준 | 평상시 | 지진시 | 적용 기준 |
|------|------|--------|--------|---------|
| A. 전체안정 | FS | ≥ 1.5 | ≥ 1.1 | KDS 11 80 20 §4.4 |
| B-1. 네일 인발 | FS | ≥ 2.0 | ≥ 1.5 | KDS 11 70 15 §4.4.2 |
| B-2. 네일 인장 | FS | ≥ 1.67 | ≥ 1.33 | KDS 11 70 15 §4.4.1 |
| B-3. 앵커 인발 | FS | ≥ 2.5 | ≥ 1.5 | KDS 11 70 15 §4.5.2 |
| B-4. 앵커 인장 | T_allow/T_res | ≥ 1.0 | — | KDS 11 70 15 §4.5.1 |
| C. 보강재→패널 | φR/S | ≥ 1.0 | — | KDS 14 20 §22.7 |
| D. PC패널 단면 | φR/S | ≥ 1.0 | — | KDS 14 30 §4.2~4.3 |

※ 기대기옹벽(PSP/PPP)은 자립 중력식 옹벽이 아니므로 활동·전도·지지력 검토 없음.
   외적안정은 전체안정(원호·쐐기파괴)이 대신함.

---

## 신뢰성 원칙

1. 모든 계산식에 KDS 조항번호 명시
2. 입력 가정 전부 사용자 수정 가능 (블랙박스 금지)
3. 출력에 면책 문구 명시 (PSP/PPP 특허 공법 고유 가정과 다를 수 있음)
4. 전체안정(원호)은 외부 프로그램 결과 수동 입력 — 프로그램 자체 원호 계산 없음
5. 등급 판정 자동매핑 후 진단기술사 최종 확인 필요 명시
6. [확인필요] 표시 항목: KDS 14 30 §4.3 전단강도 간이식 사용 — 원문 대조 후 V_ci/V_cw 정확식으로 교체 예정

---

## 파일 구조

```
src/
  types.ts                          전역 타입 (Phase01~04 Output, ReinfTier, SoilTier 등)
  calc/
    stability.ts                    Phase 04 순수 계산 엔진 (부작용 없음)
  state/
    PwasContext.tsx                 전역 상태 (p01·p02·p03snap·p04Manual)
    usePwas.ts                      컨텍스트 훅
  components/
    common/
      PwasLogo.tsx                  PWAS 엠블럼 컴포넌트
    layout/
      Header.tsx                    상단 헤더 (엠블럼 + 워드마크)
      Sidebar.tsx                   좌측 네비게이션
    modules/
      OverviewPanel.tsx             Phase 흐름도 (첫탭) ✅
      BasicInfoPanel.tsx            Phase 01 기본정보 ✅
      SiteSurveyPanel.tsx           Phase 02 현장조사 ✅
      InputPanel.tsx                Phase 03 입력값 확정 ✅
      StabilityPanel.tsx            Phase 04 안정성 검토 ✅
      PlaceholderPanel.tsx          미구현 탭 placeholder
      GradePanel.tsx                Phase 05 등급 판정 🔲
      ReportPanel.tsx               Phase 06 출력 🔲
```

---

## 개발 현황

1. ✅ Phase 00 — 흐름도 탭 (OverviewPanel)
2. ✅ Phase 01 — 기본정보 입력 (BasicInfoPanel)
3. ✅ Phase 02 — 현장조사 입력 (SiteSurveyPanel, 공법별 필드 분기)
4. ✅ Phase 03 — 입력값 확정 (InputPanel, 7섹션 A~G + 신뢰도 게이지)
5. ✅ Phase 04 — 안정성 검토 (StabilityPanel, stability.ts 계산 엔진)
6. 🔲 Phase 05 — 등급 판정 (GradePanel)
7. 🔲 Phase 06 — PDF 출력 (ReportPanel)
