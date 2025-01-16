const transporter = require("../../../common/transporter");
const userModel = require("../../models/user")

const index = async (req, res) => {
    const users = await userModel.find({
        role: "Member"
    }).sort({_id:-1})
    res.render("admin/users/user", {users,})
}

const remove = async (req, res) => {
    const id = req.params.id;
    await userModel.deleteOne({_id: id});
    req.flash('success', 'Xóa thành công !');
    res.redirect("/admin/user")
}

const lockAccount = async(req, res) => {
    const id = req.params.id;
    const user = await userModel.findById(id);
    user.isLocked = true;
    await user.save();
    // Gửi email nội dung khóa tài khoản
    const mailOptions = {
        to: user.email,
        from: 'D-SHOP',
        subject: 'Thông báo khóa tài khoản',
        text: `Xin chào ${user.fullName}, tài khoản của bạn đã bị khóa do vi phạm chính sách.
        Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi qua email duongga4xxx@gmail.com.`,
    };
    await transporter.sendMail(mailOptions);
    req.flash('success', 'Đã khóa tài khoản !');
    res.redirect('/admin/user');
}

const unlockAccount = async(req, res) => {
    const id = req.params.id;
    const user = await userModel.findById(id);
    user.isLocked = false;
    await user.save();
    req.flash('success', 'Mở khóa tài khoản thành công !');
    res.redirect('/admin/user');
}

const search = async (req, res) => {
    const keyword = req.query.keyword || '';
    const searchUsers = await userModel.find({
        role: "Member",
        $or: [
            { fullName: { $regex: new RegExp(keyword, 'i') } },
            { email: { $regex: new RegExp(keyword, 'i') } },
        ],
    })
    res.render("admin/users/search-user", {searchUsers, keyword,})
}

module.exports = {
    index,
    remove,
    lockAccount,
    unlockAccount,
    search
}