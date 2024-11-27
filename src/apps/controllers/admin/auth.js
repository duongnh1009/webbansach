const bcryptjs = require("bcryptjs")
const validator = require("validator")
const crypto = require("crypto")
const transporter = require("../../../common/transporter");
const userModel = require("../../models/user")

const getLogin = async (req, res) => {
    let error = '';
    res.render("admin/auth/login", {error})
} 

const postLogin = async (req, res) => {
    const {email, password} = req.body;
    let error = '';
    const user = await userModel.findOne({ email });

    //kiem tra xem email ton tai hay khong
    if (!user) {
        error = "Tài khoản không tồn tại !"
        return res.render("admin/auth/login", {error, email});
    }

    //kiem tra mat khau dung hay chua
    const checkPass = await bcryptjs.compare(password, user.password)
    if(!checkPass) {
        error = "Mật khẩu không chính xác !"
        return res.render("admin/auth/login", {error, email});
    }
   
    //luu thong tin tai khoan vao session
    req.session.userId = user._id;
    req.session.fullName = user.fullName;
    req.session.role = user.role;

    //kiem tra quyen truy cap cua tai khoan
    if(req.session.role !== "Admin") {
        error = "Tài khoản không có quyền truy cập !"
        return res.render("admin/auth/login", {error, email});
    }
    res.redirect('/admin/dashboard');
}

const logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/admin/login');
    });
} 

//dang ki tai khoan
const register = (req, res) => {
    let error = ''
    res.render("admin/auth/register", {error})
}

const registerStore = async(req, res) => {
    const {email, password, password_retype, fullName} = req.body;
    let error = '';

    //kiem tra xem email da ton tai chua
    const users = await userModel.findOne({
        email: {$regex: new RegExp("^" + email + "$", "i")}
    })

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
       role: "Admin"
    }

    if(users) {
        error = 'Email đã tồn tại !'
    }

    else if(!isValidEmail(email)) {
        error = "Không đúng định dạng email !"
    }

    else if(password.length<6) {
        error = "Mật khẩu tối thiểu 6 kí tự !"
    }
    
    else if(password !== password_retype) {
        error = "Mật khẩu nhập lại không đúng !"
    }

    else {
        await userModel.create(user)
        req.flash('success', 'Đăng kí thành công !');
        res.redirect("/admin/register")
    }
    res.render("admin/auth/register", {error})
}

//doi mat khau
const changePassword = (req, res) => {
    let error = ''
    res.render("admin/auth/changePass", {error})
}

const updatePass = async(req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    let error = ''
    const user = await userModel.findById(req.session.userId);
    if (!user || !(await bcryptjs.compare(currentPassword, user.password))) {
        error = "Mật khẩu cũ không chính xác !"
    }

    else if(newPassword.length < 6) {
        error = "Mật khẩu tối thiểu 6 kí tự !"
    }

    else if (newPassword !== confirmPassword) {
        error = "Mật khẩu nhập lại không chính xác !"
    }

    else {
        const hashPass = await bcryptjs.hash(newPassword, 10);
        user.password = hashPass;
        await user.save();
        req.flash('success', 'Đổi mật khẩu thành công !');
        res.redirect('/admin/changePass')
    }
    return res.render('admin/auth/changePass', {error});
}

//quen mat khau
const forgotPass = (req, res) => {
    let error = ''
    res.render("admin/auth/forgotPass", {error})
}

const forgotCode = async(req, res) => {
    const { email } = req.body;
    let error = '';
    const user = await userModel.findOne({ email });

    if (!user) {
        error = 'Tài khoản không tồn tại !'
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
            text: `Vui lòng nhấp vào đường link sau để đổi mật khẩu, hoặc copy-paste nó vào trình duyệt để hoàn tất quá trình: http://${req.headers.host}/admin/resetPass-${token}.`,
        };

        await transporter.sendMail(mailOptions);
        req.flash('success', 'Vui lòng kiểm tra email !');
        res.redirect('/admin/forgotPass')
    }
    res.render("admin/auth/forgotPass", {error});
}

const resetPass = async(req, res) => {
    let error = '';
    const user = await userModel.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() },
    });
  
    if (!user) {
        return res.render('site/auth/invalidToken');
    }
  
    res.render('admin/auth/resetPass', {error, token: req.params.token });
}

const resetUpdate = async(req, res) => {
    const { newPassword, confirmPassword } = req.body;
    let error = '';
    const user = await userModel.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
        return res.render('site/auth/invalidToken');
    }
  
    if(newPassword.length < 6) {
        error = "Mật khẩu tối thiểu 6 kí tự !"
    }

    else if(newPassword !== confirmPassword) {
        error = "Mật khẩu nhập lại không đúng !"
    }

    else {
        // Cập nhật mật khẩu và xóa thông tin reset password
        const hashPass = await bcryptjs.hash(newPassword, 10);
        user.password = hashPass;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        res.redirect("site/auth/passUpdate");
    }
    res.render("admin/auth/resetPass", {error})
}

module.exports = {
    getLogin,
    postLogin,
    logout,
    register,
    registerStore,
    changePassword,
    updatePass,
    forgotPass,
    forgotCode,
    resetPass, 
    resetUpdate
}