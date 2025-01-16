const productModel = require("../../models/product");
const categoryModel = require("../../models/category");
const orderModel = require("../../models/order");
const pagination = require("../../../common/pagination");

const search = async (req, res) => {
    const keyword = req.query.keyword || '';
    const searchProducts = await productModel.find({
        $or: [
            { name: { $regex: new RegExp(keyword, 'i') } },
            { cat_id: { $in: await categoryModel.find({ title: { $regex: new RegExp(keyword, 'i') } }).distinct('_id') } },
        ],
    });

    // lấy số lượng đã bán cho từng sản phẩm
    for (const product of searchProducts) {
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
    res.render("site/search/search", {
        searchProducts, 
        keyword,
    })
}

module.exports = {
    search
}