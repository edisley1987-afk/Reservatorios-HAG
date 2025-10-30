const chartCanvas = document.getElementById("chartCanvas");
let chartInstance = null;

// Função principal: atualiza cards, gráfico e tabela
function updateDashboard(dados) {
if (!dados || !dados.leituras || dados.leituras.length === 0) {
console.warn("Nenhum dado recebido da API.");
return;
}

// === Atualiza os cards ===
const cardsContainer = document.getElementById("cards");
cardsContainer.innerHTML = "";
dados.reservatorios.forEach(res => {
const card = document.createElement("div");
card.className = "card";
card.innerHTML = `       <h3>${res.nome}</h3>       <p><strong>Nível atual:</strong> ${res.nivel}%</p>       <p><strong>Volume:</strong> ${res.volume} L</p>       <p><strong>Status:</strong> ${res.status}</p>
    `;
cardsContainer.appendChild(card);
});

// === Atualiza o gráfico ===
const labels = dados.leituras.map(l => new Date(l.hora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
const datasets = dados.reservatorios.map((res, i) => ({
label: res.nome,
data: dados.leituras.map(l => l[res.id] || 0),
fill: false,
borderColor: `hsl(${i * 60}, 70%, 50%)`,
tension: 0.2
}));

if (chartInstance) {
chartInstance.destroy();
}

chartInstance = new Chart(chartCanvas, {
type: "line",
data: { labels, datasets },
options: {
responsive: true,
plugins: {
legend: { position: "bottom" },
title: { display: true, text: "Histórico de Níveis (Últimas 24h)" }
},
scales: {
y: { beginAtZero: true, max: 100, title: { display: true, text: "%" } },
x: { title: { display: true, text: "Hora" } }
}
}
});

// === Atualiza tabela ===
const tableWrap = document.getElementById("tableWrap");
let html = "<table><thead><tr><th>Hora</th>";

dados.reservatorios.forEach(r => html += `<th>${r.nome}</th>`);
html += "</tr></thead><tbody>";

dados.leituras.forEach(l => {
html += `<tr><td>${new Date(l.hora).toLocaleString("pt-BR")}</td>`;
dados.reservatorios.forEach(r => {
html += `<td>${l[r.id] !== undefined ? l[r.id] + "%" : "-"}</td>`;
});
html += "</tr>";
});

html += "</tbody></table>";
tableWrap.innerHTML = html;
}

// === Logout ===
document.getElementById("logoutBtn").addEventListener("click", () => {
window.location.href = "index.html";
});
// Função para alterar a cor do cartão conforme o percentual
function updateCardColor(cardElement, percent) {
  if (!cardElement) return;

  if (percent <= 20) {
    cardElement.style.backgroundColor = "#8B0000"; // vermelho escuro
  } else if (percent <= 50) {
    cardElement.style.backgroundColor = "#B8860B"; // amarelo escuro
  } else if (percent <= 80) {
    cardElement.style.backgroundColor = "#2E8B57"; // verde médio
  } else {
    cardElement.style.backgroundColor = "#006400"; // verde escuro (cheio)
  }
}
