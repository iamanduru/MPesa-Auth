//User schema
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
    {
        phoneNumber: { type: String, required: true, unique: true},
        email: { type: String, unique: true, sparse: true},
        password: { type: String, required: true},
    },
    { timestamps: true}
);

//Hash Password before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

module.exports = mongoose.model("User", userSchema);