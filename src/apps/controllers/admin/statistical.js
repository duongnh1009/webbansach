const orderModel = require("../../models/order");

const getRevenue = async(req, res) => {
  res.render("admin/statistical/statistical");
}

// thống kế doanh thu theo thời gian
const getTotalRevenue = async (req, res) => {
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
          const startOfWeek = new Date();
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

      // Truy vấn doanh thu cho ngày hiện tại
      const revenueTotal = await orderModel.aggregate([
        {
          // chọn những đơn hàng nằm trong khoảng từ startOfDay đến endOfDay và có trạng thái là "Đã giao hàng"
          $match: {
            createdAt: {
              $gte: startDate,
              $lte: endDate,
            },
            status: "Đã giao hàng",
          },
        },
        {
          // Nhóm các đơn hàng lại và tính tổng doanh thu 
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, // Định dạng ngày
            totalRevenue: {
              $sum: "$totalPrice",
            },
          },
        },
        {
          $sort: { _id: 1 }, // Sắp xếp theo ngày tăng dần
        },
      ]);
      // Trả về kết quả
      res.json(revenueTotal);
  } catch (error) {
    console.error("Lỗi khi tính toán doanh thu theo 10 ngày gần nhất:", error);
    throw error;
  }
};

module.exports = {
  getRevenue,
  getTotalRevenue
};
