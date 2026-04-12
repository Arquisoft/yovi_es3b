// mongo.js
import mongoose from 'mongoose'

export async function connectMongo() {
    const url = process.env.MONGO_URL || "mongodb://localhost:27017/yovi";
    await mongoose.connect(url);
    console.log("[users] Mongo connected:", url);
}