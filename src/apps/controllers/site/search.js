const productModel = require("../../models/product");
const categoryModel = require("../../models/category");
const orderModel = require("../../models/order");
const pagination = require("../../../common/pagination");

const search = async (req, res) => {
    const keyword = req.query.keyword || '';
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = page*limit - limit;
    const total = await productModel.find({
        $or: [
            { name: { $regex: new RegExp(keyword, 'i') } },
            { cat_id: { $in: await categoryModel.find({ title: { $regex: new RegExp(keyword, 'i') } }).distinct('_id') } },
        ],
    })
    const totalPages = Math.ceil(total.length/limit);
    const next = page + 1;
    const prev = page - 1;
    const hasNext = page < totalPages ? true : false;
    const hasPrev = page > 1 ? true : false;
    const searchProducts = await productModel.find({
        $or: [
            { name: { $regex: new RegExp(keyword, 'i') } },
            { cat_id: { $in: await categoryModel.find({ title: { $regex: new RegExp(keyword, 'i') } }).distinct('_id') } },
        ],
    }).skip(skip).limit(limit);

    //hien thi so luong ban cua san pham
    const orders = await orderModel.aggregate([
        {
          $match: {
            status: "Đã giao hàng", // Chỉ lấy các đơn hàng đã giao
          },
        },
        {
          $unwind: "$items", // Tách mỗi mục hàng thành một document riêng biệt
        },
        {
          $group: {
            _id: {
              productName: "$items.name", // Nhóm theo tên sản phẩm
            },
            totalQuantity: { $sum: "$items.qty" }, // Tính tổng số lượng đã bán
            productName: { $first: "$items.name" }, // Giữ lại tên sản phẩm
          },
        },
    ]);
    res.render("site/search/search", {
        searchProducts, 
        keyword,
        orders,
        page,
        next,
        hasNext,
        prev,
        hasPrev,
        pages: pagination(page, totalPages)
    })
}

module.exports = {
    search
}