exports.isAdmin = function (req, res, next) {
    if(req.session.isAdmin) {return next();}
    return res.status(401).end();
};