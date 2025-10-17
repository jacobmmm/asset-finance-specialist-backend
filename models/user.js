const mongoose = require('mongoose');
const jwt = require('jsonwebtoken')
const config = require('config')

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    dob: { type: Date, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    address: { type: String, required: true },
}, { timestamps: true });

// In models/user.js, add this after the schema definition:
userSchema.index({ email: 1 });

const User = mongoose.model('User', userSchema);

const generateAuthToken = function(object){
    const jwtPrivateKey = process.env.finance_jwtPrivateKey || config.get('jwtPrivateKey');
    console.log("jwtPrivateKey", jwtPrivateKey)
    const token = jwt.sign({userId: object._id,email:object.email}, jwtPrivateKey);
    return token;
}

exports.User = User;
exports.generateAuthToken = generateAuthToken;