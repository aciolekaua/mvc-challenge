const { body, param, query } = require("express-validator");

const classifications = ["livre", "10+", "12+", "14+", "16+", "18+", "media"];

const registerRules = [
  body("name").trim().notEmpty().withMessage("Nome é obrigatório.").isLength({ max: 255 }),
  body("email").trim().isEmail().withMessage("Email inválido.").normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Senha deve ter pelo menos 6 caracteres."),
];

const loginRules = [
  body("email").trim().isEmail().withMessage("Email inválido.").normalizeEmail(),
  body("password").notEmpty().withMessage("Senha é obrigatória."),
];

const bookRules = [
  body("title").trim().notEmpty().withMessage("Título é obrigatório.").isLength({ max: 500 }),
  body("classification")
    .trim()
    .notEmpty()
    .withMessage("Classificação é obrigatória.")
    .isIn(classifications)
    .withMessage("Classificação inválida."),
  body("genre").trim().notEmpty().withMessage("Gênero é obrigatório.").isLength({ max: 255 }),
  body("author").trim().notEmpty().withMessage("Autor é obrigatório.").isLength({ max: 255 }),
  body("publisher").trim().notEmpty().withMessage("Editora é obrigatória.").isLength({ max: 255 }),
];

const bookIdParam = [param("id").isInt({ min: 1 }).withMessage("ID inválido.")];

const listBooksQuery = [
  query("q").optional().trim().isLength({ max: 200 }),
  query("classification").optional().trim().isIn(classifications),
  query("page").optional().isInt({ min: 1 }),
];

const reviewRules = [
  param("id").isInt({ min: 1 }).withMessage("ID inválido."),
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Nota deve ser um inteiro entre 1 e 5."),
  body("comment").optional({ checkFalsy: true }).trim().isLength({ max: 2000 }),
];

module.exports = {
  classifications,
  registerRules,
  loginRules,
  bookRules,
  bookIdParam,
  listBooksQuery,
  reviewRules,
};
