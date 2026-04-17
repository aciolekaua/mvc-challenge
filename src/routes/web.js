const express = require("express");
const authController = require("../controllers/authController");
const bookController = require("../controllers/bookController");
const reviewController = require("../controllers/reviewController");
const favoriteController = require("../controllers/favoriteController");
const { requireAuthWeb } = require("../middlewares/authWeb");
const { uploadCover } = require("../middlewares/uploadCover");
const {
  registerRules,
  loginRules,
  bookRules,
  bookIdParam,
  listBooksQuery,
  reviewRules,
} = require("../utils/validators");
const { asyncHandler } = require("../utils/asyncHandler");
const { validateRequest } = require("../middlewares/validateRequest");

const router = express.Router();

router.get("/", (_req, res) => res.redirect("/books"));

router.get("/register", authController.registerForm);
router.post("/register", registerRules, authController.register);

router.get("/login", authController.loginForm);
router.post("/login", loginRules, authController.login);
router.post("/logout", authController.logout);

router.get("/books", listBooksQuery, validateRequest, asyncHandler(bookController.index));
router.get("/books/new", requireAuthWeb, bookController.newForm);
router.post(
  "/books",
  requireAuthWeb,
  uploadCover.single("cover"),
  bookRules,
  asyncHandler(bookController.create)
);

router.get("/books/:id", bookIdParam, validateRequest, asyncHandler(bookController.show));

router.get(
  "/books/:id/edit",
  requireAuthWeb,
  bookIdParam,
  validateRequest,
  asyncHandler(bookController.editForm)
);
router.put(
  "/books/:id",
  requireAuthWeb,
  bookIdParam,
  validateRequest,
  uploadCover.single("cover"),
  bookRules,
  asyncHandler(bookController.update)
);

router.post(
  "/books/:id/reviews",
  requireAuthWeb,
  reviewRules,
  asyncHandler(reviewController.upsert)
);

router.post(
  "/books/:id/favorite",
  requireAuthWeb,
  bookIdParam,
  validateRequest,
  asyncHandler(favoriteController.toggle)
);

module.exports = router;
