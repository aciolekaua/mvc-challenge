const path = require("path");
const fs = require("fs");
const { validationResult } = require("express-validator");
const { Book } = require("../models/Book");
const { Review } = require("../models/Review");
const { Favorite } = require("../models/Favorite");
const { asyncHandler } = require("../utils/asyncHandler");

function formatErrors(req) {
  const r = validationResult(req);
  if (r.isEmpty()) return [];
  return r.array().map((e) => e.msg);
}

function publicCoverUrl(storedPath) {
  if (!storedPath) return null;
  const filename = path.basename(storedPath);
  return `/uploads/covers/${filename}`;
}

const index = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const q = req.query.q || "";
  const classification = req.query.classification || "";

  const { books, totalPages, page: currentPage, total, pageSize } = await Book.list({
    q: q || undefined,
    classification: classification || undefined,
    page,
    userIdForFavorite: req.session.userId || null,
  });

  res.render("books/index", {
    title: "Livros",
    books,
    q,
    classification,
    totalPages,
    currentPage,
    total,
    pageSize,
    publicCoverUrl,
  });
});

const show = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const book = await Book.getDetailWithStats(id);
  if (!book) {
    const err = new Error("Livro não encontrado.");
    err.status = 404;
    throw err;
  }

  const reviews = await Review.listByBook(id);
  let userReview = null;
  let isFavorite = false;
  if (req.session.userId) {
    userReview = await Review.findByUserAndBook(req.session.userId, id);
    isFavorite = await Favorite.isFavorite(req.session.userId, id);
  }

  res.render("books/show", {
    title: book.title,
    book,
    reviews,
    userReview,
    isFavorite,
    publicCoverUrl,
  });
});

const newForm = (req, res) => {
  res.render("books/form", {
    title: "Novo livro",
    isEdit: false,
    book: {},
    errors: [],
  });
};

const create = asyncHandler(async (req, res) => {
  const errors = formatErrors(req);
  if (errors.length) {
    return res.status(422).render("books/form", {
      title: "Novo livro",
      isEdit: false,
      book: req.body,
      errors,
    });
  }

  let cover_path = null;
  if (req.file) {
    cover_path = req.file.path;
  }

  await Book.create({
    user_id: req.session.userId,
    title: req.body.title,
    classification: req.body.classification,
    genre: req.body.genre,
    author: req.body.author,
    publisher: req.body.publisher,
    cover_path,
  });

  req.session.flash = { type: "success", message: "Livro cadastrado." };
  return res.redirect("/books");
});

const editForm = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const book = await Book.findById(id);
  if (!book) {
    const err = new Error("Livro não encontrado.");
    err.status = 404;
    throw err;
  }
  if (book.user_id !== req.session.userId) {
    const err = new Error("Você não pode editar este livro.");
    err.status = 403;
    throw err;
  }

  res.render("books/form", {
    title: "Editar livro",
    isEdit: true,
    book,
    errors: [],
  });
});

const update = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const existing = await Book.findById(id);
  if (!existing) {
    const err = new Error("Livro não encontrado.");
    err.status = 404;
    throw err;
  }
  if (existing.user_id !== req.session.userId) {
    const err = new Error("Você não pode editar este livro.");
    err.status = 403;
    throw err;
  }

  const errors = formatErrors(req);
  if (errors.length) {
    return res.status(422).render("books/form", {
      title: "Editar livro",
      isEdit: true,
      book: { ...existing, ...req.body },
      errors,
    });
  }

  let cover_path = existing.cover_path;
  if (req.file) {
    if (existing.cover_path && fs.existsSync(existing.cover_path)) {
      try {
        fs.unlinkSync(existing.cover_path);
      } catch {
        /* ignore */
      }
    }
    cover_path = req.file.path;
  }

  await Book.update(id, {
    title: req.body.title,
    classification: req.body.classification,
    genre: req.body.genre,
    author: req.body.author,
    publisher: req.body.publisher,
    cover_path,
  });

  req.session.flash = { type: "success", message: "Livro atualizado." };
  return res.redirect(`/books/${id}`);
});

module.exports = {
  index,
  show,
  newForm,
  create,
  editForm,
  update,
};
