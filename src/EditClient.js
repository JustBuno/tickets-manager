import React, { useEffect, useState } from 'react';
import { HOME, SERVER } from './constants';
import { FaChevronLeft } from 'react-icons/fa';
import { getDbPool } from './variables';
import axios from 'axios';
import { handleGoBack } from './functions';
import { useLanguage } from './LanguageContext';

const EditClient = () => {
    const clientID = sessionStorage.getItem("clientID");
    const dbPool = getDbPool();

    const { t } = useLanguage();
    
    const [formData, setFormData] = useState({
        techid: '',
        name: '',
        nif: '',
        address: '',
        maps: '',
        mobile: '',
        phone: '',
        email: '',
    });

    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!clientID) {
            setError("Client ID is missing. Please select a client.");
            setLoading(false);
            return;
        }

        const fetchClientData = async () => {
            try {
                const response = await axios.get(`${SERVER}/clients/${clientID}`, {
                    headers: { dbPool },
                });

                const { client } = response.data;
                // Ensure all values in `formData` are strings
                const sanitizedClient = {
                    techid: client.commissionid || '',
                    name: client.name || '',
                    nif: client.nif || '',
                    address: client.address || '',
                    maps: client.maps || '',
                    mobile: client.mobile || '',
                    phone: client.phone || '',
                    email: client.email || '',
                };
                setFormData(sanitizedClient);

            } catch (err) {
                console.error("Error fetching client data:", err);
                setError("An unexpected error occurred.");
            } finally {
                setLoading(false);
            }
        };

        const fetchExtraData = async () => {
            try {
                const response = await axios.get(`${SERVER}/extraformdata/${clientID}`, {
                    headers: { dbPool },
                });

                const data = response.data;
                setTechnicians(data.users);
            } catch (err) {
                console.error("Error fetching extra form data:", err);
                setError("An unexpected error occurred.");
            } finally {
                setLoading(false);
            }
        };

        fetchClientData();
        fetchExtraData();
        setLoading(false);
    }, [clientID, dbPool]);

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
            const response = await axios.put(`${SERVER}/editclient/${clientID}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        dbPool,
                    },
                }
            );

            if (response.status === 200) {
                console.log('Client updated successfully:', response.data);
                alert(t('editClient.successMessage'));

                // Redirect to client list after closing alert
                window.location = `${HOME}/clientdetails`;
            } else {
                console.error('Error updating client:', response.data);
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
            <h2>{t('editClient.title')}</h2>
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
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder={t('clientDetails.name')}
                        maxLength="255"
                        required
                    />
                </div>
                <div>
                    <input
                        type="text"
                        name="nif"
                        value={formData.nif}
                        onChange={handleChange}
                        placeholder={t('clientDetails.nif')}
                        maxLength="9"
                    />
                </div>
                <div>
                    <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder={t('clientDetails.address')}
                        maxLength="255"
                    />
                </div>
                <div>
                    <input
                        type="text"
                        name="maps"
                        value={formData.maps}
                        onChange={handleChange}
                        placeholder={t('clientDetails.maps')}
                        maxLength="255"
                    />
                </div>
                <div>
                    <input
                        type="text"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleChange}
                        placeholder={t('clientDetails.mobile')}
                    />
                </div>
                <div>
                    <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder={t('clientDetails.phone')}
                    />
                </div>
                <div>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder={t('clientDetails.email')}
                        maxLength="255"
                    />
                </div>
                <button type="submit">{t('form.editSubmit')}</button>
            </form>
        </div>
    );
};

export default EditClient;
