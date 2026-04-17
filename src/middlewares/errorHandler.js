/**
 * Tratamento centralizado de erros (web + API).
 */
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err.message && String(err.message).includes("Apenas arquivos de imagem")) {
    const message = err.message;
    if (req.path.startsWith("/api/")) {
      return res.status(400).json({ error: true, message });
    }
    return res.status(400).render("error", { title: "Upload", status: 400, message });
  }

  if (err.name === "MulterError") {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Arquivo muito grande (máx. 3MB)."
        : "Erro no upload do arquivo.";
    if (req.path.startsWith("/api/")) {
      return res.status(400).json({ error: true, message });
    }
    const e = new Error(message);
    e.status = 400;
    return res.status(400).render("error", { title: "Upload", status: 400, message });
  }

  const status = err.status || err.statusCode || 500;
  const message =
    status === 500 && process.env.NODE_ENV === "production"
      ? "Erro interno do servidor."
      : err.message || "Erro interno do servidor.";

  if (req.path.startsWith("/api/")) {
    return res.status(status).json({
      error: true,
      message,
      ...(process.env.NODE_ENV !== "production" && err.stack
        ? { stack: err.stack }
        : {}),
    });
  }

  return res.status(status).render("error", {
    title: "Erro",
    status,
    message,
  });
}

function notFoundHandler(req, res, next) {
  const err = new Error("Página não encontrada.");
  err.status = 404;
  next(err);
}

module.exports = { errorHandler, notFoundHandler };
