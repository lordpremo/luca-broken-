// filename: app.js
document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const analyzeBtn = document.getElementById("analyzeBtn");
  analyzeBtn.addEventListener("click", handleAnalyze);
});

function handleAnalyze() {
  const slipText = document.getElementById("slipText").value.trim();
  const stake = parseFloat(document.getElementById("stake").value || "0");
  const riskProfile = document.getElementById("riskProfile").value;

  if (!slipText) {
    alert("Bandika kwanza betting slip yako.");
    return;
  }

  const lines = slipText.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  if (!lines.length) {
    alert("Hakuna mechi zilizopatikana kwenye slip.");
    return;
  }

  const matches = parseMatches(lines);
  if (!matches.length) {
    alert("Nimeshindwa kusoma odds. Hakikisha kila mstari una odds mwisho, mfano: @ 1.85");
    return;
  }

  updateSummary(matches, stake);
  updateRiskAnalysis(matches, riskProfile);
  updateTips(matches, riskProfile);
}

function parseMatches(lines) {
  const matches = [];

  lines.forEach(line => {
    // tunatafuta odds kama namba ya mwisho kwenye mstari
    const parts = line.split("@");
    if (parts.length < 2) return;

    const namePart = parts[0].trim();
    const oddsPart = parts[1].trim().split(" ")[0];
    const odds = parseFloat(oddsPart.replace(",", "."));

    if (!odds || odds <= 1) return;

    matches.push({
      name: namePart || "Mechi isiyojulikana",
      odds,
    });
  });

  return matches;
}

function updateSummary(matches, stake) {
  const count = matches.length;
  const oddsArr = matches.map(m => m.odds);
  const totalOdds = oddsArr.reduce((a, b) => a * b, 1);
  const avgOdds = oddsArr.reduce((a, b) => a + b, 0) / count;

  const potentialWin = stake > 0 ? stake * totalOdds : 0;

  setText("sumMatches", count);
  setText("sumAvgOdds", avgOdds.toFixed(2));
  setText("sumTotalOdds", totalOdds.toFixed(2));
  setText("sumPotentialWin", stake > 0 ? formatMoney(potentialWin) + " TZS" : "-");

  const confidence = calculateConfidence(matches);
  updateScore(confidence, matches, stake);
}

function calculateConfidence(matches) {
  const count = matches.length;
  const oddsArr = matches.map(m => m.odds);

  const avgOdds = oddsArr.reduce((a, b) => a + b, 0) / count;
  const highOddsCount = oddsArr.filter(o => o >= 3).length;
  const veryHighOddsCount = oddsArr.filter(o => o >= 5).length;

  let score = 100;

  // adhabu kwa mechi nyingi sana
  if (count > 5) score -= (count - 5) * 4;
  if (count > 10) score -= (count - 10) * 3;

  // adhabu kwa average odds kubwa
  if (avgOdds > 2) score -= (avgOdds - 2) * 8;
  if (avgOdds > 3) score -= (avgOdds - 3) * 10;

  // adhabu kwa high odds
  score -= highOddsCount * 4;
  score -= veryHighOddsCount * 6;

  if (score < 5) score = 5;
  if (score > 100) score = 100;

  return Math.round(score);
}

function updateScore(score, matches, stake) {
  const scoreValueEl = document.getElementById("scoreValue");
  const scoreBarEl = document.getElementById("scoreBar");
  const scoreNoteEl = document.getElementById("scoreNote");

  scoreValueEl.textContent = score + "/100";
  scoreBarEl.style.width = score + "%";

  let note = "";

  if (score >= 80) {
    note = "Slip yako ina nidhamu nzuri sana. Bado hakuna guarantee ya ushindi, lakini risk iko chini ukilinganisha na slips nyingi.";
  } else if (score >= 60) {
    note = "Slip yako iko sawa, lakini bado ina risk ya wastani. Unaweza kupunguza mechi au odds kubwa ili kuongeza usalama.";
  } else if (score >= 40) {
    note = "Slip yako ina risk kubwa. Odds au idadi ya mechi ni nyingi. Hii ni slip ya kubet kwa kiasi kidogo tu.";
  } else {
    note = "Slip hii ni hatari sana. Odds kubwa sana au mechi nyingi. Hii ni slip ya kubet kwa utani, si kwa pesa ya muhimu.";
  }

  if (stake > 0) {
    note += " Kumbuka: usibet zaidi ya kiasi ambacho uko tayari kupoteza.";
  }

  scoreNoteEl.textContent = note;
}

function updateRiskAnalysis(matches, riskProfile) {
  const container = document.getElementById("riskList");
  container.innerHTML = "";
  container.classList.remove("empty");

  matches.forEach(m => {
    const riskLevel = classifyMatchRisk(m.odds, riskProfile);

    const item = document.createElement("div");
    item.classList.add("risk-item");

    const line = document.createElement("div");
    line.classList.add("risk-line");

    const left = document.createElement("div");
    const right = document.createElement("div");

    const matchName = document.createElement("div");
    matchName.classList.add("risk-match");
    matchName.textContent = m.name;

    const oddsEl = document.createElement("div");
    oddsEl.classList.add("risk-odds");
    oddsEl.textContent = "Odds: " + m.odds.toFixed(2);

    left.appendChild(matchName);
    left.appendChild(oddsEl);

    const tag = document.createElement("span");
    tag.classList.add("risk-tag", riskLevel.level);
    tag.textContent = riskLevel.label;

    right.appendChild(tag);

    line.appendChild(left);
    line.appendChild(right);

    const desc = document.createElement("div");
    desc.classList.add("risk-desc");
    desc.style.fontSize = "12px";
    desc.style.color = "var(--text-muted)";
    desc.textContent = riskLevel.desc;

    item.appendChild(line);
    item.appendChild(desc);

    container.appendChild(item);
  });
}

function classifyMatchRisk(odds, profile) {
  // profile inaathiri jinsi tunavyoona odds
  let base = "medium";

  if (odds < 1.4) base = "low";
  else if (odds <= 2.2) base = "medium";
  else if (odds <= 3.5) base = "high";
  else base = "high";

  if (profile === "safe") {
    if (odds > 2) base = "high";
  } else if (profile === "aggressive") {
    if (odds <= 2) base = "low";
  }

  if (base === "low") {
    return {
      level: "low",
      label: "Low risk",
      desc: "Odds ziko upande wa usalama zaidi. Bado hakuna guarantee, lakini hii mechi ni ya upande relatively salama.",
    };
  } else if (base === "medium") {
    return {
      level: "medium",
      label: "Medium risk",
      desc: "Risk ya kawaida. Hii mechi si salama sana, si hatari sana. Inategemea strategy yako ya bankroll.",
    };
  } else {
    return {
      level: "high",
      label: "High risk",
      desc: "Odds ni kubwa au mechi ni ngumu. Hii mechi inaweza kuharibu slip nzima. Fikiria kuipunguza au kubet kiasi kidogo.",
    };
  }
}

function updateTips(matches, profile) {
  const tipsList = document.getElementById("tipsList");
  tipsList.innerHTML = "";

  const count = matches.length;
  const oddsArr = matches.map(m => m.odds);
  const avgOdds = oddsArr.reduce((a, b) => a + b, 0) / count;
  const highOdds = matches.filter(m => m.odds >= 3);
  const veryHighOdds = matches.filter(m => m.odds >= 5);

  const tips = [];

  if (count > 8) {
    tips.push("Slip yako ina mechi " + count + ". Jaribu kupunguza hadi 4–7 ili kuongeza nafasi ya kupita.");
  } else if (count >= 5) {
    tips.push("Idadi ya mechi ni ya kati. Kama unataka kuwa salama zaidi, punguza mechi 1–2.");
  } else {
    tips.push("Idadi ya mechi ni ndogo. Hii ni nzuri kwa nidhamu ya bankroll.");
  }

  if (avgOdds > 2.5) {
    tips.push("Average odds ya slip yako ni " + avgOdds.toFixed(2) + ". Hii inaonyesha slip ni ya risk kubwa.");
  } else {
    tips.push("Average odds ya slip yako ni " + avgOdds.toFixed(2) + ". Hii ni range nzuri kwa slip yenye nidhamu.");
  }

  if (highOdds.length > 0) {
    tips.push("Kuna mechi " + highOdds.length + " zenye odds ≥ 3. Hizi ndizo hatari zaidi kwenye slip.");
  }

  if (veryHighOdds.length > 0) {
    tips.push("Kuna mechi " + veryHighOdds.length + " zenye odds ≥ 5. Hizi ni mechi za kubet kwa utani, si kwa pesa ya muhimu.");
  }

  if (profile === "safe") {
    tips.push("Umechagua profile ya Safe. Epuka odds kubwa sana na slips zenye mechi nyingi.");
  } else if (profile === "balanced") {
    tips.push("Umechagua profile ya Balanced. Changanya odds ndogo na za kati, usijaze slip na odds kubwa pekee.");
  } else {
    tips.push("Umechagua profile ya Aggressive. Hakikisha unabet kiasi kidogo tu kwa slips za hatari.");
  }

  tips.forEach(t => {
    const li = document.createElement("li");
    li.textContent = t;
    tipsList.appendChild(li);
  });
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function formatMoney(value) {
  const v = Number.isFinite(value) ? value : 0;
  return v.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
