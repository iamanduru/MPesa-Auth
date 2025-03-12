//Manages access control
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const config = require("../config/env");

//user registration
const register = async (req, res) => {
    try {
        const { name, email, password } =req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hashedPassword });

        res.status(201).json({ message: "User registration successfully", user });

    } catch (error) {
        res.status(500).json({ error: "Registration failed!", details: error.message });
    }
};

//User log in
const login = async (req, res) => {
    try {
        const { email, password } =req.body;
        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign({ id: user._id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
        res.json({ message: "Login successful", token });
    } catch (error) {
        res.status(500).json({ error: "Login failed", details: error.message });
    }
};

module.exports = { register, login };