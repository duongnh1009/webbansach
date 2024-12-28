const moment = require("moment");
const orderModel = require("../../models/order");
const productModel = require("../../models/product");
const pagination = require("../../../common/pagination");

const index = async (req, res) => {
    const orders = await orderModel.find({
        status: "Đang chuẩn bị"
    }).sort({_id: -1});
    res.render("admin/order/order", {orders, moment})
}

const trash = async (req, res) => {
    const orders = await orderModel.findWithDeleted({
        deleted: true
    }).sort({_id: -1});
    
    res.render("admin/order/trash", {
        orders, 
        moment, 
    })
}

const transport = async (req, res) => {
    const orders = await orderModel.find({
        status: "Đang giao hàng"
    }).sort({_id: -1})

    res.render("admin/order/order-transport", {
        orders, 
        moment,
    })
}

const delivered = async (req, res) => {
    const orders = await orderModel.find({
        status: "Đã giao hàng"
    }).sort({_id: -1})

    res.render("admin/order/order-delivered", {
        orders, 
        moment,
    })
}

const orderDetail = async (req, res) => {
    const id = req.params.id;
    const order = await orderModel.findById(id)
    res.render("admin/order/order-detail", {order})
}

const update = async (req, res) => {
    const id = req.params.id;
    const {status} = req.body;
    const order = {
        status
    }
    await orderModel.findByIdAndUpdate(id, order);
    req.flash('success', 'Cập nhật thành công !');
    res.redirect("/admin/order");
}

const orderDetailTrash = async (req, res) => {
    const id = req.params.id;
    const order = await orderModel.findOneWithDeleted({
        _id: id,
        deleted: true
    }).populate("items.product")
    res.render("admin/order/order-detailTrash", {order})
}

const force = async (req, res) => {
    const id = req.params.id;
    await orderModel.deleteOne({_id: id});
    req.flash('success', 'Xóa thành công !');
    res.redirect("/admin/order/trash")
}

const remove = async (req, res) => {
    const id = req.params.id;
    const order = await orderModel.findById(id);

    //cap nhat lai so luong khi nguoi dung xoa don hang
    for (const item of order.items) {
      const product = await productModel.findById(item.id);
      if (product) {
        product.quantity += item.qty;
        await product.save();
      }
    }
    await orderModel.delete({_id: id});
    req.flash('success', 'Xóa thành công !');
    res.redirect("/admin/order")
}

const search = async (req, res) => {
    const keyword = req.query.keyword || '';
    const searchOrders = await orderModel.find({
        $or: [
            { name: { $regex: new RegExp(keyword, 'i') } },
            { phone: { $regex: new RegExp(keyword, 'i') } },
        ],
    })
    
    res.render("admin/order/search-order", {
        searchOrders, 
        moment, 
    })
}

module.exports = {
    index,
    trash,
    transport,
    delivered,
    orderDetail,
    update,
    orderDetailTrash,
    remove,
    force,
    search
}