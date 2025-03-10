//Express app setup

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./src/config/db");
const authRoutes = require("./src/routes/authRoutes");
const mpesaRoutes = require("./src/routes/mpesaRoutes");

dotenv.config();
connectDB();
const app = express();

//Middleware
app.use(express.json());
app.use(cors());

//Default route
app.get("/", (req, res) => {
    res.send("Secure M-Pesa Authentication API Running...");
});

// ✅ Authentication Routes
app.use("/", authRoutes);

// M-Pesa Payment Routes
app.use("/api/mpesa", mpesaRoutes);

module.exports = app;