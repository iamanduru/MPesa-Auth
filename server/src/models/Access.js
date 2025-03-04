//Access control schema
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const accessSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        transaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction", required: true },
        accessLink: { type: String, default: uuidv4, unique: true },
        expiresAt: { type: Date, required: true },
        deviceInfo: { type: String },
    },
    {
        timestamps: true
    }
);

//Automatically set expiration time(24 hour)
accessSchema.pre("save", function (next){
    if (!this.expiresAt) {
        this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
    next();
});

module.exports = mongoose.model("Access", accessSchema);