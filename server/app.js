//Express app setup

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./src/config/db");

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

module.exports = app;