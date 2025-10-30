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

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
