const { getAdmin } = require("../firebase/admin");

function createVerifyToken(adminInstance = null) {
    return async function verifyToken(req, res, next) {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: req.t('tokenNotProvided') });
        }

        const token = authHeader.split("Bearer ")[1];

        try {
            const admin = adminInstance || getAdmin();
            const decoded = await admin.auth().verifyIdToken(token);
            req.user = decoded;
            next();
        } catch (err) {
            console.error("verifyToken error:", err.code, err.message);
            return res.status(401).json({ error: req.t('tokenInvalid') });
        }
    }
}

const verifyToken = createVerifyToken();

module.exports = { verifyToken, createVerifyToken };