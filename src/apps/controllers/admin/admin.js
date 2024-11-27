const userModel = require("../../models/user");
const productModel = require("../../models/product");
const orderModel = require("../../models/order");

const index = async (req, res) => {
    const users = (await userModel.find({
        role: "Member"
    })).length;
    const products = (await productModel.find()).length;
    const orders = await orderModel.find({
        status: "Đã giao hàng"
    });
    res.render("admin/dashboard", {users, products, orders})
}
module.exports = {
    index
}