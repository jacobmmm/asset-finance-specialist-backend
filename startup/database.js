const mongoose = require('mongoose');

//const mongoURI = "mongodb+srv://jacobMammen:karkaKaka%2345@cluster0.uexj2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; // Replace with your actual MongoDB URI
const mongoURI = "mongodb+srv://jacobMammen:karkaKaka%2345@cluster0.uexj2.mongodb.net/test?retryWrites=true&w=majority"; 
async function connectDB() {
    try {
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB successfully.');
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error.message);
    }
}

module.exports = { connectDB };
