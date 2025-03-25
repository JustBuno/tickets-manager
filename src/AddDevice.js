import React, { useState } from 'react';
import { HOME, SERVER } from './constants';
import { FaChevronLeft } from 'react-icons/fa';
import axios from 'axios';
import { getDbPool } from './variables';
import { handleGoBack } from './functions';
import { useLanguage } from './LanguageContext';

const AddDevice = () => {
    const clientID = sessionStorage.getItem("clientID");

    const { t } = useLanguage();

    const [formData, setFormData] = useState({
        brand: '',
        model: '',
        serial: '',
    });

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
            // Include clientID in the payload
            const payload = {
                ...formData,
                clientID,
            };

            const dbPool = getDbPool();

            const response = await axios.post(`${SERVER}/newdevice`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        dbPool,
                    },
                }
            );

            if (response.status === 200) {
                const data = response.data;
                console.log('Device added successfully:', data);
                alert(t('addDevice.successMessage'));

                // Redirect to device list after closing alert
                window.location = `${HOME}/devicelist`;
            } else {
                const errorData = await response.json();
                console.error('Error adding device:', errorData);
                alert(`Error: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            alert(t('form.submitError'));
        }
    };

    return (
        <div>
            {/* Go Back Button */}
            <button
                onClick={handleGoBack}
                className='backButton'
            >
                <FaChevronLeft />
            </button>
            <h2>{t('addDevice.title')}</h2>
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
                <button type="submit">{t('form.addSubmit')}</button>
            </form>
        </div>
    );
};

export default AddDevice;