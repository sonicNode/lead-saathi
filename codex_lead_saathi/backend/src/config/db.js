const mongoose = require("mongoose");
const env = require("./env");

let connectionMode = "memory";

async function connectToDatabase() {
  if (!env.mongodbUri) {
    console.warn("MONGODB_URI is not set. Falling back to in-memory storage.");
    connectionMode = "memory";
    return { connected: false, mode: connectionMode };
  }

  try {
    await mongoose.connect(env.mongodbUri, {
      serverSelectionTimeoutMS: 5000
    });
    connectionMode = "mongodb";
    console.info("Connected to MongoDB Atlas.");
    return { connected: true, mode: connectionMode };
  } catch (error) {
    console.warn("MongoDB connection failed. Falling back to in-memory storage.");
    console.warn(error.message);
    connectionMode = "memory";
    return { connected: false, mode: connectionMode };
  }
}

function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

function getConnectionMode() {
  return isDatabaseConnected() ? "mongodb" : connectionMode;
}

module.exports = {
  connectToDatabase,
  getConnectionMode,
  isDatabaseConnected
};

