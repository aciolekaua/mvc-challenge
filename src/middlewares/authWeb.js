function requireAuthWeb(req, res, next) {
  if (!req.session.userId) {
    req.session.returnTo = req.originalUrl;
    return res.redirect("/login");
  }
  next();
}

function loadUserForViews(User) {
  return (req, res, next) => {
    Promise.resolve(
      (async () => {
        res.locals.currentUser = null;
        if (req.session.userId) {
          const user = await User.findById(req.session.userId);
          if (user) {
            res.locals.currentUser = { id: user.id, name: user.name, email: user.email };
          } else {
            req.session.destroy(() => {});
          }
        }
        next();
      })()
    ).catch(next);
  };
}

module.exports = { requireAuthWeb, loadUserForViews };
