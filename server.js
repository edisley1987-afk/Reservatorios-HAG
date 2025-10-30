const express = require("express");
const session = require("express-session");
const cors = require("cors");
const path = require("path");
const { users } = require("./users");

const app = express();
const PORT = process.env.PORT || 10080;

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

app.use(express.static(path.join(__dirname, "public")));

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
  if (!req.session.user) {
    return res.redirect("/");
  }
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

// Rotas de API simuladas (substituir depois com os dados reais do gateway)
app.get("/api/data1", (req, res) => {
  res.json({
    nivel: 0,
    litros: 0,
    capacidade: 20000,
    ultimaAtualizacao: null,
  });
});

app.get("/api/data2", (req, res) => {
  res.json({
    nivel: 0,
    litros: 0,
    capacidade: 200,
    ultimaAtualizacao: null,
  });
});

app.get("/api/data3", (req, res) => {
  res.json({
    nivel: 0,
    litros: 0,
    capacidade: 9000,
    ultimaAtualizacao: null,
  });
});

// Rotas de envio de dados (mock)
app.post("/api/send1", (req, res) => {
  console.log("🔹 Recebido dado do reservatório 1:", req.body);
  res.json({ status: "OK" });
});

app.post("/api/send2", (req, res) => {
  console.log("🔹 Recebido dado do reservatório 2:", req.body);
  res.json({ status: "OK" });
});

app.post("/api/send3", (req, res) => {
  console.log("🔹 Recebido dado do reservatório 3:", req.body);
  res.json({ status: "OK" });
});
// Rota para leituras dos reservatórios
app.get("/api/readings", (req, res) => {
  res.json([
    {
      hora: "13:40",
      sensor: "Elevador",
      valor: 0,
      porcentagem: 0,
      litros: 0
    },
    {
      hora: "13:41",
      sensor: "Osmose",
      valor: 0,
      porcentagem: 0,
      litros: 0
    },
    {
      hora: "13:42",
      sensor: "Água abrandada",
      valor: 0,
      porcentagem: 0,
      litros: 0
    }
  ]);
});
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
