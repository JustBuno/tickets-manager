import React, { useState, useEffect } from 'react';
import { HOME, SERVER } from './constants';
import STATUS_TEXT from './statusDictionary';
import { FaChevronLeft } from 'react-icons/fa';
import { handleGoBack } from './functions';
import axios from 'axios';
import { getDbPool } from './variables';
import { useLanguage } from './LanguageContext';

const EditRepair = () => {
    const repairID = sessionStorage.getItem('repairID');
    const clientID = sessionStorage.getItem('clientID');
    const dbPool = getDbPool();

    const { t } = useLanguage();

    const [formData, setFormData] = useState({
        techid: '',
        deviceid: '',
        startdate: '',
        description: '',
        password: '',
        battery: false,
        charger: false,
        cable: false,
        bag: false,
        delivered: false,
        other: '',
        budget: '',
        notes: '',
        status: '',
        enddate: null,
    });

    const [technicians, setTechnicians] = useState([]);
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const formatDate = (date) => {
        const formattedDate = new Date(date);
        return formattedDate.toISOString().split('T')[0];
    };

    useEffect(() => {
        const fetchRepairDetails = async () => {
            if (!repairID) {
                setError("Repair ID is missing. Please select a repair.");
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get(`${SERVER}/repairdata/${repairID}`, {
                    headers: { dbPool },
                });

                console.log(response.data);

                const repairData = response.data;

                const sanitizedData = {
                    techid: repairData[0]?.techid || '',
                    deviceid: repairData[0]?.deviceid || '',
                    startdate: formatDate(repairData[0]?.startdate || new Date()),
                    description: repairData[0]?.description || '',
                    password: repairData[0]?.password || '',
                    battery: repairData[0]?.battery || false,
                    charger: repairData[0]?.charger || false,
                    cable: repairData[0]?.cable || false,
                    bag: repairData[0]?.bag || false,
                    delivered: repairData[0]?.delivered || false,
                    other: repairData[0]?.other || '',
                    budget: repairData[0]?.budget || '',
                    notes: repairData[0]?.notes || '',
                    status: repairData[0]?.status?.toString() || '0',
                    enddate: repairData[0]?.enddate ? formatDate(repairData[0].enddate) : null,
                };

                setFormData(sanitizedData);
            } catch (err) {
                console.error("Error fetching repair details:", err);
                setError("An unexpected error occurred.");
            }
        };

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

                const { users, devices } = await response.data;
                setTechnicians(users);
                setDevices(devices);
            } catch (err) {
                console.error("Error fetching extra form data:", err);
                setError("An unexpected error occurred.");
            }
        };

        fetchRepairDetails();
        fetchExtraData();
        setLoading(false);
    }, [repairID, clientID, dbPool]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData((prevData) => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleDateChange = (e) => {
        const { value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            enddate: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const payload = {
                ...formData,
                // Set enddate explicitly based on status
                enddate: formData.status === '0' || formData.status === '4'
                    ? formData.enddate || formatDate(new Date())
                    : null,
            };

            const response = await axios.put(`${SERVER}/editrepair/${repairID}`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        dbPool,
                    },
                }
            );

            if (response.status === 200) {
                console.log('Repair updated successfully:', response.data);
                alert(t('editRepair.successMessage'));

                window.location = `${HOME}/repairlist`;
            } else {
                const errorData = await response.json();
                console.error('Error updating repair:', errorData);
                alert(`Error: ${errorData.error}`);
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
            <h2>{t('editRepair.title')}</h2>
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
                <div>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        required
                    >
                        {Object.entries(STATUS_TEXT).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                </div>
                {(formData.status === '0' || formData.status === '4') && (
                    <div>
                        <input
                            type="date"
                            name="enddate"
                            value={formData.enddate || formatDate(new Date())}
                            onChange={handleDateChange}
                        />
                    </div>
                )}
                <label>
                    <input
                        type="checkbox"
                        name="delivered"
                        checked={formData.delivered}
                        onChange={handleChange}
                    />
                    {t('repairDetails.delivered')}
                </label>
                <button type="submit">{t('form.editSubmit')}</button>
            </form>
        </div>
    );
};

export default EditRepair;