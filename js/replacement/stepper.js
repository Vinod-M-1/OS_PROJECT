import { simulateFIFO, simulateLRU, simulateOptimal } from './algorithms.js';
import { renderLiveAccuracyChart, renderBeladyComparisonChart } from '../../assets/js/live-graph.js';

document.addEventListener('DOMContentLoaded', () => {
  const refStringInput = document.getElementById('ref-string');
  const frameCountInput = document.getElementById('frame-count');
  const algoSelect = document.getElementById('algo-select');
  const speedSelect = document.getElementById('speed-select');

  const simulateBtn = document.getElementById('simulate-btn');
  const initBtn = document.getElementById('init-btn');
  const randomBtn = document.getElementById('random-btn');
  const presetBtn = document.getElementById('preset-btn');
  const compareAllBtn = document.getElementById('compare-all-btn');
  const closeCompareBtn = document.getElementById('close-compare-btn');

  const singleSimStage = document.getElementById('single-sim-stage');
  const nextBtn = document.getElementById('next-step-btn');
  const prevBtn = document.getElementById('prev-step-btn');
  const stepIndicator = document.getElementById('step-indicator');
  const refSequenceStrip = document.getElementById('ref-sequence-strip');

  const diskPagesGrid = document.getElementById('disk-pages-grid');
  const diskCountBadge = document.getElementById('disk-count-badge');
  const flyingPagePill = document.getElementById('flying-page-pill');
  const busArrowSvg = document.getElementById('bus-arrow-svg');
  const busDirectionLabel = document.getElementById('bus-direction-label');
  const ramSlotsStack = document.getElementById('ram-slots-stack');
  const ramOccupancyBadge = document.getElementById('ram-occupancy-badge');

  const statusBanner = document.getElementById('status-banner');
  const statusText = document.getElementById('status-text');
  const matrixContainer = document.getElementById('matrix-container');

  // Telemetry fields
  const teleRequest = document.getElementById('tele-request');
  const teleStatus = document.getElementById('tele-status');
  const teleFaults = document.getElementById('tele-faults');
  const teleHits = document.getElementById('tele-hits');
  const teleRatio = document.getElementById('tele-ratio');

  // Algorithm specification fields
  const algoSpecHeader = document.getElementById('algo-spec-header');
  const specRule = document.getElementById('spec-rule');
  const specComplexity = document.getElementById('spec-complexity');
  const specStrength = document.getElementById('spec-strength');
  const specWeakness = document.getElementById('spec-weakness');

  // Compare All 3 elements
  const compareAllSection = document.getElementById('compare-all-section');
  const compareBarsContainer = document.getElementById('compare-bars-container');
  const compareAnalysisBox = document.getElementById('compare-analysis-box');
  const compareTableBody = document.getElementById('compare-table-body');

  let simulationResult = null;
  let microTimeline = [];
  let currentMicroIndex = -1;
  let referenceStringArr = [];
  let allDiskPages = [];
  let autoPlayTimer = null;

  const ALGO_SPECS = {
    FIFO: {
      title: 'Active Policy Specification: FIFO (First-In, First-Out)',
      rule: 'Evict the oldest page in memory',
      complexity: 'O(1) queue pop/push',
      strength: 'Simplest to implement; minimal overhead',
      weakness: "Ignores usage frequency; prone to Belady's anomaly"
    },
    LRU: {
      title: 'Active Policy Specification: LRU (Least Recently Used)',
      rule: 'Evict the page unused for the longest time',
      complexity: 'O(n) scan or O(1) hash + doubly-linked list',
      strength: 'Exploits temporal locality; immune to Belady’s anomaly',
      weakness: 'Higher hardware/tracking overhead per memory access'
    },
    OPTIMAL: {
      title: 'Active Policy Specification: Optimal (MIN Algorithm)',
      rule: 'Evict the page used farthest in future',
      complexity: 'O(n²) look-ahead',
      strength: 'Fewest faults possible',
      weakness: 'Needs future knowledge; benchmark only'
    }
  };

  function showSingleStage() {
    compareAllSection.style.display = 'none';
    singleSimStage.style.display = 'block';
    updateUIState();
  }

  function showCompareStage() {
    stopAutoPlay();
    singleSimStage.style.display = 'none';
    compareAllSection.style.display = 'block';
  }

  function updateAlgorithmSpecs(algoKey) {
    const spec = ALGO_SPECS[algoKey] || ALGO_SPECS.FIFO;
    algoSpecHeader.textContent = spec.title;
    specRule.textContent = spec.rule;
    specComplexity.textContent = spec.complexity;
    specStrength.textContent = spec.strength;
    specWeakness.textContent = spec.weakness;
  }

  function buildMicroTimeline(history, frameCount) {
    const timeline = [];
    let prevFrames = new Array(frameCount).fill(null);

    history.forEach((step, macroIdx) => {
      const prevFaults = macroIdx > 0 ? history[macroIdx - 1].faultsCount : 0;
      const prevHits = macroIdx > 0 ? history[macroIdx - 1].hitsCount : 0;

      if (!step.isHit && step.victim !== null) {
        const intermediateFrames = [...prevFrames];
        intermediateFrames[step.targetSlot] = null;

        timeline.push({
          phase: 'EVICT',
          macroIndex: macroIdx,
          stepNumber: step.step,
          totalSteps: history.length,
          page: step.page,
          victim: step.victim,
          targetSlot: step.targetSlot,
          frames: intermediateFrames,
          faultsCount: prevFaults,
          hitsCount: prevHits
        });

        timeline.push({
          phase: 'FETCH',
          macroIndex: macroIdx,
          stepNumber: step.step,
          totalSteps: history.length,
          page: step.page,
          victim: step.victim,
          targetSlot: step.targetSlot,
          frames: [...step.frames],
          faultsCount: step.faultsCount,
          hitsCount: step.hitsCount
        });
      } else if (!step.isHit) {
        timeline.push({
          phase: 'FETCH',
          macroIndex: macroIdx,
          stepNumber: step.step,
          totalSteps: history.length,
          page: step.page,
          victim: null,
          targetSlot: step.targetSlot,
          frames: [...step.frames],
          faultsCount: step.faultsCount,
          hitsCount: step.hitsCount
        });
      } else {
        timeline.push({
          phase: 'HIT',
          macroIndex: macroIdx,
          stepNumber: step.step,
          totalSteps: history.length,
          page: step.page,
          victim: null,
          targetSlot: step.targetSlot,
          frames: [...step.frames],
          faultsCount: step.faultsCount,
          hitsCount: step.hitsCount
        });
      }

      prevFrames = [...step.frames];
    });

    return timeline;
  }

  function stopAutoPlay() {
    if (autoPlayTimer) {
      clearInterval(autoPlayTimer);
      autoPlayTimer = null;
    }
    simulateBtn.textContent = 'Simulate';
  }

  function startAutoPlay() {
    showSingleStage();
    if (!simulationResult || microTimeline.length === 0) return;
    if (currentMicroIndex >= microTimeline.length - 1) {
      currentMicroIndex = -1;
      updateUIState();
    }

    simulateBtn.textContent = 'Pause';
    const delay = parseInt(speedSelect.value, 10) || 750;

    autoPlayTimer = setInterval(() => {
      if (currentMicroIndex < microTimeline.length - 1) {
        currentMicroIndex++;
        updateUIState();
      } else {
        stopAutoPlay();
      }
    }, delay);
  }

  function buildDiskCatalog(refArr) {
    const basePages = Array.from({ length: 12 }, (_, i) => i);
    const merged = new Set([...basePages, ...refArr]);
    return Array.from(merged).sort((a, b) => a - b);
  }

  function initSimulation(e) {
    if (e) e.preventDefault();
    stopAutoPlay();

    const rawRef = refStringInput.value.trim();
    referenceStringArr = rawRef.split(/[\s,]+/).map(Number).filter(n => !isNaN(n) && n >= 0);
    const frameCount = parseInt(frameCountInput.value, 10);
    const algorithm = algoSelect.value;

    if (referenceStringArr.length === 0 || isNaN(frameCount) || frameCount < 1 || frameCount > 10) {
      alert('Please enter valid non-negative page numbers and a RAM frame count between 1 and 10.');
      return;
    }

    updateAlgorithmSpecs(algorithm);
    allDiskPages = buildDiskCatalog(referenceStringArr);

    if (algorithm === 'FIFO') simulationResult = simulateFIFO(referenceStringArr, frameCount);
    else if (algorithm === 'LRU') simulationResult = simulateLRU(referenceStringArr, frameCount);
    else if (algorithm === 'OPTIMAL') simulationResult = simulateOptimal(referenceStringArr, frameCount);

    microTimeline = buildMicroTimeline(simulationResult.history, frameCount);
    currentMicroIndex = -1;
    updateUIState();
    renderMatrixOverview(referenceStringArr, frameCount, simulationResult);

    if (compareAllSection.style.display !== 'none') {
      renderCompareAllDashboard();
    }
  }

  function generateRandomInput(e) {
    if (e) e.preventDefault();
    stopAutoPlay();

    const length = Math.floor(Math.random() * 6) + 14;
    const maxPageId = 8;
    const seq = [];
    for (let i = 0; i < length; i++) {
      if (i > 2 && Math.random() < 0.35) {
        const recentIdx = Math.max(0, i - Math.floor(Math.random() * 3) - 1);
        seq.push(seq[recentIdx]);
      } else {
        seq.push(Math.floor(Math.random() * (maxPageId + 1)));
      }
    }

    refStringInput.value = seq.join(' ');
    initSimulation();
  }

  function renderCompareAllDashboard() {
    const rawRef = refStringInput.value.trim();
    const refArr = rawRef.split(/[\s,]+/).map(Number).filter(n => !isNaN(n) && n >= 0);
    const frameCount = parseInt(frameCountInput.value, 10) || 3;
    if (refArr.length === 0) return;

    showCompareStage();

    const fifo = simulateFIFO(refArr, frameCount);
    const lru = simulateLRU(refArr, frameCount);
    const opt = simulateOptimal(refArr, frameCount);

    const rows = [
      { name: 'FIFO', data: fifo, time: 'O(1)' },
      { name: 'LRU', data: lru, time: 'O(n)' },
      { name: 'Optimal', data: opt, time: 'O(n²)' }
    ];

    const maxFaults = Math.max(fifo.totalFaults, lru.totalFaults, opt.totalFaults, 1);
    const minFaults = Math.min(fifo.totalFaults, lru.totalFaults, opt.totalFaults);

    compareBarsContainer.innerHTML = rows.map(item => {
      const widthPct = Math.round((item.data.totalFaults / maxFaults) * 100);
      const hitPct = Math.round(item.data.hitRatio * 100);
      const isBest = item.data.totalFaults === minFaults;
      const barBg = isBest ? 'var(--accent-lime)' : 'var(--bg-slot)';
      const barText = isBest ? 'var(--accent-lime-dark)' : 'var(--text-primary)';

      return `
        <div style="display: grid; grid-template-columns: 80px 1fr; align-items: center; gap: 1rem;">
          <span style="font-weight: 700; font-size: 0.9rem;">${item.name}</span>
          <div style="width: 100%; height: 34px; background: var(--bg-surface-alt); border-radius: 9999px; overflow: hidden; border: 1px solid var(--border-color);">
            <div style="width: ${Math.max(widthPct, 24)}%; height: 100%; background: ${barBg}; display: flex; align-items: center; padding: 0 1rem; color: ${barText}; font-weight: 700; font-size: 0.82rem; white-space: nowrap; transition: width 0.45s ease;">
              ${item.data.totalFaults} faults · ${hitPct}% hit
            </div>
          </div>
        </div>
      `;
    }).join('');

    const lruSavings = fifo.totalFaults > 0
      ? Math.round(((fifo.totalFaults - lru.totalFaults) / fifo.totalFaults) * 100)
      : 0;

    compareAnalysisBox.innerHTML = `
      <strong>Analysis:</strong> Optimal gives the fewest faults (<strong>${opt.totalFaults}</strong>).
      LRU produces <strong>${lruSavings}%</strong> ${lruSavings >= 0 ? 'fewer' : 'more'} faults than FIFO (${lru.totalFaults} vs ${fifo.totalFaults}) across ${refArr.length} references with ${frameCount} frames.
    `;

    compareTableBody.innerHTML = rows.map(item => `
      <tr style="border-bottom: 1px solid var(--border-color);">
        <td style="padding: 0.7rem; font-weight: 700;">${item.name}</td>
        <td style="padding: 0.7rem; font-family: var(--font-mono); color: var(--accent-red); font-weight: 700;">${item.data.totalFaults}</td>
        <td style="padding: 0.7rem; font-family: var(--font-mono); color: var(--accent-green); font-weight: 700;">${item.data.totalHits}</td>
        <td style="padding: 0.7rem; font-family: var(--font-mono);">${(item.data.hitRatio * 100).toFixed(1)}%</td>
        <td style="padding: 0.7rem; font-family: var(--font-mono);">${item.time}</td>
      </tr>
    `).join('');

    renderBeladyComparisonChart('compare-faults-chart', refArr, frameCount, 'faults');
    renderBeladyComparisonChart('compare-hitratio-chart', refArr, frameCount, 'hitRatio');
  }

  function triggerBusAnimation(micro) {
    flyingPagePill.classList.remove('animate-fetch', 'animate-evict', 'animate-hit');
    void flyingPagePill.offsetWidth;

    if (micro.phase === 'EVICT') {
      busArrowSvg.classList.add('reversed');
      busArrowSvg.style.color = 'var(--accent-amber)';
      flyingPagePill.textContent = `← Page ${micro.victim}`;
      flyingPagePill.classList.add('animate-evict');
      busDirectionLabel.textContent = 'Evicting RAM → Disk';
    } else if (micro.phase === 'FETCH') {
      busArrowSvg.classList.remove('reversed');
      busArrowSvg.style.color = 'var(--accent-lime)';
      flyingPagePill.textContent = `Page ${micro.page} →`;
      flyingPagePill.classList.add('animate-fetch');
      busDirectionLabel.textContent = 'Fetching Disk → RAM';
    } else {
      busArrowSvg.classList.remove('reversed');
      busArrowSvg.style.color = 'var(--accent-green)';
      flyingPagePill.textContent = `Page ${micro.page} ✓`;
      flyingPagePill.classList.add('animate-hit');
      busDirectionLabel.textContent = 'RAM Cache Hit';
    }
  }

  function updateUIState() {
    if (!simulationResult) return;
    const history = simulationResult.history;
    const frameCount = parseInt(frameCountInput.value, 10);
    const activeMicro = currentMicroIndex >= 0 ? microTimeline[currentMicroIndex] : null;
    const currentFrames = activeMicro ? activeMicro.frames : new Array(frameCount).fill(null);

    if (activeMicro) {
      const phaseSuffix = activeMicro.phase === 'EVICT'
        ? ' (1/2 Evict)'
        : (activeMicro.victim !== null && activeMicro.phase === 'FETCH' ? ' (2/2 Fetch)' : '');
      stepIndicator.textContent = `Step ${activeMicro.stepNumber} / ${activeMicro.totalSteps}${phaseSuffix}`;

      if (activeMicro.phase === 'EVICT') stepIndicator.className = 'badge badge-evict';
      else if (activeMicro.phase === 'HIT') stepIndicator.className = 'badge badge-hit';
      else stepIndicator.className = 'badge badge-fault';
    } else {
      stepIndicator.textContent = `Step 0 / ${history.length}`;
      stepIndicator.className = 'badge';
    }

    const activeMacroIdx = activeMicro ? activeMicro.macroIndex : -1;
    refSequenceStrip.innerHTML = referenceStringArr.map((page, idx) => {
      let cls = 'seq-chip';
      if (idx === activeMacroIdx) cls += ' seq-current';
      else if (idx < activeMacroIdx) cls += ' seq-past';
      return `<div class="${cls}">S${idx + 1}: P${page}</div>`;
    }).join('');

    diskCountBadge.textContent = `${allDiskPages.length} Pages`;
    diskPagesGrid.innerHTML = allDiskPages.map(page => {
      const isLoadedInRam = currentFrames.includes(page);
      const wasJustRestored = activeMicro && activeMicro.phase === 'EVICT' && activeMicro.victim === page;
      let blockClass = 'disk-page-block';
      if (isLoadedInRam) blockClass += ' in-ram-struck';
      if (wasJustRestored) blockClass += ' just-restored';

      return `
        <div class="${blockClass}">
          <span class="page-title-text">Page ${page}</span>
          <span class="disk-sub">${isLoadedInRam ? 'In RAM' : (wasJustRestored ? 'Restored' : 'On Disk')}</span>
        </div>
      `;
    }).join('');

    const occupiedCount = currentFrames.filter(f => f !== null).length;
    ramOccupancyBadge.textContent = `${occupiedCount} / ${frameCount} Frames`;

    ramSlotsStack.innerHTML = currentFrames.map((val, fIdx) => {
      const isEmpty = val === null;
      const isTarget = activeMicro && activeMicro.targetSlot === fIdx;
      let pillClass = 'frame-pill';

      if (isEmpty && isTarget && activeMicro.phase === 'EVICT') {
        pillClass += ' empty-slot slot-evicting';
      } else if (isEmpty) {
        pillClass += ' empty-slot';
      } else if (isTarget) {
        pillClass += activeMicro.phase === 'HIT' ? ' slot-hit' : ' slot-fault';
      }

      const labelText = isEmpty
        ? (isTarget && activeMicro.phase === 'EVICT' ? `— Evicted Page ${activeMicro.victim} —` : '— Empty —')
        : `Page ${val}`;

      return `
        <div class="frame-slot-row">
          <span class="frame-index-label">F${fIdx}</span>
          <div class="${pillClass}">${labelText}</div>
        </div>
      `;
    }).join('');

    if (activeMicro) {
      triggerBusAnimation(activeMicro);

      const totalProcessed = activeMicro.hitsCount + activeMicro.faultsCount;
      const ratioPct = totalProcessed > 0 ? Math.round((activeMicro.hitsCount / totalProcessed) * 100) : 0;

      teleRequest.textContent = `Page ${activeMicro.page}`;
      teleFaults.textContent = activeMicro.faultsCount;
      teleHits.textContent = activeMicro.hitsCount;
      teleRatio.textContent = `${ratioPct}%`;

      if (activeMicro.phase === 'EVICT') {
        teleStatus.textContent = 'Evicting Victim (RAM → Disk)';
        statusBanner.className = 'status-banner evict-banner';
        statusText.textContent = `Phase 1 (Eviction): RAM is full. Moving victim Page ${activeMicro.victim} from Frame F${activeMicro.targetSlot} back to Secondary Storage (strikethrough removed). Click Next Step to fetch Page ${activeMicro.page}.`;
      } else if (activeMicro.phase === 'FETCH') {
        teleStatus.textContent = 'Fetching Page (Disk → RAM)';
        statusBanner.className = 'status-banner fault-banner';
        statusText.textContent = activeMicro.victim !== null
          ? `Phase 2 (Fetch): Arrow reversed to Disk → RAM. Loaded requested Page ${activeMicro.page} into freed Frame F${activeMicro.targetSlot}.`
          : `Page Fault: Fetched Page ${activeMicro.page} from Secondary Storage into empty RAM Frame F${activeMicro.targetSlot}.`;
      } else {
        teleStatus.textContent = 'Page Hit (In RAM)';
        statusBanner.className = 'status-banner hit-banner';
        statusText.textContent = `Cache Hit: Page ${activeMicro.page} is already resident in Primary Memory (Frame F${activeMicro.targetSlot}).`;
      }

      const graphStepIdx = activeMicro.phase === 'EVICT' ? activeMicro.macroIndex - 1 : activeMicro.macroIndex;
      renderLiveAccuracyChart('accuracy-chart', history, graphStepIdx);
    } else {
      busArrowSvg.classList.remove('reversed');
      busArrowSvg.style.color = 'var(--text-muted)';
      flyingPagePill.classList.remove('animate-fetch', 'animate-evict', 'animate-hit');
      flyingPagePill.textContent = 'Idle';
      busDirectionLabel.textContent = 'Disk → RAM Bus';

      teleRequest.textContent = '-';
      teleStatus.textContent = 'Ready';
      teleFaults.textContent = '0';
      teleHits.textContent = '0';
      teleRatio.textContent = '0%';
      statusBanner.className = 'status-banner';
      statusText.textContent = 'Click "Simulate" for auto-motion playback or "Next Step" to step manually.';
      renderLiveAccuracyChart('accuracy-chart', history, -1);
    }

    prevBtn.disabled = currentMicroIndex < 0;
    nextBtn.disabled = currentMicroIndex >= microTimeline.length - 1;
    nextBtn.textContent = currentMicroIndex >= microTimeline.length - 1 ? 'Simulation Complete' : 'Next Step →';
  }

  function renderMatrixOverview(refString, frameCount, result) {
    let html = `
      <table style="width: 100%; border-collapse: collapse; font-family: var(--font-mono); font-size: 0.82rem; text-align: center;">
        <thead>
          <tr style="border-bottom: 2px solid var(--border-color); color: var(--text-muted);">
            <th style="padding: 0.5rem;">Slot</th>
            ${refString.map((r, i) => `<th style="padding: 0.5rem;">S${i + 1}<br><span style="color:var(--text-primary)">${r}</span></th>`).join('')}
          </tr>
        </thead>
        <tbody>
    `;

    for (let f = 0; f < frameCount; f++) {
      html += `<tr style="border-bottom: 1px solid var(--border-color);">
        <td style="padding: 0.5rem; color: var(--text-muted); font-weight: 700;">F${f}</td>
        ${result.history.map(step => `<td style="padding: 0.5rem;">${step.frames[f] !== null ? step.frames[f] : '-'}</td>`).join('')}
      </tr>`;
    }

    html += `<tr>
      <td style="padding: 0.5rem; font-weight: 700;">Event</td>
      ${result.history.map(step => `
        <td style="padding: 0.5rem;">
          <span class="badge ${step.isHit ? 'badge-hit' : 'badge-fault'}">${step.isHit ? 'H' : 'F'}</span>
        </td>
      `).join('')}
    </tr>`;

    html += `</tbody></table>`;
    matrixContainer.innerHTML = html;
  }

  simulateBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (autoPlayTimer) stopAutoPlay();
    else startAutoPlay();
  });

  nextBtn.addEventListener('click', (e) => {
    e.preventDefault();
    stopAutoPlay();
    if (microTimeline.length > 0 && currentMicroIndex < microTimeline.length - 1) {
      currentMicroIndex++;
      updateUIState();
    }
  });

  prevBtn.addEventListener('click', (e) => {
    e.preventDefault();
    stopAutoPlay();
    if (microTimeline.length > 0 && currentMicroIndex >= 0) {
      currentMicroIndex--;
      updateUIState();
    }
  });

  algoSelect.addEventListener('change', () => {
    showSingleStage();
    initSimulation();
  });

  frameCountInput.addEventListener('change', initSimulation);
  initBtn.addEventListener('click', (e) => {
    showSingleStage();
    initSimulation(e);
  });
  randomBtn.addEventListener('click', generateRandomInput);

  presetBtn.addEventListener('click', (e) => {
    e.preventDefault();
    refStringInput.value = '1 2 3 4 1 2 5 1 2 3 4 5';
    frameCountInput.value = '3';
    algoSelect.value = 'FIFO';
    initSimulation();
  });

  compareAllBtn.addEventListener('click', (e) => {
    e.preventDefault();
    renderCompareAllDashboard();
  });

  closeCompareBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showSingleStage();
  });

  const chartCanvas = document.getElementById('accuracy-chart');
  if (chartCanvas && chartCanvas.parentElement) {
    const ro = new ResizeObserver(() => {
      if (singleSimStage.style.display !== 'none') {
        updateUIState();
      }
      if (compareAllSection.style.display !== 'none') {
        renderCompareAllDashboard();
      }
    });
    ro.observe(chartCanvas.parentElement);
  }

  window.addEventListener('themeChanged', () => {
    if (singleSimStage.style.display !== 'none') {
      updateUIState();
    }
    if (compareAllSection.style.display !== 'none') {
      renderCompareAllDashboard();
    }
  });

  initSimulation();
});