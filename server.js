const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'super_secret_lab_key';

// 1. Database & Table Creation
const db = new sqlite3.Database('./lab04.db', (err) => {
    if (err) console.error("Database connection error:", err.message);
    else {
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            password TEXT NOT NULL
        )`);
    }
});

// 2. Registration Endpoint
app.post('/register/', async (req, res) => {
    const { username, name, password } = req.body;

    if (!username || !name || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (row) {
            return res.status(400).json({ error: "Username already exists" });
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            db.run(`INSERT INTO users (username, name, password) VALUES (?, ?, ?)`, 
                [username, name, hashedPassword], 
                function(err) {
                    if (err) return res.status(500).json({ error: "Database error" });
                    res.status(201).json({ message: "User registered successfully" });
                }
            );
        } catch (error) {
            res.status(500).json({ error: "Error hashing password" });
        }
    });
});

// 3. Login Endpoint
app.post('/login/', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (!user) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        try {
            const match = await bcrypt.compare(password, user.password);
            
            if (!match) {
                return res.status(400).json({ error: "Invalid credentials" });
            }

            const payload = { username: user.username };
            const jwt_token = jwt.sign(payload, JWT_SECRET);

            res.status(200).json({ jwt_token });
        } catch (error) {
            res.status(500).json({ error: "Error during login" });
        }
    });
});

app.get('/', (req, res) => res.send('Lab 4 API is running!'));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});