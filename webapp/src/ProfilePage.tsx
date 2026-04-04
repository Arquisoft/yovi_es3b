import { useTranslation } from "react-i18next";
import {useAuth} from "./context/AuthContext.tsx";

const ProfilePage: React.FC = () => {
    const { t } = useTranslation();
    const { username, photoURL } = useAuth();
    return (
        <div className="profile-page">
            <h1>{t('profile.title')}</h1>
            <div className="profile-wrap">
                <div className="avatar-ring">
                    <img
                        src={"/avatars/" + (photoURL ?? "avatar_1.png")}
                        alt={username ?? "avatar"}
                        onError={(e) =>
                            { (e.target as HTMLImageElement).src = "/avatars/avatar_1.png"; }}
                    />
                </div>
                <p className="username">{username}</p>
                <hr className=".profile-wrap hr"/>
                <div className="profile-options">
                    <button className="profile-option-button">{t('profile.editProfile')}</button>
                    <button className="profile-option-button">{t('profile.changePhoto')}</button>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;