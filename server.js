// server.js
const express = require("express");
const fs = require("fs");
const cors = require("cors");
const { SENSORS } = require("./config.js");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const LOG_FILE = "./data/log.json";

// Função auxiliar para salvar os registros
function salvarRegistro(dado) {
  if (!fs.existsSync("./data")) fs.mkdirSync("./data");
  fs.appendFileSync(LOG_FILE, JSON.stringify(dado) + ",\n");
}

// ======================
// 🔹 ROTA: Receber dados do Gateway
// ======================
app.post("/api/send", (req, res) => {
  try {
    const { sensor, value } = req.body;
    const conf = SENSORS[sensor];

    if (!conf) {
      console.log("Sensor não encontrado:", sensor);
      return res.status(404).send("Sensor desconhecido");
    }

    // Cálculo de porcentagem e litros
    const perc = ((value - conf.leituraVazio) / (conf.leituraCheio - conf.leituraVazio)) * 100;
    const litros = (perc / 100) * conf.capacidadeTotal;

    const registro = {
      hora: new Date().toLocaleString("pt-BR"),
      sensor: conf.nome,
      valor: value,
      porcentagem: Math.max(0, Math.min(100, perc)),
      litros: Math.max(0, litros)
    };

    salvarRegistro(registro);
    console.log("🔹 Dado recebido:", registro);
    res.send("OK");
  } catch (error) {
    console.error("❌ Erro ao gravar dado:", error);
    res.status(500).send("Erro interno no servidor");
  }
});

// ======================
// 🔹 ROTA: Fornecer dados para o Dashboard
// ======================
app.get("/api/readings", (req, res) => {
  try {
    if (!fs.existsSync(LOG_FILE)) return res.json([]);
    const dados = fs.readFileSync(LOG_FILE, "utf-8")
      .split("\n")
      .filter(Boolean)
      .map(line => JSON.parse(line))
      .slice(-100); // últimas 100 leituras
    res.json(dados.reverse());
  } catch (error) {
    console.error("❌ Erro ao ler log:", error);
    res.status(500).send("Erro interno");
  }
});

// (Opcional) Compatibilidade com /api/data
app.get("/api/data", (req, res) => {
  try {
    if (!fs.existsSync(LOG_FILE)) return res.json([]);
    const dados = fs.readFileSync(LOG_FILE, "utf-8")
      .split("\n")
      .filter(Boolean)
      .map(line => JSON.parse(line))
      .slice(-100);
    res.json(dados.reverse());
  } catch (error) {
    console.error("❌ Erro ao ler log:", error);
    res.status(500).send("Erro interno");
  }
});

// ======================
// 🔹 Inicialização do servidor
// ======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
