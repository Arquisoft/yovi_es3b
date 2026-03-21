const i18next = require('../i18n/i18n');

function detectLanguage(req, res, next) {
    const header = req.headers['accept-language'] ?? 'en';
    const lang = header.startsWith('es') ? 'es' : 'en';
    req.t = (key, options) => i18next.t(key, { lng: lang, ...options });
    next();
}

module.exports = { detectLanguage };