import mongoose from "mongoose";

const dbConnect = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB connected successfully on ${connection.connection.host}`);

  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};


// Function to disconnect from the database
const dbDisconnect = async () => {
  try {
    await mongoose.disconnect();
    console.log("MongoDB disconnected successfully.");
  } catch (error) {
    console.error(`Error during MongoDB disconnection: ${error.message}`);
  }
};

export { dbConnect, dbDisconnect };
