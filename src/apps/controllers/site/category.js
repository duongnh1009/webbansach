const productModel = require("../../models/product")
const categoryModel = require("../../models/category")
const orderModel = require("../../models/order")

const category = async (req, res) => {
    const id = req.params.id;
    // phân trang
    const page = parseInt(req.query.page) || 1;
    const limit = 12; // hien thi so luong san pham tren 1 trang
    const skip = (page - 1) * limit;
    const total = await productModel.find({
        cat_id: id
    })
    const totalPages = Math.ceil(total.length/limit);
    
    // lấy toàn bộ danh mục
    const category = await categoryModel.findById(id)

    // Lấy danh sách sản phẩm theo danh mục
    const products = await productModel.find({
        cat_id: id
    }).sort({_id: -1}).skip(skip).limit(limit)

    // lấy số lượng đã bán cho từng sản phẩm
    for (const product of products) {
      const salesData = await orderModel.aggregate([
        { $match: { status: "Đã giao hàng" } }, // Chỉ lấy đơn hàng đã giao
        { $unwind: "$items" }, // Tách từng mục hàng trong đơn hàng
        { $match: { "items.name": product.name } }, // Lọc sản phẩm theo tên
        {
            $group: {
                _id: "$items.name", // Nhóm theo tên sản phẩm
                totalSold: { $sum: "$items.qty" }, // Tính tổng số lượng đã bán
            },
        },
    ]);
  
      // Gắn số lượng đã bán vào sản phẩm
      product.totalSold = salesData[0]?.totalSold || 0;
    }
    res.render("site/category/category", {
        category, 
        products,
        currentPage: page, 
        totalPages,
    })
}

module.exports = {
    category
}