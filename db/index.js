const mongoose = require("mongoose");
const DB_NAME = require("../constants");

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(`\n MongoDB connected! ${connectionInstance.connection.host}`);
  } catch (err) {
    console.log("MongoDB connection error", err);
    process.exit(1);
  }
};

module.exports = connectDB;
