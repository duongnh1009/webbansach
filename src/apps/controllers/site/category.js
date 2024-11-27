const productModel = require("../../models/product")
const categoryModel = require("../../models/category")
const orderModel = require("../../models/order")
const pagination = require("../../../common/pagination")

const category = async (req, res) => {
    const id = req.params.id;

    // phân trang
    const page = parseInt(req.query.page) || 1;
    const limit = 12; // hien thi so luong san pham tren 1 trang
    const skip = page*limit - limit;
    const total = await productModel.find({
        cat_id: id
    })
    const totalPages = Math.ceil(total.length/limit);
    const next = page + 1;
    const prev = page - 1;
    const hasNext = page < totalPages ? true : false;
    const hasPrev = page > 1 ? true : false;

    const category = await categoryModel.findById(id)

    //kiem tra xem danh muc cua san pham co trung id voi danh muc cu the
    const products = await productModel.find({
        cat_id: id
    }).sort({_id: -1}).skip(skip).limit(limit)

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
    res.render("site/category/category", {
        category, 
        products,
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
    category
}