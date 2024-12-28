const productModel = require("../../models/product");

// thêm sản phẩm vào giỏ hàng
const addToCart = async (req, res) => {
  const { id, qty} = req.body;
  let cart = req.session.cart;
  let isProduct = false; // kiểm tra xem sản phẫm đã tồn tài trong giỏ hàng chưa
  cart.map((item) => {
    if (item.id === id) {
      item.qty += parseInt(qty);
      isProduct = true;
    }
    return item;
  }); // nếu sản phẩm đã có trong giỏ hàng thì chỉ thêm số lượng
  if (!isProduct) {
    const product = await productModel.findById(id).populate("cat_id");
    cart.push({
      id,
      name: product.name,
      author: product.author,
      cat_id: product.cat_id.title,
      price: product.price,
      salePrice: product.salePrice,
      img: product.image,
      qty: parseInt(qty),
      quantity: parseInt(product.quantity),
    });
  }
  req.session.cart = cart;
  res.redirect("/cart");
};

const cart = (req, res) => {
  const cart = req.session.cart;
  res.render("site/cart/cart", { cart });
};

// cập nhật giỏ hàng
const updateCart = (req, res) => {
  const productId = req.params.productId;
  const newQuantity = parseInt(req.params.newQuantity);

  let updateCart = req.session.cart;
  // Tìm sản phẩm cần cập nhật số lượng
  const productIndex = updateCart.findIndex((item) => item.id === productId);

  updateCart[productIndex].qty = newQuantity;
  req.session.cart = updateCart;

  const totalPrice = updateCart.reduce((total, item) => {
    if (item.salePrice > 0) {
      return total + item.qty * item.salePrice;
    } else {
      return total + item.qty * item.price;
    }
  }, 0);
  res.json({ newQuantity, totalPrice });
};

// xóa sản phẩm khỏi giỏ hàng
const removeCart = (req, res) => {
  const id = req.params.id;
  let removeCart = req.session.cart;
  const newCart = removeCart.filter((item) => {
    return item.id != id;
  });
  req.session.cart = newCart;
  res.redirect("/cart");
};

module.exports = {
  addToCart,
  cart,
  updateCart,
  removeCart,
};
