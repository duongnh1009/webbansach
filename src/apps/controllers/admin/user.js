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