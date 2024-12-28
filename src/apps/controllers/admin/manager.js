const orderModel = require("../../models/order");
const productModel = require("../../models/product");

// lấy dữ liệu các sản phẩm đã nhập
const getProducts = async (req, res) => {
  try {
    const { timeframe, start, end } = req.query; // Nhận giá trị timeframe và thời gian tùy chọn từ query params
    let startDate, endDate;
    const currentDate = new Date();

    // Xác định ngày bắt đầu và kết thúc dựa trên `timeframe` hoặc thời gian tùy chọn
    switch (timeframe) {
      case "10days":
        // 10 ngày gần nhất
        startDate = new Date(currentDate.setDate(currentDate.getDate() - 10));
        endDate = new Date(); // Hiện tại
        break;

        case "week":
          // Tuần mới nhất (Thứ 2 -> Chủ nhật)
          const startOfWeek = new Date(currentDate);
          startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Thứ 2 đầu tuần
          startOfWeek.setHours(0, 0, 0, 0); // Đặt thời gian bắt đầu
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6); // Chủ nhật cuối tuần
          endOfWeek.setHours(23, 59, 59, 999); // Đặt thời gian kết thúc
          startDate = startOfWeek;
          endDate = endOfWeek;
          break;

      case "month":
        // Tháng hiện tại
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); // Ngày đầu tháng
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); // Ngày cuối tháng
        startDate = startOfMonth;
        endDate = endOfMonth;
        break;

      case "custom":
        // Thời gian tùy chọn
        startDate = new Date(start); // Ngày bắt đầu từ query
        endDate = new Date(end); // Ngày kết thúc từ query
        break;

      default:
        // Mặc định lấy 10 ngày gần nhất
        startDate = new Date(currentDate.setDate(currentDate.getDate() - 10));
        endDate = new Date(); // Hiện tại
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
    ]);

    res.render("admin/manager/import", { result, timeframe, start, end });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Đã xảy ra lỗi khi lấy dữ liệu.");
  }
};

// lấy dữ liệu các sản phẩm nhập nhiều
const getProductsByMuch = async (req, res) => {
  try {
    const { timeframe, start, end } = req.query; // Nhận giá trị timeframe và thời gian tùy chọn từ query params
    let startDate, endDate;

    const currentDate = new Date();

    // Xác định ngày bắt đầu và kết thúc dựa trên `timeframe` hoặc thời gian tùy chọn
    switch (timeframe) {
      case "10days":
        // 10 ngày gần nhất
        startDate = new Date(currentDate.setDate(currentDate.getDate() - 10));
        endDate = new Date(); // Hiện tại
        break;

      case "week":
        // Tuần mới nhất (Thứ 2 -> Chủ nhật)
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Thứ 2 đầu tuần
        startOfWeek.setHours(0, 0, 0, 0); // Đặt thời gian bắt đầu
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Chủ nhật cuối tuần
        endOfWeek.setHours(23, 59, 59, 999); // Đặt thời gian kết thúc
        startDate = startOfWeek;
        endDate = endOfWeek;
        break;

      case "month":
        // Tháng hiện tại
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); // Ngày đầu tháng
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); // Ngày cuối tháng
        startDate = startOfMonth;
        endDate = endOfMonth;
        break;

      case "custom":
        // Thời gian tùy chọn
        startDate = new Date(start); // Ngày bắt đầu từ query
        endDate = new Date(end); // Ngày kết thúc từ query
        break;

      default:
        // Mặc định lấy 10 ngày gần nhất
        startDate = new Date(currentDate.setDate(currentDate.getDate() - 10));
        endDate = new Date(); // Hiện tại
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
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Đã xảy ra lỗi khi lấy dữ liệu.");
  }
};

// lấy dữ liệu các sản phẩm nhập ít nhất
const getProductsByLeast = async (req, res) => {
  try {
    const { timeframe, start, end } = req.query; // Nhận giá trị timeframe và thời gian tùy chọn từ query params
    let startDate, endDate;

    const currentDate = new Date();

    // Xác định ngày bắt đầu và kết thúc dựa trên `timeframe` hoặc thời gian tùy chọn
    switch (timeframe) {
      case "10days":
        // 10 ngày gần nhất
        startDate = new Date(currentDate.setDate(currentDate.getDate() - 10));
        endDate = new Date(); // Hiện tại
        break;

      case "week":
        // Tuần mới nhất (Thứ 2 -> Chủ nhật)
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Thứ 2 đầu tuần
        startOfWeek.setHours(0, 0, 0, 0); // Đặt thời gian bắt đầu
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Chủ nhật cuối tuần
        endOfWeek.setHours(23, 59, 59, 999); // Đặt thời gian kết thúc
        startDate = startOfWeek;
        endDate = endOfWeek;
        break;

      case "month":
        // Tháng hiện tại
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); // Ngày đầu tháng
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); // Ngày cuối tháng
        startDate = startOfMonth;
        endDate = endOfMonth;
        break;

      case "custom":
        // Thời gian tùy chọn
        startDate = new Date(start); // Ngày bắt đầu từ query
        endDate = new Date(end); // Ngày kết thúc từ query
        break;

      default:
        // Mặc định lấy 10 ngày gần nhất
        startDate = new Date(currentDate.setDate(currentDate.getDate() - 10));
        endDate = new Date(); // Hiện tại
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
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Đã xảy ra lỗi khi lấy dữ liệu.");
  }
};

// lấy dữ liệu các sản phẩm đã bán 
const getSoldProducts = async (req, res) => {
  try {
    const { timeframe, start, end } = req.query; // Nhận các tham số từ query params
    let startDate, endDate;

    const currentDate = new Date();

    // Xác định ngày bắt đầu và kết thúc dựa trên option
    switch (timeframe) {
      case "10days":
        startDate = new Date(currentDate.setDate(currentDate.getDate() - 10));
        endDate = new Date(); // Hiện tại
        break;

      case "week":
        // Tuần mới nhất (Thứ 2 -> Chủ nhật)
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Thứ 2 đầu tuần
        startOfWeek.setHours(0, 0, 0, 0); // Đặt thời gian bắt đầu
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Chủ nhật cuối tuần
        endOfWeek.setHours(23, 59, 59, 999); // Đặt thời gian kết thúc
        startDate = startOfWeek;
        endDate = endOfWeek;
        break;

      case "month":
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); // Ngày đầu tháng
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); // Ngày cuối tháng
        startDate = startOfMonth;
        endDate = endOfMonth;
        break;

      case "custom":
        startDate = new Date(start);
        endDate = new Date(end);
        break;

      default:
        startDate = new Date(currentDate.setDate(currentDate.getDate() - 10));
        endDate = new Date(); // Hiện tại
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
            year: { $year: "$createdAt" }, // Nhóm theo năm
            month: { $month: "$createdAt" }, // Nhóm theo tháng
            day: { $dayOfMonth: "$createdAt" }, // Nhóm theo ngày
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
          date: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: {
                $dateFromParts: {
                  year: "$_id.year",
                  month: "$_id.month",
                  day: "$_id.day",
                },
              },
            },
          },
          totalQuantity: 1,
          "productDetails.quantity": 1,
        },
      },
      { $sort: { date: -1 } },
    ]);

    res.render("admin/manager/soldOut", { soldItems, timeframe, start, end });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách sản phẩm đã bán:", error);
    res.status(500).send("Đã xảy ra lỗi khi lấy danh sách sản phẩm đã bán.");
  }
};

// lấy dữ liệu các sản phẩm bán nhiều 
const getSoldProductsByMuch = async (req, res) => {
  try {
    const { timeframe, start, end } = req.query; // Nhận các tham số từ query params
    let startDate, endDate;

    const currentDate = new Date();

    // Xác định ngày bắt đầu và kết thúc dựa trên option
    switch (timeframe) {
      case "10days":
        startDate = new Date(currentDate.setDate(currentDate.getDate() - 10));
        endDate = new Date(); // Hiện tại
        break;

      case "week":
        // Tuần mới nhất (Thứ 2 -> Chủ nhật)
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Thứ 2 đầu tuần
        startOfWeek.setHours(0, 0, 0, 0); // Đặt thời gian bắt đầu
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Chủ nhật cuối tuần
        endOfWeek.setHours(23, 59, 59, 999); // Đặt thời gian kết thúc
        startDate = startOfWeek;
        endDate = endOfWeek;
        break;

      case "month":
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); // Ngày đầu tháng
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); // Ngày cuối tháng
        startDate = startOfMonth;
        endDate = endOfMonth;
        break;

      case "custom":
        startDate = new Date(start);
        endDate = new Date(end);
        break;

      default:
        startDate = new Date(currentDate.setDate(currentDate.getDate() - 10));
        endDate = new Date(); // Hiện tại
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
  } catch (error) {
    console.error("Lỗi khi lấy danh sách sản phẩm đã bán:", error);
    res.status(500).send("Đã xảy ra lỗi khi lấy danh sách sản phẩm đã bán.");
  }
};

// lấy dữ liệu các sản phẩm bán ít
const getSoldProductsByLeast = async (req, res) => {
  try {
    const { timeframe, start, end } = req.query; // Nhận các tham số từ query params
    let startDate, endDate;

    const currentDate = new Date();

    // Xác định ngày bắt đầu và kết thúc dựa trên option
    switch (timeframe) {
      case "10days":
        startDate = new Date(currentDate.setDate(currentDate.getDate() - 10));
        endDate = new Date(); // Hiện tại
        break;

     case "week":
        // Tuần mới nhất (Thứ 2 -> Chủ nhật)
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Thứ 2 đầu tuần
        startOfWeek.setHours(0, 0, 0, 0); // Đặt thời gian bắt đầu
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Chủ nhật cuối tuần
        endOfWeek.setHours(23, 59, 59, 999); // Đặt thời gian kết thúc
        startDate = startOfWeek;
        endDate = endOfWeek;
        break;

      case "month":
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); // Ngày đầu tháng
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); // Ngày cuối tháng
        startDate = startOfMonth;
        endDate = endOfMonth;
        break;

      case "custom":
        startDate = new Date(start);
        endDate = new Date(end);
        break;

      default:
        startDate = new Date(currentDate.setDate(currentDate.getDate() - 10));
        endDate = new Date(); // Hiện tại
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

    res.render("admin/manager/productLeastSell", { result, timeframe, start, end });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách sản phẩm đã bán:", error);
    res.status(500).send("Đã xảy ra lỗi khi lấy danh sách sản phẩm đã bán.");
  }
};

module.exports = {
  getProducts,
  getProductsByMuch,
  getProductsByLeast,
  getSoldProducts,
  getSoldProductsByMuch,
  getSoldProductsByLeast
};
