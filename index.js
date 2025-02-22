const express = require('express');
const app = express();
const mongoose = require('mongoose');
const { connectDB } = require('./startup/database');


// mongoose.connect('mongodb://localhost:27017/Cluster0DB', { useNewUrlParser: true, useUnifiedTopology: true });
// const db = mongoose.connection;
// db.on('error', console.error.bind(console, 'connection error:'));
// db.once('open', function() {
//   console.log('Connected to MongoDB successfully.');
// });
async function startServer() {
  await connectDB(); // Ensures DB is connected before the server starts
  app.listen(3000, () => {
      console.log('Server is running on port 3000');
  });
}

startServer().catch(error => {
  console.error('Error starting the server:', error);
});