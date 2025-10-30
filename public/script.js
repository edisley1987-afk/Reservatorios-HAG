// script.js
const SENSORS = {
  "Reservatorio_Elevador_current": {
    name: "Reservatório Elevador",
    capacidade: 20000,
    leituraVazio: 0.004168,
    leituraCheio: 0.008096,
  },
  "Reservatorio_Osmose_current": {
    name: "Reservatório Osmose",
    capacidade: 200,
    leituraVazio: 0.00505,
    leituraCheio: 0.006412,
  },
  "Reservatorio_CME_current": {
    name: "Reservatório CME",
    capacidade: 1000,
    leituraVazio: 0.004088,
    leituraCheio: 0.004408,
  },
  "Agua_Abrandada_current": {
    name: "Reservatório Água Abrandada",
    capacidade: 9000,
    leituraVazio: 0.004008,
    leituraCheio: 0.004929,
  },
};

// Faz o cálculo de porcentagem e litros
function calcularPercentELitros(valor, cfg) {
  const min = cfg.leituraVazio;
  const max = cfg.leituraCheio;
  const capacidade = cfg.capacidade;
  if (valor <= min) return { pct: 0, litros: 0 };
  if (valor >= max) return { pct: 100, litros: capacidade };
  const pct = ((valor - min) / (max - min)) * 100;
  const litros = Math.round((pct / 100) * capacidade);
  return { pct, litros };
}

// Renderiza os cards
function renderCards(data) {
  const container = document.getElementById("cards");
  container.innerHTML = "";
  Object.keys(SENSORS).forEach((key) => {
    const sensorCfg = SENSORS[key];
    const leitura = data.find((d) => d.ref === key);
    const { pct, litros } = leitura
      ? calcularPercentELitros(leitura.value, sensorCfg)
      : { pct: 0, litros: 0 };
    const color =
      pct < 20 ? "#d9534f" : pct < 50 ? "#f0ad4e" : "#5cb85c";
    const hora = leitura
      ? new Date(Number(leitura.time) / 1000).toLocaleString()
      : "N/A";

    const card = `
      <div class="card">
        <h3>${sensorCfg.name}</h3>
        <div class="metric">${pct.toFixed(1)}% <span class="small">(${litros} L)</span></div>
        <div class="bar"><div class="fill" style="width:${pct}%; background:${color}"></div></div>
        <div class="sub">Capacidade: ${sensorCfg.capacidade.toLocaleString()} L</div>
        <div class="sub">Última leitura: ${hora}</div>
      </div>
    `;
    container.innerHTML += card;
  });
}

// Renderiza tabela
function renderTable(data) {
  const wrap = document.getElementById("tableWrap");
  if (!wrap) return;
  let html = `
    <table>
      <thead>
        <tr><th>Hora</th><th>Sensor</th><th>Valor</th><th>%</th><th>Litros</th></tr>
      </thead>
      <tbody>
  `;
  data.forEach((r) => {
    const cfg = SENSORS[r.ref];
    if (!cfg) return;
    const { pct, litros } = calcularPercentELitros(r.value, cfg);
    const hora = new Date(Number(r.time) / 1000).toLocaleString();
    html += `
      <tr>
        <td>${hora}</td>
        <td>${cfg.name}</td>
        <td>${r.value.toFixed(6)}</td>
        <td>${pct.toFixed(1)}%</td>
        <td>${litros}</td>
      </tr>
    `;
  });
  html += "</tbody></table>";
  wrap.innerHTML = html;
}

// Atualiza dashboard
async function atualizarDashboard() {
  try {
    const res = await fetch("/api/readings", { cache: "no-store" });
    if (!res.ok) throw new Error("Falha ao buscar leituras");
    const data = await res.json();
    renderCards(data);
    renderTable(data);
    document.getElementById("lastUpdate").textContent = new Date().toLocaleString();
  } catch (err) {
    console.error("Erro ao atualizar dashboard:", err);
  }
}

// Primeira atualização imediata e depois a cada 30s
atualizarDashboard();
setInterval(atualizarDashboard, 30000);
