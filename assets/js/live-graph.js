// export function renderLiveAccuracyChart(canvasId, history, currentIndex) {
//   const canvas = document.getElementById(canvasId);
//   if (!canvas || !canvas.parentElement) return;

//   const wrapper = canvas.parentElement;
//   const width = wrapper.clientWidth;
//   const height = wrapper.clientHeight || 270;
//   if (width <= 0 || height <= 0) return;

//   const dpr = window.devicePixelRatio || 1;
//   canvas.width = width * dpr;
//   canvas.height = height * dpr;

//   const ctx = canvas.getContext('2d');
//   ctx.scale(dpr, dpr);
//   ctx.clearRect(0, 0, width, height);

//   const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
//   const gridColor = isDark ? 'rgba(227, 246, 200, 0.08)' : 'rgba(17, 18, 20, 0.08)';
//   const labelColor = isDark ? '#9ca39e' : '#575b56';
//   const primaryLineColor = isDark ? '#e3f6c8' : '#111214';

//   const padLeft = 46;
//   const padRight = 20;
//   const padTop = 20;
//   const padBottom = 34;
//   const chartW = width - padLeft - padRight;
//   const chartH = height - padTop - padBottom;

//   ctx.font = '11px JetBrains Mono, monospace';
//   ctx.textAlign = 'right';
//   ctx.textBaseline = 'middle';

//   for (let i = 0; i <= 5; i++) {
//     const pct = i * 20;
//     const y = padTop + chartH * (1 - pct / 100);

//     ctx.strokeStyle = gridColor;
//     ctx.lineWidth = 1;
//     ctx.beginPath();
//     ctx.moveTo(padLeft, y);
//     ctx.lineTo(width - padRight, y);
//     ctx.stroke();

//     ctx.fillStyle = labelColor;
//     ctx.fillText(`${pct}%`, padLeft - 8, y);
//   }

//   const totalSteps = history ? history.length : 0;
//   if (totalSteps > 0) {
//     ctx.textAlign = 'center';
//     ctx.textBaseline = 'top';
//     for (let i = 0; i < totalSteps; i++) {
//       const x = padLeft + (chartW / Math.max(totalSteps - 1, 1)) * i;
//       ctx.fillStyle = i === currentIndex ? primaryLineColor : labelColor;
//       ctx.fillText(`${i + 1}`, x, height - padBottom + 10);
//     }
//   }

//   if (!history || totalSteps === 0 || currentIndex < 0) {
//     ctx.textAlign = 'center';
//     ctx.textBaseline = 'middle';
//     ctx.fillStyle = labelColor;
//     ctx.font = '13px Inter, sans-serif';
//     ctx.fillText('Click "Simulate" or "Next Step" to plot live Hit Accuracy & Fault Rate', padLeft + chartW / 2, padTop + chartH / 2);
//     return;
//   }

//   const hitPoints = [];
//   const faultPoints = [];
//   for (let i = 0; i <= currentIndex; i++) {
//     const step = history[i];
//     const total = i + 1;
//     hitPoints.push((step.hitsCount / total) * 100);
//     faultPoints.push((step.faultsCount / total) * 100);
//   }

//   ctx.save();
//   ctx.setLineDash([4, 4]);
//   ctx.strokeStyle = '#f87171';
//   ctx.lineWidth = 2;
//   ctx.beginPath();
//   faultPoints.forEach((val, idx) => {
//     const x = padLeft + (chartW / Math.max(totalSteps - 1, 1)) * idx;
//     const y = padTop + chartH * (1 - val / 100);
//     if (idx === 0) ctx.moveTo(x, y);
//     else ctx.lineTo(x, y);
//   });
//   ctx.stroke();
//   ctx.restore();

//   ctx.strokeStyle = primaryLineColor;
//   ctx.lineWidth = 2.75;
//   ctx.beginPath();
//   hitPoints.forEach((val, idx) => {
//     const x = padLeft + (chartW / Math.max(totalSteps - 1, 1)) * idx;
//     const y = padTop + chartH * (1 - val / 100);
//     if (idx === 0) ctx.moveTo(x, y);
//     else ctx.lineTo(x, y);
//   });
//   ctx.stroke();

//   hitPoints.forEach((val, idx) => {
//     const x = padLeft + (chartW / Math.max(totalSteps - 1, 1)) * idx;
//     const y = padTop + chartH * (1 - val / 100);
//     ctx.fillStyle = primaryLineColor;
//     ctx.beginPath();
//     ctx.arc(x, y, idx === currentIndex ? 5.5 : 3.5, 0, Math.PI * 2);
//     ctx.fill();
//   });
// }

// export function renderBeladyComparisonChart(canvasId, referenceString, activeFrameCount = 3, mode = 'faults') {
//   const canvas = document.getElementById(canvasId);
//   if (!canvas || !canvas.parentElement) return;

//   const wrapper = canvas.parentElement;
//   const width = wrapper.clientWidth;
//   const height = wrapper.clientHeight || 260;
//   if (width <= 0 || height <= 0) return;

//   const dpr = window.devicePixelRatio || 1;
//   canvas.width = width * dpr;
//   canvas.height = height * dpr;
//   const ctx = canvas.getContext('2d');
//   ctx.scale(dpr, dpr);
//   ctx.clearRect(0, 0, width, height);

//   import('../../js/replacement/algorithms.js').then(({ simulateFIFO, simulateLRU, simulateOptimal }) => {
//     const framesRange = [1, 2, 3, 4, 5, 6, 7, 8];
//     const fifoSims = framesRange.map(f => simulateFIFO(referenceString, f));
//     const lruSims = framesRange.map(f => simulateLRU(referenceString, f));
//     const optSims = framesRange.map(f => simulateOptimal(referenceString, f));

//     const fifoData = mode === 'hitRatio'
//       ? fifoSims.map(s => Math.round(s.hitRatio * 100))
//       : fifoSims.map(s => s.totalFaults);
//     const lruData = mode === 'hitRatio'
//       ? lruSims.map(s => Math.round(s.hitRatio * 100))
//       : lruSims.map(s => s.totalFaults);
//     const optData = mode === 'hitRatio'
//       ? optSims.map(s => Math.round(s.hitRatio * 100))
//       : optSims.map(s => s.totalFaults);

//     const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
//     const gridColor = isDark ? 'rgba(227, 246, 200, 0.08)' : 'rgba(17, 18, 20, 0.08)';
//     const labelColor = isDark ? '#9ca39e' : '#575b56';
//     const activeLabelColor = isDark ? '#e3f6c8' : '#111214';

//     const padLeft = 46;
//     const padRight = 24;
//     const padTop = 20;
//     const padBottom = 42;
//     const chartW = width - padLeft - padRight;
//     const chartH = height - padTop - padBottom;
//     const maxVal = mode === 'hitRatio'
//       ? 100
//       : Math.max(...fifoData, ...lruData, ...optData, 10);

//     ctx.font = '11px JetBrains Mono, monospace';
//     ctx.textAlign = 'right';
//     ctx.textBaseline = 'middle';

//     const ticks = mode === 'hitRatio' ? 5 : 4;
//     for (let i = 0; i <= ticks; i++) {
//       const val = Math.round((maxVal / ticks) * i);
//       const y = padTop + chartH * (1 - val / maxVal);
//       ctx.strokeStyle = gridColor;
//       ctx.lineWidth = 1;
//       ctx.beginPath();
//       ctx.moveTo(padLeft, y);
//       ctx.lineTo(width - padRight, y);
//       ctx.stroke();

//       ctx.fillStyle = labelColor;
//       ctx.fillText(mode === 'hitRatio' ? `${val}%` : `${val}`, padLeft - 8, y);
//     }

//     if (activeFrameCount >= 1 && activeFrameCount <= 8) {
//       const activeX = padLeft + (chartW / (framesRange.length - 1)) * (activeFrameCount - 1);
//       ctx.save();
//       ctx.setLineDash([3, 3]);
//       ctx.strokeStyle = activeLabelColor;
//       ctx.lineWidth = 1.25;
//       ctx.beginPath();
//       ctx.moveTo(activeX, padTop);
//       ctx.lineTo(activeX, padTop + chartH);
//       ctx.stroke();
//       ctx.restore();
//     }

//     ctx.textAlign = 'center';
//     ctx.textBaseline = 'top';
//     framesRange.forEach((f, idx) => {
//       const x = padLeft + (chartW / (framesRange.length - 1)) * idx;
//       const isSelected = f === activeFrameCount;
//       ctx.font = isSelected ? 'bold 12px JetBrains Mono, monospace' : '11px JetBrains Mono, monospace';
//       ctx.fillStyle = isSelected ? activeLabelColor : labelColor;
//       ctx.fillText(`${f}`, x, height - padBottom + 10);
//     });

//     ctx.fillStyle = labelColor;
//     ctx.font = '11px Inter, sans-serif';
//     ctx.fillText('Number of frames', padLeft + chartW / 2, height - 14);

//     function plotSeries(series, color) {
//       ctx.strokeStyle = color;
//       ctx.lineWidth = 2.5;
//       ctx.beginPath();
//       series.forEach((v, idx) => {
//         const x = padLeft + (chartW / (framesRange.length - 1)) * idx;
//         const y = padTop + chartH * (1 - v / maxVal);
//         if (idx === 0) ctx.moveTo(x, y);
//         else ctx.lineTo(x, y);
//       });
//       ctx.stroke();

//       series.forEach((v, idx) => {
//         const x = padLeft + (chartW / (framesRange.length - 1)) * idx;
//         const y = padTop + chartH * (1 - v / maxVal);
//         ctx.fillStyle = color;
//         ctx.beginPath();
//         ctx.arc(x, y, idx + 1 === activeFrameCount ? 5.5 : 4, 0, Math.PI * 2);
//         ctx.fill();
//       });
//     }

//     plotSeries(fifoData, '#fbbf24');
//     plotSeries(lruData, '#9ca39e');
//     plotSeries(optData, '#4ade80');
//   });
// }
export function renderLiveAccuracyChart(canvasId, history, currentIndex) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !canvas.parentElement) return;

  const wrapper = canvas.parentElement;
  const width = wrapper.clientWidth;
  const height = wrapper.clientHeight || 270;
  if (width <= 0 || height <= 0) return;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const gridColor = isDark ? 'rgba(227, 246, 200, 0.08)' : 'rgba(17, 18, 20, 0.08)';
  const labelColor = isDark ? '#9ca39e' : '#575b56';
  const primaryLineColor = isDark ? '#e3f6c8' : '#111214';

  const padLeft = 46;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 34;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  ctx.font = '11px "Fira Code", monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  for (let i = 0; i <= 5; i++) {
    const pct = i * 20;
    const y = padTop + chartH * (1 - pct / 100);

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(width - padRight, y);
    ctx.stroke();

    ctx.fillStyle = labelColor;
    ctx.fillText(`${pct}%`, padLeft - 8, y);
  }

  const totalSteps = history ? history.length : 0;
  if (totalSteps > 0) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i < totalSteps; i++) {
      const x = padLeft + (chartW / Math.max(totalSteps - 1, 1)) * i;
      ctx.fillStyle = i === currentIndex ? primaryLineColor : labelColor;
      ctx.fillText(`${i + 1}`, x, height - padBottom + 10);
    }
  }

  if (!history || totalSteps === 0 || currentIndex < 0) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = labelColor;
    ctx.font = '13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Click "Simulate" or "Next Step" to plot live Hit Accuracy & Fault Rate', padLeft + chartW / 2, padTop + chartH / 2);
    return;
  }

  const hitPoints = [];
  const faultPoints = [];
  for (let i = 0; i <= currentIndex; i++) {
    const step = history[i];
    const total = i + 1;
    hitPoints.push((step.hitsCount / total) * 100);
    faultPoints.push((step.faultsCount / total) * 100);
  }

  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = '#f87171';
  ctx.lineWidth = 2;
  ctx.beginPath();
  faultPoints.forEach((val, idx) => {
    const x = padLeft + (chartW / Math.max(totalSteps - 1, 1)) * idx;
    const y = padTop + chartH * (1 - val / 100);
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.restore();

  ctx.strokeStyle = primaryLineColor;
  ctx.lineWidth = 2.75;
  ctx.beginPath();
  hitPoints.forEach((val, idx) => {
    const x = padLeft + (chartW / Math.max(totalSteps - 1, 1)) * idx;
    const y = padTop + chartH * (1 - val / 100);
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  hitPoints.forEach((val, idx) => {
    const x = padLeft + (chartW / Math.max(totalSteps - 1, 1)) * idx;
    const y = padTop + chartH * (1 - val / 100);
    ctx.fillStyle = primaryLineColor;
    ctx.beginPath();
    ctx.arc(x, y, idx === currentIndex ? 5.5 : 3.5, 0, Math.PI * 2);
    ctx.fill();
  });
}

export function renderBeladyComparisonChart(canvasId, referenceString, activeFrameCount = 3, mode = 'faults') {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !canvas.parentElement) return;

  const wrapper = canvas.parentElement;
  const width = wrapper.clientWidth;
  const height = wrapper.clientHeight || 260;
  if (width <= 0 || height <= 0) return;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  import('../../js/replacement/algorithms.js').then(({ simulateFIFO, simulateLRU, simulateOptimal }) => {
    const framesRange = [1, 2, 3, 4, 5, 6, 7, 8];
    const fifoSims = framesRange.map(f => simulateFIFO(referenceString, f));
    const lruSims = framesRange.map(f => simulateLRU(referenceString, f));
    const optSims = framesRange.map(f => simulateOptimal(referenceString, f));

    const fifoData = mode === 'hitRatio'
      ? fifoSims.map(s => Math.round(s.hitRatio * 100))
      : fifoSims.map(s => s.totalFaults);
    const lruData = mode === 'hitRatio'
      ? lruSims.map(s => Math.round(s.hitRatio * 100))
      : lruSims.map(s => s.totalFaults);
    const optData = mode === 'hitRatio'
      ? optSims.map(s => Math.round(s.hitRatio * 100))
      : optSims.map(s => s.totalFaults);

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const gridColor = isDark ? 'rgba(227, 246, 200, 0.08)' : 'rgba(17, 18, 20, 0.08)';
    const labelColor = isDark ? '#9ca39e' : '#575b56';
    const activeLabelColor = isDark ? '#e3f6c8' : '#111214';

    const padLeft = 46;
    const padRight = 24;
    const padTop = 20;
    const padBottom = 42;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;
    const maxVal = mode === 'hitRatio'
      ? 100
      : Math.max(...fifoData, ...lruData, ...optData, 10);

    ctx.font = '11px "Fira Code", monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const ticks = mode === 'hitRatio' ? 5 : 4;
    for (let i = 0; i <= ticks; i++) {
      const val = Math.round((maxVal / ticks) * i);
      const y = padTop + chartH * (1 - val / maxVal);
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();

      ctx.fillStyle = labelColor;
      ctx.fillText(mode === 'hitRatio' ? `${val}%` : `${val}`, padLeft - 8, y);
    }

    if (activeFrameCount >= 1 && activeFrameCount <= 8) {
      const activeX = padLeft + (chartW / (framesRange.length - 1)) * (activeFrameCount - 1);
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = activeLabelColor;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(activeX, padTop);
      ctx.lineTo(activeX, padTop + chartH);
      ctx.stroke();
      ctx.restore();
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    framesRange.forEach((f, idx) => {
      const x = padLeft + (chartW / (framesRange.length - 1)) * idx;
      const isSelected = f === activeFrameCount;
      ctx.font = isSelected ? 'bold 12px "Fira Code", monospace' : '11px "Fira Code", monospace';
      ctx.fillStyle = isSelected ? activeLabelColor : labelColor;
      ctx.fillText(`${f}`, x, height - padBottom + 10);
    });

    ctx.fillStyle = labelColor;
    ctx.font = '11px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Number of frames', padLeft + chartW / 2, height - 14);

    function plotSeries(series, color) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      series.forEach((v, idx) => {
        const x = padLeft + (chartW / (framesRange.length - 1)) * idx;
        const y = padTop + chartH * (1 - v / maxVal);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      series.forEach((v, idx) => {
        const x = padLeft + (chartW / (framesRange.length - 1)) * idx;
        const y = padTop + chartH * (1 - v / maxVal);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, idx + 1 === activeFrameCount ? 5.5 : 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    plotSeries(fifoData, '#fbbf24');
    plotSeries(lruData, '#9ca39e');
    plotSeries(optData, '#4ade80');
  });
}