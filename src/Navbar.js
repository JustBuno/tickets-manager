import React from 'react';
import { FaCog, FaAddressBook, FaTasks, FaFileAlt, FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import useActivePath from './useActivePath'; // Import the custom hook

const Navbar = () => {
    const [active, setActive] = useActivePath(); // Get active state and setter
    const navigate = useNavigate();

    const handleClick = (path) => {
        setActive(path); // Update active state
        navigate(`/${path}`); // Navigate to the selected path
    };

    return (
        <div className="navbar">
            {/* Repair List */}
            <div
                className={active === 'repairlist' ? 'activeIcon' : 'icon'}
                onClick={() => handleClick('repairlist')}
            >
                <FaTasks size={25} />
            </div>

            {/* Client List */}
            <div
                className={active === 'clientlist' ? 'activeIcon' : 'icon'}
                onClick={() => handleClick('clientlist')}
            >
                <FaAddressBook size={25} />
            </div>
            {/* Search */}
            {/* <div
                className={active === 'search' ? 'activeIcon' : 'icon'}
                onClick={() => handleClick('search')}
            >
                <FaSearch size={25} />
            </div> */}
            {/* Documentation */}
            {/* <div
                className={active === 'docs' ? 'activeIcon' : 'icon'}
                onClick={() => handleClick('docs')}
            >
                <FaFileAlt size={25} />
            </div> */}
            {/* User Settings */}
            <div
                className={active === 'settings' ? 'activeIcon' : 'icon'}
                onClick={() => handleClick('settings')}
            >
                <FaCog size={25} />
            </div>
        </div>
    );
};

export default Navbar;