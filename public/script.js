const SENSORS = {
  "Reservatorio_Elevador_current": {
    id: "Reservatorio_Elevador_current",
    name: "Reservatório Elevador",
    capacidade: 20000,
    alturaRes: 1.45,
    leituraVazio: 0.004168,
    leituraCheio: 0.008096
  },
  "Reservatorio_Osmose_current": {
    id: "Reservatorio_Osmose_current",
    name: "Reservatório Osmose",
    capacidade: 200,
    alturaRes: 1.0,
    leituraVazio: 0.00505,
    leituraCheio: 0.006412
  },
  "Reservatorio_CME_current": {
    id: "Reservatorio_CME_current",
    name: "Reservatório CME",
    capacidade: 1000,
    alturaRes: 0.45,
    leituraVazio: 0.004088,
    leituraCheio: 0.004408
  },
  "Agua_Abrandada_current": {
    id: "Agua_Abrandada_current",
    name: "Reservatório Água Abrandada",
    capacidade: 9000,
    alturaRes: 0.6,
    leituraVazio: 0.004008,
    leituraCheio: 0.004929
  }
};

let allReadings = [];

function computeFromValue(sensorCfg, rawValue){
  const min = sensorCfg.leituraVazio, max = sensorCfg.leituraCheio;
  let pct = 0;
  if(max > min){
    pct = (rawValue - min) / (max - min);
    pct = Math.max(0, Math.min(1, pct));
  }
  const litros = Math.round(sensorCfg.capacidade * pct);
  return { pct: pct*100, litros };
}

function renderCards(){
  const container = document.getElementById('cards');
  container.innerHTML = '';
  Object.values(SENSORS).forEach(cfg => {
    const last = latestForSensor(cfg.id);
    const {pct, litros} = last ? computeFromValue(cfg, last.value) : {pct:0, litros:0};
    const color = pct < 20 ? 'var(--red)' : pct < 50 ? 'var(--yellow)' : 'var(--green)';
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.sensor = cfg.id;
    card.innerHTML = `
      <h3>${cfg.name}</h3>
      <div class="metric" id="${cfg.id}_metric">${pct.toFixed(1)}% &nbsp; <span class="small">(${litros} L)</span></div>
      <div class="bar"><div id="${cfg.id}_fill" class="fill" style="width:${pct}%; background:${color}"></div></div>
      <div class="sub">Capacidade: ${cfg.capacidade.toLocaleString()} L</div>
      <div class="sub">Última: <span id="${cfg.id}_last">${last ? new Date(last.ts).toLocaleString() : 'N/A'}</span></div>
    `;
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => { drawChartFor(cfg.id); });
    container.appendChild(card);
  });
}

function latestForSensor(ref){
  for(let i=allReadings.length-1;i>=0;i--){
    if(allReadings[i].ref === ref) return allReadings[i];
  }
  return null;
}

function updateDashboard(data){
  data = (data || []).map(d => ({...d, ts: d.ts || d.time || d.timestamp || new Date().toISOString()}));
  allReadings = allReadings.concat(data).filter(r => r && r.ref && typeof r.value !== 'undefined');
  const cutoff = Date.now() - 24*3600*1000;
  allReadings = allReadings.filter(r => (new Date(r.ts)).getTime() >= cutoff);
  allReadings.sort((a,b)=> new Date(a.ts) - new Date(b.ts));
  renderCards();
  renderTable();
  if(window.currentChartSensor) drawChartFor(window.currentChartSensor);
}

function renderTable(){
  const wrap = document.getElementById('tableWrap');
  const rows = [...allReadings].reverse();
  const html = [];
  html.push('<table><thead><tr><th>Hora</th><th>Sensor</th><th>Valor</th><th>%</th><th>Litros</th></tr></thead><tbody>');
  for(const r of rows){
    const cfg = SENSORS[r.ref] || null;
    const name = cfg ? cfg.name : r.ref;
    const {pct, litros} = cfg ? computeFromValue(cfg, r.value) : {pct:0, litros:0};
    html.push(`<tr>
      <td>${new Date(r.ts).toLocaleString()}</td>
      <td>${name}</td>
      <td>${Number(r.value).toFixed(6)}</td>
      <td>${pct.toFixed(1)}%</td>
      <td>${litros}</td>
    </tr>`);
  }
  html.push('</tbody></table>');
  wrap.innerHTML = html.join('\n');
}

function drawChartFor(sensorRef){
  window.currentChartSensor = sensorRef;
  const cfg = SENSORS[sensorRef];
  if(!cfg) return;
  const canvas = document.getElementById('chartCanvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#071018';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  const series = allReadings.filter(r=>r.ref===sensorRef).map(r=>({t:new Date(r.ts).getTime(), value: computeFromValue(cfg, r.value).litros}));
  const pad = 40;
  const w = canvas.width, h = canvas.height;
  const chartW = w - pad*2, chartH = h - pad*2;
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  const gridLines = 5;
  ctx.font = '12px Arial';
  ctx.fillStyle = '#9aa6b2';
  for(let i=0;i<=gridLines;i++){
    const y = pad + (chartH * i / gridLines);
    ctx.beginPath(); ctx.moveTo(pad,y); ctx.lineTo(pad+chartW,y); ctx.stroke();
  }
  const maxL = cfg.capacidade;
  ctx.fillStyle = '#9aa6b2';
  ctx.fillText('0 L', 6, h-6);
  ctx.fillText(`${maxL.toLocaleString()} L`, 6, pad+8);

  if(series.length===0){
    ctx.fillStyle = '#9aa6b2';
    ctx.fillText('Sem dados suficientes para gráfico', pad+20, pad+chartH/2);
    return;
  }

  const tmin = Math.min(...series.map(s=>s.t));
  const tmax = Math.max(...series.map(s=>s.t));
  const vmin = 0;
  const vmax = Math.max(...series.map(s=>s.value), 1);

  function tx(t){ return pad + ((t - tmin) / (Math.max(1, tmax - tmin)) ) * chartW; }
  function ty(v){ return pad + chartH - ((v - vmin) / (vmax - vmin)) * chartH; }

  ctx.beginPath();
  for(let i=0;i<series.length;i++){
    const x = tx(series[i].t), y = ty(series[i].value);
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.strokeStyle = '#f87171'; ctx.lineWidth = 2; ctx.stroke();

  for(const p of series){
    ctx.beginPath();
    ctx.arc(tx(p.t), ty(p.value), 3, 0, Math.PI*2);
    ctx.fillStyle = '#f87171'; ctx.fill();
  }

  ctx.fillStyle = '#e6eef6';
  ctx.font = '16px Arial';
  ctx.fillText(cfg.name + ' - Últimas 24h', pad, 20);
}

async function fetchReadings(){
  const endpoints = ['/api/readings','/api/data','/api/send','/api'];
  for(const ep of endpoints){
    try{
      const res = await fetch(ep, {cache:'no-store'});
      if(res.ok){
        const json = await res.json();
        if(Array.isArray(json)) return json;
        if(json.data && Array.isArray(json.data)) return json.data;
        const arr = [];
        for(const k in json){
          const v = json[k];
          if(v && typeof v.value !== 'undefined'){
            arr.push({ref:k, value: v.value, ts: v.ts || new Date().toISOString()});
          }
        }
        if(arr.length) return arr;
      }
    }catch(e){}
  }
  return [];
}

async function atualizarDashboard(){
  try{
    const data = await fetchReadings();
    const normalized = data.map(d=>{
      return {
        ref: d.ref || d.sensor || d.name,
        value: typeof d.value === 'number' ? d.value : parseFloat(String(d.value || 0).replace(/[^0-9\.\-]/g,'')) || 0,
        ts: d.ts || d.time || d.timestamp || new Date().toISOString()
      };
    }).filter(d=>d.ref);
    updateDashboard(normalized);
    const lu = document.getElementById('lastUpdate');
    if(lu) lu.textContent = new Date().toLocaleString();
  }catch(err){
    console.error('Erro atualizarDashboard', err);
  }
}

atualizarDashboard();
setInterval(atualizarDashboard, 300000);
