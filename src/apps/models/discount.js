const mongoose = require("mongoose");

const discountSchema = new mongoose.Schema({
    code: { 
        type: String
    },

    discount: { 
        type: Number
    }, // phần trăm giảm giá

    minOrderValue: {
        type: Number 
    }, // Giá trị tối thiểu đơn hàng

    isActive: { 
        type: Boolean,
        default: false
    },

    expiryDate: { 
        type: Date, 
    }, // ngày hết hạn
}, {
    timestamps: true,
    versionKey: false
})


const discountModel = mongoose.model("Discount", discountSchema);
module.exports = discountModel;
