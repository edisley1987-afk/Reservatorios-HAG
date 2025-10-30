// tenta encontrar escala automática e calcula % e litros
function calcularPercentELitros(leituraRaw, cfg) {
  // cfg: { leituraVazio, alturaRes, capacidadeTotal }
  const vazio = Number(cfg.leituraVazio) || 0;
  const altura = Number(cfg.alturaRes) || 1; // interpretar como "delta" esperado se já em mesmas unidades
  const cap = Number(cfg.capacidadeTotal) || 1;

  // se leituraRaw já for NaN -> retorna zeros
  let leitura = Number(leituraRaw);
  if (!isFinite(leitura)) return { perc: 0, litros: 0, leituraUsada: leituraRaw };

  // lista de fatores que vamos testar (inclui 1 para caso já esteja na escala correta)
  const fatores = [1, 10, 100, 1000, 10000, 100000, 1000000];

  // função para computar percent usando a suposição:
  // perc = 100 * (leitura - vazio) / altura
  const testar = (val) => {
    const delta = val - vazio;
    const perc = (altura === 0) ? 0 : (100 * delta / altura);
    return perc;
  };

  // testa cada fator e escolhe o primeiro que produzir perc plausível 0..120
  let melhor = { perc: 0, litros: 0, leituraUsada: leitura, fator: 1 };
  for (let f of fatores) {
    const valTest = leitura * f;
    const percTest = testar(valTest);
    if (percTest >= -5 && percTest <= 120) { // margem -5 a 120 para aceitar pequenas diferenças
      const perc = Math.min(100, Math.max(0, percTest));
      const litros = Math.round((cap * perc) / 100);
      melhor = { perc, litros, leituraUsada: valTest, fator: f };
      return melhor;
    }
  }

  // se nenhum fator deu resultado plausível, usar fórmula alternativa:
  // alternativa: usar leitura como percentual direto (se leituraRaw entre 0 e 1)
  if (leitura >= 0 && leitura <= 1) {
    const perc = Math.min(100, Math.max(0, leitura * 100));
    const litros = Math.round((cap * perc) / 100);
    return { perc, litros, leituraUsada: leitura, fator: 1 };
  }

  // fallback: calcular delta simples / altura (pode dar 0)
  const perc = Math.min(100, Math.max(0, testar(leitura)));
  const litros = Math.round((cap * perc) / 100);
  return { perc, litros, leituraUsada: leitura, fator: 1 };
}
