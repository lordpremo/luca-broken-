// filename: app.js
// Sample static data (you can later replace with real data from API/CSV)
const sampleMultipliers = [
  1.12, 1.45, 2.3, 8.5, 12.4, 1.01, 1.2, 1.35, 3.4, 5.6,
  1.1, 1.3, 1.4, 1.2, 9.8, 15.2, 2.1, 1.05, 1.2, 1.6,
  1.3, 1.4, 1.1, 6.7, 7.8, 1.2, 1.3, 1.5, 10.2, 2.4,
  1.09, 1.15, 1.2, 4.5, 5.1, 1.3, 1.4, 1.1, 2.9, 3.3
];

// Config thresholds
const HIGH_THRESHOLD = 5;     // ≥ 5x = high
const LOW_THRESHOLD = 1.5;    // ≤ 1.5x = low;
const MIN_ROUNDS_FOR_SIGNAL = 10;

document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const refreshBtn = document.getElementById("refreshBtn");
  refreshBtn.addEventListener("click", () => {
    // For now, just re-render using same sample data
    renderAll(sampleMultipliers);
    refreshBtn.classList.add("clicked");
    setTimeout(() => refreshBtn.classList.remove("clicked"), 200);
  });

  renderAll(sampleMultipliers);
});

function renderAll(multipliers) {
  const rounds = buildRounds(multipliers);
  updateStats(rounds);
  updateSignals(rounds);
  renderTable(rounds);
  renderGraph(rounds);
}

function buildRounds(multipliers) {
  // Latest on top
  const reversed = [...multipliers].reverse();
  return reversed.map((multiplier, index) => {
    const type = classifyMultiplier(multiplier);
    return {
      id: index + 1,
      multiplier,
      type
    };
  });
}

function classifyMultiplier(m) {
  if (m >= HIGH_THRESHOLD) return "high";
  if (m <= LOW_THRESHOLD) return "low";
  return "mid";
}

function updateStats(rounds) {
  const total = rounds.length;
  const multipliers = rounds.map(r => r.multiplier);
  const sum = multipliers.reduce((a, b) => a + b, 0);
  const avg = total ? sum / total : 0;
  const highest = total ? Math.max(...multipliers) : 0;
  const lowest = total ? Math.min(...multipliers) : 0;

  const highStreak = longestStreak(rounds, "high");
  const lowStreak = longestStreak(rounds, "low");

  setText("statTotalRounds", total);
  setText("statAverage", avg.toFixed(2) + "x");
  setText("statHighest", highest.toFixed(2) + "x");
  setText("statLowest", lowest.toFixed(2) + "x");
  setText("statHighStreak", highStreak);
  setText("statLowStreak", lowStreak);
}

function longestStreak(rounds, type) {
  let max = 0;
  let current = 0;
  for (const r of rounds) {
    if (r.type === type) {
      current++;
      if (current > max) max = current;
    } else {
      current = 0;
    }
  }
  return max;
}

function updateSignals(rounds) {
  const signalEl = document.getElementById("signalStatus");
  const labelEl = signalEl.querySelector(".signal-label");
  const detailEl = signalEl.querySelector(".signal-detail");

  if (rounds.length < MIN_ROUNDS_FOR_SIGNAL) {
    setSignalClass(signalEl, "neutral");
    labelEl.textContent = "Analyzing pattern...";
    detailEl.textContent = "Waiting for enough rounds to detect a pattern.";
    return;
  }

  const last20 = rounds.slice(0, 20);
  const highCount = last20.filter(r => r.type === "high").length;
  const lowCount = last20.filter(r => r.type === "low").length;

  if (highCount >= 5 && highCount > lowCount) {
    setSignalClass(signalEl, "green");
    labelEl.textContent = "High streak detected";
    detailEl.textContent = `Last 20 rounds: ${highCount} high (≥ ${HIGH_THRESHOLD}x). Pattern leaning to high side.`;
  } else if (lowCount >= 8 && lowCount > highCount) {
    setSignalClass(signalEl, "red");
    labelEl.textContent = "Low streak detected";
    detailEl.textContent = `Last 20 rounds: ${lowCount} low (≤ ${LOW_THRESHOLD}x). Pattern leaning to low side.`;
  } else if (highCount >= 3 && lowCount >= 3) {
    setSignalClass(signalEl, "yellow");
    labelEl.textContent = "Unstable pattern";
    detailEl.textContent = `Mix of high and low rounds. No clear direction.`;
  } else {
    setSignalClass(signalEl, "neutral");
    labelEl.textContent = "Neutral pattern";
    detailEl.textContent = `No strong streak detected in last 20 rounds.`;
  }
}

function setSignalClass(el, mode) {
  el.classList.remove("green", "red", "yellow", "neutral");
  el.classList.add(mode);
}

function renderTable(rounds) {
  const tbody = document.getElementById("roundsTableBody");
  tbody.innerHTML = "";

  const limited = rounds.slice(0, 30);
  limited.forEach((round, index) => {
    const tr = document.createElement("tr");

    const tdIndex = document.createElement("td");
    tdIndex.textContent = index + 1;

    const tdMultiplier = document.createElement("td");
    tdMultiplier.textContent = round.multiplier.toFixed(2) + "x";
    tdMultiplier.classList.add("multiplier", round.type);

    const tdType = document.createElement("td");
    const typeSpan = document.createElement("span");
    typeSpan.classList.add("type-pill");
    if (round.type === "high") {
      typeSpan.textContent = "High";
    } else if (round.type === "low") {
      typeSpan.textContent = "Low";
    } else {
      typeSpan.textContent = "Mid";
    }
    tdType.appendChild(typeSpan);

    const tdStreak = document.createElement("td");
    tdStreak.textContent = streakLabel(rounds, index);

    tr.appendChild(tdIndex);
    tr.appendChild(tdMultiplier);
    tr.appendChild(tdType);
    tr.appendChild(tdStreak);

    tbody.appendChild(tr);
  });
}

function streakLabel(rounds, indexInLimited) {
  // We only show simple label: part of high/low streak or not
  // Because we reversed earlier, index 0 is latest
  const globalIndex = indexInLimited; // in this simple version, same
  const current = rounds[globalIndex];
  if (!current) return "-";

  const type = current.type;
  if (type === "mid") return "-";

  let length = 1;

  // Look forward (older)
  for (let i = globalIndex + 1; i < rounds.length; i++) {
    if (rounds[i].type === type) length++;
    else break;
  }

  if (length >= 3) {
    return `${type === "high" ? "High" : "Low"} streak (${length})`;
  }
  return "-";
}

function renderGraph(rounds) {
  const canvas = document.getElementById("trendCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  if (!rounds.length) return;

  const multipliers = rounds.map(r => r.multiplier);
  const max = Math.max(...multipliers);
  const min = Math.min(...multipliers);

  const padding = 30;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  // Axes
  ctx.strokeStyle = "rgba(155, 155, 179, 0.6)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();

  // Y labels (min, mid, max)
  ctx.fillStyle = "rgba(245, 245, 247, 0.8)";
  ctx.font = "11px system-ui";

  const mid = (max + min) / 2;
  ctx.fillText(max.toFixed(1) + "x", 4, padding + 4);
  ctx.fillText(mid.toFixed(1) + "x", 4, height / 2 + 4);
  ctx.fillText(min.toFixed(1) + "x", 4, height - padding);

  const count = rounds.length;
  const stepX = innerWidth / Math.max(count - 1, 1);

  // Line
  ctx.lineWidth = 2;
  ctx.beginPath();
  rounds.forEach((round, index) => {
    const x = padding + index * stepX;
    const normalized = (round.multiplier - min) / (max - min || 1);
    const y = height - padding - normalized * innerHeight;

    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  const gradient = ctx.createLinearGradient(padding, padding, width - padding, height - padding);
  gradient.addColorStop(0, "#f5c451");
  gradient.addColorStop(1, "#ff4b5c");
  ctx.strokeStyle = gradient;
  ctx.stroke();

  // Points
  rounds.forEach((round, index) => {
    const x = padding + index * stepX;
    const normalized = (round.multiplier - min) / (max - min || 1);
    const y = height - padding - normalized * innerHeight;

    let color;
    if (round.type === "high") color = "#4cd964";
    else if (round.type === "low") color = "#ff4b5c";
    else color = "#ffd666";

    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
