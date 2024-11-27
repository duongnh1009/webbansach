const mongoose = require("mongoose");
const bannerSchema = new mongoose.Schema({
    img_banner: {
        type: String,
    },

    featured: {
        type: Boolean,
        default: false  
    },

    category: {
        type: String,
        default: 'Slider'
    }

}, {
    timestamps: true,
    versionKey: false
})

const bannerModel = mongoose.model("Banner", bannerSchema);
module.exports = bannerModel;