const userModel = require("../../models/user");

const index = async(req, res) => {
    const userSiteId = req.session.userSiteId; // Sử dụng session để lấy userSiteId
    const user = await userModel.findById(userSiteId);
    res.render("site/user/user", {user});
};

const update = async(req, res) => {
    const userSiteId = req.session.userSiteId; // Lấy ID người dùng từ session
    const { name, mail, phone, address } = req.body; // Lấy thông tin từ form cập nhật
    await userModel.findByIdAndUpdate(userSiteId, {name, mail, phone, address}, {new: true});
    req.flash("success", "Cập nhật thành công !");
    res.redirect("/user")
}

module.exports = {
    index,
    update
}