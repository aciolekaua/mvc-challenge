const { validationResult } = require("express-validator");

function validateRequest(req, res, next) {
  const r = validationResult(req);
  if (r.isEmpty()) return next();

  const messages = r.array().map((e) => e.msg).join(" ");
  const err = new Error(messages);
  err.status = 422;
  return next(err);
}

module.exports = { validateRequest };
