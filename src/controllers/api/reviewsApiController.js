const { validationResult } = require("express-validator");
const { Book } = require("../../models/Book");
const { Review } = require("../../models/Review");
const { asyncHandler } = require("../../utils/asyncHandler");

function formatErrors(req) {
  const r = validationResult(req);
  if (r.isEmpty()) return [];
  return r.array().map((e) => ({ field: e.path, message: e.msg }));
}

const upsert = asyncHandler(async (req, res) => {
  const bookId = Number(req.params.id);
  const book = await Book.findById(bookId);
  if (!book) {
    return res.status(404).json({ error: true, message: "Livro não encontrado." });
  }

  const errors = formatErrors(req);
  if (errors.length) {
    return res.status(422).json({ error: true, errors });
  }

  const row = await Review.upsert({
    book_id: bookId,
    user_id: req.user.id,
    rating: Number(req.body.rating),
    comment: req.body.comment,
  });

  const agg = await Review.aggregateForBook(bookId);

  return res.json({
    data: {
      review: row,
      book_stats: {
        avg_rating: Number(agg.avg_rating),
        review_count: agg.review_count,
      },
    },
  });
});

module.exports = { upsert };
