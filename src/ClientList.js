import React, { useEffect, useState } from "react";
import axios from "axios";
import { SERVER } from "./constants.js";
import { FaPlusSquare } from "react-icons/fa";
import { getDbPool } from "./variables.js";
import { useLanguage } from "./LanguageContext.js";

const ClientList = () => {
    const { t } = useLanguage();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Fetch data from the server
        sessionStorage.setItem('path', 'clientlist');
        const fetchClients = async () => {
            try {
                const dbPool = getDbPool();
                const response = await axios.get(`${SERVER}/clients`, {
                    headers: { dbPool },
                });

                setClients(response.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching clients:", err);
                setError("Failed to fetch clients data.");
                setLoading(false);
            }
        };

        fetchClients();
    }, []);

    // Function to handle client click
    const handleClientClick = (clientID) => {
        sessionStorage.setItem("clientID", clientID); // Store client ID in sessionStorage
        window.location.href = "/clientdetails"; // Redirect to client details page
    };

    const handleNewClientClick = () => {
        window.location.href = "/addclient";
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
            <h2>{t('clientList.title')}</h2>
            {clients.length === 0 ? (
                <p>{t('clientList.noClient')}</p>
            ) : (
                clients.map((client) => (
                    <div
                        className="clickable"
                        key={client.id}
                        onClick={() => handleClientClick(client.id)}
                    >
                        <table>
                            <thead>
                                <tr>
                                    <th className={client.undelivered > 0 ? "pending" : "status1"}>{client.name}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {client.nif !== 999999990 && (
                                    <tr>
                                        <td>{t('clientDetails.nif')}: {client.nif}</td>
                                    </tr>
                                )}
                                {client.mobile && (
                                    <tr>
                                        <td>{t('clientDetails.mobile')}: {client.mobile}</td>
                                    </tr>
                                )}
                                {client.phone && (
                                    <tr>
                                        <td>{t('clientDetails.phone')}: {client.phone}</td>
                                    </tr>
                                )}
                                {client.email && (
                                    <tr>
                                        <td>{t('clientDetails.email')}: {client.email}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ))
            )}
            <FaPlusSquare
                onClick={handleNewClientClick}
                className="plusButton"
            />
        </div>
    );
};

export default ClientList;