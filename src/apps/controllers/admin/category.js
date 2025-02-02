const slug = require("slug")
const categoryModel = require("../../models/category");

const index = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;
    const total = await categoryModel.find()
    const totalPages = Math.ceil(total.length/limit);
    const categories = await categoryModel.find()
        .sort({_id:-1})
        .skip(skip)
        .limit(limit)
    const categoryRemove = await categoryModel.countWithDeleted({
        deleted: true
    });
    res.render("admin/category/category", {
        categories,
        currentPage: page, 
        totalPages,
        categoryRemove,
    })
}

const trash = async (req, res) => {
    const categories = await categoryModel.findWithDeleted({
        deleted: true
    })
    .sort({_id:-1});
    res.render("admin/category/trash", {categories})
}

const create = (req, res) => {
    res.render("admin/category/add_category")
}

const store = async (req, res) => {
    const {title} = req.body;
    const category = {
        title,
        slug: slug(title)
    }
    //kiem tra xem danh muc da ton tai chua
    const categories = await categoryModel.findOne({
        slug: slug(title)
    });

    if(categories) {
        return res.render("admin/category/add_category", {
            error: "Danh mục đã tồn tại !",
            title
        });
    }

    else {
        await categoryModel.create(category);
        req.flash('success', 'Thêm thành công !');
        res.redirect("/admin/category")
    }
}

const edit = async (req, res) => {
    const id = req.params.id;
    const categories = await categoryModel.findById(id);  
    res.render('admin/category/edit_category', {categories})
}

const update = async (req, res) => {
    const id = req.params.id;
    const {title} = req.body;
    const category = {
        title,
        slug: slug(title)
    }
    //kiem tra xem co cap nhat danh muc khong
    const categories = await categoryModel.findOne({
        _id: id
    });

    if(category.title !== categories.title) {
        const isCheck = await categoryModel.findOne({
            slug: slug(title)
        })

        if(isCheck) {
            return res.render('admin/category/edit_category', {
                error: "Danh mục đã tồn tại !", 
                categories
            });
        }
    }
    
    await categoryModel.findByIdAndUpdate(id, category);
    req.flash('success', 'Cập nhật thành công !');  
    res.redirect("/admin/category");    
}

const restore = async (req, res) => {
    const id = req.params.id;
    await categoryModel.restore({_id: id});
    req.flash('success', 'Khôi phục thành công !');
    res.redirect("/admin/category/trash")
}

const force = async (req, res) => {
    const id = req.params.id;
    await categoryModel.deleteOne({_id: id});
    req.flash('success', 'Xóa thành công !');
    res.redirect("/admin/category/trash")
}

const remove = async (req, res) => {
    const id = req.params.id;
    await categoryModel.delete({_id: id});
    req.flash('success', 'Xóa thành công !');
    res.redirect("/admin/category")
}

const search = async (req, res) => {
    const keyword = req.query.keyword || '';
    const searchCategory = await categoryModel.find({
        $or: [
            { title: { $regex: new RegExp(keyword, 'i') } },
        ],
    }).sort({_id: -1});
    const categoryRemove = await categoryModel.countWithDeleted({
        deleted: true
    });
    res.render("admin/category/search-category", {
        searchCategory, 
        categoryRemove,
        keyword,
    })
}

module.exports = {
    index,
    trash,
    create,
    store,
    edit,
    update,
    restore,
    remove,
    force,
    search
}