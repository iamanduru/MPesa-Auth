//IP and device restrictions
const jwt = require("jsonwebtoken");
const config = require("../config/env");

const authenticationUser = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        req.user = decoded;
        next();
      } catch (error) {
        res.status(401).json({ error: "Invalid token" });
      }
    };
    
module.exports = { authenticateUser };