const path = require("path");
const fs = require("fs");
const { validationResult } = require("express-validator");
const { Book } = require("../../models/Book");
const { Review } = require("../../models/Review");
const { asyncHandler } = require("../../utils/asyncHandler");

function formatErrors(req) {
  const r = validationResult(req);
  if (r.isEmpty()) return [];
  return r.array().map((e) => ({ field: e.path, message: e.msg }));
}

function publicCoverUrl(storedPath) {
  if (!storedPath) return null;
  const filename = path.basename(storedPath);
  return `/uploads/covers/${filename}`;
}

function mapBook(b) {
  return {
    id: b.id,
    user_id: b.user_id,
    title: b.title,
    classification: b.classification,
    genre: b.genre,
    author: b.author,
    publisher: b.publisher,
    cover_url: publicCoverUrl(b.cover_path),
    created_at: b.created_at,
    avg_rating: b.avg_rating != null ? Number(b.avg_rating) : 0,
    review_count: b.review_count != null ? Number(b.review_count) : 0,
    is_favorite: Boolean(b.is_favorite),
  };
}

const list = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const q = req.query.q || "";
  const classification = req.query.classification || "";

  const { books, totalPages, page: currentPage, total, pageSize } = await Book.list({
    q: q || undefined,
    classification: classification || undefined,
    page,
    userIdForFavorite: req.user?.id || null,
  });

  return res.json({
    data: books.map(mapBook),
    meta: { page: currentPage, totalPages, total, pageSize },
  });
});

const show = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const book = await Book.getDetailWithStats(id);
  if (!book) {
    return res.status(404).json({ error: true, message: "Livro não encontrado." });
  }

  const reviews = await Review.listByBook(id);
  let isFavorite = false;
  if (req.user) {
    const { Favorite } = require("../../models/Favorite");
    isFavorite = await Favorite.isFavorite(req.user.id, id);
  }

  return res.json({
    data: {
      ...mapBook({ ...book, is_favorite: isFavorite }),
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        user_name: r.user_name,
        created_at: r.created_at,
        updated_at: r.updated_at,
      })),
    },
  });
});

const create = asyncHandler(async (req, res) => {
  const errors = formatErrors(req);
  if (errors.length) {
    return res.status(422).json({ error: true, errors });
  }

  let cover_path = null;
  if (req.file) {
    cover_path = req.file.path;
  }

  const row = await Book.create({
    user_id: req.user.id,
    title: req.body.title,
    classification: req.body.classification,
    genre: req.body.genre,
    author: req.body.author,
    publisher: req.body.publisher,
    cover_path,
  });

  return res.status(201).json({ data: mapBook(row) });
});

const update = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const existing = await Book.findById(id);
  if (!existing) {
    return res.status(404).json({ error: true, message: "Livro não encontrado." });
  }
  if (existing.user_id !== req.user.id) {
    return res.status(403).json({ error: true, message: "Sem permissão." });
  }

  const errors = formatErrors(req);
  if (errors.length) {
    return res.status(422).json({ error: true, errors });
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

  const row = await Book.update(id, {
    title: req.body.title,
    classification: req.body.classification,
    genre: req.body.genre,
    author: req.body.author,
    publisher: req.body.publisher,
    cover_path,
  });

  return res.json({ data: mapBook(row) });
});

module.exports = { list, show, create, update };
