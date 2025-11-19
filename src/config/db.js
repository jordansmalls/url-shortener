import mongoose from "mongoose";

/**
 * @description establishes a connection to mongoDB using the URI provided in the environment variable
 * @returns {Promise<void>} A promise that resolves when the connection is successful
 * @throws {Error} logs a connection error message and terminates the node process if the connection fails
 */

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`Mongoose Error: ${err.message}`);
    process.exit(1);
  }
};

export default connectDB;
