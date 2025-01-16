const orderModel = require("../../models/order");

const getRevenue = async(req, res) => {
  res.render("admin/statistical/statistical");
}

// thống kế doanh thu theo thời gian
const getTotalRevenue = async (req, res) => {
  const { timeframe, start, end } = req.query;
  let startDate, endDate;
  const currentDate = new Date();

  switch (timeframe) {
    case "10days":
      startDate = new Date(currentDate.setDate(currentDate.getDate() - 10));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      break;

    case "week":
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
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 11, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      break;

    case "custom":
      startDate = new Date(start);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
      break;

    default:
      startDate = new Date(currentDate.setDate(currentDate.getDate() - 10));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      break;
  }

  const groupDate = timeframe === "month" ? 
    { $dateToString: { format: "%Y-%m", date: "$createdAt" } } : 
    { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };

  const revenueTotal = await orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: "Đã giao hàng",
        },
      },
      {
          $group: {
            _id: groupDate,
            totalRevenue: { $sum: "$totalPrice" },
          },
      },
      { $sort: { _id: 1 } },
  ]);

  res.json(revenueTotal);
};

module.exports = {
  getRevenue,
  getTotalRevenue
};
