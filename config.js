// Configurações de usuário e sensores
exports.USER = "hag";
exports.PASS = "38195156";
exports.SENSORS = {
  "Reservatorio_Elevador_current": {
    nome: "Reservatório Elevador",
    leituraVazio: 0.004168,
    leituraCheio: 0.007855,
    alturaRes: 1.45,
    capacidadeTotal: 20000
  },
  "Reservatorio_Osmose_current": {
    nome: "Reservatório Osmose",
    leituraVazio: 0.00505,
    leituraCheio: 0.006492,
    alturaRes: 1.0,
    capacidadeTotal: 200
  },
  "Reservatorio_CME_current": {
    nome: "Reservatório CME",
    leituraVazio: 0.004088,
    leituraCheio: 0.004408,
    alturaRes: 0.45,
    capacidadeTotal: 1000
  },
  "Agua_Abrandada_current": {
    nome: "Reservatório Água Abrandada",
    leituraVazio: 0.004008,
    leituraCheio: 0.004929,
    alturaRes: 0.6,
    capacidadeTotal: 9000
  }
};
