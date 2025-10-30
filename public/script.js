const SENSORS = {
  "Reservatorio_Elevador_current": {
    id: "Reservatorio_Elevador_current",
    name: "Reservatório Elevador",
    capacidade: 20000,
    leituraVazio: 0.004168,
    leituraCheio: 0.008096,
  },
  "Reservatorio_Osmose_current": {
    id: "Reservatorio_Osmose_current",
    name: "Reservatório Osmose",
    capacidade: 200,
    leituraVazio: 0.00505,
    leituraCheio: 0.006412,
  },
  "Reservatorio_CME_current": {
    id: "Reservatorio_CME_current",
    name: "Reservatório CME",
    capacidade: 1000,
    leituraVazio: 0.004088,
    leituraCheio: 0.004408,
  },
  "Agua_Abrandada_current": {
    id: "Agua_Abrandada_current",
    name: "Reservatório Água Abrandada",
    capacidade: 9000,
    leituraVazio: 0.004008,
    leituraCheio: 0.004929,
  },
};

let allReadings = [];

function computeFromValue(sensorCfg, rawValue) {
  const min = sensorCfg.leituraVazio,
    max = sensorCfg.leituraCheio;
  let pct = 0;
  if (max > min) {
    pct = (rawValue - min) / (max - min);
    pct = Math.max(0, Math.min(1, pct));
  }
  const litros = Math.round(sensorCfg.capacidade * pct);
  return { pct: pct * 100, litros };
}

function latestForSensor(ref) {
  for (let i = allReadings.length - 1; i >= 0; i--) {
    if (allReadings[i].ref === ref) return allReadings[i];
  }
  return null;
}

function renderCards() {
  const container = document.getElementById("cards");
  container.innerHTML = "";
  Object.values(SENSORS).forEach((cfg) => {
    const last = latestForSensor(cfg.id);
    const { pct, litros } = last
      ? computeFromValue(cfg, last.value)
      : { pct: 0, litros: 0 };
    const color =
      pct < 20 ? "var(--red)" : pct < 50 ? "var(--yellow)" : "var(--green)";
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.sensor = cfg.id;
    card.innerHTML = `
      <h3>${cfg.name}</h3>
      <div class="metric" id="${cfg.id}_metric">${pct.toFixed(
      1
    )}% &nbsp; <span class="small">(${litros} L)</span></div>
      <div class="bar"><div id="${cfg.id}_fill" class="fill" style="width:${pct}%; background:${color}"></div></div>
      <div class="sub">Capacidade: ${cfg.capacidade.toLocaleString()} L</div>
      <div class="sub">Última: <span id="${cfg.id}_last">${
      last ? new Date(last.ts).toLocaleString() : "N/A"
    }</span></div>
    `;
    container.appendChild(card);
  });
}

function renderTable() {
  const wrap = document.getElementById("tableWrap");
  const rows = [...allReadings].reverse();
  const html = [];
  html.push(
    "<table><thead><tr><th>Hora</th><th>Sensor</th><th>Valor</th><th>%</th><th>Litros</th></tr></thead><tbody>"
  );
  for (const r of rows) {
    const cfg = SENSORS[r.ref] || null;
    const name = cfg ? cfg.name : r.ref;
    const { pct, litros } = cfg
      ? computeFromValue(cfg, r.value)
      : { pct: 0, litros: 0 };
    html.push(`<tr>
      <td>${new Date(r.ts).toLocaleString()}</td>
      <td>${name}</td>
      <td>${Number(r.value).toFixed(6)}</td>
      <td>${pct.toFixed(1)}%</td>
      <td>${litros}</td>
    </tr>`);
  }
  html.push("</tbody></table>");
  wrap.innerHTML = html.join("\n");
}

async function fetchReadings() {
  const endpoints = ["/api/data", "/api/send", "/api"];
  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json)) return json;
      }
    } catch (e) {}
  }
  return [];
}

async function atualizarDashboard() {
  try {
    const data = await fetchReadings();
    const normalized = data
      .map((d) => ({
        ref: d.ref || d.sensor,
        value: Number(d.value),
        ts: d.ts || new Date().toISOString(),
      }))
      .filter((d) => d.ref);
    allReadings = normalized;
    renderCards();
    renderTable();
    document.getElementById("lastUpdate").textContent =
      new Date().toLocaleString();
  } catch (err) {
    console.error("Erro atualizarDashboard", err);
  }
}

atualizarDashboard();
setInterval(atualizarDashboard, 300000);
