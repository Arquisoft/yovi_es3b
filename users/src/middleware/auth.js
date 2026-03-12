const { getAdmin } = require("../firebase/admin");

function createVerifyToken(adminInstance = null) {
    return async function verifyToken(req, res, next) {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Token no proporcionado" });
        }

        const token = authHeader.split("Bearer ")[1];

        try {
            const admin = adminInstance || getAdmin();
            const decoded = await admin.auth().verifyIdToken(token);
            req.user = decoded;
            next();
        } catch (err) {
            return res.status(401).json({ error: "Token inválido o expirado" });
        }
    }
}

const verifyToken = createVerifyToken();

module.exports = { verifyToken, createVerifyToken };