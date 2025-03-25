import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { SERVER } from './constants';
import STATUS_TEXT from './statusDictionary';
import { getDbPool } from './variables';
import { useLanguage } from './LanguageContext';

const RepairDetails = () => {
    const repairID = sessionStorage.getItem('repairID');
    const { t } = useLanguage();
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRepairDetails = async () => {
            try {
                const dbPool = getDbPool();

                const response = await axios.get(`${SERVER}/repairs/details/${repairID}`, {
                    headers: { dbPool },
                });

                const data = response.data;
                setDetails(data);
                sessionStorage.setItem("clientID", data.clientid);
                sessionStorage.setItem("deviceID", data.deviceid);
            } catch (err) {
                console.error("Error fetching repair details:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchRepairDetails();
    }, [repairID]);

    const getAccessories = (details) => {
        return [
            details.charger && t('repairDetails.charger'),
            details.cable && t('repairDetails.cable'),
            details.battery && t('repairDetails.battery'),
            details.bag && t('repairDetails.bag'),
            details.other,
        ].filter(Boolean);
    };

    // Function to handle client click
    const handleClientClick = () => {
        window.location.href = "/clientdetails"; // Redirect to client details page
    };

    // Function to handle device click
    const handleDeviceClick = () => {
        window.location.href = "/editdevice"; // Redirect to device details page
    };

    // Function to handle repair click
    const handleRepairClick = () => {
        window.location.href = "/editrepair"; // Redirect to repair details page
    };

    if (loading) {
        return (
            <div className="loader-container">
                <div className="loader"></div>
            </div>
        );
    }

    if (error) return <div>Error: {error}</div>;

    if (!details) {
        return <div>No details available for this repair.</div>;
    }

    const accessories = getAccessories(details);

    return (
        <div>
            <h3 className={`details-header status${details.status}`}>{t('repairDetails.repairNumber')}{repairID}</h3>
            <div>
                <table
                    className='clickable'
                    onClick={() => handleClientClick()}
                >
                    <thead>
                        <tr>
                            <th>{t('repairDetails.client')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>{details.name}</td>
                        </tr>
                        <tr>
                            <td>{t('clientDetails.nif')}: {details.nif}</td>
                        </tr>
                        <tr>
                            <td>{t('clientDetails.address')}: {details.address || t('clientDetails.nd')}</td>
                        </tr>
                        <tr>
                            <td>{t('clientDetails.maps')}: {details.maps ? t('clientDetails.mapsTrue') : t('clientDetails.nd')}</td>
                        </tr>
                        <tr>
                            <td>{t('clientDetails.mobile')}: {details.mobile || t('clientDetails.nd')}</td>
                        </tr>
                        <tr>
                            <td>{t('clientDetails.phone')}: {details.phone || t('clientDetails.nd')}</td>
                        </tr>
                        <tr>
                            <td>{t('clientDetails.email')}: {details.email || t('clientDetails.nd')}</td>
                        </tr>
                    </tbody>
                </table>

                {details.deviceid && (
                    <table
                        className="clickable"
                        onClick={() => handleDeviceClick()}
                    >
                        <thead>
                            <tr>
                                <th>{t('repairDetails.device')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{t('deviceDetails.brand')}: {details.brand || t('deviceDetails.nd')}</td>
                            </tr>
                            <tr>
                                <td>{t('deviceDetails.model')}: {details.model || t('deviceDetails.nd')}</td>
                            </tr>
                            <tr>
                                <td>{t('repairDetails.serial')}: {details.serial || t('deviceDetails.nd')}</td>
                            </tr>
                        </tbody>
                    </table>
                )}

                <table
                    className='clickable'
                    onClick={() => handleRepairClick()}
                >
                    <tbody>
                        <tr>
                            <th>{t('repairDetails.tech')}</th>
                        </tr>
                        <tr>
                            <td>{details.displayname}</td>
                        </tr>
                        <tr>
                            <th>{t('repairDetails.startDate')}</th>
                        </tr>
                        <tr>
                            <td>{new Date(details.startdate).toLocaleDateString('pt-PT')}</td>
                        </tr>
                        <tr>
                            <th>{t('repairDetails.description')}</th>
                        </tr>
                        <tr>
                            <td className='preserve-whitespace'>{details.description}</td>
                        </tr>
                        <tr>
                            <th>{t('repairDetails.password')}</th>
                        </tr>
                        <tr>
                            <td>{details.password || t('repairDetails.none')}</td>
                        </tr>
                        <tr>
                            <th>{t('repairDetails.accessories')}</th>
                        </tr>
                        {accessories.length > 0 ? (
                            accessories.map((accessory, index) => (
                                <tr key={index}>
                                    <td>{accessory}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td>{t('repairDetails.none')}</td>
                            </tr>
                        )}
                        {details.budget && (
                            <>
                                <tr>
                                    <th>{t('repairDetails.budget')}</th>
                                </tr>
                                <tr>
                                    <td className='preserve-whitespace'>{details.budget}</td>
                                </tr>
                            </>
                        )}
                        {details.notes && (
                            <>
                                <tr>
                                    <th>{t('repairDetails.notes')}</th>
                                </tr>
                                <tr>
                                    <td className='preserve-whitespace'>{details.notes}</td>
                                </tr>
                            </>
                        )}
                        <tr>
                            <th>{t('repairDetails.status')}</th>
                        </tr>
                        <tr>
                            <td>{STATUS_TEXT[details.status]}</td>
                        </tr>
                        {details.enddate && (
                            <>
                                <tr>
                                    <th>{t('repairDetails.endDate')}</th>
                                </tr>
                                <tr>
                                    <td>{new Date(details.enddate).toLocaleDateString('pt-PT')}</td>
                                </tr>
                            </>
                        )}
                        {details.delivered === 1 && (
                            <tr>
                                <td className='delivered-text'>{t('repairDetails.delivered')}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RepairDetails;