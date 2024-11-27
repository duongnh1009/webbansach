const moment = require("moment");
const orderModel = require("../../models/order");
const pagination = require("../../../common/pagination");

const index = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = page*limit - limit;
    const total = await orderModel.find({
        status: "Đang chuẩn bị"
    })
    const totalPages = Math.ceil(total.length/limit);
    const next = page + 1;
    const prev = page - 1;
    const hasNext = page < totalPages ? true : false;
    const hasPrev = page > 1 ? true : false;
    const orders = await orderModel.find({
        status: "Đang chuẩn bị"
    }).skip(skip).limit(limit).sort({_id: -1})

    res.render("admin/order/order", {
        orders, 
        moment,
        page,
        next,
        hasNext,
        prev,
        hasPrev,
        pages: pagination(page, totalPages)
    })
}

const trash = async (req, res) => {
    const orders = await orderModel.findWithDeleted({
        deleted: true
    });
    
    res.render("admin/order/trash", {
        orders, 
        moment, 
    })
}

const transport = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = page*limit - limit;
    const total = await orderModel.find({
        status: "Đang giao hàng"
    })
    const totalPages = Math.ceil(total.length/limit);
    const next = page + 1;
    const prev = page - 1;
    const hasNext = page < totalPages ? true : false;
    const hasPrev = page > 1 ? true : false;
    const orders = await orderModel.find({
        status: "Đang giao hàng"
    }).sort({_id: -1}).skip(skip).limit(limit)

    res.render("admin/order/order-transport", {
        orders, 
        moment,
        page,
        next,
        hasNext,
        prev,
        hasPrev,
        pages: pagination(page, totalPages)
    })
}

const delivered = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = page*limit - limit;
    const total = await orderModel.find({
        status: "Đã giao hàng"
    })
    const totalPages = Math.ceil(total.length/limit);
    const next = page + 1;
    const prev = page - 1;
    const hasNext = page < totalPages ? true : false;
    const hasPrev = page > 1 ? true : false;
    const orders = await orderModel.find({
        status: "Đã giao hàng"
    }).sort({_id: -1}).skip(skip).limit(limit)

    res.render("admin/order/order-delivered", {
        orders, 
        moment,
        page,
        next,
        hasNext,
        prev,
        hasPrev,
        pages: pagination(page, totalPages)
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
        id,
        deleted: true
    })
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