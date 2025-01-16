const slug = require("slug");
const fs = require("fs");
const path = require("path");
const productModel = require("../../models/product");
const categoryModel = require("../../models/category");
const orderModel = require("../../models/order");

const index = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 6;
  const skip = (page - 1) * limit;
  const total = await productModel.find();
  const totalPages = Math.ceil(total.length / limit);

  // lấy toàn bộ sản phẩm
  const products = await productModel.find().sort({ _id: -1 }).populate("cat_id")
    .skip(skip).limit(limit);

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
    product.totalSold = salesData[0]?.totalSold || 0;
  }
  const productRemove = await productModel.countWithDeleted({
    deleted: true,
  });

  res.render("admin/products/product", {
    products,
    productRemove,
    currentPage: page,
    totalPages,
  });
};

const trash = async (req, res) => {
  const products = await productModel.findWithDeleted({
    deleted: true,
  }).sort({ _id: -1 }).populate("cat_id")
  res.render("admin/products/trash", {
    products,
  });
};

const create = async (req, res) => {
  const categories = await categoryModel.find();
  res.render("admin/products/add_product", { categories });
};

const store = async (req, res) => {
  const {
    name,
    price,
    sale,
    author,
    translator,
    publisher,
    details,
    cat_id,
    quantity,
    description,
  } = req.body;
  const { file } = req;
  const product = {
    name,
    price,
    sale,
    author,
    translator,
    publisher,
    details,
    cat_id,
    quantity,
    description,
    slug: slug(name),
  };
  
  //kiem tra xem san pham da ton tai chua
  const products = await productModel.findOne({
    slug: slug(name),
  });

  if(product.sale <=100) {
    product.salePrice = product.price - (product.sale * product.price) / 100;
  } else {
    product.salePrice = product.price - product.sale;
  }

  if (products) {
    res.render("admin/products/add_product", { 
      error: "Tên sản phẩm đã tồn tại !", 
      name, price, sale, author, translator, publisher
    });
  } else if (file) {
    const image = "products/" + file.originalname; // file.originalname: Tên tệp ban đầu của ảnh được tải lên, 
    // "products/": Đường dẫn thư mục con (ví dụ: products/) nơi ảnh sẽ được lưu
    fs.renameSync(file.path, path.resolve("src/public/images", image)); // fs.renameSync(): Di chuyển tệp từ đường dẫn tạm thời (file.path) đến đường dẫn đích path.resolve
    product["image"] = image;
    await productModel.create(product)
    req.flash("success", "Thêm thành công !");
    res.redirect("/admin/product");
  }
};

const edit = async (req, res) => {
  const id = req.params.id;
  const products = await productModel.findById(id);
  const categories = await categoryModel.find();
  res.render("admin/products/edit_product", { products, categories });
};

const update = async (req, res) => {
  const id = req.params.id;
  const {
    name,
    price,
    sale,
    author,
    translator,
    publisher,
    details,
    cat_id,
    quantity,
    description,
  } = req.body;
  const { file } = req;
  const product = {
    name,
    price,
    sale,
    author,
    translator,
    publisher,
    details,
    cat_id,
    quantity,
    description,
    slug: slug(name),
  };

  //kiem tra xem san pham co cap nhat khong
  const products = await productModel.findOne({
    _id: req.params.id,
  });

  if (product.name !== products.name) {
    //kiem tra xem san pham da ton tai chua
    const isCheck = await productModel.findOne({
      slug: slug(name)
    });

    if (isCheck) {
      return res.render("admin/products/edit_product", {
        error: "Tên sản phẩm đã tồn tại !", 
        products 
      });
    }
  } else if (file) {
    const image = "products/" + file.originalname;
    fs.renameSync(file.path, path.resolve("src/public/images", image));
    product["image"] = image;
  }

  if(product.sale <=100) {
    product.salePrice = product.price - (product.sale * product.price) / 100;
  } else {
    product.salePrice = product.price - product.sale;
  }
  
  await productModel.findByIdAndUpdate(id, product);
  req.flash("success", "Cập nhật thành công !");
  res.redirect("/admin/product");
};

const restore = async (req, res) => {
  const id = req.params.id;
  await productModel.restore({ _id: id });
  req.flash("success", "Khôi phục thành công !");
  res.redirect("/admin/product/trash");
};

const force = async (req, res) => {
  const id = req.params.id;
  await productModel.deleteOne({ _id: id });
  req.flash("success", "Xóa thành công !");
  res.redirect("/admin/product/trash");
};

const remove = async (req, res) => {
  const id = req.params.id;
  await productModel.delete({ _id: id });
  req.flash("success", "Xóa thành công !");
  res.redirect("/admin/product");
};

const search = async (req, res) => {
  const keyword = req.query.keyword || "";
  const products = await productModel
    .find({
      $or: [
        { name: { $regex: new RegExp(keyword, "i") } },
        {
          cat_id: {
            $in: await categoryModel
              .find({ title: { $regex: new RegExp(keyword, "i") } })
              .distinct("_id"),
          },
        },
      ],
    }).sort({ _id: -1 }).populate("cat_id");

  const productRemove = await productModel.countWithDeleted({
    deleted: true,
  });

  res.render("admin/products/search-product", {
    products,
    productRemove,
    keyword,
  });
};

const restock = (req, res) => {
  const id = req.params.id;
  const { new_quantity } = req.body;

  const newPurchase = {
    date: new Date(), 
    quantity: new_quantity, 
  };

  productModel.findByIdAndUpdate(
    id,
    {
      $push: { purchaseHistory: newPurchase },
      $inc: { quantity: newPurchase.quantity }, // cập nhật số lượng khi người dùng thêm số lượng
    }, 
    { new: true }, 
    (err) => {
      if (err) {
        req.flash("success", "Lỗi khi cập nhật sản phẩm !");
      } else {
        req.flash("success", "Cập nhật số lượng sản phẩm thành công !");
      }
      res.redirect("/admin/product");
    }
  );
};

module.exports = {
  index,
  trash,
  create,
  store,
  edit,
  update,
  restore,
  remove,
  force,
  search,
  restock,
};
