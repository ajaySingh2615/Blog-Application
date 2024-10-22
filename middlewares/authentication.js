const {validateToken} = require("../services/authentication");

function checkForAuthenticationCookie(cookieName) {
    return (req, res, next) => {
        const tokenCookieValue = req.cookies[cookieName];
        if (!tokenCookieValue) {
            return next();
        }

        try {
            req.user = validateToken(tokenCookieValue);
        } catch (err) {
        }
        return next();
    }
}

module.exports = {
    checkForAuthenticationCookie,
}