// scripts/initialize-migration-fields.js
const mongoose = require('mongoose');
const { User } = require('../models/user');

const mongoURI = "mongodb+srv://jacobMammen:karkaKaka%2345@cluster0.uexj2.mongodb.net/test?retryWrites=true&w=majority";

async function initializeMigrationFields() {
    try {
        // Connect to MongoDB (separate process from running server)
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 120000,
            connectTimeoutMS: 120000,
            serverApi: { version: '1' },
            tls: true,
            maxPoolSize: 10,
            minPoolSize: 5,
            maxIdleTimeMS: 30000,
        });
        
        console.log('Connected to MongoDB successfully.');
        console.log('Initializing migration fields for existing users...');
        
        // Update all users that don't have the migration status field
        const result = await User.updateMany(
            { passwordMigrationStatus: { $exists: false } },
            { 
                $set: { 
                    passwordMigrationStatus: 'pending',
                    migrationDate: null
                } 
            }
        );
        
        console.log(`Updated ${result.modifiedCount} users with migration fields`);
        
    } catch (error) {
        console.error('Error initializing migration fields:', error);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB connection closed.');
    }
}

initializeMigrationFields();