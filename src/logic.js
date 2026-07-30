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
