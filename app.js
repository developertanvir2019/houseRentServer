// app.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors());

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

const houseSchema = new mongoose.Schema({
    name: { type: String, required: true },
    userPhone: { type: Number, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    bedrooms: { type: Number, required: true },
    bathrooms: { type: Number, required: true },
    roomSize: { type: String, required: true },
    picture: { type: String, required: true },
    availabilityDate: { type: Date, required: true },
    rentPerMonth: { type: Number, required: true },
    phoneNumber: { type: String, required: true, match: /^01[3-9]\d{8}$/ }, // Regex for Bangladeshi phone numbers
    description: { type: String, required: true },
});

const bookingSchema = new mongoose.Schema({
    name: { type: String, required: true },
    userPhone: { type: Number, required: true },
    queryPhone: { type: Number, required: true },
    userEmail: { type: String, required: true },
    userName: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    bedrooms: { type: Number, required: true },
    bathrooms: { type: Number, required: true },
    roomSize: { type: String, required: true },
    picture: { type: String, required: true },
    availabilityDate: { type: Date, required: true },
    rentPerMonth: { type: Number, required: true },
    phoneNumber: { type: String, required: true, match: /^01[3-9]\d{8}$/ }, // Regex for Bangladeshi phone numbers
    description: { type: String, required: true },
});



const User = mongoose.model('User', userSchema);
const House = mongoose.model('House', houseSchema);
const Booking = mongoose.model('Booking', bookingSchema);

// Registration route
app.post('/api/register', async (req, res) => {
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




app.post('/api/login', async (req, res) => {
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
        const token = jwt.sign({ _id: user._id, phoneNumber: user?.phoneNumber }, '918289128371302319', { expiresIn: '1h' });
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


// Define a new route to get a user by phone number
app.get('/api/getUserByPhoneNumber/:phoneNumber', async (req, res) => {
    try {
        const phoneNumber = req.params.phoneNumber;
        const user = await User.findOne({ phoneNumber });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/houses', async (req, res) => {
    try {
        const houseData = req.body;
        const newHouse = new House(houseData);
        await newHouse.save();
        res.status(201).json({ message: 'House added successfully' });
    } catch (err) {
        res.status(500).json({ error: err });
    }
});

app.get('/api/houses', async (req, res) => {
    try {
        const houses = await House.find().exec();
        res.json(houses);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});


app.get('/api/houses/:userPhone', async (req, res) => {
    try {
        const userPhone = req.params.userPhone;
        const houses = await House.find({ userPhone }).exec(); // Use .exec() to force execution as a promise
        res.json(houses);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});


app.delete('/api/houses/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const deletedHouse = await House.findByIdAndDelete(id);
        if (!deletedHouse) {
            return res.status(404).json({ message: 'House not found' });
        }
        res.json({ message: 'House deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Assuming you have already set up your required imports and app setup...

// Edit API for updating an existing house by MongoDB ObjectId (_id)
app.put('/api/house/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const updateData = req.body; // Assuming the updated data is sent in the request body

        const updatedHouse = await House.findByIdAndUpdate(id, updateData, { new: true }).exec();

        if (!updatedHouse) {
            return res.status(404).json({ message: 'House not found' });
        }

        res.json(updatedHouse);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});




app.post('/api/booking', async (req, res) => {
    try {
        const bookingData = req.body;
        const newBooking = new Booking(bookingData);
        await newBooking.save();
        res.status(201).json({ message: 'Booking added successfully' });
    } catch (err) {
        res.status(500).json({ error: err });
    }
});


app.get('/api/booking/:queryPhone', async (req, res) => {
    try {
        const queryPhone = req.params.queryPhone;
        const bookings = await Booking.find({ queryPhone }).exec(); // Use .exec() to force execution as a promise
        res.json(bookings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/api/booking/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const deletedBooking = await Booking.findByIdAndDelete(id);
        if (!deletedBooking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        res.json({ message: 'Booking deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});