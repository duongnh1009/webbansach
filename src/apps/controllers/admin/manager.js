const orderModel = require("../../models/order");
const productModel = require("../../models/product");

// lấy dữ liệu các sản phẩm đã nhập
const getProducts = async (req, res) => {
  const { timeframe, start, end} = req.query; // Nhận giá trị timeframe và thời gian tùy chọn từ query params
  let startDate, endDate;
  const currentDate = new Date(); // lấy thời gian hiện tại

  const page = parseInt(req.query.page) || 1; // Nhận giá trị page từ query params
  const limit = 12; // số lượng hiển thị ở 1 trang
  const skip = (page - 1) * limit; // Tính số mục cần bỏ qua

  // Xác định ngày bắt đầu và kết thúc dựa trên option
  switch (timeframe) {
    case "10days":
      startDate = new Date(currentDate.setDate(currentDate.getDate() - 10));
      startDate.setHours(0, 0, 0, 0); // Đặt thời gian bắt đầu
      endDate = new Date(); // Hiện tại
      endDate.setHours(23, 59, 59, 999); // Đặt thời gian kết thúc
      break;

    case "week":
      // Tuần mới nhất (Thứ 2 -> Chủ nhật)
      const startOfWeek = new Date();
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1);
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      startDate = startOfWeek;
      endDate = endOfWeek;
      break;

    case "month":
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); // Ngày đầu tháng
      startDate.setHours(0, 0, 0, 0); // Đặt thời gian bắt đầu
      endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); // Ngày cuối tháng
      endDate.setHours(23, 59, 59, 999); // Đặt thời gian kết thúc
      break;

    case "custom":
      startDate = new Date(start);
      startDate.setHours(0, 0, 0, 0); // Đặt thời gian bắt đầu
      endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999); // Đặt thời gian kết thúc
      break;

    default:
      startDate = new Date(currentDate.setDate(currentDate.getDate() - 10));
      startDate.setHours(0, 0, 0, 0); // Đặt thời gian bắt đầu
      endDate = new Date(); // Hiện tại
      endDate.setHours(23, 59, 59, 999); // Đặt thời gian kết thúc
      break;
  }

  const result = await productModel.aggregate([
    // Tách `purchaseHistory` thành các documents riêng biệt
    { $unwind: "$purchaseHistory" },
    // Lọc theo thời gian bắt đầu và kết thúc
    {
      $match: {
        "purchaseHistory.date": { $gte: startDate, $lte: endDate },
      },
    },
    // Nhóm theo ngày và sản phẩm
    {
      $group: {
        _id: {
          day: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: { $toDate: "$purchaseHistory.date" },
            },
          },
          product: "$name",
          quantity: "$quantity", // lấy số lượng tồn kho
        },
        totalQuantity: { $sum: "$purchaseHistory.quantity" },
      },
    },
    // Tạo một object dễ đọc
    {
      $project: {
        day: "$_id.day",
        product: "$_id.product",
        quantity: "$_id.quantity",
        totalQuantity: 1,
      },
    },
    // Sắp xếp theo ngày mới nhất
    { $sort: { day: -1 } },
    { $skip: skip }, // Bỏ qua các mục không thuộc trang hiện tại
    { $limit: limit }, // Giới hạn số mục trả về
  ]);

  // Tính tổng số mục để hiển thị số trang
  const totalItems = await productModel.aggregate([
    { $unwind: "$purchaseHistory" },
    { $match: { "purchaseHistory.date": { $gte: startDate, $lte: endDate } } },
  ]);
  const totalPages = Math.ceil(totalItems.length/limit);

  res.render("admin/manager/import", { result, timeframe, start, end, currentPage: page, totalPages, query: req.query});
};

// lấy dữ liệu các sản phẩm nhập nhiều
const getProductsByMuch = async (req, res) => {
    const { timeframe, start, end } = req.query; // Nhận giá trị timeframe và thời gian tùy chọn từ query params
    let startDate, endDate;
    const currentDate = new Date();

    // Xác định ngày bắt đầu và kết thúc dựa trên option
    switch (timeframe) {
      case "10days":
        startDate = new Date(currentDate.setDate(currentDate.getDate() - 10));
        startDate.setHours(0, 0, 0, 0); // Đặt thời gian bắt đầu
        endDate = new Date(); // Hiện tại
        endDate.setHours(23, 59, 59, 999); // Đặt thời gian kết thúc
        break;

      case "week":
        // Tuần mới nhất (Thứ 2 -> Chủ nhật)
        const startOfWeek = new Date();
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1); // thứ 2 đầu tuần
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // chủ nhật cuối tuần
        endOfWeek.setHours(23, 59, 59, 999);
        startDate = startOfWeek;
        endDate = endOfWeek;
        break;
    
      case "month":
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); // Ngày đầu tháng
        startDate.setHours(0, 0, 0, 0); // Đặt thời gian bắt đầu
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); // Ngày cuối tháng
        endDate.setHours(23, 59, 59, 999); // Đặt thời gian kết thúc
        break;
    
      case "custom":
        startDate = new Date(start);
        startDate.setHours(0, 0, 0, 0); // Đặt thời gian bắt đầu
        endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999); // Đặt thời gian kết thúc
        break;

      default:
        startDate = new Date(currentDate.setDate(currentDate.getDate() - 10));
        startDate.setHours(0, 0, 0, 0); // Đặt thời gian bắt đầu
        endDate = new Date(); // Hiện tại
        endDate.setHours(23, 59, 59, 999); // Đặt thời gian kết thúc
        break;
    }

    const result = await productModel.aggregate([
      // Tách `purchaseHistory` thành các documents riêng biệt
      { $unwind: "$purchaseHistory" },
      // Lọc theo thời gian bắt đầu và kết thúc
      {
        $match: {
          "purchaseHistory.date": { $gte: startDate, $lte: endDate },
        },
      },
      // Nhóm theo ngày và sản phẩm
      {
        $group: {
          _id: {
            product: "$name",
            quantity: "$quantity", // lấy số lượng tồn kho
          },
          totalQuantity: { $sum: "$purchaseHistory.quantity" },
        },
      },

      {
        $match: {
          totalQuantity: { $gt: 30 },
        },
      },

      // Tạo một object dễ đọc
      {
        $project: {
          product: "$_id.product",
          quantity: "$_id.quantity",
          totalQuantity: 1,
        },
      },
      // Sắp xếp theo số lượng tăng dần
      { $sort: { totalQuantity: -1 } },
    ]);

    res.render("admin/manager/productBestImport", { result, timeframe, start, end });
};

// lấy dữ liệu các sản phẩm nhập ít nhất
const getProductsByLeast = async (req, res) => {
    const { timeframe, start, end } = req.query; // Nhận giá trị timeframe và thời gian tùy chọn từ query params
    let startDate, endDate;
    const currentDate = new Date();

    // Xác định ngày bắt đầu và kết thúc dựa trên option
    switch (timeframe) {
      case "10days":
        startDate = new Date(currentDate.setDate(currentDate.getDate() - 10));
        startDate.setHours(0, 0, 0, 0); // Đặt thời gian bắt đầu
        endDate = new Date(); // Hiện tại
        endDate.setHours(23, 59, 59, 999); // Đặt thời gian kết thúc
        break;

      case "week":
        // Tuần mới nhất (Thứ 2 -> Chủ nhật)
        const startOfWeek = new Date();
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1); // thứ 2 đầu tuần
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // chủ nhật cuối tuần
        endOfWeek.setHours(23, 59, 59, 999);
        startDate = startOfWeek;
        endDate = endOfWeek;
        break;
      
      case "month":
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); // Ngày đầu tháng
        startDate.setHours(0, 0, 0, 0); // Đặt thời gian bắt đầu
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); // Ngày cuối tháng
        endDate.setHours(23, 59, 59, 999); // Đặt thời gian kết thúc
        break;

      case "custom":
        startDate = new Date(start);
        startDate.setHours(0, 0, 0, 0); // Đặt thời gian bắt đầu
        endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999); // Đặt thời gian kết thúc
        break;

      default:
        startDate = new Date(currentDate.setDate(currentDate.getDate() - 10));
        startDate.setHours(0, 0, 0, 0); // Đặt thời gian bắt đầu
        endDate = new Date(); // Hiện tại
        endDate.setHours(23, 59, 59, 999); // Đặt thời gian kết thúc
        break;
    }

    const result = await productModel.aggregate([
      // Tách `purchaseHistory` thành các documents riêng biệt
      { $unwind: "$purchaseHistory" },
      // Lọc theo thời gian bắt đầu và kết thúc
      {
        $match: {
          "purchaseHistory.date": { $gte: startDate, $lte: endDate },
        },
      },
      // Nhóm theo ngày và sản phẩm
      {
        $group: {
          _id: {
            product: "$name",
            quantity: "$quantity", // lấy số lượng tồn kho
          },
          totalQuantity: { $sum: "$purchaseHistory.quantity" },
        },
      },

      {
        $match: {
          totalQuantity: { $lte: 30 },
        },
      },

      // Tạo một object dễ đọc
      {
        $project: {
          product: "$_id.product",
          quantity: "$_id.quantity",
          totalQuantity: 1,
        },
      },
      // Sắp xếp theo số lượng tăng dần
      { $sort: { totalQuantity: -1 } },
    ]);

    res.render("admin/manager/productLeastImport", { result, timeframe, start, end });
};

// lấy dữ liệu các sản phẩm đã bán 
const getSoldProducts = async (req, res) => {
    const { timeframe, start, end } = req.query; // Nhận các tham số từ query params
    let startDate, endDate;
    const currentDate = new Date(); // lấy thời gian hiện tại

    const page = parseInt(req.query.page) || 1; // Nhận giá trị page từ query params
    const limit = 12; // số lượng hiển thị ở 1 trang
    const skip = (page - 1) * limit; // Tính số mục cần bỏ qua

    // Xác định ngày bắt đầu và kết thúc dựa trên option
    switch (timeframe) {
      case "10days":
        startDate = new Date(currentDate.setDate(currentDate.getDate() - 10));
        startDate.setHours(0, 0, 0, 0); // Đặt thời gian bắt đầu
        endDate = new Date(); // Hiện tại
        endDate.setHours(23, 59, 59, 999); // Đặt thời gian kết thúc
        break;

      case "week":
        // Tuần mới nhất (Thứ 2 -> Chủ nhật)
        const startOfWeek = new Date();
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1); // thứ 2 đầu tuần
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // chủ nhật cuối tuần
        endOfWeek.setHours(23, 59, 59, 999);
        startDate = startOfWeek;
        endDate = endOfWeek;
        break;
        
      case "month":
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); // Ngày đầu tháng
        startDate.setHours(0, 0, 0, 0); // Đặt thời gian bắt đầu
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); // Ngày cuối tháng
        endDate.setHours(23, 59, 59, 999); // Đặt thời gian kết thúc
        break;

      case "custom":
        startDate = new Date(start);
        startDate.setHours(0, 0, 0, 0); // Đặt thời gian bắt đầu
        endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999); // Đặt thời gian kết thúc
        break;

      default:
        startDate = new Date(currentDate.setDate(currentDate.getDate() - 10));
        startDate.setHours(0, 0, 0, 0); // Đặt thời gian bắt đầu
        endDate = new Date(); // Hiện tại
        endDate.setHours(23, 59, 59, 999); // Đặt thời gian kết thúc
        break;
    }

    // Truy vấn sản phẩm đã bán
    const soldItems = await orderModel.aggregate([
      {
        $match: {
          status: "Đã giao hàng", // Chỉ lấy đơn hàng đã giao
          createdAt: { $gte: startDate, $lte: endDate }, // Lọc theo khoảng thời gian
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: {
            productName: "$items.name",
            day: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: { $toDate: "$createdAt" },
              },
            },
          },
          totalQuantity: { $sum: "$items.qty" },
        },
      },

      {
        $lookup: {
          from: "products",
          localField: "_id.productName",
          foreignField: "name",
          as: "productDetails",
        },
      },
      {
        $project: {
          productName: "$_id.productName",
          day: "$_id.day",
          totalQuantity: 1, // Giữ lại trường này trong kết quả
          "productDetails.quantity": 1, // Giữ lại trường này trong kết quả
        },
      },
      { $sort: { day: -1 } },
      { $skip: skip }, // Bỏ qua các mục không thuộc trang hiện tại
      { $limit: limit }, // Giới hạn số mục trả về
    ]);

    // Tính tổng số mục để hiển thị số trang
    const totalItems = await orderModel.aggregate([
      {
        $match: {
          status: "Đã giao hàng", // Chỉ lấy đơn hàng đã giao
          createdAt: { $gte: startDate, $lte: endDate }, // Lọc theo khoảng thời gian
        },
      },
      { $unwind: "$items" },
    ]);
    const totalPages = Math.ceil(totalItems.length/limit);

    res.render("admin/manager/soldOut", { soldItems, timeframe, start, end, currentPage: page, totalPages, query: req.query });
};

// lấy dữ liệu các sản phẩm bán nhiều 
const getSoldProductsByMuch = async (req, res) => {
  const { timeframe, start, end } = req.query; // Nhận các tham số từ query params
  let startDate, endDate;
  const currentDate = new Date();

  // Xác định ngày bắt đầu và kết thúc dựa trên option
  switch (timeframe) {
    case "10days":
      startDate = new Date(currentDate.setDate(currentDate.getDate() - 10));
      startDate.setHours(0, 0, 0, 0); // Đặt thời gian bắt đầu
      endDate = new Date(); // Hiện tại
      endDate.setHours(23, 59, 59, 999); // Đặt thời gian kết thúc
      break;

    case "week":
      // Tuần mới nhất (Thứ 2 -> Chủ nhật)
      const startOfWeek = new Date();
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1); // thứ 2 đầu tuần
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // chủ nhật cuối tuần
      endOfWeek.setHours(23, 59, 59, 999);
      startDate = startOfWeek;
      endDate = endOfWeek;
      break;
        
    case "month":
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); // Ngày đầu tháng
      startDate.setHours(0, 0, 0, 0); // Đặt thời gian bắt đầu
      endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); // Ngày cuối tháng
      endDate.setHours(23, 59, 59, 999); // Đặt thời gian kết thúc
      break;

    case "custom":
      startDate = new Date(start);
      startDate.setHours(0, 0, 0, 0); // Đặt thời gian bắt đầu
      endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999); // Đặt thời gian kết thúc
      break;

    default:
      startDate = new Date(currentDate.setDate(currentDate.getDate() - 10));
      startDate.setHours(0, 0, 0, 0); // Đặt thời gian bắt đầu
      endDate = new Date(); // Hiện tại
      endDate.setHours(23, 59, 59, 999); // Đặt thời gian kết thúc
      break;
  }

  // Truy vấn sản phẩm đã bán
  const result = await orderModel.aggregate([
    {
      $match: {
        status: "Đã giao hàng", // Chỉ lấy đơn hàng đã giao
        createdAt: { $gte: startDate, $lte: endDate }, // Lọc theo khoảng thời gian
      },
    },
    { $unwind: "$items" },
    {
      $group: {
        _id: {
          productName: "$items.name",
        },
        totalQuantity: { $sum: "$items.qty" },
      },
    },

    {
      $match: {
        totalQuantity: { $gt: 5 },
      },
    },

    {
      $lookup: {
        from: "products",
        localField: "_id.productName",
        foreignField: "name",
        as: "productDetails",
      },
    },
    {
      $project: {
        productName: "$_id.productName",
        totalQuantity: 1,
        "productDetails.quantity": 1,
      },
    },
    { $sort: { totalQuantity: -1 } },
  ]);

  res.render("admin/manager/productBestSell", { result, timeframe, start, end });
};

// lấy dữ liệu các sản phẩm bán ít
const getSoldProductsByLeast = async (req, res) => {
    const { timeframe, start, end } = req.query; // Nhận các tham số từ query params
    let startDate, endDate;
    const currentDate = new Date();

    // Xác định ngày bắt đầu và kết thúc dựa trên option
    switch (timeframe) {
      case "10days":
        startDate = new Date(currentDate.setDate(currentDate.getDate() - 10));
        startDate.setHours(0, 0, 0, 0); // Đặt thời gian bắt đầu
        endDate = new Date(); // Hiện tại
        endDate.setHours(23, 59, 59, 999); // Đặt thời gian kết thúc
        break;

      case "week":
        // Tuần mới nhất (Thứ 2 -> Chủ nhật)
        const startOfWeek = new Date();
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1); // thứ 2 đầu tuần
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // chủ nhật cuối tuần
        endOfWeek.setHours(23, 59, 59, 999);
        startDate = startOfWeek;
        endDate = endOfWeek;
        break;
            
      case "month":
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); // Ngày đầu tháng
        startDate.setHours(0, 0, 0, 0); // Đặt thời gian bắt đầu
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); // Ngày cuối tháng
        endDate.setHours(23, 59, 59, 999); // Đặt thời gian kết thúc
        break;

      case "custom":
        startDate = new Date(start);
        startDate.setHours(0, 0, 0, 0); // Đặt thời gian bắt đầu
        endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999); // Đặt thời gian kết thúc
        break;

      default:
        startDate = new Date(currentDate.setDate(currentDate.getDate() - 10));
        startDate.setHours(0, 0, 0, 0); // Đặt thời gian bắt đầu
        endDate = new Date(); // Hiện tại
        endDate.setHours(23, 59, 59, 999); // Đặt thời gian kết thúc
        break;
    }

    // Truy vấn sản phẩm đã bán
    const result = await orderModel.aggregate([
      {
        $match: {
          status: "Đã giao hàng", // Chỉ lấy đơn hàng đã giao
          createdAt: { $gte: startDate, $lte: endDate }, // Lọc theo khoảng thời gian
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: {
            productName: "$items.name",
          },
          totalQuantity: { $sum: "$items.qty" },
        },
      },

      {
        $match: {
          totalQuantity: { $lte: 5 },
        },
      },

      {
        $lookup: {
          from: "products", // Collection 'products' chứa thông tin chi tiết sản phẩm
          localField: "_id.productName", // Tên sản phẩm trong nhóm
          foreignField: "name", // Tên sản phẩm trong 'products'
          as: "productDetails", // Gắn thông tin chi tiết sản phẩm vào
        },
      },
      {
        $project: {
          productName: "$_id.productName",
          totalQuantity: 1,
          "productDetails.quantity": 1,
        },
      },
      { $sort: { totalQuantity: -1 } },
    ]);

    res.render("admin/manager/productLeastSell", { result, timeframe, start, end });
};

module.exports = {
  getProducts,
  getProductsByMuch,
  getProductsByLeast,
  getSoldProducts,
  getSoldProductsByMuch,
  getSoldProductsByLeast
};
