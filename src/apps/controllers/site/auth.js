const bcryptjs = require("bcryptjs")
const validator = require("validator")
const crypto = require("crypto")
const userModel = require("../../models/user")
const transporter = require("../../../common/transporter");

const login = (req, res) => {
    res.render("site/auth/login")
}

// đăng nhập
const postLogin = async(req, res) => {
    const {email, password} = req.body;
    const user = await userModel.findOne({ email }); // kiểm tra xem email đã được đăng kí chưa
    if (!user) {
        return res.render("site/auth/login", {error: "Email chưa được đăng kí !", email});
    }

    else if(!(await bcryptjs.compare(password, user.password))) {
        return res.render("site/auth/login", {error: "Mật khẩu không chính xác !", email});
    }

    else if(user.isLocked) {
        return res.render("site/auth/login", {error: "Tài khoản của bạn đã bị khóa !", email});
    }

    //luu thong tin tai khoan vao session
    req.session.userSiteId = user._id;
    req.session.emailSite = user.email;
    req.session.fullNameSite = user.fullName;
    res.redirect('/');
}

const Logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
} 

const register = (req, res) => {
    res.render("site/auth/register")
}

// đăng kí
const registerStore = async(req, res) => {
    const {email, password, password_retype, fullName} = req.body;

    const users = await userModel.findOne({
        email: {$regex: new RegExp("^" + email + "$", "i")}
    }) // kiem tra xem email da duoc dang ki chua

    //kiem tra dinh dang email
    function isValidEmail(email) {
        return validator.isEmail(email);
    }

    //ma hoa mat khau
    const hashPass = await bcryptjs.hash(password, 10);
    
    const user = {
       email,
       password: hashPass,
       fullName,
    }

    if(users) {
        res.render("site/auth/register", {error: 'Email này đã tồn tại !', email, fullName})
    }

    else if(!isValidEmail(email)) {
        res.render("site/auth/register", {error: "Không đúng định dạng email !", email, fullName})
    }

    else if(password.length<6) {
        res.render("site/auth/register", {error: "Mật khẩu tối thiểu 6 kí tự !", email, fullName})
    }
    
    else if(password !== password_retype) {
        res.render("site/auth/register", {error: "Mật khẩu nhập lại không đúng !", email, fullName})
    }

    else {
        await userModel.create(user);
        req.flash('success', 'Đăng kí thành công !');
        res.redirect("/register")
    }
}

//cap nhat mat khau
const changePassword = (req, res) => {
    res.render("site/auth/changePassword")
}

const updatePass = async(req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const user = await userModel.findById(req.session.userSiteId); // kiem tra id tai khoan đang đăng nhập

    if (!user || !(await bcryptjs.compare(currentPassword, user.password))) {
        return res.render('site/auth/changePassword', {error: "Mật khẩu cũ không chính xác !"});
    } 

    else if(newPassword.length < 6) {
        return res.render('site/auth/changePassword', {error: "Mật khẩu tối thiểu 6 kí tự !"});
    }

    else if (newPassword !== confirmPassword) {
        return res.render('site/auth/changePassword', {error: "Mật khẩu nhập lại không chính xác !"});
    }

    else {
        const hashPass = await bcryptjs.hash(newPassword, 10);
        user.password = hashPass;
        await user.save();
        req.flash('success', 'Đổi mật khẩu thành công !');
        res.redirect('/changePassword')
    }
}

//quen mat khau
const forgotPass = (req, res) => {
    res.render("site/auth/forgotPass")
}

const forgotCode = async(req, res) => {
    const { email } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
        res.render("site/auth/forgotPass", {error: 'Tài khoản không tồn tại !'});
    }

    else {
        // Tạo mã reset password
        const token = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 giờ
        await user.save();

        // Gửi email reset password
        const mailOptions = {
            to: email,
            from: 'D-SHOP',
            subject: 'Yêu cầu reset mật khẩu từ D-SHOP',
            text: `Vui lòng nhấp vào đường link sau để đổi mật khẩu, hoặc copy-paste nó vào trình duyệt để hoàn tất quá trình: http://${req.headers.host}/resetPassword-${token}.`,
        };

        await transporter.sendMail(mailOptions);
        req.flash('success', 'Vui lòng kiểm tra email !');
        res.redirect('/forgotPassword')
    }
}

const resetPass = async(req, res) => {
    const user = await userModel.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() },
    });
  
    if (!user) {
        return res.render('site/auth/invalidToken');
    }
  
    res.render('site/auth/resetPass', {token: req.params.token });
}

const resetUpdate = async(req, res) => {
    const { newPassword, confirmPassword } = req.body;
    const user = await userModel.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
        return res.render('site/auth/invalidToken');
    }
  
    if(newPassword.length < 6) {
        res.render("site/auth/resetPass", {error: "Mật khẩu tối thiểu 6 kí tự !"});

    }

    else if(newPassword !== confirmPassword) {
        res.render("site/auth/resetPass", {error: "Mật khẩu nhập lại không đúng !"});
    }

    else {
        // Cập nhật mật khẩu và xóa thông tin reset password
        const hashPass = await bcryptjs.hash(newPassword, 10);
        user.password = hashPass;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        res.render("site/auth/passUpdate");
    }
}

module.exports = {
    login,
    postLogin,
    Logout,
    register,
    registerStore,
    changePassword,
    updatePass,
    forgotPass,
    forgotCode,
    resetPass,
    resetUpdate,
}