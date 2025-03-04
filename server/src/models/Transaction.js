//Payment transaction schema
const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        mpesaRecieptNumber: { type: String, unique: true, required: true },
        amount: { type: Number, required: true},
        status: { type: String, enum: ["pending", "success", "failed"], default: "pending" },
        transactionDate: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);