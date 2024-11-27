const categoryModel = require("../models/category");
const bannerModel = require("../models/banner");
const orderModel = require("../models/order");

module.exports = async (req, res, next) => {
    res.locals.success = req.flash('success');

    res.locals.categories = await categoryModel.find();

    res.locals.order = (await orderModel.find({
        status: 'Đang chuẩn bị'
    })).length;

    res.locals.orderTransport = (await orderModel.find({
        status: 'Đang giao hàng'
    })).length;

    res.locals.orderDelive = (await orderModel.find({
        status: 'Đã giao hàng'
    })).length;

    res.locals.orderRemove = await orderModel.countWithDeleted({
        deleted: true
    });

    const userSiteId = req.session.userSiteId; // Sử dụng session để lấy userSiteId
    res.locals.orderSite = (await orderModel.find({
        userSiteId,
        status: 'Đang chuẩn bị'
    })).length;

    res.locals.orderSiteTransport = (await orderModel.find({
        userSiteId,
        status: 'Đang giao hàng'
    })).length;

    res.locals.orderSiteDelive = (await orderModel.find({
        userSiteId,
        status: 'Đã giao hàng'
    })).length;

    res.locals.orderSiteRemove = await orderModel.countWithDeleted({
        userSiteId,
        deleted: true
    });

    res.locals.logos = await bannerModel.find({
        category: "Logo"
    });

    res.locals.sliders = await bannerModel.find({
        category: "Slider"
    }).sort({_id: -1}); 

    res.locals.banners = await bannerModel.find({
        category: "Banner"
    }).sort({_id: -1}); 
    
    res.locals.totalCart = req.session.cart.reduce((total, item) => {
        return total + item.qty
    }, 0);
    next();
}