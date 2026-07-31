export const events = [
  { id: 1, text: '이인국이 "국어 상용의 가"가 적힌 종이를 찢음.' },
  { id: 2, text: '치안대에 연행됨.' },
  { id: 3, text: '아들을 소련으로 유학 보냄.' },
  { id: 4, text: '감방에서 소련 병사에게 회중시계를 뺏김.' },
  { id: 5, text: '춘석의 입원을 거절함.' },
  { id: 6, text: '스텐코프의 혹 수술에 성공함.' },
  { id: 7, text: '해방 경축 시가행진에서 춘석이와 만남.' },
  { id: 8, text: '브라운에게 청자 화병을 선물함.' },
  { id: 9, text: '아내가 사망하고 아들과 연락이 두절됨.' },
  { id: 10, text: '미국 대사관을 나와 미래를 꿈꾸며 즐거워함.' },
  { id: 11, text: '감방에 전염병이 발생함.' },
  { id: 12, text: '우리나라가 광복함.' },
];

export const correctTimeline = [5, 12, 7, 1, 2, 4, 11, 6, 3, 9, 8, 10];

export function validateTimeline(values) {
  const normalized = values.map((value) => Number(value));

  if (normalized.some((value) => !Number.isInteger(value) || value < 1 || value > 12)) {
    return {
      isCorrect: false,
      message: '1부터 12까지의 숫자를 모두 입력해주세요.',
    };
  }

  if (new Set(normalized).size !== normalized.length) {
    return {
      isCorrect: false,
      message: '숫자는 중복 없이 입력해주세요.',
    };
  }

  if (normalized.every((value, index) => value === correctTimeline[index])) {
    return {
      isCorrect: true,
      message: '정답입니다! 이제 이인국의 심리 그래프를 만들어볼까요?',
    };
  }

  return {
    isCorrect: false,
    message:
      '천천히 다시 시도해보세요. 앞쪽에는 해방과 새로움의 사건들이, 뒤쪽에는 상실과 전환의 사건들이 많이 들어갑니다.',
  };
}

export const worksheetSections = [
  {
    stage: '발단',
    rows: [
      {
        time: '광복 직후 (과거)',
        space: '북쪽',
        lines: [
          '일제 강점기가 끝나고 광복을 맞이함.',
          '이인국은 ({{0}})을/를 타도하자는 사회 분위기 때문에 초조해하면서도 별일 없을 것이라 생각함.',
        ],
      },
    ],
  },
  {
    stage: '전개 1',
    rows: [
      {
        time: '일제 강점기 (과거)',
        space: '북쪽',
        lines: ['이인국은 황국 신민이 되기 위한 자신의 노력에 걸림돌이 될까 봐 사상범 ({{1}})의 입원을 거절함.'],
      },
      {
        time: '광복 직후 (과거)',
        space: '북쪽',
        lines: [
          '이인국은 해방 경축 시가행진을 구경하다 자신을 노려보는 춘석을 만남.',
          '광복 후 소련군이 들어오자 이인국은 자신의 친일 행적 때문에 문제가 될까 봐 초조해함.',
          "이인국이 '({{2}})'가 적힌 종이를 찢음.",
        ],
      },
    ],
  },
  {
    stage: '전개 2',
    rows: [
      {
        time: '6·25 전쟁 이후 (현재)',
        space: '남쪽',
        lines: ['자동차를 타고 미국 대사관으로 향하던 이인국은 신문 기사를 보고 유학 간 뒤 생사를 알 수 없게 된 아들을 떠올림.'],
      },
      {
        time: '소련군 주둔 시기 (과거)',
        space: '북쪽',
        lines: ['이인국은 아내의 반대를 무릅쓰고 아들을 ({{3}})(으)로 유학 보냄.'],
      },
      {
        time: '소련군 진주 직후 (과거)',
        space: '북쪽',
        lines: [
          '이인국이 치안대에 잡혀가 춘석에게 문초를 당하고 소련 병사에게 자신의 분신과 같은 ({{4}})을/를 빼앗김.',
          '감방에 갇혀 ({{5}})을/를 공부하며 살아날 기회를 엿봄.',
        ],
      },
    ],
  },
  {
    stage: '위기',
    rows: [
      {
        time: '소련군 진주 직후 (과거)',
        space: '북쪽',
        lines: ['감방에 전염병이 돌자 소련군은 이인국을 당분간 응급 치료실에서 일하게 함.'],
      },
    ],
  },
  {
    stage: '절정',
    rows: [
      {
        time: '소련군 진주 직후 (과거)',
        space: '북쪽',
        lines: [
          '이인국은 적극적으로 환자를 치료하며 풀려날 기회를 엿봄.',
          '소련군 장교인 ({{6}})의 ({{7}})을/를 제거하는 수술을 성공적으로 끝낸 이인국은 자유를 되찾음.',
        ],
      },
    ],
  },
  {
    stage: '결말',
    rows: [
      {
        time: '6·25 전쟁 이후 (현재)',
        space: '남쪽',
        lines: [
          '미국 대사관에 도착한 이인국은 평소에 신세를 지던 미국인 브라운에게 ({{8}})을/를 선물로 주며 그와 친분을 쌓고, 브라운의 도움으로 미국행을 준비함.',
        ],
      },
    ],
  },
];

export const worksheetStructureLine = '소설 <꺼삐딴 리>의 구성 방식 ⇨ 현재와 과거를 오가며 이야기가 전개되는 ({{9}}) 구성';

export const worksheetAnswers = [
  ['친일파', '민족 반역자'],
  ['춘석'],
  ['국어 상용의 가'],
  ['소련', '모스크바'],
  ['시계', '회중시계'],
  ['노어'],
  ['스텐코프'],
  ['혹'],
  ['고려청자 화병', '고려청자', '청자 화병'],
  ['역순행적'],
];

function normalizeWorksheetAnswer(value) {
  return (value || '').trim().replace(/\s+/g, '');
}

export function checkWorksheetAnswers(values) {
  return worksheetAnswers.map((accepted, index) => {
    const normalized = normalizeWorksheetAnswer(values[index]);
    if (!normalized) {
      return false;
    }
    return accepted.some((answer) => normalizeWorksheetAnswer(answer) === normalized);
  });
}
