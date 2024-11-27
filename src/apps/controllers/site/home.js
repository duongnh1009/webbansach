const categoryModel = require("../../models/category");
const orderModel = require("../../models/order");
const productModel = require("../../models/product")

const home = async (req, res) => {
    // hiển thị sản phẩm theo danh mục cụ thể
    const categories = await categoryModel.find();
    const productsByCategory = {};
    for (const category of categories) {
        const products = await productModel.find({ 
            quantity: { $gt: 0 },
            cat_id: category._id,
        }).limit(8).sort({_id: -1});

        // Chỉ thêm vào danh sách nếu danh mục có ít nhất một sản phẩm
        if (products.length > 0) {
          productsByCategory[category.title] = products;
        }
    }

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
    res.render("site/home/index", {productsByCategory, productBestSell, orders})
}

module.exports = {
    home
}