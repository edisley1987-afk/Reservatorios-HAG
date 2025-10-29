// Configuration: user, pass and sensors
exports.USER = "hag";
exports.PASS = "38195156";
exports.SENSORS = {
  "Reservatorio_Elevador_current": {
    nome: "Reservatório Elevador",
    leituraVazio: 4168,
    alturaRes: 1.45,
    capacidadeTotal: 20000
  },
  "Reservatorio_Osmose_current": {
    nome: "Reservatório Osmose",
    leituraVazio: 505,
    alturaRes: 1.0,
    capacidadeTotal: 200
  },
  "Reservatorio_CME_current": {
    nome: "Reservatório CME",
    leituraVazio: 4088,
    alturaRes: 0.45,
    capacidadeTotal: 1000
  },
  "Agua_Abrandada_current": {
    nome: "Reservatório Água Abrandada",
    leituraVazio: 4008,
    alturaRes: 0.6,
    capacidadeTotal: 9000
  }
};
