const mongoose = require('mongoose');

const FinancialSchema = new mongoose.Schema({
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Assuming there's a User model
        required: true
    },
    income: {
        type: String,
        required: true
    },
    assets: {
        type: String,
        required: true
    },
    expenses: {
        type: String,
        required: true
    },  
    liabilities: {
        type: String,
        required: true
    }
}, { timestamps: true });

const Financial = mongoose.model('Financial', FinancialSchema);

module.exports = Financial;
