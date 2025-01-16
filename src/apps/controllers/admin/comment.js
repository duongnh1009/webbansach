const moment = require("moment");
const commentModel = require("../../models/comment");
const productModel = require("../../models/product");

const index = async(req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;
    const total = await commentModel.find()
    const totalPages = Math.ceil(total.length/limit);
    const comments = await commentModel.find()
        .sort({_id:-1})
        .populate("prd_id")
        .skip(skip)
        .limit(limit);
    res.render("admin/comment/comment", {
        comments,
        moment,
        currentPage: page, 
        totalPages,
    })
};

const browseComment = async(req, res) => {
    const comment = await commentModel.findById(req.params.id);
    comment.isBrowse = true;
    await comment.save();
    req.flash('success', 'Duyệt bình luận thành công !');
    res.redirect("/admin/comment");
};

const hiddenComment = async(req, res) => {
    const comment = await commentModel.findById(req.params.id);
    comment.isBrowse = false;
    await comment.save();
    req.flash('success', 'Ẩn bình luận thành công !');
    res.redirect("/admin/comment");
};

const removeComment = async (req, res) => {
    const id = req.params.id;
    await commentModel.findByIdAndDelete(id);
    req.flash("success", "Xóa thành công !");
    res.redirect("/admin/comment");
};

const search = async (req, res) => {
    const keyword = req.query.keyword || '';
    const searchComment = await commentModel.find({
        $or: [
            {
                prd_id: {
                  $in: await productModel
                    .find({ name: { $regex: new RegExp(keyword, "i") } })
                    .distinct("_id"),
                },
            },
        ],
    }).populate("prd_id")
    res.render("admin/comment/searchComment", {searchComment, keyword,})
}

module.exports = {
    index,
    browseComment,
    hiddenComment,
    removeComment,
    search
}