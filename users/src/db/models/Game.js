const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema({
    username:   { type: String, required: true },
    winner:     { type: String, enum: ["player", "bot"], required: true },
    durationMs: { type: Number, required: true },
    turns:      { type: Number, required: true },
    difficulty: { type: String, enum: ["easy", "hard"], required: true },
    createdAt:  { type: Date, default: Date.now },
});

module.exports = mongoose.model("Game", gameSchema);