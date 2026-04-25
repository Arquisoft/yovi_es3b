import mongoose from 'mongoose'

const gameSchema = new mongoose.Schema({
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    winner:     { type: String, enum: ["player", "bot"], required: true },
    durationMs: { type: Number, required: true },
    turns:      { type: Number, required: true },
    difficulty: { type: String, enum: ["easy", "hard", "extreme", "impossible"], required: true },
    createdAt:  { type: Date, default: Date.now },
});

export default mongoose.model('Game', gameSchema)