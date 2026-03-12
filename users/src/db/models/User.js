const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    firebaseUid:  { type: String, required: true, unique: true },
    username:     { type: String, required: true, unique: true },
    gamesPlayed:  { type: Number, default: 0 },
    gamesWon:     { type: Number, default: 0 },
    gamesLost:    { type: Number, default: 0 },
    createdAt:    { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);