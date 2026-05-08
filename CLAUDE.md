# PWAS — Panel Wall Analysis System

## 프로젝트 개요
PSP/PPP 옹벽(프리스트레스 PC패널 + 소일네일/그라운드앵커 조합 기대기 옹벽)의
**기존 구조물 안전성·안정성 평가** 프로그램.
설계 프로그램이 아닌 **현장 진단·평가 전용** 도구.

**GitHub:** https://github.com/sjidok750-creator/rewall
**로컬:** D:/workclaude/rewall/

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
| PSP | Prestressed Soil-nailed Panel | 소일네일 + PS패널 | KDS 11 80 20 + 11 70 15 |
| PPP | Prestressed Panel w/ Permanent anchor | 영구앵커 + PS패널 | KDS 11 80 20 + 11 70 15 |
| 혼용 | PSP+PPP 구간별 병행 | 상동 | 상동 |

---

## 평가 흐름 (6 Phase)

```
Phase 01 — 기본정보 수집
  공법분류 / 자료보유현황 / KDS버전 / 시공방법 / 제원

Phase 02 — 현장조사  (입력값이지 프로그램이 조사하는 게 아님)
  외관조사 / 비파괴시험 / 코어채취 / Lift-off Test / 지반자료

Phase 03 — 입력값 확정
  단면·배근 / 재료강도 / PS잔존력 / 지반정수 / 앵커·네일제원 / 하중

Phase 04 — 안정성 검토  ← 핵심 계산 모듈
  A. 외적안정     [KDS 11 80 20]
     토압(Coulomb/M-O) → 활동(1.5) / 전도(1.5) / 지지력(2.5) / 자체파괴(2.0)
  B. 보강재→패널  [KDS 11 70 15 + FHWA NHI-14-007]
     잔존인장력 → 펀칭전단 / 패널휨(4점지지)
  C. 단면검토     [KDS 14 20 + 14 30]
     PS잔존력 → 휨강도 / 전단강도 / 정착부
  D. 전체안정     [외부 입력란]
     SLOPE/W 등 결과 수동 입력

Phase 05 — 등급 판정
  항목별FS + 외관등급 → 종합 a~e등급 → 보수보강 의견

Phase 06 — 출력
  화면 요약 + PDF 계산서 (KDS 조항 추적성 포함)
```

---

## 적용 설계기준

| 기준 | 내용 |
|------|------|
| KDS 11 80 20 : 2020 | 기대기옹벽 |
| KDS 11 70 15 : 2020 | 비탈면 보강공법 (네일·앵커) |
| KDS 14 20 : 2022 | 콘크리트구조 설계기준 |
| KDS 14 30 : 2022 | 프리스트레스트 콘크리트 |
| FHWA NHI-14-007 | Soil Nail Wall Reference Manual |
| 시설물 안전 세부지침해설서(옹벽) 2012 | 등급 판정 기준 |

---

## 안전율 기준 요약

| 항목 | 정상 | 지진 시 |
|------|------|--------|
| 활동 | ≥ 1.5 | ≥ 1.1 |
| 전도 | ≥ 1.5 | ≥ 1.1 |
| 지지력 | ≥ 2.5 | ≥ 2.0 |
| 자체파괴 | ≥ 2.0 | — |

---

## 신뢰성 원칙

1. 모든 계산식에 KDS 조항번호 명시
2. 입력 가정 전부 사용자 수정 가능 (블랙박스 금지)
3. 출력에 면책 문구 명시 (PSP/PPP 특허 공법 고유 가정과 다를 수 있음)
4. 전체안정(원호) 은 외부 프로그램 결과 수동 입력 — 프로그램 자체 계산 없음
5. 등급 판정 자동매핑 후 진단기술사 최종 확인 필요 명시

---

## 파일 구조

```
src/
  types.ts                          ModuleId 타입
  components/
    common/
      PwasLogo.tsx                  PWAS 엠블럼 컴포넌트
    layout/
      Header.tsx                    상단 헤더 (엠블럼 + 워드마크)
      Sidebar.tsx                   좌측 네비게이션
    modules/
      OverviewPanel.tsx             Phase 흐름도 (첫탭)
      PlaceholderPanel.tsx          미구현 탭 placeholder
      BasicInfoPanel.tsx            (예정) Phase 01
      SiteSurveyPanel.tsx           (예정) Phase 02
      InputPanel.tsx                (예정) Phase 03
      StabilityPanel.tsx            (예정) Phase 04 ← 핵심
      GradePanel.tsx                (예정) Phase 05
      ReportPanel.tsx               (예정) Phase 06
```

---

## 개발 우선순위

1. ✅ 흐름도 탭 (OverviewPanel) — 완료
2. 🔲 Phase 01 기본정보 입력
3. 🔲 Phase 03 입력값 확정 (단면·재료·PS잔존력)
4. 🔲 Phase 04-A 외적안정 계산 엔진 (핵심)
5. 🔲 Phase 04-B 보강재→패널 검토
6. 🔲 Phase 04-C 단면 검토
7. 🔲 Phase 05 등급 판정
8. 🔲 Phase 06 PDF 출력
