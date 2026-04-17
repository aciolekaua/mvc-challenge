const { validationResult } = require("express-validator");
const { Book } = require("../models/Book");
const { Review } = require("../models/Review");
const { asyncHandler } = require("../utils/asyncHandler");

function formatErrors(req) {
  const r = validationResult(req);
  if (r.isEmpty()) return [];
  return r.array().map((e) => e.msg);
}

const upsert = asyncHandler(async (req, res) => {
  const bookId = Number(req.params.id);
  const book = await Book.findById(bookId);
  if (!book) {
    const err = new Error("Livro não encontrado.");
    err.status = 404;
    throw err;
  }

  const errors = formatErrors(req);
  if (errors.length) {
    req.session.flash = { type: "error", message: errors.join(" ") };
    return res.redirect(`/books/${bookId}`);
  }

  await Review.upsert({
    book_id: bookId,
    user_id: req.session.userId,
    rating: Number(req.body.rating),
    comment: req.body.comment,
  });

  req.session.flash = { type: "success", message: "Avaliação salva." };
  return res.redirect(`/books/${bookId}`);
});

module.exports = { upsert };
