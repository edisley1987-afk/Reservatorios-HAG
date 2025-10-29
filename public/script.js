// Sensor config (same values as server)
const SENSOR_CONFIG = {
  "Reservatorio_Elevador_current": { nome: "Reservatório Elevador", leituraVazio:4168, alturaRes:1.45, capacidadeTotal:20000 },
  "Reservatorio_Osmose_current": { nome: "Reservatório Osmose", leituraVazio:505, alturaRes:1.0, capacidadeTotal:200 },
  "Reservatorio_CME_current": { nome: "Reservatório CME", leituraVazio:4088, alturaRes:0.45, capacidadeTotal:1000 },
  "Agua_Abrandada_current": { nome: "Reservatório Água Abrandada", leituraVazio:4008, alturaRes:0.6, capacidadeTotal:9000 }
};

function computePercent(leitura, cfg){
  const delta = (Number(leitura)||0) - cfg.leituraVazio;
  const perc = Math.min(100, Math.max(0, (delta / cfg.alturaRes) * 100));
  return perc;
}
function computeLitros(perc, cfg){
  return (cfg.capacidadeTotal * perc) / 100;
}

function formatDate(ts){
  const d = new Date(ts);
  return d.toLocaleString();
}

async function carregar(){
  const resp = await fetch('/api/readings');
  const dados = await resp.json();

  // group by sensor ref
  const groups = {};
  for(const item of dados){
    if(!groups[item.ref]) groups[item.ref] = [];
    groups[item.ref].push(item);
  }

  // Render cards (latest value)
  const cardWrap = document.getElementById('cards');
  cardWrap.innerHTML = '';
  for(const key of Object.keys(SENSOR_CONFIG)){
    const cfg = SENSOR_CONFIG[key];
    const arr = groups[key] || [];
    const last = arr.length ? arr[arr.length-1] : null;
    const leitura = last ? Number(last.value) : cfg.leituraVazio;
    const perc = computePercent(leitura, cfg);
    const litros = computeLitros(perc, cfg);
    const color = perc<30 ? '#f87171' : perc<60 ? '#fbbf24' : '#34d399';
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<div class="title">${cfg.nome}</div>
      <div class="bar"><div class="fill" style="width:${perc}%;background:${color}">${perc.toFixed(1)}% - ${litros.toFixed(0)} L</div></div>
      <div style="margin-top:8px;font-size:12px;color:var(--muted)">Última: ${last?formatDate(last.timestamp):'N/A'}</div>`;
    cardWrap.appendChild(card);
  }

  // render table of last 24h
  const tableWrap = document.getElementById('tableWrap');
  let table = '<table><thead><tr><th>Hora</th><th>Sensor</th><th>Valor</th><th>%</th><th>Litros</th></tr></thead><tbody>';
  // sort global by timestamp
  const flat = dados.slice().sort((a,b)=>a.timestamp-b.timestamp);
  for(const row of flat){
    const cfg = SENSOR_CONFIG[row.ref] || null;
    const leitura = Number(row.value)||0;
    const perc = cfg ? computePercent(leitura,cfg) : 0;
    const litros = cfg ? computeLitros(perc,cfg) : 0;
    table += `<tr><td>${formatDate(row.timestamp)}</td><td>${cfg?cfg.nome:row.ref}</td><td>${leitura}</td><td>${perc.toFixed(1)}%</td><td>${litros.toFixed(0)}</td></tr>`;
  }
  table += '</tbody></table>';
  tableWrap.innerHTML = table;

  // render combined canvas chart
  const canvas = document.getElementById('chartCanvas');
  const ctx = canvas.getContext('2d');
  // clear
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // prepare timeline (timestamps)
  const timestamps = Array.from(new Set(dados.map(d=>d.timestamp))).sort();
  if(timestamps.length<2) {
    ctx.fillStyle = '#9ca3af';
    ctx.fillText('Sem dados suficientes para gráfico', 20, 40);
    document.getElementById('lastUpdate').innerText = 'Última atualização: ' + new Date().toLocaleString();
    return;
  }
  const padding = 40;
  const w = canvas.width;
  const h = canvas.height;
  const chartW = w - padding*2;
  const chartH = h - padding*2;

  // compute max liters to scale
  let maxLitros = 0;
  const series = {};
  for(const key in SENSOR_CONFIG){
    const cfg = SENSOR_CONFIG[key];
    series[key] = timestamps.map(ts=>{
      const items = dados.filter(d=>d.ref===key && d.timestamp===ts);
      const leitura = items.length?Number(items[0].value):cfg.leituraVazio;
      const perc = computePercent(leitura,cfg);
      const litros = computeLitros(perc,cfg);
      if(litros>maxLitros) maxLitros = litros;
      return {ts, litros, perc};
    });
  }
  if(maxLitros<=0) maxLitros = 1;

  // draw axes
  ctx.strokeStyle = '#243447';
  ctx.lineWidth = 1;
  ctx.strokeRect(padding, padding, chartW, chartH);

  // draw grid lines and labels
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px Arial';
  const yTicks = 4;
  for(let i=0;i<=yTicks;i++){
    const y = padding + (chartH*(i/yTicks));
    ctx.setLineDash([2,4]);
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(padding+chartW, y);
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.stroke();
    ctx.setLineDash([]);
    const val = Math.round(maxLitros*(1 - i/yTicks));
    ctx.fillText(val + ' L', 6, y+4);
  }

  // colors
  const colors = {
    "Reservatorio_Elevador_current": '#60a5fa',
    "Reservatorio_Osmose_current": '#f59e0b',
    "Reservatorio_CME_current": '#34d399',
    "Agua_Abrandada_current": '#f87171'
  };

  // draw each series
  const pxPerStep = chartW / Math.max(1, timestamps.length-1);
  for(const key in series){
    ctx.beginPath();
    ctx.strokeStyle = colors[key] || '#fff';
    ctx.lineWidth = 2;
    series[key].forEach((pt, idx)=>{
      const x = padding + idx*pxPerStep;
      const y = padding + chartH - (pt.litros / maxLitros) * chartH;
      if(idx===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.stroke();

    // draw small label at end
    const last = series[key][series[key].length-1];
    const lx = padding + (series[key].length-1)*pxPerStep + 6;
    const ly = padding + chartH - (last.litros / maxLitros) * chartH;
    ctx.fillStyle = colors[key];
    ctx.fillRect(lx, ly-6, 8,8);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(SENSOR_CONFIG[key].nome + ' ' + Math.round(last.litros) + ' L', lx+12, ly+2);
  }

  document.getElementById('lastUpdate').innerText = 'Última: ' + new Date().toLocaleString();
}

document.getElementById('logoutBtn')?.addEventListener('click', async ()=>{
  await fetch('/logout', {method:'POST'});
  window.location = '/';
});

// initial load and interval
carregar();
setInterval(carregar, 5*60*1000);
