import React, { useState } from 'react';
import { SERVER } from './constants';
import axios from 'axios';
import { toggleDbPool } from './variables';
import { useLanguage } from './LanguageContext';

const Login = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('displayname');
    localStorage.removeItem('accesstoken');
    localStorage.removeItem('userid');
    sessionStorage.removeItem('path');

    const { t, language, setLanguage } = useLanguage();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const dbPool = sessionStorage.getItem('dbPool') || 'mainPool';

    const handleLanguageToggle = (locale) => {
        setLanguage(locale);
        localStorage.setItem('language', locale);
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!username || !password) {
            alert('Please fill in both fields.');
            return;
        }

        try {
            // Make a POST request to the login endpoint
            const response = await axios.post(`${SERVER}/auth/login`, { username, password, dbPool }, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = response.data;

            if (response.status === 200) {
                // Save user details in localStorage
                localStorage.setItem('username', username);
                localStorage.setItem('displayname', data.displayname);
                localStorage.setItem('accesstoken', data.accesstoken);
                localStorage.setItem('userid', data.id);
                sessionStorage.setItem('dbPool', dbPool);

                sessionStorage.setItem('path', 'repairlist');
                window.location.href = '/repairlist'; // Redirect to the home page
            } else {
                // Handle login error
                setError(data.error || 'Login failed. Please try again.');
            }
        } catch (err) {
            console.error('Error during login:', err);
            setError('An unexpected error occurred. Please try again later.');
        }
    };

    return (
        <div className='login'>
            <div className="language-toggle">
                <span
                    className={language === 'pt' ? 'active' : ''}
                    onClick={() => handleLanguageToggle('pt')}
                >
                    PT
                </span>
                {" | "}
                <span
                    className={language === 'en' ? 'active' : ''}
                    onClick={() => handleLanguageToggle('en')}
                >
                    EN
                </span>
            </div>
            <form onSubmit={handleLogin}>
                <div className='footer' onClick={toggleDbPool}>
                    {dbPool === 'demoPool' ? t('login.demoDisable') : t('login.demoEnable')}
                </div>
                <div>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder={t('login.username')}
                        required
                    />
                </div>
                <div>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t('login.password')}
                        required
                    />
                </div>
                <button type="submit">{t('login.submit')}</button>
                {error && <p className='error-message'>{error}</p>}
            </form>
        </div>
    );
};

export default Login;