const jwt = require("jsonwebtoken");

function requireAuthApi(User) {
  return (req, res, next) => {
    Promise.resolve(
      (async () => {
        const header = req.headers.authorization || "";
        const token = header.startsWith("Bearer ") ? header.slice(7) : null;

        if (!token) {
          res.status(401).json({ error: true, message: "Token ausente." });
          return;
        }

        try {
          const payload = jwt.verify(token, process.env.JWT_SECRET);
          const user = await User.findById(payload.sub);
          if (!user) {
            res.status(401).json({ error: true, message: "Usuário inválido." });
            return;
          }
          req.user = { id: user.id, name: user.name, email: user.email };
        } catch {
          res.status(401).json({ error: true, message: "Token inválido ou expirado." });
          return;
        }

        next();
      })()
    ).catch(next);
  };
}

module.exports = { requireAuthApi };
