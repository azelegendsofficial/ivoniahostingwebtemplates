const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// File paths
const USER_FILE = path.join(__dirname, 'user-password.txt');

// Fungsi untuk menulis user ke file
async function writeUserToFile(username, password) {
    try {
        // Cek apakah user sudah ada
        const fileContent = await fs.readFile(USER_FILE, 'utf8');
        const users = fileContent.split('\n').filter(line => line.trim() !== '');
        
        const existingUser = users.find(user => user.split(':')[0] === username);
        if (existingUser) {
            return false; // User sudah ada
        }

        // Tambahkan user baru
        await fs.appendFile(USER_FILE, `${username}:${password}\n`);
        return true;
    } catch (error) {
        // Jika file tidak ada, buat file baru
        if (error.code === 'ENOENT') {
            await fs.writeFile(USER_FILE, `${username}:${password}\n`);
            return true;
        }
        throw error;
    }
}

// Fungsi untuk verifikasi login
async function verifyLogin(username, password) {
    try {
        const fileContent = await fs.readFile(USER_FILE, 'utf8');
        const users = fileContent.split('\n').filter(line => line.trim() !== '');
        
        return users.some(user => {
            const [storedUsername, storedPassword] = user.split(':');
            return storedUsername === username && storedPassword === password;
        });
    } catch (error) {
        return false;
    }
}

// Rute registrasi
app.post('/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const registrationSuccess = await writeUserToFile(username, password);
        
        if (registrationSuccess) {
            res.json({ success: true, message: 'Registrasi berhasil' });
        } else {
            res.json({ success: false, message: 'Username sudah ada' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal melakukan registrasi' });
    }
});

// Rute login
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const loginValid = await verifyLogin(username, password);
        
        if (loginValid) {
            res.json({ success: true });
        } else {
            res.json({ success: false });
        }
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// Jalankan server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
