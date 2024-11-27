const mongoose = require("mongoose");
const mongooseDelete = require("mongoose-delete");

const categorySchema = new mongoose.Schema({
    title: {
        type: String,
    },

    slug: {
        type: String,
    },
}, {
    timestamps: true,
    versionKey: false
})

categorySchema.plugin(mongooseDelete, { 
    deletedAt : true,
    overrideMethods: 'all' 
});

const categoryModel = mongoose.model("Category", categorySchema);
module.exports = categoryModel;
