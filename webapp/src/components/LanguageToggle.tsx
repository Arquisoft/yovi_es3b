import { useTranslation } from 'react-i18next';

const LanguageToggle: React.FC = () => {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        i18n.changeLanguage(i18n.language.startsWith('es') ? 'en' : 'es');
    };

    return (
        <button className="navbar-lang" onClick={toggleLanguage}>
            {i18n.language.startsWith('es') ? 'EN' : 'ES'}
        </button>
    );
};

export default LanguageToggle;