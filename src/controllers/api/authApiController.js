const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const { User } = require("../../models/User");
const { asyncHandler } = require("../../utils/asyncHandler");

function tokenForUser(user) {
  return jwt.sign(
    { sub: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

function formatErrors(req) {
  const r = validationResult(req);
  if (r.isEmpty()) return [];
  return r.array().map((e) => ({ field: e.path, message: e.msg }));
}

const register = asyncHandler(async (req, res) => {
  const errors = formatErrors(req);
  if (errors.length) {
    return res.status(422).json({ error: true, errors });
  }

  const { name, email, password } = req.body;
  const existing = await User.findByEmail(email);
  if (existing) {
    return res.status(409).json({ error: true, message: "Email já cadastrado." });
  }

  const user = await User.create({ name, email, password });
  const token = tokenForUser(user);
  return res.status(201).json({
    user: { id: user.id, name: user.name, email: user.email },
    token,
  });
});

const login = asyncHandler(async (req, res) => {
  const errors = formatErrors(req);
  if (errors.length) {
    return res.status(422).json({ error: true, errors });
  }

  const { email, password } = req.body;
  const user = await User.findByEmail(email);
  if (!user || !(await User.verifyPassword(password, user.password_hash))) {
    return res.status(401).json({ error: true, message: "Credenciais inválidas." });
  }

  const safe = await User.findById(user.id);
  const token = tokenForUser(safe);
  return res.json({
    user: { id: safe.id, name: safe.name, email: safe.email },
    token,
  });
});

module.exports = { register, login };
