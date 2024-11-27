const moment = require("moment")
const productModel = require("../../models/product")
const orderModel = require("../../models/order");

const product = async (req, res) => {
    const id = req.params.id;
    const productById = await productModel.findById(id);

    //hien thi san pham cung danh muc
    const productByCatId = await productModel.find({
        quantity: { $gt: 0 },
        cat_id: productById.cat_id,
        _id: {
          $ne: productById
        }
    }).limit(8);

    // //hien thi san pham cung tac gia
    // const authors = await productModel.find({
    //   quantity: { $gt: 0 },
    //   author: productById.author,
    //   _id: {
    //     $ne: productById,
    //   },
    // }).limit(8);

    //hien thi san pham ban nhieu nhat
    const productBestSell = await orderModel.aggregate([
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
  
      {
        $match: {
          totalQuantity: { $gt: 4 },
        },
      },
  
      {
        $limit: 8,
      },
      
      {
        $lookup: {
          from: "products", // Tên collection chứa thông tin sản phẩm
          localField: "_id.productName", // Trường trong collection hiện tại để so khớp
          foreignField: "name", // Trường trong collection "products" chứa thông tin sản phẩm để so khớp
          as: "productDetails", // Tên của trường chứa kết quả tìm kiếm
        },
      },

      {
        $project: {
          productName: 1, // Bao gồm trường productName
          totalQuantity: 1, // Bao gồm trường totalQuantity
          "productDetails.image": 1, // Bao gồm trường image từ kết quả của $lookup
          "productDetails.price": 1, // Bao gồm trường price từ kết quả của $lookup
          "productDetails.salePrice": 1, // Bao gồm trường salePrice từ kết quả của $lookup
          "productDetails.sale": 1, // Bao gồm trường sale từ kết quả của $lookup
        },
      },
    ]);
    
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
    res.render("site/product/product", {productById, productByCatId, productBestSell, orders});
}

module.exports = {
    product
}