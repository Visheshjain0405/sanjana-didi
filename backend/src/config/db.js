const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGODB_URI ||
      'mongodb+srv://Vishesh6609:Vishesh6609@cluster0.bw0bufi.mongodb.net/didi_bhai_chat?retryWrites=true&w=majority&appName=Cluster0';

    const conn = await mongoose.connect(mongoURI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
  }
};

module.exports = connectDB;
