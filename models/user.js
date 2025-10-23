const mongoose = require('mongoose');
const jwt = require('jsonwebtoken')
const config = require('config')

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    dob: { type: Date, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    address: { type: String, required: true },
    passwordMigrationStatus: { 
        type: String, 
        enum: ['pending', 'completed', 'failed'], 
        default: 'pending' 
    },
    migrationDate: { type: Date }
}, { timestamps: true });

// Email index is automatically created by unique: true constraint
// Explicit index not needed, but kept for documentation
// userSchema.index({ email: 1 });

const User = mongoose.model('User', userSchema);

const generateAuthToken = function(object){
    const jwtPrivateKey = process.env.finance_jwtPrivateKey || config.get('jwtPrivateKey');
    console.log("jwtPrivateKey", jwtPrivateKey)
    const token = jwt.sign({userId: object._id,email:object.email}, jwtPrivateKey);
    return token;
}

exports.User = User;
exports.generateAuthToken = generateAuthToken;