const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: "duongga4xxx@gmail.com",
        pass: "glwm pphh apwo slsm"
    }
});

module.exports = transporter;