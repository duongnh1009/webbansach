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

const editComment = async (req, res) => {
    const commentId = req.params.id;
    const comment = await commentModel.findById(commentId);
    res.render("site/product/editComment", { comment });
};

const updateComment = async (req, res) => {
    const commentId = req.params.id;
    const { content } = req.body;
    const comment = await commentModel.findByIdAndUpdate(commentId, {
      content: content,
    });
    res.redirect(`/product-${comment.prd_id}`);
};

const removeComment = async (req, res) => {
    const id = req.params.id;
    await commentModel.findByIdAndDelete(id);
    res.redirect(`/product-${comment.prd_id}`);
};

const commentOrder = async(req, res) => {
    const order = await orderModel.findById(req.params.id);
    res.render("site/order/commentOrder", {order})
}

const createCommentOrder = async(req, res) => {
    // const id = req.params.id;
    const {contents} = req.body;
    const userSiteId = req.session.userSiteId;
    const emailSite = req.session.emailSite;
    const fullNameSite = req.session.fullNameSite;
    // Tạo một mảng các promise để lưu các bình luận
    const commentPromises = Object.keys(contents).map(prd_id => { // object chứa các bình luận được gửi từ client, trong đó mỗi key là prd_id
        const content = contents[prd_id];
        return commentModel.create({
            content,
            prd_id,
            userSiteId, 
            emailSite,
            fullNameSite
        });
    });

    // Chờ tất cả các bình luận được lưu thành công
    await Promise.all(commentPromises);

    req.flash("success", "Bình luận thành công!");
    res.redirect("/orderDelivered");

}

module.exports = {
    createComment,
    editComment,
    updateComment,
    removeComment,
    commentOrder,
    createCommentOrder
}