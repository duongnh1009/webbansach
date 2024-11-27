const mongoose = require("mongoose");
const mongooseDelete = require("mongoose-delete");

const orderSchema = new mongoose.Schema({
    userSiteId: {
        type: String
    },

    fullNameSite: {
        type: String
    },

    name: {
        type: String,
        text: true
    },

    phone: {
        type: String,
    },

    mail: {
        type: String,
    },

    address: {
        type: String
    },

    status: {
        type: String,
        default: "Đang chuẩn bị",
    },

    totalPrice: {
        type: Number
    },

    payment: {
        type: String,
    },

    items: {
        type: Object
    },
}, {
    timestamps: true,
    versionKey: false
})

orderSchema.plugin(mongooseDelete, { 
    deletedAt : true,
    overrideMethods: 'all' 
});

const orderModel = mongoose.model("Order", orderSchema);
module.exports = orderModel;