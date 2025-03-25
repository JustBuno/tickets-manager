import React, { useState, useEffect } from 'react';
import { HOME, SERVER } from './constants';
import { FaChevronLeft } from 'react-icons/fa';
import { getDbPool } from './variables';
import axios from 'axios';
import { handleGoBack } from './functions';
import { useLanguage } from './LanguageContext';

const AddRepair = () => {
    const techID = localStorage.getItem('userid');
    const deviceID = sessionStorage.getItem('deviceID');
    const clientID = sessionStorage.getItem('clientID');
    const dbPool = getDbPool();

    const { t } = useLanguage();

    const getCurrentDate = () => {
        const date = new Date();
        return date.toISOString().split('T')[0];
    };

    const [formData, setFormData] = useState({
        techid: techID,
        deviceid: deviceID,
        startdate: getCurrentDate(),
        description: '',
        password: '',
        battery: false,
        charger: false,
        cable: false,
        bag: false,
        other: '',
        budget: '',
        notes: '',
    });

    const [technicians, setTechnicians] = useState([]);
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchExtraData = async () => {
            if (!clientID) {
                setError("Client ID is missing. Please select a client.");
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get(`${SERVER}/extraformdata/${clientID}`, {
                    headers: { dbPool },
                });

                const data = response.data;
                setTechnicians(data.users);
                setDevices(data.devices);
            } catch (err) {
                console.error("Error fetching extra form data:", err);
                setError("An unexpected error occurred.");
            } finally {
                setLoading(false);
            }
        };

        fetchExtraData();
    }, [clientID, dbPool]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const payload = { ...formData, clientid: clientID };

            const response = await axios.post(`${SERVER}/newrepair`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        dbPool,
                    },
                });

            if (response.status === 200) {
                const data = response.data;
                console.log('Repair added successfully:', data);
                alert(t('addRepair.successMessage'));

                // Redirect to repair list after closing alert
                window.location = `${HOME}/repairlist`;
            } else {
                console.error('Error adding repair:', response.data);
                alert(`Error: ${response.data.error}`);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            alert(t('form.submitError'));
        }
    };

    if (loading) {
        return (
            <div className="loader-container">
                <div className="loader"></div>
            </div>
        );
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div>
            {/* Go Back Button */}
            <button
                onClick={handleGoBack}
                className='backButton'
            >
                <FaChevronLeft />
            </button>
            <h2>{t('addRepair.title')}</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <select
                        name="techid"
                        value={formData.techid}
                        onChange={handleChange}
                        required
                    >
                        {technicians.map((tech) => (
                            <option key={tech.id} value={tech.id}>
                                {tech.displayname}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <select
                        name="deviceid"
                        value={formData.deviceid}
                        onChange={handleChange}
                    >
                        <option value="">{t('repairDetails.noDevice')}</option>
                        {devices.map((device) => (
                            <option key={device.id} value={device.id}>
                                {`${device.brand}${device.model ? ` - ${device.model}` : ''}`}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <input
                        type="date"
                        name="startdate"
                        value={formData.startdate}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder={t('repairDetails.description')}
                        required
                    />
                </div>
                <div>
                    <input
                        type="text"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder={t('repairDetails.password')}
                    />
                </div>
                <div>
                    <div>
                        <label>
                            <input
                                type="checkbox"
                                name="charger"
                                checked={formData.charger}
                                onChange={handleChange}
                            />
                            {t('repairDetails.charger')}
                        </label>
                    </div>
                    <div>
                        <label>
                            <input
                                type="checkbox"
                                name="cable"
                                checked={formData.cable}
                                onChange={handleChange}
                            />
                            {t('repairDetails.cable')}
                        </label>
                    </div>
                    <div>
                        <label>
                            <input
                                type="checkbox"
                                name="battery"
                                checked={formData.battery}
                                onChange={handleChange}
                            />
                            {t('repairDetails.battery')}
                        </label>
                    </div>
                    <div>
                        <label>
                            <input
                                type="checkbox"
                                name="bag"
                                checked={formData.bag}
                                onChange={handleChange}
                            />
                            {t('repairDetails.bag')}
                        </label>
                    </div>
                </div>
                <div>
                    <input
                        type="text"
                        name="other"
                        value={formData.other}
                        onChange={handleChange}
                        placeholder={t('repairDetails.other')}
                    />
                </div>
                <div>
                    <textarea
                        name="budget"
                        value={formData.budget}
                        onChange={handleChange}
                        placeholder={t('repairDetails.budget')}
                    />
                </div>
                <div>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder={t('repairDetails.notes')}
                    />
                </div>
                <button type="submit">{t('form.addSubmit')}</button>
            </form>
        </div>
    );
};

export default AddRepair;