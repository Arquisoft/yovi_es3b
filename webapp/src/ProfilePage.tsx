const ProfilePage: React.FC = () => {
    return (
        <div className="profile-page">
            <h1>Mi perfil</h1>
            <div className="profile-options">
                <button className="profile-option-button" disabled>Editar perfil</button> {/* Estan en disable ya que no esta hecha aun la funcionalidad */}
                <button className="profile-option-button" disabled>Cambiar foto</button>
            </div>
        </div>
    );
};

export default ProfilePage;