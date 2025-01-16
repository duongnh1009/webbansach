const categoryModel = require("../../models/category");
const orderModel = require("../../models/order");
const productModel = require("../../models/product");

const home = async (req, res) => {
    const categories = await categoryModel.find(); // lấy toàn bộ danh mục
    const publishers = await productModel.distinct('publisher'); // lay toan bo nha xuat ban tu co so du lieu
    const productsByCategory = {};

    // lấy sản phẩm theo danh mục
    for (const category of categories) {
        const products = await productModel.find({ 
            quantity: { $gt: 0 },
            cat_id: category._id,
        }).limit(8).sort({_id: -1});

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
          product.totalSold = salesData[0]?.totalSold || 0; // Kiểm tra salesData[0] có tồn tại không trước khi truy cập totalSold
        }

        // Chỉ thêm vào danh sách nếu danh mục có ít nhất một sản phẩm
        if (products.length > 0) {
          productsByCategory[category.title] = products;
        }
    }

    //hien thi san pham ban nhieu nhat trong thang
    const productBestSell = await orderModel.aggregate([
      {
        $match: {
          status: "Đã giao hàng", // Chỉ lấy các đơn hàng đã giao
          createdAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Ngày đầu tháng
            $lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1), // Ngày đầu tháng kế tiếp
          },
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
          totalQuantity: { $gt: 5 },
        },
      },
  
      {
        $limit: 12,
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
          "productDetails._id": 1, // Bao gồm trường id từ kết quả của $lookup
          "productDetails.price": 1, // Bao gồm trường price từ kết quả của $lookup
          "productDetails.salePrice": 1, // Bao gồm trường salePrice từ kết quả của $lookup
          "productDetails.sale": 1, // Bao gồm trường sale từ kết quả của $lookup
        },
      },

      // Sắp xếp theo số lượng tăng dần
      { $sort: { totalQuantity: -1 } },
    ]);
    res.render("site/home/index", { publishers, productsByCategory, productBestSell })
}

module.exports = {
    home
}