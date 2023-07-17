// app.js
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// Connect to MongoDB
const MONGO_URI = 'mongodb+srv://pHeroJune23:pHeroJune23@cluster0.mnqdjoo.mongodb.net/pHeroJune23';
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('Error connecting to MongoDB:', err);
});
// Define the user schema and model
const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['House Owner', 'House Renter'],
        required: true,
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
});

const User = mongoose.model('User', userSchema);

// Registration route
app.post('/register', async (req, res) => {
    try {
        const { fullName, role, phoneNumber, email, password } = req.body;

        // Check if the user already exists
        const existingUser = await User.findOne({ $or: [{ phoneNumber }, { email }] });
        if (existingUser) {
            return res.status(409).json({ error: 'User already exists' });
        }

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create and save the user to the database
        const newUser = new User({
            fullName,
            role,
            phoneNumber,
            email,
            password: hashedPassword,
        });
        await newUser.save();

        res.status(201).json({ message: 'Registration successful' });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});




app.post('/login', async (req, res) => {
    try {
        const { phoneNumber, password } = req.body;

        // Check if the user exists in the database
        const user = await User.findOne({ phoneNumber });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check the password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign({ _id: user._id }, 'your-secret-key', { expiresIn: '1h' });

        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});



const verifyToken = (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ error: 'Access denied. Token is missing.' });
    }

    jwt.verify(token, 'your-secret-key', (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        req.userId = decoded._id;
        next();
    });
};

// Example of a secured route
app.get('/dashboard', verifyToken, (req, res) => {
    // Here, you can access the authenticated user's ID using req.userId
    // Perform operations only authorized users can do
    res.json({ message: 'Welcome to the dashboard' });
});