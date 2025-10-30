const express = require("express");
const session = require("express-session");
const cors = require("cors");
const path = require("path");
const { users } = require("./users");

const app = express();
const PORT = process.env.PORT || 10080;

// --- Middleware ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(
  session({
    secret: "reservatorioshag",
    resave: false,
    saveUninitialized: true,
  })
);

// --- Banco de dados temporário em memória ---
let readings = {
  elevador: { valor: 0, porcentagem: 0, litros: 0, hora: null },
  osmose: { valor: 0, porcentagem: 0, litros: 0, hora: null },
  cme: { valor: 0, porcentagem: 0, litros: 0, hora: null },
  aguaAbrandada: { valor: 0, porcentagem: 0, litros: 0, hora: null },
};

// --- ROTAS DE ENVIO (Gateway -> Servidor) ---
app.post("/api/send1", (req, res) => {
  readings.elevador = {
    ...req.body,
    hora: new Date().toLocaleTimeString("pt-BR"),
  };
  console.log("🔹 Dados recebidos do Elevador:", readings.elevador);
  res.json({ status: "OK" });
});

app.post("/api/send2", (req, res) => {
  readings.osmose = {
    ...req.body,
    hora: new Date().toLocaleTimeString("pt-BR"),
  };
  console.log("🔹 Dados recebidos da Osmose:", readings.osmose);
  res.json({ status: "OK" });
});

app.post("/api/send3", (req, res) => {
  readings.cme = {
    ...req.body,
    hora: new Date().toLocaleTimeString("pt-BR"),
  };
  console.log("🔹 Dados recebidos da CME:", readings.cme);
  res.json({ status: "OK" });
});

app.post("/api/send4", (req, res) => {
  readings.aguaAbrandada = {
    ...req.body,
    hora: new Date().toLocaleTimeString("pt-BR"),
  };
  console.log("🔹 Dados recebidos da Água Abrandada:", readings.aguaAbrandada);
  res.json({ status: "OK" });
});

// --- ROTAS DE CONSULTA (Dashboard -> Servidor) ---
app.get("/api/data1", (req, res) => res.json(readings.elevador));
app.get("/api/data2", (req, res) => res.json(readings.osmose));
app.get("/api/data3", (req, res) => res.json(readings.cme));
app.get("/api/data4", (req, res) => res.json(readings.aguaAbrandada));

// --- Todas as leituras juntas ---
app.get("/api/readings", (req, res) => {
  res.json([
    { sensor: "Elevador", ...readings.elevador },
    { sensor: "Osmose", ...readings.osmose },
    { sensor: "CME", ...readings.cme },
    { sensor: "Água abrandada", ...readings.aguaAbrandada },
  ]);
});

// --- Servir arquivos estáticos ---
app.use(express.static(path.join(__dirname, "public")));

// --- LOGIN E DASHBOARD ---
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (user) {
    req.session.user = user;
    res.redirect("/dashboard");
  } else {
    res.send(
      `<script>alert("Usuário ou senha inválidos"); window.location.href = "/";</script>`
    );
  }
});

app.get("/dashboard", (req, res) => {
  if (!req.session.user) return res.redirect("/");
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

// --- Fallback para arquivos estáticos ausentes ---
app.use((req, res, next) => {
  if (req.path.endsWith(".css") || req.path.endsWith(".js")) {
    return res.sendFile(path.join(__dirname, "public", req.path));
  }
  next();
});

// --- Inicialização ---
// --- SIMULADOR AUTOMÁTICO (teste sem gateway) ---
setInterval(() => {
  const gerar = () => ({
    valor: Math.random() * 5,
    porcentagem: Math.random() * 100,
    litros: Math.floor(Math.random() * 1000),
    hora: new Date().toLocaleTimeString("pt-BR"),
  });

  readings.elevador = gerar();
  readings.osmose = gerar();
  readings.cme = gerar();
  readings.aguaAbrandada = gerar();

  console.log("📊 Leituras simuladas atualizadas:", readings);
}, 30000);
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});
