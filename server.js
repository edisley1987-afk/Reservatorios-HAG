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

// Função auxiliar
function salvarRegistro(dado) {
  if (!fs.existsSync("./
  if (!fs.existsSync("./data")) fs.mkdirSync("./data");
  fs.appendFileSync(LOG_FILE, JSON.stringify(dado) + ",\n");
}

// Rota para receber dados do Gateway
app.post("/api/send", (req, res) => {
  try {
    const { sensor, value } = req.body;
    const conf = SENSORS[sensor];

    if (!conf) {
      console.log("Sensor não encontrado:", sensor);
      return res.status(404).send("Sensor desconhecido");
    }

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
    res.send("OK");
  } catch (error) {
    console.error("Erro ao gravar dado:", error);
    res.status(500).send("Erro interno no servidor");
  }
});

// Rota para listar últimas leituras (dashboard)
app.get("/api/data", (req, res) => {
  try {
    if (!fs.existsSync(LOG_FILE)) return res.json([]);
    const dados = fs.readFileSync(LOG_FILE, "utf-8")
      .split("\n")
      .filter(Boolean)
      .map(line => JSON.parse(line))
      .slice(-100); // últimas 100 leituras
    res.json(dados.reverse());
  } catch (error) {
    console.error("Erro ao ler log:", error);
    res.status(500).send("Erro interno");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
