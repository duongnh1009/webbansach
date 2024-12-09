const fs = require("fs");
const path = require("path")
const bannerModel = require("../../models/banner");
const pagination = require("../../../common/pagination");

const index = async (req, res) => {
    const banner = await bannerModel.find().sort({_id: -1})
    res.render("admin/banner/banner", {
        banner, 
    })
}

const create = (req, res) => {
    res.render("admin/banner/add_banner")
}

const store = async (req, res) => {
    const {body, file} = req;
    const banner = {
        category: body.category,
        featured: body.featured=="on",
    }
    if(file) {
        const img_banner = "products/"+file.originalname;
        fs.renameSync(file.path, path.resolve("src/public/images", img_banner));
        banner["img_banner"] = img_banner;
        await bannerModel.create(banner);
        req.flash('success', 'Thêm thành công !');
        res.redirect("/admin/banner");
    }
}

const edit = async (req, res) => {
    const id = req.params.id;
    const banner = await bannerModel.findById(id);
    res.render("admin/banner/edit_banner", {banner})
}

const update = async (req, res) => {
    const id = req.params.id;
    const {body, file} = req;
    const banner = {
        category: body.category,
        featured: body.featured=="on",
    }
    if(file) {
        const img_banner = "products/"+file.originalname;
        fs.renameSync(file.path, path.resolve("src/public/images", img_banner));
        banner["img_banner"] = img_banner;
    }
    await bannerModel.findByIdAndUpdate(id, banner);
    req.flash('success', 'Cập nhật thành công !');
    res.redirect("/admin/banner");
}

const remove = async (req, res) => {
    await bannerModel.deleteOne({_id: req.params.id});
    req.flash('success', 'Xóa thành công !');
    res.redirect("/admin/banner")
}

module.exports = {
    index,
    create,
    store,
    edit,
    update,
    remove,
}
