const mongoose = require("mongoose");
const mongooseDelete = require("mongoose-delete");

const purchaseHistorySchema = mongoose.Schema({
  date: { type: Date, default: Date.now },
  quantity: { type: Number },
});

const productSchema = new mongoose.Schema(
  {
    image: {
      type: String,
    },

    name: {
      type: String,
    },

    author: {
      type: String,
    },

    translator: {
      type: String,
    },

    publisher: {
      type: String,
    },

    description: {
      type: String,
    },

    slug: {
      type: String,
    },

    price: {
      type: Number,
    },

    sale: {
      type: Number,
      default: 0,
    },

    salePrice: {
      type: Number,
    },

    cat_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },

    details: {
      type: String,
    },

    quantity: {
      type: Number,
      default: 0
    },
    purchaseHistory: [purchaseHistorySchema],
  },
  {
    timestamps: true,
    versionKey: false
  }
);

productSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

const productModel = mongoose.model("Product", productSchema);
module.exports = productModel;
