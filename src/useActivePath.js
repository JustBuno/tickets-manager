import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const useActivePath = () => {
    const location = useLocation(); // Get the current URL path
    const [active, setActive] = useState(sessionStorage.getItem('path') || location.pathname.slice(1));

    useEffect(() => {
        // Update sessionStorage and active state whenever the URL changes
        const path = location.pathname.slice(1); // Remove the leading "/"
        setActive(path);
        sessionStorage.setItem('path', path);
    }, [location]); // Dependency on location ensures it runs on URL change

    return [active, setActive];
};

export default useActivePath;