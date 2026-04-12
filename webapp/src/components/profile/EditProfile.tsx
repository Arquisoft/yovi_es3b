import React, {useState} from "react";
import {useAuth} from "../../context/AuthContext.tsx";
import {useTranslation} from "react-i18next";
import "./EditProfile.css"
import {AVATARS} from "./avatars.ts";

interface EditProfileProps {
    onCancel: () => void;
}

const EditProfile: React.FC<EditProfileProps> = ({ onCancel }) => {
    const { t } = useTranslation();
    const { username, photoURL, setUsername, setPhotoURL, token } = useAuth();
    const [newUsername, setNewUsername] = useState(username ?? "");
    const [newPhoto, setNewPhoto] = useState(photoURL ?? AVATARS[0]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!newUsername.trim()) {
            setError(t('profile.usernameRequired'));
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
            const res = await fetch(`${API_URL}/users/me/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ username: newUsername.trim(), photoURL: newPhoto }),
            });
            if (!res.ok) {
                const data = await res.json();
                setError(data.error ?? t('profile.saveError'));
                return;
            }
            setUsername(newUsername.trim());
            setPhotoURL(newPhoto);
            onCancel();
        } catch (err) {
            setError(t('profile.saveError'));
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="profile-page">
            <h1>{t('profile.title')}</h1>
            <div className="profile-wrap">

                    <div className="profile-edit-form">
                        <div className="form-group">
                            <label htmlFor="username">{t('profile.username')}</label>
                            <input
                                id="username"
                                className="form-input"
                                type="text"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>{t('profile.chooseAvatar')}</label>
                            <div className="avatar-grid">
                                {AVATARS.map((av) => (
                                    <button
                                        key={av}
                                        className={`avatar-option ${newPhoto === av ? "avatar-option--selected" : ""}`}
                                        onClick={() => setNewPhoto(av)}
                                        type="button"
                                    >
                                        <img src={"/avatars/" + av} alt={av} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {error && <p className="error-message">{error}</p>}

                        <div className="profile-edit-actions">
                            <button
                                className="profile-option-button submit-button"
                                onClick={handleSave}
                                disabled={loading}
                            >
                                {loading ? t('profile.saving') : t('profile.save')}
                            </button>
                            <button className="profile-option-button" onClick={onCancel} disabled={loading}>
                                {t('profile.cancel')}
                            </button>
                        </div>
                    </div>

            </div>
        </div>
    );
};

export default EditProfile;