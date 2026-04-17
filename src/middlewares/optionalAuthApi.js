const jwt = require("jsonwebtoken");

function optionalAuthApi(User) {
  return (req, res, next) => {
    Promise.resolve(
      (async () => {
        req.user = null;
        const header = req.headers.authorization || "";
        const token = header.startsWith("Bearer ") ? header.slice(7) : null;
        if (!token) {
          next();
          return;
        }

        try {
          const payload = jwt.verify(token, process.env.JWT_SECRET);
          const user = await User.findById(payload.sub);
          if (user) {
            req.user = { id: user.id, name: user.name, email: user.email };
          }
        } catch {
          /* anônimo */
        }
        next();
      })()
    ).catch(next);
  };
}

module.exports = { optionalAuthApi };
