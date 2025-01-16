const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
    userSiteId: {
        type: String
    },

    emailSite: {
        type: String
    },

    fullNameSite: {
        type: String
    },

    prd_id: {
        type: mongoose.Types.ObjectId,
        ref: 'Product',
    },

    content: {
        type: String
    },

    isBrowse: { 
        type: Boolean, 
        default: false 
    },
}, {
    timestamps: true,
    versionKey: false
})

const commentModel = mongoose.model("Comment", commentSchema);
module.exports = commentModel;
