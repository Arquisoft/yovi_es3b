const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const path = require('node:path');

i18next
    .use(Backend)
    .init({
        fallbackLng: 'en',
        supportedLngs: ['es', 'en'],
        backend: {
            loadPath: path.join(__dirname, 'locales/{{lng}}.json')
        }
    });

module.exports = i18next;