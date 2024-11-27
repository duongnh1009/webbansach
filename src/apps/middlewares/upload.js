const multer = require("multer");
const dotenv = require("dotenv");
dotenv.config();
const upload = multer({
    dest: process.env.TMP
})

module.exports = upload