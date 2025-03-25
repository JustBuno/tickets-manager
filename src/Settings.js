import { useState, useEffect } from 'react';
import axios from 'axios';
import { SERVER } from './constants';
import { getDbPool, toggleDbPool } from './variables';
import { navigateToLogin } from './functions';
import { useLanguage } from './LanguageContext';

const Settings = () => {
    sessionStorage.setItem('path', 'settings');
    const { t, language, setLanguage } = useLanguage();
    const dbPool = getDbPool();
    const displayName = localStorage.getItem('displayname');
    const username = localStorage.getItem('username');
    const accesstoken = localStorage.getItem('accesstoken');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [isPasswordFormVisible, setPasswordFormVisible] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [inviteLink, setInviteLink] = useState('');
    const [copyMessage, setCopyMessage] = useState('');

    const handleLanguageToggle = (locale) => {
        setLanguage(locale);
        localStorage.setItem('language', locale);
    };

    useEffect(() => {
        const checkIfAdmin = async () => {
            try {
                const response = await axios.post(
                    `${SERVER}/check-admin`,
                    { username, dbPool },
                    {
                        headers: {
                            Authorization: `Bearer ${accesstoken}`,
                        },
                    }
                );

                if (response.data.isAdmin) {
                    setIsAdmin(true);
                }
            } catch (error) {
                console.error('Error checking if admin:', error);
                setIsAdmin(false); // Set admin to false in case of an error
            }
        };

        checkIfAdmin();
    }, [accesstoken, username, dbPool]);

    const handleLogout = () => {
        localStorage.clear();
        navigateToLogin();
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setPasswordError(t('settings.passwordMatchError'));
            return;
        }

        const sanitizedPassword = newPassword.trim();

        const data = {
            username,
            accesstoken,
            newPassword: sanitizedPassword,
            dbPool,
        };

        try {
            const response = await axios.put(`${SERVER}/change-password`, data);

            if (response.data.newAccessToken) {
                localStorage.setItem('accessToken', response.data.newAccessToken);
            }

            alert(t('settings.changePasswordSuccess'));
            handleLogout();
        } catch (error) {
            if (error.response) {
                setPasswordError(error.response.data.error || t('settings.unknownError'));
            } else {
                setPasswordError(t('settings.changePasswordSuccess'));
            }
        }
    };

    const handleShowPasswordForm = () => {
        setPasswordFormVisible(true);
    };

    const handleGenerateInviteLink = async () => {
        try {
            const response = await axios.post(
                `${SERVER}/generate-invite-link`,
                { username, dbPool },
                {
                    headers: {
                        Authorization: `Bearer ${accesstoken}`,
                    },
                }
            );

            if (response.data.inviteLink) {
                setInviteLink(response.data.inviteLink);
            }
        } catch (error) {
            console.error('Error generating invite link:', error);
        }
    };

    // Copy the invite link to clipboard when it's updated
    useEffect(() => {
        if (inviteLink) {
            navigator.clipboard.writeText(inviteLink)
                .then(() => {
                    setCopyMessage(t('settings.copyLinkSuccess'));
                })
                .catch((err) => {
                    console.error('Failed to copy invite link: ', err);
                    setCopyMessage(t('settings.copyLinkError'));
                });
        }
    }, [inviteLink, t]);

    return (
        <div className="settings-container">
            <h2 className="settings-header">{displayName}</h2>
            <button className="logout-btn" onClick={handleLogout}>{t('settings.logout')}</button>

            <hr style={{ margin: "30px 0", borderTop: "2px solid #ccc" }} />

            {!isPasswordFormVisible && (
                <button style={{ width: "90%" }} onClick={handleShowPasswordForm}>
                    {t('settings.changePassword')}
                </button>
            )}

            {isPasswordFormVisible && (
                <form className="password-change-form" onSubmit={handlePasswordChange}>
                    <div>
                        <input
                            type="password"
                            id="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder={t('settings.newPassword')}
                            required
                        />
                    </div>

                    <div>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder={t('settings.confirmNewPassword')}
                            required
                        />
                    </div>

                    {passwordError && <p className="error-message">{passwordError}</p>}

                    <button type="submit">{t('settings.changePassword')}</button>
                </form>
            )}

            {/* Conditionally render the invite link button for the admin */}
            {isAdmin && (
                <div style={{ marginTop: '20px' }}>
                    {inviteLink ? (
                        <div>
                            <input
                                type="text"
                                value={inviteLink}
                                readOnly
                                style={{ width: '90%' }}
                            />
                            {copyMessage && <p>{copyMessage}</p>} {/* Show the copy message */}
                        </div>
                    ) : (
                        <button
                            onClick={handleGenerateInviteLink}
                            style={{ width: '90%' }}
                        >
                            {t('settings.inviteLink')}
                        </button>
                    )}
                </div>
            )}
            <button
                onClick={toggleDbPool}
                style={{ width: '90%' }}
            >
                {dbPool === 'demoPool' ? t('settings.demoDisable') : t('settings.demoEnable')}
            </button>
            <button
                onClick={language === 'pt' ? () => handleLanguageToggle('en') : () => handleLanguageToggle('pt')}
                style={{ width: '90%' }}
            >
                {t('settings.toggleLanguage')}
            </button>
        </div>
    );
};

export default Settings;
