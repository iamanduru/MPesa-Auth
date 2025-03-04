//Handles authentication
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();

//Generate JWT Token
const generateToken = (user) => {
    return jwt.sign({ id: user._id, phoneNumber: user.phoneNumber }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

// ✅ User Signup
exports.signup = async (req, res) => {
    try {
      const { phoneNumber, email, password } = req.body;
  
      // Check if user already exists
      const existingUser = await User.findOne({ phoneNumber });
      if (existingUser) return res.status(400).json({ message: "Phone number already registered" });
  
      // Create new user
      const newUser = new User({ phoneNumber, email, password });
      await newUser.save();
  
      // Generate JWT
      const token = generateToken(newUser);
  
      res.status(201).json({ message: "User registered successfully", token });
    } catch (error) {
      res.status(500).json({ message: "Error signing up", error: error.message });
    }
  };

  // ✅ User Login

exports.login = async (req, res) => {
    try {
        const { phoneNumber, password } = req.body;

        //Find User by phone number
        const user = await User.findOne({ phoneNumber });
        if (!user) return res.status(400).json({ message: "User not found!" });

        //Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid Password!" });

        //Generate JWT token
        const token = generateToken(user);

        res.status(200).json({message: "Login Successful", token });
    } catch (error) {
        res.status(500).json({ message: "Error logging in", error: error.message });
    }
};