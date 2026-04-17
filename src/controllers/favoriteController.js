const { Book } = require("../models/Book");
const { Favorite } = require("../models/Favorite");
const { asyncHandler } = require("../utils/asyncHandler");

const toggle = asyncHandler(async (req, res) => {
  const bookId = Number(req.params.id);
  const book = await Book.findById(bookId);
  if (!book) {
    const err = new Error("Livro não encontrado.");
    err.status = 404;
    throw err;
  }

  const { favorited } = await Favorite.toggle(req.session.userId, bookId);
  req.session.flash = {
    type: "success",
    message: favorited ? "Adicionado aos favoritos." : "Removido dos favoritos.",
  };

  const back = req.get("referer") || `/books/${bookId}`;
  return res.redirect(back);
});

module.exports = { toggle };
