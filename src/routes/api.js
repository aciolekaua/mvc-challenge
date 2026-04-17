const express = require("express");
const authApiController = require("../controllers/api/authApiController");
const booksApiController = require("../controllers/api/booksApiController");
const reviewsApiController = require("../controllers/api/reviewsApiController");
const favoritesApiController = require("../controllers/api/favoritesApiController");
const { requireAuthApi } = require("../middlewares/authApi");
const { optionalAuthApi } = require("../middlewares/optionalAuthApi");
const { uploadCover } = require("../middlewares/uploadCover");
const { User } = require("../models/User");
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
const requireUser = requireAuthApi(User);
const optionalUser = optionalAuthApi(User);

router.post("/auth/register", registerRules, validateRequest, asyncHandler(authApiController.register));
router.post("/auth/login", loginRules, validateRequest, asyncHandler(authApiController.login));

router.get(
  "/books",
  optionalUser,
  listBooksQuery,
  validateRequest,
  asyncHandler(booksApiController.list)
);
router.get(
  "/books/:id",
  optionalUser,
  bookIdParam,
  validateRequest,
  asyncHandler(booksApiController.show)
);

router.post(
  "/books",
  requireUser,
  uploadCover.single("cover"),
  bookRules,
  asyncHandler(booksApiController.create)
);
router.patch(
  "/books/:id",
  requireUser,
  bookIdParam,
  validateRequest,
  uploadCover.single("cover"),
  bookRules,
  asyncHandler(booksApiController.update)
);

router.put(
  "/books/:id/reviews",
  requireUser,
  reviewRules,
  asyncHandler(reviewsApiController.upsert)
);

router.post(
  "/books/:id/favorite",
  requireUser,
  bookIdParam,
  validateRequest,
  asyncHandler(favoritesApiController.toggle)
);

module.exports = router;
