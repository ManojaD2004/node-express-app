const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const connectDB = require("./config/db");
const path = require("path");
const exphbs = require("express-handlebars");
const methodOverride = require("method-override");
const passport = require("passport");
const session = require("express-session");
const { default: mongoose } = require("mongoose");
const MongoStore = require("connect-mongo");

// Load Config
dotenv.config({ path: "./config/config.env" });

// Passport Config
require("./config/passport")(passport);

connectDB();

const app = express();

// Body Parser
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Method Override
app.use(
  methodOverride(function (req, res) {
    if (req.body && typeof req.body === "object" && "_method" in req.body) {
      // look in urlencoded POST bodies and delete it
      let method = req.body._method;
      delete req.body._method;
      return method;
    }
  })
);

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Handlebars Helpers
const {
  formateDate,
  stripTags,
  truncate,
  editIcon,
  select,
} = require("./helpers/hbs");

// Handlebars
app.engine(
  ".hbs",
  exphbs.engine({
    helpers: { formateDate, stripTags, truncate, editIcon, select },
    extname: ".hbs",
    defaultLayout: "main",
  })
);
app.set("view engine", ".hbs");
app.set("views", "./views");

// Sessions
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
    }),
    // using store session on MongoDB using express-session + connect
  })
);

// Passport Middleware
// Init passport authentication
app.use(passport.initialize());
// persistent login sessions
app.use(passport.session());

// Set global variable
app.use(function (req, res, next) {
  res.locals.user = req.user || null;
  next();
});

// Static
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/", require("./routes/index"));
app.use("/auth", require("./routes/auth"));
app.use("/stories", require("./routes/stories"));

const PORT = process.env.PORT || 3000;

app.listen(
  PORT,
  console.log(`Server Running in PORT ${process.env.NODE_ENV} in ${PORT}`)
);
