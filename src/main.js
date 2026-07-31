import './style.css';
import {
  events,
  validateTimeline,
  worksheetSections,
  worksheetStructureLine,
  worksheetAnswers,
  checkWorksheetAnswers,
} from './logic.js';

const app = document.querySelector('#app');

const appState = {
  step: 'worksheet',
  worksheetValues: Array(worksheetAnswers.length).fill(''),
  worksheetStatus: Array(worksheetAnswers.length).fill(null),
  timelineValues: Array(12).fill(''),
  graphValues: Array(events.length).fill(null),
  graphCompleted: false,
  showEventPeek: false,
  selectedEventIndex: 0,
  eventOrder: events.map((event) => event.id),
  animatingSlotIndex: null,
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

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
  const stepView = {
    worksheet: createWorksheetView,
    timeline: createTimelineView,
    graph: createGraphView,
  }[appState.step]();

  app.innerHTML = `
    <main class="app-shell">
      <header class="hero-block">
        <p class="eyebrow">소설 <span>꺼삐딴 리</span></p>
        <h1>이인국의 심리 그래프</h1>
        <p class="intro">
          소설의 배경과 구성을 정리하고, 12개의 사건을 시간 순서대로 배치한 뒤, 이인국의 심리를 0을 기준으로 위/아래로 나누어 그래프로 표현해보세요.
        </p>
      </header>

      <section class="panel">
        <div class="step-nav">
          <button class="step-pill ${appState.step === 'worksheet' ? 'active' : ''}" type="button">1. 소설의 배경과 구성 방식</button>
          <button class="step-pill ${appState.step === 'timeline' ? 'active' : ''}" type="button">2. 사건이 발생한 순서대로 배열하기</button>
          <button class="step-pill ${appState.step === 'graph' ? 'active' : ''}" type="button">3. 심리 그래프 만들기</button>
        </div>

        ${stepView}
      </section>
    </main>
  `;

  if (appState.step === 'worksheet') {
    attachWorksheetEvents();
  } else if (appState.step === 'timeline') {
    attachTimelineEvents();
  } else {
    attachGraphEvents();
  }
}

function renderBlankLine(line) {
  return line.replace(/\{\{(\d+)\}\}/g, (_, indexStr) => {
    const index = Number(indexStr);
    const value = appState.worksheetValues[index] || '';
    const status = appState.worksheetStatus[index];
    const statusClass = status ? ` ${status}` : '';
    return `<input type="text" class="blank-input${statusClass}" data-blank-index="${index}" value="${escapeHtml(value)}" aria-label="빈칸 ${index + 1}" autocomplete="off" />`;
  });
}

function getWorksheetStatusText() {
  const filledCount = appState.worksheetValues.filter((value) => value.trim() !== '').length;
  const correctCount = appState.worksheetStatus.filter((status) => status === 'correct').length;
  const hasBeenChecked = appState.worksheetStatus.some((status) => status !== null);

  return hasBeenChecked
    ? `${worksheetAnswers.length}문항 중 ${correctCount}개 정답입니다.`
    : `${worksheetAnswers.length}문항 중 ${filledCount}개 작성함`;
}

function createWorksheetView() {
  return `
    <div class="worksheet-section">
      <h2>1단계 · 소설의 배경과 구성 방식</h2>
      <p class="subtext">구성 단계, 시기, 공간을 참고해 소설의 주요 내용 빈칸에 알맞은 단어를 채워보세요.</p>

      <div class="worksheet-table">
        ${worksheetSections.map((section) => `
          <div class="worksheet-stage-group">
            <div class="worksheet-stage-badge">${section.stage}</div>
            <div class="worksheet-rows">
              ${section.rows.map((row) => `
                <div class="worksheet-row">
                  <div class="worksheet-meta">
                    <span class="worksheet-time">${row.time}</span>
                    <span class="worksheet-space">${row.space}</span>
                  </div>
                  <ul class="worksheet-content">
                    ${row.lines.map((line) => `<li>${renderBlankLine(line)}</li>`).join('')}
                  </ul>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>

      <div class="worksheet-structure">${renderBlankLine(worksheetStructureLine)}</div>

      <p class="worksheet-status">${getWorksheetStatusText()}</p>

      <div class="actions">
        <button id="worksheet-submit" type="button">완료</button>
      </div>
      <p id="worksheet-feedback" class="feedback" aria-live="polite"></p>
    </div>
  `;
}

function attachWorksheetEvents() {
  document.querySelectorAll('.blank-input').forEach((input) => {
    input.addEventListener('input', (event) => {
      const index = Number(event.target.dataset.blankIndex);
      appState.worksheetValues[index] = event.target.value;
      appState.worksheetStatus[index] = null;
      event.target.classList.remove('correct', 'incorrect');

      const statusText = document.querySelector('.worksheet-status');
      if (statusText) {
        statusText.textContent = getWorksheetStatusText();
      }
    });
  });

  document.querySelector('#worksheet-submit').addEventListener('click', () => {
    const results = checkWorksheetAnswers(appState.worksheetValues);
    appState.worksheetStatus = results.map((isCorrect) => (isCorrect ? 'correct' : 'incorrect'));
    const allCorrect = results.every(Boolean);

    if (allCorrect) {
      appState.step = 'timeline';
      render();
      return;
    }

    render();

    const feedback = document.querySelector('#worksheet-feedback');
    const correctCount = results.filter(Boolean).length;
    feedback.textContent = `${correctCount} / ${results.length}개 정답이에요. 빨간 테두리로 표시된 빈칸을 다시 확인해보세요.`;
    feedback.classList.add('warning');
    feedback.classList.remove('success');
  });
}

function createTimelineView() {
  return `
    <div class="timeline-section">
      <h2>2단계 · 사건이 발생한 순서대로 배열하기</h2>
      <p class="subtext">먼저 12개의 사건을 읽어보고, 카드를 드래그해서 아래 12개의 네모칸에 놓아보세요.</p>
      <p class="subtext">사건을 마우스로 끌어다 빈칸에 놓으면 사건 번호가 입력되고, 더블클릭하면 뺄 수 있습니다.</p>

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
              ${assignedValue ? '<div class="slot-check-row"><span class="slot-check" aria-hidden="true">✓</span></div>' : ''}
              <div class="slot-chip">${assignedValue ? `사건 ${assignedValue}` : '빈 칸'}</div>
              ${assignedEvent ? `<div class="slot-event-text">${assignedEvent.text}</div>` : ''}
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

function getOrderedEvents() {
  const orderedIds = appState.timelineValues.map((value) => Number(value));
  const orderedEvents = orderedIds.map((id) => events.find((event) => event.id === id)).filter(Boolean);
  return orderedEvents.length === events.length ? orderedEvents : events;
}

function getPlotMetrics() {
  const orderedEvents = getOrderedEvents();
  const margin = { top: 20, right: 24, bottom: 54, left: 44 };
  const plotWidth = 700;
  const plotHeight = 300;
  const stepX = plotWidth / (orderedEvents.length - 1);
  const maxValue = 5;

  return {
    orderedEvents,
    margin,
    plotWidth,
    plotHeight,
    stepX,
    maxValue,
    viewBoxWidth: margin.left + plotWidth + margin.right,
    viewBoxHeight: margin.top + plotHeight + margin.bottom,
    indexToX: (index) => margin.left + index * stepX,
    valueToY: (value) => margin.top + plotHeight / 2 - (value / maxValue) * (plotHeight / 2),
  };
}

function formatGraphValue(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function createGraphView() {
  const metrics = getPlotMetrics();
  const { orderedEvents, margin, plotWidth, plotHeight, viewBoxWidth, viewBoxHeight, maxValue, indexToX, valueToY } = metrics;
  const filledCount = appState.graphValues.filter((value) => value !== null && value !== undefined).length;
  const allFilled = filledCount === orderedEvents.length;
  const points = appState.graphCompleted ? buildGraphPoints(metrics) : [];

  return `
    <div class="graph-section">
      <h2>3단계 · 이인국의 심리 그래프</h2>
      <p class="subtext">좌표평면 위에서 각 사건이 위치한 지점(사건 × 심리 값)을 클릭해 표시해 보세요. 심리 값은 -5(매우 부정)부터 +5(매우 긍정)까지 0.5 단위로 표시할 수 있습니다.</p>
      <p class="subtext">이미 표시한 사건은 다시 클릭하거나 더블클릭하면 값을 수정할 수 있습니다. 12개 사건을 모두 표시한 뒤 완료 버튼을 누르면 점들이 이어진 꺾은선 그래프가 완성됩니다.</p>

      <div class="graph-toolbar">
        <button id="event-peek-toggle" type="button" class="peek-btn">${appState.showEventPeek ? '사건 내용 닫기' : '사건 내용 엿보기'}</button>
      </div>

      ${appState.showEventPeek ? createEventPeekPanel() : ''}

      <svg class="graph-svg" viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}" role="img" aria-label="이인국 심리 좌표 그래프">
        <defs>
          <filter id="line-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        ${Array.from({ length: maxValue * 2 + 1 }, (_, i) => {
          const value = maxValue - i;
          const y = valueToY(value);
          return `
            <line x1="${margin.left}" y1="${y}" x2="${margin.left + plotWidth}" y2="${y}" class="grid ${value === 0 ? 'zero-line' : ''}" />
            <text x="${margin.left - 12}" y="${y}" class="axis-label y-label">${value}</text>
          `;
        }).join('')}

        ${orderedEvents.map((event, index) => {
          const x = indexToX(index);
          return `
            <line x1="${x}" y1="${margin.top}" x2="${x}" y2="${margin.top + plotHeight}" class="grid grid-vertical" />
            <text x="${x}" y="${margin.top + plotHeight + 26}" class="axis-label x-label">사건${event.id}</text>
          `;
        }).join('')}

        <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + plotHeight}" class="axis" />

        ${appState.graphCompleted ? `<polyline points="${points.map(([x, y]) => `${x},${y}`).join(' ')}" class="graph-line drawing" filter="url(#line-glow)" />` : ''}

        ${orderedEvents.map((event, index) => {
          const value = appState.graphValues[index];
          if (value === null || value === undefined) {
            return '';
          }
          const x = indexToX(index);
          const y = valueToY(value);
          const delay = appState.graphCompleted ? `${1.3 + index * 0.06}s` : '0s';
          const labelY = value >= maxValue - 0.5 ? y + 18 : y - 12;
          const labelAnchor = index === 0 ? 'start' : index === orderedEvents.length - 1 ? 'end' : 'middle';
          const labelX = index === 0 ? x + 8 : index === orderedEvents.length - 1 ? x - 8 : x;
          return `
            <circle data-index="${index}" cx="${x}" cy="${y}" r="7" class="graph-point ${value === 0 ? 'neutral' : ''} ${appState.graphCompleted ? 'completed' : ''}" style="animation-delay:${delay}" />
            <text x="${labelX}" y="${labelY}" class="axis-label point-value-label" style="text-anchor:${labelAnchor}">${formatGraphValue(value)}</text>
          `;
        }).join('')}
      </svg>

      ${appState.graphCompleted ? `
        <div class="graph-export">
          <button id="copy-graph-btn" type="button" class="export-btn">공유하기</button>
          <p id="graph-copy-feedback" class="feedback" aria-live="polite"></p>
        </div>
      ` : ''}

      <p class="graph-status">${allFilled ? '모든 사건에 값을 표시했어요. 완료를 눌러 그래프를 완성해보세요!' : `사건 ${filledCount} / ${orderedEvents.length}개 표시함`}</p>

      <div class="actions">
        <button id="graph-submit" type="button">완료</button>
      </div>
      <p id="graph-feedback" class="feedback" aria-live="polite"></p>
    </div>
  `;
}

const GRAPH_EXPORT_STYLES = `
  .axis { stroke: #1e293b; stroke-width: 2; }
  .grid { stroke: #e5e7eb; stroke-width: 1; }
  .grid.zero-line { stroke: #94a3b8; stroke-width: 1.5; }
  .grid.grid-vertical { stroke: #eef2ff; }
  .axis-label { fill: #64748b; font-size: 11px; font-weight: 600; font-family: 'Pretendard', 'Segoe UI', sans-serif; }
  .axis-label.y-label { text-anchor: end; dominant-baseline: middle; }
  .axis-label.x-label { text-anchor: middle; }
  .graph-line { fill: none; stroke: #4f46e5; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
  .graph-point { fill: #4f46e5; stroke: white; stroke-width: 2; }
  .graph-point.neutral { fill: #94a3b8; }
  .point-value-label { fill: #4f46e5; font-size: 11px; font-weight: 700; text-anchor: middle; font-family: 'Pretendard', 'Segoe UI', sans-serif; }
`;

function exportGraphAsPngBlob() {
  return new Promise((resolve, reject) => {
    const original = document.querySelector('.graph-svg');
    if (!original) {
      reject(new Error('그래프를 찾을 수 없습니다.'));
      return;
    }

    const clone = original.cloneNode(true);
    clone.querySelectorAll('.graph-line').forEach((line) => {
      line.classList.remove('drawing');
      line.style.strokeDasharray = 'none';
      line.style.strokeDashoffset = '0';
    });
    clone.querySelectorAll('.graph-point').forEach((point) => {
      point.classList.remove('completed');
    });

    const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    styleEl.textContent = GRAPH_EXPORT_STYLES;
    clone.insertBefore(styleEl, clone.firstChild);

    const [, , vbWidth, vbHeight] = clone.getAttribute('viewBox').split(' ').map(Number);
    const scale = 2;
    const width = vbWidth * scale;
    const height = vbHeight * scale;
    clone.setAttribute('width', String(width));
    clone.setAttribute('height', String(height));

    const svgString = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('이미지 생성에 실패했습니다.'));
        }
      }, 'image/png');
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('그래프를 이미지로 변환하는 데 실패했습니다.'));
    };
    image.src = url;
  });
}

function createEventPeekPanel() {
  return `
    <div class="event-peek-panel">
      <div class="event-peek-grid">
        ${events.map((event) => `
          <div class="event-peek-item">
            <span class="event-peek-number">${event.id}</span>
            <span class="event-peek-text">${event.text}</span>
          </div>
        `).join('')}
      </div>
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
  const svg = document.querySelector('.graph-svg');
  const metrics = getPlotMetrics();
  const { margin, plotWidth, plotHeight, viewBoxWidth, viewBoxHeight, maxValue, orderedEvents, stepX } = metrics;

  svg.addEventListener('click', (event) => {
    const rect = svg.getBoundingClientRect();
    const scaleX = viewBoxWidth / rect.width;
    const scaleY = viewBoxHeight / rect.height;
    const clickX = (event.clientX - rect.left) * scaleX;
    const clickY = (event.clientY - rect.top) * scaleY;

    const relX = clickX - margin.left;
    const relY = clickY - margin.top;
    if (relX < -20 || relX > plotWidth + 20 || relY < -20 || relY > plotHeight + 20) {
      return;
    }

    const index = Math.max(0, Math.min(orderedEvents.length - 1, Math.round(relX / stepX)));
    const rawValue = ((plotHeight / 2 - relY) / (plotHeight / 2)) * maxValue;
    const value = Math.max(-maxValue, Math.min(maxValue, Math.round(rawValue * 2) / 2));

    appState.graphValues[index] = value;
    appState.graphCompleted = false;
    render();
  });

  const peekToggle = document.querySelector('#event-peek-toggle');
  if (peekToggle) {
    peekToggle.addEventListener('click', () => {
      appState.showEventPeek = !appState.showEventPeek;
      render();
    });
  }

  const copyGraphBtn = document.querySelector('#copy-graph-btn');
  if (copyGraphBtn) {
    copyGraphBtn.addEventListener('click', async () => {
      const copyFeedback = document.querySelector('#graph-copy-feedback');

      if (!navigator.clipboard || typeof window.ClipboardItem === 'undefined') {
        copyFeedback.textContent = '이 브라우저는 이미지 클립보드 복사를 지원하지 않아요.';
        copyFeedback.classList.add('warning');
        copyFeedback.classList.remove('success');
        return;
      }

      try {
        const blob = await exportGraphAsPngBlob();
        await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': blob })]);
        copyFeedback.textContent = '그래프가 클립보드에 복사되었어요! 캔바에서 Ctrl+V(붙여넣기)로 넣어보세요.';
        copyFeedback.classList.add('success');
        copyFeedback.classList.remove('warning');
      } catch (error) {
        copyFeedback.textContent = '복사에 실패했어요. 다시 시도해주세요.';
        copyFeedback.classList.add('warning');
        copyFeedback.classList.remove('success');
      }
    });
  }

  document.querySelector('#graph-submit').addEventListener('click', () => {
    const feedback = document.querySelector('#graph-feedback');
    const allFilled = appState.graphValues.every((value) => value !== null && value !== undefined);

    if (!allFilled) {
      feedback.textContent = '아직 표시하지 않은 사건이 있어요. 좌표평면 위에 12개 사건을 모두 클릭해 표시해주세요.';
      feedback.classList.add('warning');
      feedback.classList.remove('success');
      return;
    }

    appState.graphCompleted = true;
    render();

    const resultFeedback = document.querySelector('#graph-feedback');
    resultFeedback.classList.remove('warning');
    resultFeedback.classList.add('success');

    const positiveCount = appState.graphValues.filter((value) => value > 0).length;
    const negativeCount = appState.graphValues.filter((value) => value < 0).length;

    if (positiveCount > negativeCount) {
      resultFeedback.textContent = '이인국의 심리가 대체로 긍정적으로 전개된 흐름으로 보입니다. 삶의 전환을 긍정적으로 받아들이는 모습이 드러납니다.';
    } else if (negativeCount > positiveCount) {
      resultFeedback.textContent = '이인국의 심리가 대체로 부정적으로 흐른 것으로 보입니다. 상실과 불안이 반복된 장면들이 많았네요.';
    } else {
      resultFeedback.textContent = '이인국의 심리가 균형 잡힌 흐름으로 보입니다. 사건마다 감정의 방향이 나뉘어졌네요.';
    }
  });
}

function buildGraphPoints(metrics) {
  return appState.graphValues
    .map((value, index) => (value === null || value === undefined ? null : [metrics.indexToX(index), metrics.valueToY(value)]))
    .filter(Boolean);
}

render();
