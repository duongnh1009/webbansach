const moment = require("moment");
const orderModel = require("../../models/order");
const productModel = require("../../models/product");
const axios = require("axios");

const order = (req, res) => {
  const cart = req.session.cart;
  res.render("site/order/order", { cart });
};

// đặt hàng
const orderBuy = async (req, res) => {
  const { name, phone, mail, village, apartment_number, payment } = req.body;

  const response = await axios.get(
    `https://esgoo.net/api-tinhthanh/5/${village}.htm`
  );
  let address = apartment_number + ", " + response.data.data.full_name;

  // lấy ra các sản phẩm trong giỏ hàng
  const items = req.session.cart;

  // tính tổng tiền đơn hàng
  const finalPrice = items.reduce((total, item) => {
    if (item.salePrice > 0) {
      return total + item.salePrice * item.qty;
    } else {
      return total + item.price * item.qty;
    }
  }, 0);

  // Tính phí ship
  const shippingFee = finalPrice >= 100000 ? 0 : 30000;

  // Tổng giá cuối cùng bao gồm phí ship
  const totalPrice = finalPrice + shippingFee;

  const orderList = {
    name,
    phone,
    mail,
    address,
    payment,
    totalPrice,
    userSiteId: req.session.userSiteId,
    fullNameSite: req.session.fullNameSite,
    items,
  };

  for (const item of items) {
    const product = await productModel.findById(item.id);
    if (product) {
      product.quantity -= item.qty;
      await product.save();
    }
  }

  await orderModel.create(orderList);
  req.session.cart = [];
  res.redirect("/success");
};

// xem những đơn đặt hàng của cá nhân người dùng
const orderUser = async (req, res) => {
  const userSiteId = req.session.userSiteId; // Sử dụng session để lấy userSiteId
  const orders = await orderModel
    .find({
      userSiteId,
      status: "Đang chuẩn bị",
    })
    .sort({ _id: -1 });
  res.render("site/order/orderUser", { orders, moment });
};

const orderTransport = async (req, res) => {
  const userSiteId = req.session.userSiteId; // Sử dụng session để lấy userSiteId
  const orders = await orderModel
    .find({
      userSiteId,
      status: "Đang giao hàng",
    })
    .sort({ _id: -1 });
  res.render("site/order/orderTransport", { orders, moment });
};

const orderDelivered = async (req, res) => {
  const userSiteId = req.session.userSiteId; // Sử dụng session để lấy userSiteId
  const orders = await orderModel
    .find({
      userSiteId,
      status: "Đã giao hàng",
    })
    .sort({ _id: -1 });
  res.render("site/order/orderDelivered", { orders, moment });
};

// xem những đơn hàng đã xóa 
const orderTrash = async (req, res) => {
  const userSiteId = req.session.userSiteId; // Sử dụng session để lấy userSiteId
  const orders = await orderModel
    .findWithDeleted({
      userSiteId,
      deleted: true,
    })
    .sort({ _id: -1 });
  res.render("site/order/orderTrash", { orders, moment });
};

// xem chi tiết đơn hàng
const orderDetail = async (req, res) => {
  const order = await orderModel.findById(req.params.id);
  res.render("site/order/orderDetail", { order });
};

const orderDetailTrash = async (req, res) => {
  const id = req.params.id;
  const order = await orderModel.findOneDeleted({
    id
  });
  res.render("site/order/orderDetailTrash", { order });
};

// xóa đơn hàng
const remove = async (req, res) => {
  const id = req.params.id;
  const order = await orderModel.findById(id);

  //cap nhat lai so luong khi nguoi dung xoa don hang
  for (const item of order.items) {
    const product = await productModel.findById(item.id);
    if (product) {
      product.quantity += item.qty;
      await product.save();
    }
  }
  await orderModel.delete({ _id: id });
  req.flash("success", "Xóa thành công !");
  res.redirect("/orderUser");
};

// mua lại đơn hàng
const restore = async (req, res) => {
  const id = req.params.id;
  const order = await orderModel.findOneWithDeleted({
    id,
    deleted: true,
  });

  //cap nhat lai so luong khi nguoi dung mua lai don hang
  for (const item of order.items) {
    const product = await productModel.findById(item.id);
    if (product) {
      product.quantity -= item.qty;
      await product.save();
    }
  }
  await orderModel.restore({ _id: id });
  req.flash("success", "Mua lại thành công !");
  res.redirect("/orderTrash");
};

const force = async (req, res) => {
  const id = req.params.id;
  await orderModel.deleteOne({ _id: id });
  req.flash("success", "Xóa thành công !");
  res.redirect("/orderTrash");
};

module.exports = {
  order,
  orderBuy,
  orderUser,
  orderTransport,
  orderDelivered,
  orderTrash,
  orderDetail,
  orderDetailTrash,
  remove,
  restore,
  force,
};
