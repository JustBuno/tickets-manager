const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();
const crypto = require('crypto'); // Use the crypto module for random token generation
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 8000;

app.use(bodyParser.json());

let allowedOrigins = process.env.ALLOWED_ORIGINS;

// Parse ALLOWED_ORIGINS into an array
if (allowedOrigins) {
    allowedOrigins = allowedOrigins.split(',').map(origin => origin.trim());
} else {
    allowedOrigins = [];
}

// MySQL Connection Pool
const mysqlUser = process.env.MYSQL_USER;
const mysqlPassword = process.env.MYSQL_PASSWORD;
const mysqlDatabase = process.env.MYSQL_DATABASE;
const mysqlDemoDatabase = process.env.MYSQL_DEMO_DATABASE;
const inviteURL = process.env.INVITE_URL;

const corsOptions = {
    origin: function (origin, callback) {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
};

app.use(cors(corsOptions));

let mainPool;
let demoPool;
let mainInviteToken = null;
let demoInviteToken = null;

try {
    mainPool = mysql.createPool({
        host: 'localhost',
        user: mysqlUser,
        password: mysqlPassword,
        database: mysqlDatabase,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    demoPool = mysql.createPool({
        host: 'localhost',
        user: mysqlUser,
        password: mysqlPassword,
        database: mysqlDemoDatabase,
        waitForConnections: true,
        connectionLimit: 2,
        queueLimit: 0
    });

} catch (error) {
    console.error('Error:', error);
}

// Utility function to get the appropriate database pool
function getDatabasePool(dbPool) {
    if (dbPool === 'mainPool') {
        return mainPool;
    } else if (dbPool === 'demoPool') {
        return demoPool;
    } else {
        throw new Error('Invalid database pool');
    }
}

const sanitizeInput = (input) => {
    // Remove leading and trailing white spaces
    input = input.trim();
    return input;
};

async function validateUser(options) {
    const { username, accesstoken, pool } = options;

    if (!username || !accesstoken || !pool) {
        return { status: 400, error: 'Missing parameters' };
    }

    try {
        // Check if user is valid and fetch displayname
        const [userResults] = await pool.execute('SELECT displayname FROM users WHERE username = ? AND accesstoken = ?', [username, accesstoken]);

        // If the user is invalid
        if (userResults.length === 0) {
            return { status: 401, error: 'Unauthorized: Incorrect User Data' };
        }

        return { status: 200, displayname: userResults[0].displayname };
    } catch (error) {
        console.error('Authentication error: ', error);

        // Check if the error has a response object
        if (error.response && error.response.status) {
            return { status: error.response.status, error: error.message };
        } else {
            // If not, return a generic error status
            return { status: 500, error: 'Internal Server Error' };
        }
    }
}

// Function to generate a unique invite link
function generateUniqueId(dbPool) {
    const token = Math.random().toString(36).substring(2, 15);

    // Assign the token to the correct pool
    if (dbPool === 'mainPool') {
        mainInviteToken = token;
    } else if (dbPool === 'demoPool') {
        demoInviteToken = token;
    } else {
        throw new Error('Invalid database pool');
    }

    // Generate and return the invite link
    let inviteLink = `${inviteURL}?token=${token}`;
    if (dbPool === 'demoPool') {
        inviteLink += `&demo=true`; // Add the 'demo' parameter for demoPool
    }

    return inviteLink;
}

// Endpoint to register a new user
app.post('/auth/signup', async (req, res) => {
    const { displayname, username, password, accesstoken, dbPool } = req.body;

    try {
        const pool = getDatabasePool(dbPool);

        // Sanitize input
        const sanitizedUsername = sanitizeInput(username);
        const sanitizedPassword = sanitizeInput(password);

        if (!displayname || !sanitizedUsername || !sanitizedPassword) {
            return res.status(400).json({ error: 'Display name, username and password are required' });
        }

        // Check if the first user already exists
        const [userResults] = await pool.execute('SELECT id FROM users LIMIT 1');

        if (userResults.length === 0) {
            // First user - No need for access token
            const newAccessToken = crypto.randomBytes(64).toString('hex');
            await pool.query(
                'INSERT INTO users (displayname, username, password, accesstoken) VALUES (?, ?, ?, ?)',
                [displayname, sanitizedUsername, sanitizedPassword, newAccessToken]
            );
            return res.status(200).json({ message: 'User registered successfully' });
        } else {
            const poolTokens = {
                mainPool: mainInviteToken,
                demoPool: demoInviteToken,
            };

            const token = poolTokens[dbPool];
            if (!token) {
                return res.status(401).json({ error: 'Invalid or missing pool!' });
            }

            // Validate the access token
            if (!accesstoken || accesstoken !== token) {
                return res.status(401).json({ error: 'Access Token inválido!' });
            }

            const newAccessToken = crypto.randomBytes(64).toString('hex');
            await pool.query(
                'INSERT INTO users (displayname, username, password, accesstoken) VALUES (?, ?, ?, ?)',
                [displayname, sanitizedUsername, sanitizedPassword, newAccessToken]
            );
            res.status(200).json({ message: 'User registered successfully' });
        }

    } catch (error) {
        console.error('Error during user registration:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to check admin and generate invite link
app.post('/generate-invite-link', async (req, res) => {
    const { username, dbPool } = req.body;
    const authorizationHeader = req.headers['authorization'];

    try {
        // Validate input
        if (!username || !authorizationHeader || !dbPool) {
            return res.status(400).json({ error: 'Username, access token, and database pool are required' });
        }

        const pool = getDatabasePool(dbPool);
        const accessToken = authorizationHeader.split(' ')[1];
        const sanitizedUsername = sanitizeInput(username);
        const sanitizedAccessToken = sanitizeInput(accessToken);

        const validationResult = await validateUser({ username: sanitizedUsername, accesstoken: sanitizedAccessToken, pool });

        if (validationResult.status !== 200) {
            return res.status(validationResult.status).json({ error: validationResult.error });
        }

        // Check if the user is an admin
        const [firstUser] = await pool.execute('SELECT username FROM users LIMIT 1');

        if (firstUser.length > 0 && firstUser[0].username.toLowerCase() === sanitizedUsername.toLowerCase()) {
            // Generate the invite link through generateUniqueId
            const inviteLink = generateUniqueId(dbPool);

            return res.status(200).json({ inviteLink });
        } else {
            return res.status(403).json({ error: 'You are not an admin' });
        }
    } catch (error) {
        console.error('Error generating invite link:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/auth/login', async (req, res) => {
    const { username, password, dbPool } = req.body;

    // Validate input
    if (!username || !password || !dbPool) {
        return res.status(400).json({ error: 'Username, password, and dbPool are required' });
    }

    try {
        const pool = getDatabasePool(dbPool); // Dynamically select the correct pool

        // Sanitize input
        const sanitizedUsername = sanitizeInput(username);
        const sanitizedPassword = sanitizeInput(password);

        // Query the database for the user
        const [rows] = await pool.query(
            'SELECT id, displayname, accesstoken FROM users WHERE username = ? AND password = ?',
            [sanitizedUsername, sanitizedPassword]
        );

        // Check if a user was found
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Utilizador ou senha inválidos' });
        }

        // Return the user data
        const user = rows[0];
        res.status(200).json({
            id: user.id,
            displayname: user.displayname,
            accesstoken: user.accesstoken,
        });
    } catch (error) {
        console.error('Error during authentication:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to validate user
app.post('/auth/validate', async (req, res) => {
    const { username, accesstoken, dbPool } = req.body;

    // Validate input
    if (!username || !accesstoken || !dbPool) {
        return res.status(400).json({ error: 'Username, access token, and dbPool are required' });
    }

    // Sanitize input
    const sanitizedUsername = sanitizeInput(username);
    const sanitizedAccessToken = sanitizeInput(accesstoken);

    try {
        const pool = getDatabasePool(dbPool); // Dynamically select the correct pool

        // Call the validateUser function
        const validationResult = await validateUser({ username: sanitizedUsername, accesstoken: sanitizedAccessToken, pool });

        // If validation is successful, return user display name
        if (validationResult.status === 200) {
            return res.status(200).json({
                displayname: validationResult.displayname,
            });
        } else {
            // Return error if validation fails
            return res.status(validationResult.status).json({ error: validationResult.error });
        }
    } catch (error) {
        console.error('Error during user validation:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/check-admin', async (req, res) => {
    const { username, dbPool } = req.body; // Get only the username from the body
    const authorizationHeader = req.headers['authorization']; // Get the token from the Authorization header

    // Validate input
    if (!username || !authorizationHeader) {
        return res.status(400).json({ error: 'Username and access token are required' });
    }

    // Extract the token from the Authorization header
    const token = authorizationHeader.split(' ')[1]; // Extract token from "Bearer <token>"

    // Sanitize input
    const sanitizedUsername = sanitizeInput(username);
    const sanitizedAccessToken = sanitizeInput(token);

    try {
        const pool = getDatabasePool(dbPool);

        // Validate the user by calling the existing validateUser function
        const validationResult = await validateUser({ username: sanitizedUsername, accesstoken: sanitizedAccessToken, pool });

        // If validation fails, return the error
        if (validationResult.status !== 200) {
            return res.status(validationResult.status).json({ error: validationResult.error });
        }

        // Fetch the first user (the admin) from the database
        const [firstUser] = await pool.execute('SELECT username FROM users LIMIT 1');

        // Check if the user is the first user (admin) by comparing usernames
        if (firstUser.length > 0 && firstUser[0].username.toLowerCase() === sanitizedUsername.toLowerCase()) {
            // If the first user's username matches, they are the admin
            return res.status(200).json({
                message: 'Admin validated',
                isAdmin: true,
            });
        } else {
            // If the user is not the admin
            return res.status(403).json({
                error: 'You are not an admin',
            });
        }
    } catch (error) {
        console.error('Error during admin check:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.put('/change-password', async (req, res) => {
    const { username, accesstoken, newPassword, dbPool } = req.body;

    // Validate input
    if (!username || !accesstoken || !newPassword || !dbPool) {
        return res.status(400).json({ error: 'Username, access token, and new password are required' });
    }

    // Sanitize input
    const sanitizedUsername = sanitizeInput(username);
    const sanitizedPassword = sanitizeInput(newPassword);
    const sanitizedAccessToken = sanitizeInput(accesstoken);

    try {
        const pool = getDatabasePool(dbPool);

        // Validate user
        const userValidation = await validateUser({ username: sanitizedUsername, accesstoken: sanitizedAccessToken, pool });
        if (userValidation.status !== 200) {
            return res.status(userValidation.status).json({ error: userValidation.error });
        }

        // Update the user's password in the database
        const [result] = await pool.query(
            'UPDATE users SET password = ? WHERE username = ?',
            [sanitizedPassword, sanitizedUsername]
        );

        if (result.affectedRows > 0) {
            // Generate a random token
            const newAccessToken = crypto.randomBytes(64).toString('hex'); // Generate a random 64-byte token

            // Store the new access token in the database for the user
            await pool.query(
                'UPDATE users SET accesstoken = ? WHERE username = ?',
                [newAccessToken, sanitizedUsername]
            );

            res.status(200).json({
                message: 'Password changed successfully',
                newAccessToken  // Send the new access token back to the client
            });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to fetch specific columns from the repairs table, including client and device data
app.get('/repairs', async (req, res) => {
    const dbPool = req.headers['dbpool'];

    try {
        const pool = getDatabasePool(dbPool);

        const [rows] = await pool.query(
            `SELECT 
                repairs.id, 
                repairs.clientid, 
                repairs.techid, 
                repairs.startdate, 
                devices.brand, 
                devices.model, 
                repairs.status, 
                repairs.delivered, 
                clients.name, 
                clients.mobile, 
                clients.phone 
            FROM repairs
            JOIN clients ON repairs.clientid = clients.id
            LEFT JOIN devices on repairs.deviceid = devices.id`
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching repairs with client name:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to fetch specific columns from the repairs table, including client and device data, for a specific repair ID
app.get('/repairs/details/:repairID', async (req, res) => {
    const { repairID } = req.params;
    const dbPool = req.headers['dbpool'];

    try {
        const pool = getDatabasePool(dbPool);

        const [rows] = await pool.query(
            `SELECT
                repairs.techid,
                repairs.clientid,
                repairs.deviceid,
                repairs.startdate,
                repairs.description,
                repairs.password,
                repairs.battery,
                repairs.charger,
                repairs.cable,
                repairs.bag,
                repairs.other,
                repairs.budget,
                repairs.notes,
                repairs.status,
                repairs.delivered,
                repairs.enddate,
                devices.brand,
                devices.model,
                devices.serial,
                clients.name,
                clients.nif,
                clients.address,
                clients.maps,
                clients.mobile,
                clients.phone,
                clients.email,
                users.displayname
            FROM repairs
            JOIN clients ON repairs.clientid = clients.id
            LEFT JOIN devices on repairs.deviceid = devices.id
            JOIN users on repairs.techid = users.id
            WHERE repairs.id = ?`,
            [repairID]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Repair not found' });
        }

        res.status(200).json(rows[0]); // Return the first (and only) result from the query
    } catch (error) {
        console.error('Error fetching repair with client and device data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to fetch repairs data for a client
app.get('/repairs/:clientid', async (req, res) => {
    const { clientid } = req.params;
    const dbPool = req.headers['dbpool'];

    try {
        const pool = getDatabasePool(dbPool);

        const [rows] = await pool.query('SELECT * FROM repairs WHERE clientid = ?', [clientid]);
        if (rows.length > 0) {
            res.status(200).json(rows);
        } else {
            res.status(404).json({ error: 'repairs not found' });
        }
    } catch (error) {
        console.error('Error fetching client by ID:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/clients', async (req, res) => {
    const dbPool = req.headers['dbpool'];

    try {
        const pool = getDatabasePool(dbPool);

        const query = `
            SELECT 
                clients.*, 
                COUNT(CASE WHEN repairs.delivered = 0 THEN 1 END) AS undelivered
            FROM clients
            LEFT JOIN repairs ON repairs.clientid = clients.id
            GROUP BY clients.id
        `;
        const [rows] = await pool.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to fetch all data from a client, including related repairs and device information
app.get('/clients/:id', async (req, res) => {
    const { id } = req.params;
    const dbPool = req.headers['dbpool'];

    try {
        const pool = getDatabasePool(dbPool);

        // Fetch client data and related repairs with device information
        const [clientData] = await pool.query('SELECT * FROM clients WHERE id = ?', [id]);
        const [deviceData] = await pool.query('SELECT * FROM devices WHERE clientid = ?', [id]);

        if (clientData.length === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }

        const [repairsData] = await pool.query(
            `SELECT 
                repairs.id, 
                repairs.clientid, 
                repairs.techid, 
                repairs.startdate, 
                devices.brand, 
                devices.model, 
                devices.serial, 
                repairs.status, 
                repairs.delivered 
            FROM repairs
            LEFT JOIN devices ON repairs.deviceid = devices.id
            WHERE repairs.clientid = ?`,
            [id]
        );

        res.status(200).json({
            client: clientData[0],
            devices: deviceData,
            repairs: repairsData,
        });
    } catch (error) {
        console.error('Error fetching client and related repairs:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/newclient', async (req, res) => {
    const { techid, name, nif, address, maps, mobile, phone, email } = req.body;
    const dbPool = req.headers['dbpool'];

    // Input validation for the required fields "techid" and "name"
    if (!techid || !name) {
        return res.status(400).json({ error: 'Name and Tech ID required' });
    }

    // Set the values to null if they are not provided
    const nifValue = nif || 999999990;
    const addressValue = address || null;
    const mapsValue = maps || null;
    const mobileValue = mobile || null;
    const phoneValue = phone || null;
    const emailValue = email || null;

    try {
        const pool = getDatabasePool(dbPool);

        // Insert the new client into the database
        const [result] = await pool.query(
            'INSERT INTO clients (commissionid, name, nif, address, maps, mobile, phone, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [techid, name, nifValue, addressValue, mapsValue, mobileValue, phoneValue, emailValue]
        );

        // Return success message with the inserted client ID
        res.status(200).json({ message: 'Client added successfully', clientId: result.insertId });
    } catch (error) {
        console.error('Error inserting client:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.put('/editclient/:id', async (req, res) => {
    const { id } = req.params;
    const { techid, name, nif, address, maps, mobile, phone, email } = req.body;
    const dbPool = req.headers['dbpool'];

    // Input validation for the required field "techid" and "name"
    if (!techid || !name) {
        return res.status(400).json({ error: 'Name and tech ID are required' });
    }

    // Prepare the values, setting defaults to null if not provided
    const nifValue = nif || 999999990; // Use default NIF if not provided
    const addressValue = address || null;
    const mapsValue = maps || null;
    const mobileValue = mobile || null;
    const phoneValue = phone || null;
    const emailValue = email || null;

    try {
        const pool = getDatabasePool(dbPool);
        
        // Update the client in the database with the new values
        const [result] = await pool.query(
            'UPDATE clients SET commissionid = ?, name = ?, nif = ?, address = ?, maps = ?, mobile = ?, phone = ?, email = ? WHERE id = ?',
            [techid, name, nifValue, addressValue, mapsValue, mobileValue, phoneValue, emailValue, id]
        );

        // Check if the client was found and updated
        if (result.affectedRows > 0) {
            res.status(200).json({
                message: 'Client updated successfully',
                client: { id, name, nif: nifValue, address: addressValue, maps: mapsValue, mobile: mobileValue, phone: phoneValue, email: emailValue }
            });
        } else {
            res.status(404).json({ error: 'Client not found' });
        }
    } catch (error) {
        console.error('Error updating client:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to fetch all data from a device
app.get('/devices/:id', async (req, res) => {
    const { id } = req.params;
    const dbPool = req.headers['dbpool'];

    try {
        const pool = getDatabasePool(dbPool);

        const [rows] = await pool.query('SELECT * FROM devices WHERE id = ?', [id]);
        if (rows.length > 0) {
            res.status(200).json(rows[0]);
        } else {
            res.status(404).json({ error: 'Device not found' });
        }
    } catch (error) {
        console.error('Error fetching device by ID:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/newdevice', async (req, res) => {
    const { brand, model, serial, clientID } = req.body;
    const dbPool = req.headers['dbpool'];

    // Validate clientID
    if (!clientID) {
        return res.status(400).json({ error: 'clientID is required' });
    }

    // Ensure brand is provided
    if (!brand) {
        return res.status(400).json({ error: 'Brand is required' });
    }

    try {
        const pool = getDatabasePool(dbPool);

        // Insert the new device into the database
        const [result] = await pool.query(
            'INSERT INTO devices (brand, model, serial, clientid) VALUES (?, ?, ?, ?)',
            [brand, model || null, serial || null, clientID]
        );

        // Return success message with the inserted device ID
        res.status(200).json({ message: 'Device added successfully', deviceId: result.insertId });
    } catch (error) {
        console.error('Error inserting device:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.put('/editdevice/:id', async (req, res) => {
    const { id } = req.params;
    const { model, brand, serial } = req.body;
    const dbPool = req.headers['dbpool'];

    // Ensure brand is provided
    if (!brand) {
        return res.status(400).json({ error: 'Brand is required' });
    }

    try {
        const pool = getDatabasePool(dbPool);

        // Update the device in the database with the new values
        const [result] = await pool.query(
            'UPDATE devices SET model = ?, brand = ?, serial = ? WHERE id = ?',
            [model, brand, serial, id]
        );

        // Check if the device was found and updated
        if (result.affectedRows > 0) {
            res.status(200).json({
                message: 'Device updated successfully',
                device: { id, model, brand, serial }
            });
        } else {
            res.status(404).json({ error: 'Device not found' });
        }
    } catch (error) {
        console.error('Error updating device:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to fetch all data from a device
app.get('/repairdata/:id', async (req, res) => {
    const { id } = req.params;
    const dbPool = req.headers['dbpool'];

    try {
        const pool = getDatabasePool(dbPool);
        
        const [rows] = await pool.query('SELECT * FROM repairs WHERE id = ?', [id]);
        if (rows.length > 0) {
            res.status(200).json(rows);
        } else {
            res.status(404).json({ error: 'Device not found' });
        }
    } catch (error) {
        console.error('Error fetching device by ID:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/extraformdata/:clientID', async (req, res) => {
    const { clientID } = req.params;
    const dbPool = req.headers['dbpool'];

    try {
        const pool = getDatabasePool(dbPool);

        // Fetch users
        const [users] = await pool.query('SELECT id, displayname FROM users');

        // Fetch devices for the given clientID
        const [devices] = await pool.query(
            'SELECT id, brand, model FROM devices WHERE clientid = ?',
            [clientID]
        );

        // Combine the results
        res.status(200).json({
            users,
            devices,
        });
    } catch (error) {
        console.error('Error fetching extra form data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/extraformdata/', async (req, res) => {
    const dbPool = req.headers['dbpool'];

    try {
        const pool = getDatabasePool(dbPool);

        // Fetch users
        const [users] = await pool.query('SELECT id, displayname FROM users');

        // Return users
        res.status(200).json({
            users,
        });
    } catch (error) {
        console.error('Error fetching extra form data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/newrepair', async (req, res) => {
    const {
        techid,
        clientid,
        deviceid,
        startdate,
        description,
        password,
        battery,
        charger,
        cable,
        bag,
        other,
        budget,
        notes,
    } = req.body;
    const dbPool = req.headers['dbpool'];

    // Validate required fields
    if (!techid || !clientid || !startdate || !description) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const pool = getDatabasePool(dbPool);

        // Insert the repair data into the database
        const [result] = await pool.query(
            `INSERT INTO repairs (
                techid,
                clientid,
                deviceid,
                startdate,
                description,
                password,
                battery,
                charger,
                cable,
                bag,
                other,
                budget,
                notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                techid,
                clientid,
                deviceid || null,
                startdate,
                description,
                password || null,
                battery ? 1 : 0,
                charger ? 1 : 0,
                cable ? 1 : 0,
                bag ? 1 : 0,
                other || null,
                budget || null,
                notes || null,
            ]
        );

        res.status(200).json({ message: 'Repair added successfully', repairID: result.insertId });
    } catch (error) {
        console.error('Error inserting repair:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.put('/editrepair/:repairID', async (req, res) => {
    const { repairID } = req.params;
    const {
        techid,
        deviceid,
        startdate,
        enddate,
        description,
        password,
        battery,
        charger,
        cable,
        bag,
        other,
        budget,
        notes,
        status,
        delivered,
    } = req.body;
    const dbPool = req.headers['dbpool'];

    // Validate required fields
    if (!repairID || !techid || !startdate || !description || !status) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const pool = getDatabasePool(dbPool);

        // Update the repair in the database
        const [result] = await pool.query(
            `UPDATE repairs
             SET techid = ?,
                 deviceid = ?,
                 startdate = ?,
                 enddate = ?,
                 description = ?,
                 password = ?,
                 battery = ?,
                 charger = ?,
                 cable = ?,
                 bag = ?,
                 other = ?,
                 budget = ?,
                 notes = ?,
                 status = ?,
                 delivered = ?
             WHERE id = ?`,
            [
                techid,
                deviceid || null,
                startdate,
                enddate || null,
                description,
                password || null,
                battery ? 1 : 0,
                charger ? 1 : 0,
                cable ? 1 : 0,
                bag ? 1 : 0,
                other || null,
                budget || null,
                notes || null,
                status,
                delivered ? 1 : 0,
                repairID,
            ]
        );

        if (result.affectedRows > 0) {
            res.status(200).json({ message: 'Repair updated successfully' });
        } else {
            res.status(404).json({ error: 'Repair not found' });
        }
    } catch (error) {
        console.error('Error updating repair:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Create HTTP server if not using a certificate
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// Create HTTPS server with SSL/TLS certificate and key

//  const certDir = process.env.CERT_DIR;
// const httpsOptions = {
//     key: fs.readFileSync(path.join(certDir, 'privkey.pem')),
//     cert: fs.readFileSync(path.join(certDir, 'fullchain.pem'))
// };

// const server = https.createServer(httpsOptions, app);

// server.listen(port, () => {
//     console.log(`Server is running on port ${port}`);
// });