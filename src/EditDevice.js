import React, { useEffect, useState } from 'react';
import { HOME, SERVER } from './constants';
import { FaChevronLeft } from 'react-icons/fa';
import { getDbPool } from './variables';
import axios from 'axios';
import { handleGoBack } from './functions';
import { useLanguage } from './LanguageContext';

const EditDevice = () => {
    const deviceID = sessionStorage.getItem("deviceID");
    const dbPool = getDbPool();

    const { t } = useLanguage();
    
    const [formData, setFormData] = useState({
        model: '',
        brand: '',
        serial: '',
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!deviceID) {
            setError("Device ID is missing. Please select a device.");
            setLoading(false);
            return;
        }

        const fetchDeviceData = async () => {
            try {
                const response = await axios.get(`${SERVER}/devices/${deviceID}`, {
                    headers: { dbPool },
                });
                const device = response.data;
                // Ensure all values in `formData` are strings
                const sanitizedDevice = {
                    brand: device.brand || '',
                    model: device.model || '',
                    serial: device.serial || '',
                };
                setFormData(sanitizedDevice);
            } catch (err) {
                console.error("Error fetching device data:", err);
                setError("An unexpected error occurred.");
            } finally {
                setLoading(false);
            }
        };

        fetchDeviceData();
    }, [deviceID, dbPool]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.put(`${SERVER}/editdevice/${deviceID}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        dbPool,
                    },
                }
            );

            if (response.status === 200) {
                console.log('Device updated successfully:', response.data);
                alert(t('editDevice.successMessage'));

                // Redirect to device list after closing alert
                window.location = `${HOME}/clientdetails`;
            } else {
                console.error('Error updating device:', response.data);
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
            <h2>{t('editDevice.title')}</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <input
                        type="text"
                        name="brand"
                        value={formData.brand}
                        onChange={handleChange}
                        placeholder={t('deviceDetails.brand')}
                        maxLength="255"
                        required
                    />
                </div>
                <div>
                    <input
                        type="text"
                        name="model"
                        value={formData.model}
                        onChange={handleChange}
                        placeholder={t('deviceDetails.model')}
                        maxLength="255"
                    />
                </div>
                <div>
                    <input
                        type="text"
                        name="serial"
                        value={formData.serial}
                        onChange={handleChange}
                        placeholder={t('deviceDetails.serial')}
                        maxLength="255"
                    />
                </div>
                <button type="submit">{t('form.editSubmit')}</button>
            </form>
        </div>
    );
};

export default EditDevice;
