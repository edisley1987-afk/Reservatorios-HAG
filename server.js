// ======================
// Reservatórios HAG Server
// ======================

const express = require("express");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const { users } = require("./users"); // arquivo users.js

const app = express();
const PORT = process.env.PORT || 443;

// ===== Middlewares =====
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: "segredo-hag",
    resave: false,
    saveUninitialized: true,
  })
);

// ===== Dados em memória =====
let readings = [];

// ===== Rotas API =====

// Recebe leituras do gateway IoT
app.post("/api/send", (req, res) => {
  try {
    const data = req.body;
    if (!data || typeof data !== "object") {
      return res.status(400).json({ error: "Dados inválidos" });
    }

    const ts = new Date().toISOString();
    const parsed = [];

    // Caso venha um único objeto
    if (data.ref && typeof data.value !== "undefined") {
      parsed.push({
        ref: data.ref,
        value: parseFloat(data.value),
        ts,
      });
    } else {
      // Caso venha múltiplos sensores
      for (const key in data) {
        const val = data[key];
        if (typeof val === "number" || typeof val === "string") {
          parsed.push({
            ref: key,
            value: parseFloat(val),
            ts,
          });
        } else if (val && typeof val.value !== "undefined") {
          parsed.push({
            ref: key,
            value: parseFloat(val.value),
            ts: val.ts || ts,
          });
        }
      }
    }

    readings = readings.concat(parsed);
    console.log("📡 Leituras recebidas:", parsed);
    res.json({ ok: true, count: parsed.length });
  } catch (err) {
    console.error("Erro em /api/send:", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// Retorna as últimas leituras
app.get("/api/readings", (req, res) => {
  res.json(readings.slice(-200)); // últimas 200 leituras
});

// ===== Login =====
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    return res
      .status(401)
      .json({ ok: false, msg: "Usuário ou senha inválidos" });
  }

  req.session.user = user.username;
  res.json({ ok: true });
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login.html");
  });
});

// ===== Proteção da dashboard =====
function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect("/login.html");
  next();
}

// ===== Frontend =====
app.use(express.static(path.join(__dirname, "public")));

// Página inicial protegida
app.get("/", requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// ===== Rota padrão =====
app.get("/api", (req, res) => {
  res.json({ ok: true, msg: "Servidor HAG ativo 🚀" });
});

// ===== Inicialização =====
app.listen(PORT, () => {
  console.log(`🌐 Servidor rodando na porta ${PORT}`);
});
