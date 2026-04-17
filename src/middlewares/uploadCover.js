const path = require("path");
const fs = require("fs");
const multer = require("multer");

const coversDir = path.join(__dirname, "..", "..", "public", "uploads", "covers");

function ensureDir() {
  if (!fs.existsSync(coversDir)) {
    fs.mkdirSync(coversDir, { recursive: true });
  }
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureDir();
    cb(null, coversDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    const safeExt = allowed.includes(ext) ? ext : ".jpg";
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  },
});

function fileFilter(_req, file, cb) {
  const ok = /^image\//i.test(file.mimetype);
  if (!ok) {
    return cb(new Error("Apenas arquivos de imagem são permitidos."));
  }
  cb(null, true);
}

const uploadCover = multer({
  storage,
  fileFilter,
  limits: { fileSize: 3 * 1024 * 1024 },
});

module.exports = { uploadCover, coversDir };
