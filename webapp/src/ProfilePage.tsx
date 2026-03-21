import { useTranslation } from "react-i18next";

const ProfilePage: React.FC = () => {
    const { t } = useTranslation();
    return (
        <div className="profile-page">
            <h1>{t('profile.title')}</h1>
            <div className="profile-options">
                <button className="profile-option-button" disabled>{t('profile.editProfile')}</button>
                <button className="profile-option-button" disabled>{t('profile.changePhoto')}</button>
            </div>
        </div>
    );
};

export default ProfilePage;