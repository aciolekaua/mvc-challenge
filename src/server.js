require("dotenv").config();
const path = require("path");
const express = require("express");
const session = require("express-session");
const methodOverride = require("method-override");
const expressLayouts = require("express-ejs-layouts");

const webRoutes = require("./routes/web");
const apiRoutes = require("./routes/api");
const { errorHandler, notFoundHandler } = require("./middlewares/errorHandler");
const { loadUserForViews } = require("./middlewares/authWeb");
const { User } = require("./models/User");
const { classifications } = require("./utils/validators");

const classificationLabels = {
  livre: "Livre",
  "10+": "10 anos",
  "12+": "12 anos",
  "14+": "14 anos",
  "16+": "16 anos",
  "18+": "18 anos",
  media: "Nota média (ex.: catálogo escolar)",
};

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));
app.use(expressLayouts);
app.set("layout", "layout");

app.use(express.static(path.join(__dirname, "..", "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));

app.use(
  session({
    name: "mvc_livros_sid",
    secret: process.env.SESSION_SECRET || "dev-inseguro-altere-no-env",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

app.use((req, res, next) => {
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  res.locals.classifications = classifications;
  res.locals.classificationLabels = classificationLabels;
  next();
});

app.use(loadUserForViews(User));

app.use("/", webRoutes);
app.use("/api/v1", apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor em http://localhost:${PORT}`);
});
