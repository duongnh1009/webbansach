const commentModel = require("../../models/comment");
const orderModel = require("../../models/order");

const createComment = async(req, res) => {
    const prd_id = req.params.id;
    const {content} = req.body;
    const userSiteId = req.session.userSiteId;
    const emailSite = req.session.emailSite;
    const fullNameSite = req.session.fullNameSite;

    // kiem tra xem nguoi dung da mua san pham chua
    const hashBuy = await orderModel.findOne({
        userSiteId: userSiteId,
        'items.id': prd_id,
        status: "Đã giao hàng"
    });

    if (hashBuy) {
        // Nếu đã mua, thêm bình luận
        const comment = {
            prd_id,
            content,
            userSiteId,
            fullNameSite,
            emailSite
        };
        await commentModel.create(comment);
      } else {
        // Nếu chưa mua, không cho phép bình luận
        req.flash('error', 'Bạn cần mua sản phẩm trước khi bình luận!');
      }
    res.redirect(req.path);
}

const removeComment = async(req, res) => {
    const comment = commentModel.findById(req.params.id);
    await comment.remove();
    res.redirect(`/product-${comment.prd_id}`);
}

module.exports = {
    createComment,
    removeComment
}