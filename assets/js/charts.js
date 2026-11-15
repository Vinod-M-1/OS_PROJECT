export function renderFaultsChart(canvasId, referenceString) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  // Set canvas display size
  const width = canvas.parentElement.clientWidth - 32;
  const height = 320;
  canvas.width = width * window.devicePixelRatio;
  canvas.height = height * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  // Compute faults for frames 1 to 8 for FIFO, LRU, Optimal
  import('../../js/replacement/algorithms.js').then(({ simulateFIFO, simulateLRU, simulateOptimal }) => {
    let framesRange = [1, 2, 3, 4, 5, 6, 7, 8];
    let fifoFaults = framesRange.map(f => simulateFIFO(referenceString, f).totalFaults);
    let lruFaults = framesRange.map(f => simulateLRU(referenceString, f).totalFaults);
    let optFaults = framesRange.map(f => simulateOptimal(referenceString, f).totalFaults);

    // Draw chart background & grid
    ctx.clearRect(0, 0, width, height);
    
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    let maxFault = Math.max(...fifoFaults, ...lruFaults, ...optFaults, 20);
    let minFault = 0;

    // Draw horizontal grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      let y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();

      // Label
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.fillText(Math.round(maxFault - (maxFault / 4) * i), padding - 30, y + 4);
    }

    // Draw X-axis frame labels
    framesRange.forEach((frame, idx) => {
      let x = padding + (chartWidth / (framesRange.length - 1)) * idx;
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(frame, x - 4, height - 15);
    });

    function drawLine(data, color) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      data.forEach((val, idx) => {
        let x = padding + (chartWidth / (framesRange.length - 1)) * idx;
        let y = padding + chartHeight - ((val - minFault) / (maxFault - minFault)) * chartHeight;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Draw points
      data.forEach((val, idx) => {
        let x = padding + (chartWidth / (framesRange.length - 1)) * idx;
        let y = padding + chartHeight - ((val - minFault) / (maxFault - minFault)) * chartHeight;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    drawLine(fifoFaults, '#f59e0b'); // FIFO (Orange)
    drawLine(lruFaults, '#818cf8');  // LRU (Purple/Indigo)
    drawLine(optFaults, '#22c55e');  // Optimal (Green)
  });
}