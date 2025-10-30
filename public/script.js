<script>
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

// --- Função automática de escala e cálculo ---
function calcularPercentELitros(leituraRaw, cfg) {
  const vazio = Number(cfg.leituraVazio) || 0;
  const altura = Number(cfg.alturaRes) || 1;
  const cap = Number(cfg.capacidadeTotal) || 1;

  let leitura = Number(leituraRaw);
  if (!isFinite(leitura)) return { perc: 0, litros: 0, leituraUsada: leituraRaw };

  const fatores = [1, 10, 100, 1000, 10000, 100000, 1000000];
  const testar = (val) => {
    const delta = val - vazio;
    const perc = (altura === 0) ? 0 : (100 * delta / altura);
    return perc;
  };

  for (let f of fatores) {
    const valTest = leitura * f;
    const percTest = testar(valTest);
    if (percTest >= -5 && percTest <= 120) {
      const perc = Math.min(100, Math.max(0, percTest));
      const litros = Math.round((cap * perc) / 100);
      return { perc, litros, leituraUsada: valTest, fator: f };
    }
  }

  if (leitura >= 0 && leitura <= 1) {
    const perc = Math.min(100, Math.max(0, leitura * 100));
    const litros = Math.round((cap * perc) / 100);
    return { perc, litros, leituraUsada: leitura, fator: 1 };
  }

  const perc = Math.min(100, Math.max(0, testar(leitura)));
  const litros = Math.round((cap * perc) / 100);
  return { perc, litros, leituraUsada: leitura, fator: 1 };
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
    const { perc: pct, litros } = last
      ? calcularPercentELitros(last.value, {
          leituraVazio: cfg.leituraVazio,
          alturaRes: cfg.leituraCheio - cfg.leituraVazio,
          capacidadeTotal: cfg.capacidade,
        })
      : { perc: 0, litros: 0 };

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
    const { perc: pct, litros } = cfg
      ? calcularPercentELitros(r.value, {
          leituraVazio: cfg.leituraVazio,
          alturaRes: cfg.leituraCheio - cfg.leituraVazio,
          capacidadeTotal: cfg.capacidade,
        })
      : { perc: 0, litros: 0 };
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
</script>

