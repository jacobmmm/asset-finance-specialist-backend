
const express = require('express')

const userRoutes = require('../appRoutes/userRoutes')


const setupRoutes = (app) => {
    app.use(express.json());
    app.use('/', userRoutes);
};

// Export the function as a variable
module.exports = setupRoutes;