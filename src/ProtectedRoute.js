import { useState, useEffect } from 'react';
import { SERVER } from './constants';
import axios from 'axios';
import Navbar from './Navbar';
import { getDbPool } from './variables';
import { navigateToLogin } from './functions';

const ProtectedRoute = ({ element }) => {
    const [isValidUser, setIsValidUser] = useState(null); // Tracks if user is valid
    const [loading, setLoading] = useState(true); // Tracks loading state
    const [errorMessage, setErrorMessage] = useState(''); // Tracks error messages

    const username = localStorage.getItem('username');
    const accesstoken = localStorage.getItem('accesstoken');
    const dbPool = getDbPool();

    useEffect(() => {
        // Check if the user is logged in
        if (username && accesstoken && dbPool) {
            // Make a request to validate the user
            axios
                .post(`${SERVER}/auth/validate`, { username, accesstoken, dbPool })
                .then((response) => {
                    // Here we can handle the response data if needed
                    if (response.status === 200) {
                        setIsValidUser(true); // Mark user as valid
                    } else {
                        setIsValidUser(false); // Handle unexpected status
                    }
                    setLoading(false); // Stop loading
                })
                .catch((error) => {
                    if (error.response) {
                        // Handle server response errors (e.g., 401 Unauthorized)
                        setErrorMessage(error.response.data.error || 'An error occurred');
                    } else if (error.request) {
                        // Handle network or no response errors
                        setErrorMessage('No response from server');
                    } else {
                        // Handle other errors
                        setErrorMessage(error.message || 'An error occurred');
                    }
                    setIsValidUser(false); // User is invalid
                    setLoading(false); // Stop loading
                });
        } else {
            setIsValidUser(false); // No username or access token found
            setLoading(false); // Stop loading
        }
    }, [username, accesstoken, dbPool]);

    if (loading) {
        return (
            <div className="loader-container">
                <div className="loader"></div>
            </div>
        );
    }

    if (!isValidUser) {
        return (
            <>
                <div>{errorMessage}</div> {/* Display the error message if user is invalid */}
                {navigateToLogin()};
            </>
        );
    }

    return (
        <>
            <Navbar />
            {element}
        </>
    );
};

export default ProtectedRoute;