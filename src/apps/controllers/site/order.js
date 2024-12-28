const moment = require("moment");
const orderModel = require("../../models/order");
const productModel = require("../../models/product");
const userModel = require("../../models/user");
const discountModel = require("../../models/discount");

const order = async(req, res) => {
  const cart = req.session.cart;
  const discounts = await discountModel.find({isActive: true});
  const user = await userModel.findById(req.session.userSiteId);
  res.render("site/order/order", { cart, user, discounts });
};

const applyDiscount = async(req, res) => {
  const { discountCode, totalCartValue } = req.body;

  // Kiểm tra mã giảm giá
  const discount = await discountModel.findById(discountCode);

  // Kiểm tra ngày hết hạn của mã giảm giá
  const now = new Date();
  if (now >= new Date(discount.expiryDate)) {
    return res.json({
      success: false,
      message: 'Mã giảm giá đã hết hạn!',
    });
  }

  // Kiểm tra điều kiện áp dụng mã giảm giá
  if (totalCartValue < discount.minOrderValue) {
    return res.json({
      success: false,
      message: `Mã giảm giá chỉ áp dụng cho đơn hàng từ ${discount.minOrderValue.toLocaleString('en-us')} đ trở lên!`,
    });
  }

  // Tính toán giảm giá
  const discountValue = (discount.discount / 100) * totalCartValue;

  // Tính tổng tiền sau giảm giá
  const shippingFee = totalCartValue >= 100000 ? 0 : 30000; // Miễn phí ship nếu tổng giá trị >= 100000
  const finalTotal = Math.floor(totalCartValue + shippingFee - discountValue);

  // Trả kết quả về client
  res.json({
    success: true,
    finalTotal,
    message: "Mã giảm giá đã được áp dụng!"
  });
}

// đặt hàng
const orderBuy = async (req, res) => {
  const { name, phone, mail, address, payment, setDefaultAddress, discountCode} = req.body;

  // Lấy người dùng hiện tại từ session
  const userId = req.session.userSiteId;
  const user = await userModel.findById(userId);

  // Nếu checkbox được chọn, cập nhật địa chỉ mặc định
  if (setDefaultAddress === "true") {
    await userModel.findByIdAndUpdate(userId, { name, phone, mail, address });
  }

  const items = req.session.cart;
  // tinh gia tien don hang
  const finalPrice = items.reduce((total, item) => 
    total + (item.salePrice > 0 ? item.salePrice * item.qty : item.price * item.qty)
  , 0);

  //tinh phi giao hang
  const shippingFee = finalPrice >= 100000 ? 0 : 30000;

  // Xử lý mã giảm giá
  let discountValue = 0;
  if (discountCode) {
    const discount = await discountModel.findById(discountCode);

    // kiem tra xem ma da het han va tong gia don hang co du dieu kien khong
    const now = new Date();
    if (now <= discount.expiryDate && finalPrice >= discount.minOrderValue) {
      discountValue = (discount.discount / 100) * finalPrice; // Tính giá trị giảm giá
      discount.isActive = false;
      await discount.save();
    } else {
      discountValue = 0;
    }
  }

  // Tính tổng giá trị cuối cùng
  const totalPrice = finalPrice + shippingFee - discountValue;
  
  // tao don hang
  const orderList = {
    name,
    phone,
    mail,
    address,
    payment,
    totalPrice,
    items,
    userSiteId: req.session.userSiteId,
    fullNameSite: req.session.fullNameSite,
  };

  //cap nhat lai so luong khi nguoi dung mua don hang
  for (const item of items) {
    const product = await productModel.findById(item.id);
    if (product) {
      product.quantity -= item.qty;
      await product.save();
    }
  }

  await orderModel.create(orderList);
  // Xóa giỏ hàng sau khi đặt hàng
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
  const orders = await orderModel.findWithDeleted({
      userSiteId,
      deleted: true,
    }).sort({ _id: -1 });
  res.render("site/order/orderTrash", { orders, moment });
};

// xem chi tiết đơn hàng
const orderDetail = async (req, res) => {
  const order = await orderModel.findById(req.params.id);
  res.render("site/order/orderDetail", { order });
};

const orderDetailTrash = async (req, res) => {
  const id = req.params.id;
  const userSiteId = req.session.userSiteId; // Sử dụng session để lấy userSiteId
  const order = await orderModel.findOneDeleted({
    _id: id,
    userSiteId,
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

const removeMany = async(req, res) => {
  const { orderIds } = req.body;
  await orderModel.deleteMany({ _id: { $in: orderIds } });
  req.flash("success", "Xóa thành công !");
  res.redirect("/orderTrash");
}

const buybackOrder = async(req, res) => {
  const id = req.params.id;
  const order = await orderModel.findById(id);
  const cart = req.session.cart || [];
  const qtyProduct = [];

  for (const item of order.items) {
    const product = await productModel.findById(item.id); // Kiểm tra sản phẩm trong DB
    if (product.quantity < item.qty) {
      // Nếu hết hàng hoặc không đủ số lượng
      qtyProduct.push(item.id); // Thêm id sản phẩm vào danh sách hết hàng
    } else {
      // Kiểm tra nếu sản phẩm đã tồn tại trong giỏ hàng
      const existingItem = cart.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        existingItem.qty += item.qty; // Cộng dồn số lượng
      } else {
        // Thêm sản phẩm mới vào giỏ hàng
        cart.push({
          id: item.id,
          name: item.name,
          author: item.author,
          cat_id: item.cat_id,
          img: item.img,
          price: item.price,
          salePrice: item.salePrice,
          qty: parseInt(item.qty),
          quantity: parseInt(product.quantity), // Lưu lại số lượng còn lại
        });
      }
    }
  }
  req.session.cart = cart;
  if(qtyProduct.length > 0) {
    req.flash("success", "Sản phẩm đã hết hàng !");
    return res.redirect("/orderDelivered");
  }
  res.redirect("/cart");
}

module.exports = {
  order,
  applyDiscount,
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
  removeMany,
  buybackOrder
};
