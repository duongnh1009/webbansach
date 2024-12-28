const moment = require("moment");
const discountModel = require("../../models/discount");

const index = async(req, res) => {
    const discounts = await discountModel.find().sort({_id: -1});
    res.render("admin/discount/discount", {discounts, moment});
}

const create = (req, res) => {
    res.render("admin/discount/add_discount");
}

const store = async(req, res) => {
    const {code, discount, minOrderValue, expiryDate, isActive} = req.body;
    const createDiscount = {
        code, discount, minOrderValue, expiryDate, 
        isActive: isActive === "on"
    };
    await discountModel.create(createDiscount);
    req.flash("success", "Thêm thành công !")
    res.redirect("/admin/discount");
}

const edit = async(req, res) => {
    const discount = await discountModel.findById(req.params.id);
    res.render("admin/discount/edit_discount", {discount});
}

const update = async(req, res) => {
    const {code, discount, minOrderValue, expiryDate, isActive} = req.body;
    const updateDiscount = {
        code, discount, minOrderValue, expiryDate, 
        isActive: isActive === "on"
    }
    await discountModel.findByIdAndUpdate(req.params.id, updateDiscount);
    req.flash('success', 'Cập nhật thành công !');  
    res.redirect("/admin/discount");
}

const remove = async(req, res) => {
    await discountModel.findByIdAndDelete(req.params.id);
    req.flash('success', 'Xóa thành công !');
    res.redirect("/admin/discount");
}

module.exports = {
    index,
    create,
    store,
    edit,
    update,
    remove
}