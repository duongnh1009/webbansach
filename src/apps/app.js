const express = require("express");
const app = express();
const mongoose = require("mongoose")
const session = require("express-session");
const methodOverride = require("method-override");
const flash = require("connect-flash");
const dotenv = require("dotenv");
const router = require("../routers/web");
const bodyParser = require("body-parser");

dotenv.config();
const {PORT, DB} = process.env;

//methodOverride
app.use(methodOverride("_method"));

//flash
app.use(flash());

//session
app.set("trust proxy", 1); // trust first proxy
app.use(session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// body-parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//form
app.use(express.urlencoded({ extended: true }));

//connect DB
mongoose.connect(DB);

//static
app.use("/static", express.static(process.env.STATIC_FOLDER));

//config view
app.set("views", process.env.VIEW_FOLDER);
app.set("view engine", process.env.VIEW_ENGINE);

//share
app.use(require("./middlewares/cart"));
app.use(require("./middlewares/share"));

//config router
app.use(router);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})

module.exports = app;
