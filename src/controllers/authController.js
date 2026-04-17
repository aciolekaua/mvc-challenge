const { validationResult } = require("express-validator");
const { User } = require("../models/User");
const { asyncHandler } = require("../utils/asyncHandler");

function formatErrors(req) {
  const r = validationResult(req);
  if (r.isEmpty()) return [];
  return r.array().map((e) => e.msg);
}

const registerForm = (req, res) => {
  res.render("auth/register", { title: "Cadastro", errors: [] });
};

const register = asyncHandler(async (req, res) => {
  const errors = formatErrors(req);
  if (errors.length) {
    return res.status(422).render("auth/register", { title: "Cadastro", errors });
  }

  const { name, email, password } = req.body;
  const existing = await User.findByEmail(email);
  if (existing) {
    return res.status(422).render("auth/register", {
      title: "Cadastro",
      errors: ["Este email já está cadastrado."],
    });
  }

  await User.create({ name, email, password });
  req.session.flash = { type: "success", message: "Conta criada. Faça login." };
  return res.redirect("/login");
});

const loginForm = (req, res) => {
  res.render("auth/login", { title: "Entrar", errors: [] });
};

const login = asyncHandler(async (req, res) => {
  const errors = formatErrors(req);
  if (errors.length) {
    return res.status(422).render("auth/login", { title: "Entrar", errors });
  }

  const { email, password } = req.body;
  const user = await User.findByEmail(email);
  if (!user || !(await User.verifyPassword(password, user.password_hash))) {
    return res.status(422).render("auth/login", {
      title: "Entrar",
      errors: ["Email ou senha incorretos."],
    });
  }

  req.session.userId = user.id;
  const dest = req.session.returnTo || "/books";
  delete req.session.returnTo;
  req.session.flash = { type: "success", message: `Olá, ${user.name}!` };
  return res.redirect(dest);
});

const logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/books");
  });
};

module.exports = { registerForm, register, loginForm, login, logout };
