const { Book } = require("../../models/Book");
const { Favorite } = require("../../models/Favorite");
const { asyncHandler } = require("../../utils/asyncHandler");

const toggle = asyncHandler(async (req, res) => {
  const bookId = Number(req.params.id);
  const book = await Book.findById(bookId);
  if (!book) {
    return res.status(404).json({ error: true, message: "Livro não encontrado." });
  }

  const { favorited } = await Favorite.toggle(req.user.id, bookId);
  return res.json({ data: { favorited } });
});

module.exports = { toggle };
