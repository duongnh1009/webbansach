const commentModel = require("../../models/comment");
const productModel = require("../../models/product");

const index = async(req, res) => {
    const comments = await commentModel.find().sort({_id:-1}).populate("prd_id")
    res.render("admin/comment/comment", {
        comments
    })
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
    removeComment,
    search
}