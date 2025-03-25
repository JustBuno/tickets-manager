import React, { useEffect, useState } from "react";
import axios from "axios";
import { SERVER } from "./constants.js";
import { getDbPool } from "./variables.js";
import { useLanguage } from "./LanguageContext.js";

const RepairList = () => {
    sessionStorage.setItem('path', 'repairlist');
    const { t } = useLanguage();
    const [repairs, setRepairs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Fetch data from the server
        const fetchRepairs = async () => {
            try {
                const dbPool = getDbPool();

                const response = await axios.get(`${SERVER}/repairs`, {
                    headers: { dbPool },
                });

                setRepairs(response.data);
            } catch (err) {
                console.error("Error fetching repairs:", err);
                setError("Failed to fetch repairs data.");
            } finally {
                setLoading(false);
            }
        };

        fetchRepairs();
    }, []);

    // Function to handle repair click
    const handleRepairClick = (repairID) => {
        sessionStorage.setItem("repairID", repairID); // Store repair ID in sessionStorage
        window.location.href = "/repairdetails"; // Redirect to repair details page
    };

    if (loading) {
        return (
            <div className="loader-container">
                <div className="loader"></div>
            </div>
        );
    }

    if (error) return <div>{error}</div>;

    return (
        <div>
            <h2>{t('repairList.title')}</h2>

            <h3>{t('repairList.undelivered')}</h3>
            {repairs.filter((repair) => repair.delivered === 0).length === 0 ? (
                <p>{t('repairList.noRepair')}</p>
            ) : (
                repairs
                    .filter((repair) => repair.delivered === 0)
                    .slice()
                    .reverse()
                    .map((repair) => (
                        <table
                            className={'clickable'}
                            key={repair.id}
                            onClick={() => handleRepairClick(repair.id)}
                        >
                            <thead>
                                <tr>
                                    <th className={`status${repair.status}`}>{t('repairDetails.repairNumber')}{repair.id}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>{new Date(repair.startdate).toLocaleDateString('pt-PT')}</td>
                                </tr>
                                <tr>
                                    <td>{repair.name}</td>
                                </tr>
                                {repair.mobile && (
                                    <tr>
                                        <td>{repair.mobile}</td>
                                    </tr>
                                )}
                                {repair.phone && (
                                    <tr>
                                        <td>{repair.phone}</td>
                                    </tr>
                                )}
                                {repair.brand && (
                                    <tr>
                                        <td>{repair.brand}</td>
                                    </tr>
                                )}
                                {repair.model && (
                                    <tr>
                                        <td>{repair.model}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    ))
            )}

            <h3>{t('repairList.delivered')}</h3>
            {repairs.filter((repair) => repair.delivered === 1).length === 0 ? (
                <p>{t('repairList.noRepair')}</p>
            ) : (
                repairs
                    .filter((repair) => repair.delivered === 1)
                    .slice()
                    .reverse()
                    .map((repair) => (
                        <table
                            className={`${repair.delivered === 1 ? 'delivered' : ''} clickable`}
                            key={repair.id}
                            onClick={() => handleRepairClick(repair.id)}
                        >
                            <thead>
                                <tr>
                                    <th className={`status${repair.status}`}>{t('repairDetails.repairNumber')}{repair.id}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>{new Date(repair.startdate).toLocaleDateString('pt-PT')}</td>
                                </tr>
                                <tr>
                                    <td>{repair.name}</td>
                                </tr>
                                {repair.mobile && (
                                    <tr>
                                        <td>{repair.mobile}</td>
                                    </tr>
                                )}
                                {repair.phone && (
                                    <tr>
                                        <td>{repair.phone}</td>
                                    </tr>
                                )}
                                {repair.brand && (
                                    <tr>
                                        <td>{repair.brand}</td>
                                    </tr>
                                )}
                                {repair.model && (
                                    <tr>
                                        <td>{repair.model}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    ))
            )}
        </div>
    );
};

export default RepairList;