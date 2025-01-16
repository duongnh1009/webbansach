const productModel = require("../../models/product");

// thêm sản phẩm vào giỏ hàng
const addToCart = async (req, res) => {
  const { id, qty} = req.body;
  const cart = req.session.cart;

  // Kiểm tra xem sản phẩm đã tồn tại trong giỏ hàng chưa
  const existingItem = cart.find((cartItem) => cartItem.id === id);
  if(existingItem) {
    existingItem.qty += parseInt(qty); // Cộng dồn số lượng
  } else {
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

  const updateCart = req.session.cart;
  // Tìm sản phẩm cần cập nhật số lượng
  const productIndex = updateCart.findIndex((item) => item.id === productId); // tìm vị trí của sản phẩm trong mảng updateCart mà item.id trùng khớp với productId.

  updateCart[productIndex].qty = newQuantity; // cập nhật số lượng của sản phẩm tại vị trí productIndex thành giá trị mới newQuantity
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
  const removeCart = req.session.cart;
  const newCart = removeCart.filter((item) => {
    return item.id != id; // Giữ lại sản phẩm có id khác với id của sản phẩm cần xóa.
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
