const express = require('express');
const app = express();
const mongoose = require('mongoose');
const { connectDB, isDBConnected } = require('./startup/database');
const  setupRoutes  = require('./startup/routes');
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:3000', // Allow only frontend
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Set up routes first
setupRoutes(app);

// mongoose.connect('mongodb://localhost:27017/Cluster0DB', { useNewUrlParser: true, useUnifiedTopology: true });
// const db = mongoose.connection;
// db.on('error', console.error.bind(console, 'connection error:'));
// db.once('open', function() {
//   console.log('Connected to MongoDB successfully.');
// });

async function startServer() {
  try {
    console.log('Attempting to connect to database...');
    await connectDB(); // Ensures DB is connected before the server starts
    
    // Verify connection is ready
    if (!isDBConnected()) {
      throw new Error('Database connection not ready');
    }
    
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server is running on port ${port}....`);
      console.log('Database connection status: Connected');
    });
    
  } catch (error) {
    console.error('Error starting the server:', error);
    console.error('Please check your MongoDB connection string and network connectivity');
    process.exit(1); // Exit if we can't connect to database
  }
}

startServer();