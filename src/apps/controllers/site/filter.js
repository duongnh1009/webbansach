const orderModel = require("../../models/order");
const productModel = require("../../models/product");

const filterProduct = async(req, res) => {
  const { category, publisher, price } = req.query;
  const filterProduct = {};

  // Thêm điều kiện danh mục nếu tồn tại
  if (category) {
    filterProduct.cat_id = category;
  }

  // Thêm điều kiện nhà xuất bản nếu tồn tại
  if (publisher) {
    filterProduct.publisher = publisher;
  }

  // Phân tích khoảng giá từ giá trị của option và thêm điều kiện lọc theo giá
  if (price) {
    const [minPrice, maxPrice] = price.split('-').map(Number);
  
    // Lọc theo giá sale nếu có hoặc theo giá gốc nếu không có giảm giá
    filterProduct.$or = [
      {
        salePrice: { $gte: minPrice, $lte: maxPrice }, // Lọc theo giá sale nếu có salePrice
      },
      {
        $and: [
          { salePrice: { $exists: false } }, // Nếu không có salePrice
          { price: { $gte: minPrice, $lte: maxPrice } } // Lọc theo giá gốc
        ]
      }
    ];
  }

  // Truy vấn sản phẩm từ cơ sở dữ liệu
  const products = await productModel.find(filterProduct)

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
  res.render("site/filterProduct/filterProduct", { products, orders })
}

module.exports = {
    filterProduct
}