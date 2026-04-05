import { useTranslation } from "react-i18next";
import {useAuth} from "./context/AuthContext.tsx";
import EditProfile from "./components/profile/EditProfile.tsx";
import React, {useState} from "react";

const ProfilePage: React.FC = () => {
    const { t } = useTranslation();
    const { username, photoURL } = useAuth();
    const [changeProfile, setChangeProfile] = useState(false);

    if (changeProfile) {
        return <EditProfile onCancel={() => setChangeProfile(false)} />
    }

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
                    <button className="profile-option-button" onClick= {() =>setChangeProfile(true)}>
                        {t('profile.editProfile')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;