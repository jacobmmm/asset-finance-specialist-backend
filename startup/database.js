const mongoose = require('mongoose');

// Disable mongoose buffering globally for better timeout handling
mongoose.set('bufferCommands', false);

//const mongoURI = "mongodb+srv://jacobMammen:karkaKaka%2345@cluster0.uexj2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; // Replace with your actual MongoDB URI
const mongoURI = "mongodb+srv://jacobMammen:karkaKaka%2345@cluster0.uexj2.mongodb.net/test?retryWrites=true&w=majority"; 

async function connectDB() {
    try {
        await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 120000, // 30 seconds
            connectTimeoutMS: 120000, // 30 seconds
            serverApi: { version: '1' },
            tls: true,
            //socketTimeoutMS: 45000, // 45 seconds
            maxPoolSize: 10, // Maintain up to 10 socket connections
            minPoolSize: 5, // Maintain a minimum of 5 socket connections
            maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
        });
        
        console.log('Connected to MongoDB successfully.');
        
        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });
        
        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected');
        });
        
        return true;
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error.message);
        throw error;
    }
}

// Function to check if connection is ready
function isDBConnected() {
    return mongoose.connection.readyState === 1;
}

module.exports = { connectDB, isDBConnected };

