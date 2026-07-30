import './style.css';
import { events, validateTimeline } from './logic.js';

const app = document.querySelector('#app');

const appState = {
  step: 'timeline',
  timelineValues: Array(12).fill(''),
  graphValues: Array(events.length).fill(0),
  graphPoints: [],
  selectedEventIndex: 0,
  eventOrder: events.map((event) => event.id),
  animatingSlotIndex: null,
};

function getDuplicateValues(values) {
  const filledValues = values.filter((value) => value !== '' && value !== null && value !== undefined);
  return filledValues.filter((value, index) => filledValues.indexOf(value) !== index);
}

function updateTimelineFeedback() {
  const feedback = document.querySelector('#timeline-feedback');
  if (!feedback) {
    return;
  }

  const duplicates = getDuplicateValues(appState.timelineValues);
  if (duplicates.length > 0) {
    feedback.textContent = '사건 중복 금지';
    feedback.classList.add('warning');
    feedback.classList.remove('success');
    return;
  }

  feedback.textContent = '';
  feedback.classList.remove('warning');
  feedback.classList.remove('success');
}

function setSlotValue(slotIndex, value) {
  const normalizedValue = value === '' || value === null || value === undefined ? '' : String(value);

  if (normalizedValue === '') {
    appState.timelineValues[slotIndex] = '';
    updateTimelineFeedback();
    return true;
  }

  const duplicateIndex = appState.timelineValues.findIndex((item, index) => index !== slotIndex && String(item) === normalizedValue);
  if (duplicateIndex !== -1) {
    updateTimelineFeedback();
    return false;
  }

  appState.timelineValues[slotIndex] = normalizedValue;
  updateTimelineFeedback();
  return true;
}

function render() {
  app.innerHTML = `
    <main class="app-shell">
      <header class="hero-block">
        <p class="eyebrow">소설 <span>꺼삐딴 리</span></p>
        <h1>이인국의 심리 그래프</h1>
        <p class="intro">
          12개의 사건을 시간 순서대로 배치한 뒤, 이인국의 심리를 0을 기준으로 위/아래로 나누어 그래프로 표현해보세요.
        </p>
      </header>

      <section class="panel">
        <div class="step-nav">
          <button class="step-pill ${appState.step === 'timeline' ? 'active' : ''}" type="button">1. 사건 순서 맞추기</button>
          <button class="step-pill ${appState.step === 'graph' ? 'active' : ''}" type="button">2. 심리 그래프 만들기</button>
        </div>

        ${appState.step === 'timeline' ? createTimelineView() : createGraphView()}
      </section>
    </main>
  `;

  if (appState.step === 'timeline') {
    attachTimelineEvents();
  } else {
    attachGraphEvents();
  }
}

function createTimelineView() {
  return `
    <div class="timeline-section">
      <h2>1단계 · 사건 배열하기</h2>
      <p class="subtext">먼저 12개의 사건을 읽어보고, 카드를 드래그해서 아래 12개의 네모칸에 놓아보세요.</p>

      <div class="event-list" id="event-drop-zone">
        <h3>제시된 사건</h3>
        <div class="event-cards">
          ${events.map((event, index) => {
            const isSelected = appState.selectedEventIndex === index;
            return `
              <button
                class="event-card ${isSelected ? 'selected' : ''}"
                type="button"
                draggable="true"
                data-event-index="${index}"
                data-event-id="${event.id}"
              >
                <span class="event-card-number">${event.id}</span>
                <span class="event-card-text">${event.text}</span>
                ${isSelected ? '<span class="event-card-badge">선택됨</span>' : ''}
              </button>`;
          }).join('')}
        </div>
      </div>

      <div class="timeline-axis" aria-hidden="true">
        <span>과거</span>
        <div class="timeline-line"></div>
        <span>현재</span>
      </div>

      <div class="timeline-grid" aria-label="사건 배치 칸">
        ${Array.from({ length: 12 }, (_, index) => {
          const assignedValue = appState.timelineValues[index];
          const assignedEvent = events.find((event) => event.id === Number(assignedValue));
          return `
            <div class="timeline-slot ${assignedValue ? 'filled' : ''} ${appState.animatingSlotIndex === index ? 'drop-animating' : ''}" data-slot-index="${index}">
              <div class="slot-chip">${assignedValue ? `사건 ${assignedValue}` : '빈 칸'}</div>
              ${assignedEvent ? `<div class="slot-event-text">${assignedEvent.text}</div>` : ''}
              ${assignedValue ? '<span class="slot-check" aria-hidden="true">✓</span>' : ''}
              <input
                type="number"
                min="1"
                max="12"
                inputmode="numeric"
                value="${assignedValue}"
                data-index="${index}"
                aria-label="${index + 1}번째 사건 칸"
              />
            </div>`;
        }).join('')}
      </div>

      <div class="actions">
        <button id="timeline-submit" type="button">완료</button>
      </div>
      <p id="timeline-feedback" class="feedback" aria-live="polite"></p>
    </div>
  `;
}

function createGraphView() {
  const graphHeight = 280;
  const graphWidth = 760;
  const stepX = graphWidth / (events.length - 1);
  const maxValue = 4;
  const minValue = -4;
  const points = appState.graphPoints.length ? appState.graphPoints : buildGraphPoints();

  return `
    <div class="graph-section">
      <h2>2단계 · 이인국의 심리 그래프</h2>
      <p class="subtext">각 사건에 대해 이인국의 심리가 긍정인지 부정인지 0을 기준으로 선택해 주세요. 마우스나 터치로 그래프 위를 클릭하면 점이 찍힙니다.</p>

      <div class="graph-legend">
        <span>부정</span>
        <span>0</span>
        <span>긍정</span>
      </div>

      <svg class="graph-svg" viewBox="0 0 ${graphWidth} ${graphHeight}" role="img" aria-label="이인국 심리 그래프">
        <line x1="0" y1="${graphHeight / 2}" x2="${graphWidth}" y2="${graphHeight / 2}" class="axis" />
        <line x1="0" y1="0" x2="0" y2="${graphHeight}" class="axis" />
        ${Array.from({ length: 9 }, (_, index) => {
          const y = (graphHeight / 8) * index;
          return `<line x1="0" y1="${y}" x2="${graphWidth}" y2="${y}" class="grid" />`;
        }).join('')}
        ${events.map((event, index) => {
          const x = index * stepX;
          const value = appState.graphValues[index];
          const y = ((value - minValue) / (maxValue - minValue)) * graphHeight;
          const adjustedY = graphHeight - y;
          return `<circle data-index="${index}" cx="${x}" cy="${adjustedY}" r="7" class="graph-point ${value === 0 ? 'neutral' : ''}" />`;
        }).join('')}
        <polyline points="${points.map(([x, y]) => `${x},${y}`).join(' ')}" class="graph-line" />
      </svg>

      <div class="graph-controls">
        <label class="control-card">
          <span>사건 선택</span>
          <select id="event-select">
            ${events.map((event, index) => `<option value="${index}" ${index === 0 ? 'selected' : ''}>${event.id}. ${event.text}</option>`).join('')}
          </select>
        </label>
        <div class="control-card">
          <span>심리 값</span>
          <div class="value-buttons">
            <button class="value-btn" data-value="-4" type="button">-4</button>
            <button class="value-btn" data-value="-2" type="button">-2</button>
            <button class="value-btn" data-value="0" type="button">0</button>
            <button class="value-btn" data-value="2" type="button">2</button>
            <button class="value-btn" data-value="4" type="button">4</button>
          </div>
        </div>
      </div>

      <div class="actions">
        <button id="graph-submit" type="button">완료</button>
      </div>
      <p id="graph-feedback" class="feedback" aria-live="polite"></p>
    </div>
  `;
}

function attachTimelineEvents() {
  const inputs = document.querySelectorAll('input[data-index]');
  inputs.forEach((input) => {
    input.addEventListener('input', (event) => {
      const index = Number(event.target.dataset.index);
      const previousValue = appState.timelineValues[index];
      const isSuccess = setSlotValue(index, event.target.value);
      if (!isSuccess) {
        event.target.value = previousValue || '';
      }
      updateTimelineFeedback();
    });
  });

  document.querySelectorAll('.event-card').forEach((card) => {
    card.addEventListener('click', () => {
      appState.selectedEventIndex = Number(card.dataset.eventIndex);
      render();
    });

    card.addEventListener('dragstart', (event) => {
      event.dataTransfer.setData('text/plain', JSON.stringify({
        type: 'event',
        eventId: Number(card.dataset.eventId),
        eventIndex: Number(card.dataset.eventIndex),
      }));
      event.dataTransfer.effectAllowed = 'copy';
    });
  });

  const eventDropZone = document.querySelector('#event-drop-zone');
  if (eventDropZone) {
    eventDropZone.addEventListener('dragenter', (event) => {
      event.preventDefault();
      eventDropZone.classList.add('drop-zone-active');
    });

    eventDropZone.addEventListener('dragover', (event) => {
      event.preventDefault();
      eventDropZone.classList.add('drop-zone-active');
    });

    eventDropZone.addEventListener('dragleave', () => {
      eventDropZone.classList.remove('drop-zone-active');
    });

    eventDropZone.addEventListener('drop', (event) => {
      event.preventDefault();
      eventDropZone.classList.remove('drop-zone-active');

      const payload = JSON.parse(event.dataTransfer.getData('text/plain') || '{}');
      if (payload.type === 'slot') {
        setSlotValue(payload.slotIndex, '');
        appState.animatingSlotIndex = payload.slotIndex;
        render();
      }
    });
  }

  document.querySelectorAll('.timeline-slot').forEach((slot) => {
    slot.addEventListener('dragstart', (event) => {
      if (!appState.timelineValues[Number(slot.dataset.slotIndex)]) {
        return;
      }

      event.dataTransfer.setData('text/plain', JSON.stringify({
        type: 'slot',
        slotIndex: Number(slot.dataset.slotIndex),
      }));
      event.dataTransfer.effectAllowed = 'move';
    });

    slot.addEventListener('dragenter', (event) => {
      event.preventDefault();
      slot.classList.add('drag-over');
    });

    slot.addEventListener('dragover', (event) => {
      event.preventDefault();
      slot.classList.add('drag-over');
    });

    slot.addEventListener('dragleave', () => {
      slot.classList.remove('drag-over');
    });

    slot.addEventListener('drop', (event) => {
      event.preventDefault();
      slot.classList.remove('drag-over');

      const payload = JSON.parse(event.dataTransfer.getData('text/plain') || '{}');
      const slotIndex = Number(slot.dataset.slotIndex);
      if (payload.type === 'event') {
        if (!payload.eventId) {
          return;
        }

        const isSuccess = setSlotValue(slotIndex, payload.eventId);
        if (!isSuccess) {
          updateTimelineFeedback();
          return;
        }

        appState.selectedEventIndex = payload.eventIndex;
        appState.animatingSlotIndex = slotIndex;
        render();
        return;
      }

      if (payload.type === 'slot' && payload.slotIndex !== slotIndex) {
        const sourceValue = appState.timelineValues[payload.slotIndex];
        const targetValue = appState.timelineValues[slotIndex];
        if (sourceValue === '') {
          return;
        }

        appState.timelineValues[payload.slotIndex] = targetValue;
        appState.timelineValues[slotIndex] = sourceValue;
        appState.animatingSlotIndex = slotIndex;
        updateTimelineFeedback();
        render();
      }
    });

    slot.addEventListener('click', () => {
      if (appState.selectedEventIndex === null || appState.selectedEventIndex === undefined) {
        return;
      }

      const selectedEvent = events[appState.selectedEventIndex];
      if (!selectedEvent) {
        return;
      }

      const slotIndex = Number(slot.dataset.slotIndex);
      const isSuccess = setSlotValue(slotIndex, selectedEvent.id);
      if (!isSuccess) {
        return;
      }
      appState.animatingSlotIndex = slotIndex;
      render();
    });

    slot.addEventListener('dblclick', (event) => {
      event.preventDefault();
      const slotIndex = Number(slot.dataset.slotIndex);
      setSlotValue(slotIndex, '');
      appState.animatingSlotIndex = slotIndex;
      render();
    });
  });

  document.querySelector('#timeline-submit').addEventListener('click', () => {
    const feedback = document.querySelector('#timeline-feedback');
    const duplicates = getDuplicateValues(appState.timelineValues);
    if (duplicates.length > 0) {
      feedback.textContent = '사건 중복 금지';
      feedback.classList.add('warning');
      feedback.classList.remove('success');
      return;
    }

    const result = validateTimeline(appState.timelineValues);
    feedback.textContent = result.message;
    feedback.classList.toggle('warning', !result.isCorrect);
    feedback.classList.toggle('success', result.isCorrect);
    if (result.isCorrect) {
      appState.step = 'graph';
      render();
    }
  });
}

function attachGraphEvents() {
  const select = document.querySelector('#event-select');
  const feedback = document.querySelector('#graph-feedback');
  const svg = document.querySelector('.graph-svg');

  let currentEventIndex = Number(select.value);

  select.addEventListener('change', (event) => {
    currentEventIndex = Number(event.target.value);
  });

  document.querySelectorAll('.value-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const value = Number(button.dataset.value);
      appState.graphValues[currentEventIndex] = value;
      appState.graphPoints = buildGraphPoints();
      render();
    });
  });

  svg.addEventListener('click', (event) => {
    const rect = svg.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const index = Math.round((x / rect.width) * (events.length - 1));
    const clampedIndex = Math.max(0, Math.min(events.length - 1, index));
    const graphHeight = 280;
    const maxValue = 4;
    const minValue = -4;
    const value = Math.max(minValue, Math.min(maxValue, Math.round(((graphHeight / 2 - y) / (graphHeight / 2)) * 4)));

    appState.graphValues[clampedIndex] = value;
    appState.graphPoints = buildGraphPoints();
    render();
  });

  document.querySelector('#graph-submit').addEventListener('click', () => {
    const positiveCount = appState.graphValues.filter((value) => value > 0).length;
    const negativeCount = appState.graphValues.filter((value) => value < 0).length;

    if (positiveCount > negativeCount) {
      feedback.textContent = '이인국의 심리가 대체로 긍정적으로 전개된 흐름으로 보입니다. 삶의 전환을 긍정적으로 받아들이는 모습이 드러납니다.';
    } else if (negativeCount > positiveCount) {
      feedback.textContent = '이인국의 심리가 대체로 부정적으로 흐른 것으로 보입니다. 상실과 불안이 반복된 장면들이 많았네요.';
    } else {
      feedback.textContent = '이인국의 심리가 균형 잡힌 흐름으로 보입니다. 사건마다 감정의 방향이 나뉘어졌네요.';
    }
  });
}

function buildGraphPoints() {
  const graphHeight = 280;
  const graphWidth = 760;
  const stepX = graphWidth / (events.length - 1);
  const maxValue = 4;
  const minValue = -4;

  return appState.graphValues.map((value, index) => {
    const x = index * stepX;
    const y = ((value - minValue) / (maxValue - minValue)) * graphHeight;
    return [x, graphHeight - y];
  });
}

appState.graphPoints = buildGraphPoints();
render();
