import React, { useState, useEffect } from 'react';
import { SERVER } from './constants';
import axios from 'axios';
import { getDbPool, setDbPool } from './variables';
import { useLanguage } from './LanguageContext';

const Signup = () => {
    const dbPool = getDbPool();
    const { t, language, setLanguage } = useLanguage();
    const [username, setUsername] = useState('');
    const [displayname, setDisplayname] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [accessToken, setAccessToken] = useState(null);  // To hold the access token

    const handleLanguageToggle = (locale) => {
        setLanguage(locale);
        localStorage.setItem('language', locale);
    };

    useEffect(() => {
        // Fetch the token from URL params (if any)
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        // If a token is found, set it; else, leave it null
        if (token) {
            setAccessToken(token);
        }
    
        // Check if it's a demo link
        const isDemo = urlParams.get('demo') === 'true';
        if (isDemo && dbPool !== 'demoPool') {
            setDbPool('demoPool');
            window.location.reload();
        } else if (!isDemo && dbPool !== 'mainPool') {
            setDbPool('mainPool');
            window.location.reload();
        }
    }, [dbPool]);

    const handleSignup = async (e) => {
        e.preventDefault();

        // Basic validation
        if (!username || !displayname || !password || !confirmPassword) {
            alert('Please fill in all fields.');
            return;
        }

        if (/\s/.test(username)) {
            setError('Username cannot contain spaces.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        try {
            const requestBody = {
                username,
                displayname,
                password,
                dbPool,
            };

            // If there's an access token, include it in the request
            if (accessToken) {
                console.log(accessToken);
                requestBody.accesstoken = accessToken;
            }

            // Make a POST request to the signup endpoint
            const response = await axios.post(`${SERVER}/auth/signup`, requestBody, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = response.data;

            if (response.status === 200) {
                alert(t('signup.success'));
                window.location.href = '/login'; // Redirect to the home page
            } else {
                setError(data.error || 'Signup failed. Please try again.');
            }
        } catch (err) {
            console.error('Error during signup:', err);
            setError('An unexpected error occurred. Please try again later.');
        }
    };

    return (
        <div className="signup">
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
            <form onSubmit={handleSignup}>
                <div>
                    <input
                        type="text"
                        id="displayname"
                        value={displayname}
                        onChange={(e) => setDisplayname(e.target.value)}
                        placeholder={t('signup.displayname')}
                        required
                    />
                </div>
                <div>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder={t('signup.username')}
                        required
                    />
                </div>
                <div>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t('signup.password')}
                        required
                    />
                </div>
                <div>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={t('signup.confirmPassword')}
                        required
                    />
                </div>
                <button type="submit">{t('signup.submit')}</button>
                {error && <p className="error-message">{error}</p>}
            </form>
        </div>
    );
};

export default Signup;