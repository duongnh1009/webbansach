// Middleware kiểm tra đăng nhập và phân quyền
const checkLogin = (req, res, next) => {
    if (req.session.userId) {
        res.locals.fullName = req.session.fullName
        next();
    } else {
        return res.redirect("/admin/login");
    }
};

// Middleware kiểm tra đăng nhập bên client
const checkLoginSite = (req, res, next) => {
    if (req.session.userSiteId) {
      res.locals.userSiteId = req.session.userSiteId;
      res.locals.fullNameSite = req.session.fullNameSite; // Lưu tên người dùng vào locals
    } else {
      res.locals.userSiteId = null;
      res.locals.fullNameSite = null;
    }
    next();
};

const backLogin = (req, res, next) => {
    if (!req.session.userSiteId) {
      return res.redirect('/login');
    }
    next();
};
  
module.exports = {
    checkLogin,
    checkLoginSite,
    backLogin
}