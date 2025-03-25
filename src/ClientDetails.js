import React, { useEffect, useState, useRef } from "react";
import { SERVER } from "./constants";
import { FaTasks, FaMobileAlt, FaPlusSquare, FaEdit, FaTimes, FaMapMarkerAlt } from "react-icons/fa";
import axios from "axios";
import { getDbPool } from "./variables";
import { useLanguage } from "./LanguageContext";

const ClientDetails = () => {
    const clientID = sessionStorage.getItem("clientID");
    const { t } = useLanguage();
    const [client, setClient] = useState(null);
    const [repairs, setRepairs] = useState([]);
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeSection, setActiveSection] = useState("repairs");
    const [showModal, setShowModal] = useState(false);
    const [modalStyle, setModalStyle] = useState({});
    const tableRef = useRef(null); // Ref for the table

    useEffect(() => {
        if (!clientID) {
            setError("Client ID is missing. Please select a client.");
            setLoading(false);
            return;
        }

        const fetchClientDetails = async () => {
            try {
                const dbPool = getDbPool();
                const response = await axios.get(`${SERVER}/clients/${clientID}`, {
                    headers: { dbPool },
                });

                const data = response.data;
                setClient(data.client);
                setRepairs(data.repairs);
                setDevices(data.devices);
            } catch (err) {
                console.error("Error fetching client details:", err);
                setError("An unexpected error occurred.");
            } finally {
                setLoading(false);
            }
        };

        fetchClientDetails();
    }, [clientID]);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (showModal && !document.querySelector('.modal')?.contains(event.target)) {
                closeModal();
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [showModal]);

    const handleClientClick = () => {
        if (tableRef.current) {
            const rect = tableRef.current.getBoundingClientRect();
            setModalStyle({
                top: `${rect.top + rect.height / 2}px`,
                left: `${rect.left + rect.width / 2}px`,
                transform: "translate(-50%, -50%)", // Center alignment
                position: "absolute",
            });
        }
        setShowModal(true);
    };

    const handleEditClick = () => {
        window.location.href = "/editclient";
    };

    const handleRepairClick = (repairID) => {
        sessionStorage.setItem("repairID", repairID);
        window.location.href = "/repairdetails";
    };

    const handleDeviceClick = (deviceID) => {
        sessionStorage.setItem("deviceID", deviceID);
        window.location.href = "/editdevice";
    };

    const handleNewDeviceClick = () => {
        window.location.href = "/adddevice";
    };

    const handleNewRepairClick = () => {
        window.location.href = "/addrepair";
    };

    const handleMapsClick = () => {
        window.open(client.maps, "_blank");
    };

    const closeModal = () => {
        setShowModal(false);
    };

    const renderDevicesSection = () => (
        <div style={{ position: "relative" }}>
            {devices.length === 0 ? (
                <p>{t('clientDetails.noDevices')}</p>
            ) : (
                devices.map((device) => (
                    <table
                        className={`clickable ${device.delivered === 1 ? "delivered" : ""}`}
                        key={device.id}
                        onClick={() => handleDeviceClick(device.id)}
                    >
                        <tbody>
                            <tr>
                                <td>{device.brand}</td>
                            </tr>
                            <tr>
                                <td>{device.model ? device.model : t('clientDetails.nd')}</td>
                            </tr>
                            <tr>
                                <td>{device.serial ? device.serial : t('clientDetails.nd')}</td>
                            </tr>
                        </tbody>
                    </table>
                ))
            )}
            <FaPlusSquare
                onClick={handleNewDeviceClick}
                className="plusButton"
            />
        </div>
    );

    const renderRepairsSection = () => (
        <div style={{ position: "relative" }}>
            {repairs.length === 0 ? (
                <p>{t('clientDetails.noRepairs')}</p>
            ) : (
                repairs.map((repair) => (
                    <table
                        className={`clickable ${repair.delivered === 1 ? "delivered" : ""}`}
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
                                <td>{new Date(repair.startdate).toLocaleDateString("pt-PT")}</td>
                            </tr>
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
                            {repair.serial && (
                                <tr>
                                    <td>{repair.serial}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                ))
            )}
            <FaPlusSquare
                onClick={handleNewRepairClick}
                className="plusButton"
            />
        </div>
    );

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
            <h2>{t('clientDetails.title')}</h2>
            {client ? (
                <div>
                    <table
                        className="clickable"
                        ref={tableRef}
                        onClick={handleClientClick}>
                        <thead>
                            <tr>
                                <th>{client.name}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {client.nif && (
                                <tr>
                                    <td>{t('clientDetails.nif')}: {client.nif}</td>
                                </tr>
                            )}
                            {client.address && (
                                <tr>
                                    <td>{t('clientDetails.address')}: {client.address}</td>
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
                    <hr style={{ margin: "20px 0", borderTop: "2px solid #ccc" }} />

                    {showModal && (
                        <div className="modal" style={modalStyle}>
                            <FaTimes
                                className="icon"
                                size={30}
                                style={{ color: "darkred" }}
                                // onClick={handleDeleteClick}
                            />
                            <FaEdit
                                className="icon"
                                size={30}
                                style={{ color: "#2196F3" }}
                                onClick={handleEditClick}
                            />
                            {client.maps && (
                                <FaMapMarkerAlt
                                    className="icon"
                                    size={30}
                                    style={{ color: "#00cc99" }}
                                    onClick={handleMapsClick}
                                />
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <p>Client not found.</p>
            )}

            <div className="section-header">
                <div
                    className={activeSection === "repairs" ? "activeIcon" : "icon"}
                    onClick={() => setActiveSection("repairs")}
                >
                    <FaTasks size={30} />
                </div>
                <div
                    className={activeSection === "devices" ? "activeIcon" : "icon"}
                    onClick={() => setActiveSection("devices")}
                >
                    <FaMobileAlt size={30} />
                </div>
            </div>

            {activeSection === "devices" ? renderDevicesSection() : renderRepairsSection()}
        </div>
    );
};

export default ClientDetails;