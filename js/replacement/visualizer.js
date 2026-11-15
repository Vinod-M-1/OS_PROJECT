import { simulateFIFO, simulateLRU, simulateOptimal } from './algorithms.js';

document.addEventListener('DOMContentLoaded', () => {
  const refStringInput = document.getElementById('ref-string');
  const frameCountInput = document.getElementById('frame-count');
  const algoSelect = document.getElementById('algo-select');
  const runBtn = document.getElementById('run-btn');
  const presetBtn = document.getElementById('preset-btn');
  const beladyBtn = document.getElementById('belady-btn');

  const statsFaults = document.getElementById('stat-faults');
  const statsHits = document.getElementById('stat-hits');
  const statsRatio = document.getElementById('stat-ratio');
  const matrixContainer = document.getElementById('matrix-container');
  const comparisonView = document.getElementById('comparison-view');

  let currentSimData = null;

  function runSimulation() {
    const rawRef = refStringInput.value.trim();
    const referenceString = rawRef.split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
    const frameCount = parseInt(frameCountInput.value, 10);
    const algorithm = algoSelect.value;

    if (referenceString.length === 0 || frameCount < 1 || frameCount > 8) {
      alert('Please enter a valid reference string and frame count (1-8).');
      return;
    }

    if (algorithm === 'ALL') {
      comparisonView.style.display = 'grid';
      matrixContainer.style.display = 'none';

      const fifo = simulateFIFO(referenceString, frameCount);
      const lru = simulateLRU(referenceString, frameCount);
      const opt = simulateOptimal(referenceString, frameCount);

      renderComparison(referenceString, frameCount, { fifo, lru, opt });
    } else {
      comparisonView.style.display = 'none';
      matrixContainer.style.display = 'block';

      let result;
      if (algorithm === 'FIFO') result = simulateFIFO(referenceString, frameCount);
      else if (algorithm === 'LRU') result = simulateLRU(referenceString, frameCount);
      else if (algorithm === 'OPTIMAL') result = simulateOptimal(referenceString, frameCount);

      currentSimData = result;
      renderMatrix(referenceString, frameCount, result);
    }
  }

  function renderMatrix(refString, frameCount, result) {
    statsFaults.textContent = result.totalFaults;
    statsHits.textContent = result.totalHits;
    statsRatio.textContent = (result.hitRatio * 100).toFixed(0) + '%';

    let html = `
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-family: var(--font-mono); font-size: 0.9rem; text-align: center;">
          <thead>
            <tr style="border-bottom: 2px solid var(--border-color); color: var(--text-muted);">
              <th style="padding: 0.75rem;">Step</th>
              <th style="padding: 0.75rem;">Ref</th>
              ${refString.map((_, i) => `<th style="padding: 0.75rem;">${i+1}</th>`).join('')}
              <th style="padding: 0.75rem;">Status</th>
            </tr>
          </thead>
          <tbody>
    `;

    // Row for Reference string
    html += `<tr style="border-bottom: 1px solid var(--border-color); font-weight: bold;">
      <td style="padding: 0.75rem; color: var(--text-muted);">Input</td>
      <td style="padding: 0.75rem;">-</td>
      ${refString.map(r => `<td style="padding: 0.75rem;">${r}</td>`).join('')}
      <td style="padding: 0.75rem;">-</td>
    </tr>`;

    // Frame rows
    for (let f = 0; f < frameCount; f++) {
      html += `<tr style="border-bottom: 1px solid var(--border-color);">
        <td style="padding: 0.75rem; color: var(--text-muted);">Frame ${f}</td>
        <td style="padding: 0.75rem;">-</td>
        ${result.history.map(step => {
          let val = step.frames[f];
          return `<td style="padding: 0.75rem; background: ${val === step.page && !step.isHit ? 'rgba(239,68,68,0.1)' : 'transparent'}">${val !== null ? val : '-'}</td>`;
        }).join('')}
        <td style="padding: 0.75rem;">-</td>
      </tr>`;
    }

    // Status Row
    html += `<tr style="border-top: 2px solid var(--border-color);">
      <td style="padding: 0.75rem; font-weight: bold;" colspan="2">Result</td>
      ${result.history.map(step => `
        <td style="padding: 0.75rem;">
          <span class="badge ${step.isHit ? 'badge-hit' : 'badge-fault'}">
            ${step.isHit ? 'H' : 'F'}
          </span>
        </td>
      `).join('')}
      <td style="padding: 0.75rem; font-weight: bold;">Faults: ${result.totalFaults}</td>
    </tr>`;

    html += `</tbody></table></div>`;
    matrixContainer.innerHTML = html;
  }

  function renderComparison(refString, frameCount, results) {
    const algos = [
      { name: 'FIFO', data: results.fifo },
      { name: 'LRU', data: results.lru },
      { name: 'Optimal', data: results.opt }
    ];

    comparisonView.innerHTML = algos.map(alg => `
      <div class="card animate-fade">
        <h3 style="margin-bottom: 1rem; color: var(--accent);">${alg.name} Algorithm</h3>
        <p style="margin-bottom: 0.5rem;"><strong>Page Faults:</strong> ${alg.data.totalFaults}</p>
        <p style="margin-bottom: 0.5rem;"><strong>Page Hits:</strong> ${alg.data.totalHits}</p>
        <p style="margin-bottom: 1rem;"><strong>Hit Ratio:</strong> ${(alg.data.hitRatio * 100).toFixed(0)}%</p>
        <div style="background: var(--bg-color); padding: 0.75rem; border-radius: 8px; font-family: var(--font-mono); font-size: 0.85rem;">
          Final Frames: [ ${alg.data.history[alg.data.history.length - 1].frames.join(', ')} ]
        </div>
      </div>
    `).join('');
  }

  runBtn.addEventListener('click', runSimulation);
  presetBtn.addEventListener('click', () => {
    refStringInput.value = '7 0 1 2 0 3 0 4 2 3 0 3 2';
    frameCountInput.value = '3';
    runSimulation();
  });

  beladyBtn.addEventListener('click', () => {
    refStringInput.value = '1 2 3 4 1 2 5 1 2 3 4 5';
    frameCountInput.value = '3';
    algoSelect.value = 'FIFO';
    runSimulation();
  });

  // Initial run
  runSimulation();
});