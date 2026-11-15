export function simulateFIFO(referenceString, frameCount) {
  const frames = new Array(frameCount).fill(null);
  const history = [];
  let faults = 0;
  let hits = 0;
  const fifoQueue = [];

  referenceString.forEach((page, stepIndex) => {
    const hit = frames.includes(page);
    let victim = null;
    let targetSlot = -1;

    if (hit) {
      hits++;
      targetSlot = frames.indexOf(page);
    } else {
      faults++;
      if (frames.includes(null)) {
        targetSlot = frames.indexOf(null);
        frames[targetSlot] = page;
        fifoQueue.push(page);
      } else {
        victim = fifoQueue.shift();
        targetSlot = frames.indexOf(victim);
        frames[targetSlot] = page;
        fifoQueue.push(page);
      }
    }

    history.push({
      step: stepIndex + 1,
      page,
      frames: [...frames],
      isHit: hit,
      victim,
      targetSlot,
      faultsCount: faults,
      hitsCount: hits
    });
  });

  return {
    history,
    totalFaults: faults,
    totalHits: hits,
    hitRatio: referenceString.length ? (hits / referenceString.length) : 0
  };
}

export function simulateLRU(referenceString, frameCount) {
  const frames = new Array(frameCount).fill(null);
  const history = [];
  let faults = 0;
  let hits = 0;
  const lastUsed = new Map();

  referenceString.forEach((page, stepIndex) => {
    const hit = frames.includes(page);
    let victim = null;
    let targetSlot = -1;

    if (hit) {
      hits++;
      targetSlot = frames.indexOf(page);
    } else {
      faults++;
      if (frames.includes(null)) {
        targetSlot = frames.indexOf(null);
        frames[targetSlot] = page;
      } else {
        let lruPage = frames[0];
        let minTime = lastUsed.has(lruPage) ? lastUsed.get(lruPage) : -1;

        frames.forEach(f => {
          const t = lastUsed.has(f) ? lastUsed.get(f) : -1;
          if (t < minTime) {
            minTime = t;
            lruPage = f;
          }
        });

        victim = lruPage;
        targetSlot = frames.indexOf(victim);
        frames[targetSlot] = page;
      }
    }
    lastUsed.set(page, stepIndex);

    history.push({
      step: stepIndex + 1,
      page,
      frames: [...frames],
      isHit: hit,
      victim,
      targetSlot,
      faultsCount: faults,
      hitsCount: hits
    });
  });

  return {
    history,
    totalFaults: faults,
    totalHits: hits,
    hitRatio: referenceString.length ? (hits / referenceString.length) : 0
  };
}

export function simulateOptimal(referenceString, frameCount) {
  const frames = new Array(frameCount).fill(null);
  const history = [];
  let faults = 0;
  let hits = 0;

  referenceString.forEach((page, stepIndex) => {
    const hit = frames.includes(page);
    let victim = null;
    let targetSlot = -1;

    if (hit) {
      hits++;
      targetSlot = frames.indexOf(page);
    } else {
      faults++;
      if (frames.includes(null)) {
        targetSlot = frames.indexOf(null);
        frames[targetSlot] = page;
      } else {
        let farthestIdx = -1;
        let pageToReplace = frames[0];

        for (const f of frames) {
          const nextUse = referenceString.indexOf(f, stepIndex + 1);
          if (nextUse === -1) {
            pageToReplace = f;
            break;
          } else if (nextUse > farthestIdx) {
            farthestIdx = nextUse;
            pageToReplace = f;
          }
        }

        victim = pageToReplace;
        targetSlot = frames.indexOf(victim);
        frames[targetSlot] = page;
      }
    }

    history.push({
      step: stepIndex + 1,
      page,
      frames: [...frames],
      isHit: hit,
      victim,
      targetSlot,
      faultsCount: faults,
      hitsCount: hits
    });
  });

  return {
    history,
    totalFaults: faults,
    totalHits: hits,
    hitRatio: referenceString.length ? (hits / referenceString.length) : 0
  };
}