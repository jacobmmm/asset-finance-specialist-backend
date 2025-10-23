const express = require('express')
const router = express.Router();
const bcrypt = require('bcrypt');
const moment = require('moment');
const _ = require('lodash');

const {User ,generateAuthToken} = require('../models/user')
const Financial = require('../models/financial')
// const { Collection } = require('../models/collection')
// const { Movie } = require('../models/movie')
// const { MovieCollection } = require('../models/movieCollection')
// const { Op, Sequelize } = require('sequelize');
// const auth  = require('../middleware/auth')
// const { putMovie } = require('../utilFunctions/setMovies')
// const { putMovieCollection } = require('../utilFunctions/setMovieCollection')
// const { extractAndInsertMovies } = require('../utilFunctions/extractMovies')
// const { v4: uuidv4 } = require('uuid');
const {connectDB, isDBConnected} = require('../startup/database')
const mongoose = require('mongoose');

let reqCounter=0;

// Middleware to check database connection
router.use((req, res, next) => {
    console.log("User router called");
    
    // Check if database is connected
    // if (!isDBConnected()) {
    //     console.error('Database not connected. Connection state:', mongoose.connection.readyState);
    //     return res.status(503).json({ 
    //         message: "Database connection not available", 
    //         connectionState: mongoose.connection.readyState 
    //     });
    // }
    
    next();
});

router.post('/register', async(req,res) => {
    try {
        console.log("Body of register", req.body)
        
        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash(req.body.password, salt);
        const name = req.body.firstName + " " + req.body.lastName;
        const email = req.body.email;
        const dob = moment(req.body.DOB, "DD-MM-YYYY").toDate();
        const age = moment().diff(moment(dob), 'years');
        console.log("Age: ", age);
        console.log("state: ", req.body.state);
        if(req.body.address2){
            address = req.body.address1 + ",\t" + req.body.address2+ ",\t" + req.body.suburb + ",\t" + req.body.state + ",\t" + req.body.postcode;
        }
        else{
            address = req.body.address1 + ", " + req.body.suburb + ", " + req.body.state + ", " + req.body.postcode;
        }
        const newUser = new User({ name, email, dob, address, password });

        // Check if the email is already registered
        const existingUser = await User.findOne({ email }).maxTimeMS(5000);
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        try {
            await newUser.save();
        } catch (error) {
            console.error("Error saving new user:", error);
            return res.status(500).json({ message: "Server error during user creation", error: error.message });
        }

        const userObj = await User.findOne({ email:newUser.email }).maxTimeMS(5000);
        console.log("User objectid after insertion", userObj._id);

        const token = generateAuthToken(userObj)
        res.status(201).json({'token':token})

    } catch (error) {
        console.error("Database operation error in register:", error);
        if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
            return res.status(503).json({ message: "Database connection timeout. Please try again." });
        }
        res.status(500).json({ message: "Server error", error: error.message });
    }
})

// router.get('/login', async(req,res) => {

//     const { email, password } = req.query;

//     console.log("Email: ", email);
//     console.log("Password   : ", password);

//     const rUser = await User.findOne({email:email})

//     if(!rUser)return res.status(400).send('Invalid email')

    

//     //const validPassword = await bcrypt.compare(req.body.password, rUser.password)
//     const validPassword = await bcrypt.compare(password, rUser.password)
//     if(!validPassword) return res.status(400).send('Invalid  password')

//     const token = generateAuthToken(rUser)

//     res.status(200).json({'message':'Login successful'})
    
    
//     //res.header('x-auth-token', token).send(_.pick(rUser,['regId','phoneNumber']))

// })

router.post('/login', async(req,res) => {
    try {
        // Validate request body
        if (!req.body.email || !req.body.password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const rUser = await User.findOne({email:req.body.email}).maxTimeMS(5000)

        if(!rUser)return res.status(400).send('Invalid email')

        const validPassword = await bcrypt.compare(req.body.password, rUser.password)
       
        if(!validPassword) return res.status(400).send('Invalid password')

        // Check if user needs password migration
        if (rUser.passwordMigrationStatus === 'pending') {
            try {
                // Rehash password with new salt rounds
                const newSalt = await bcrypt.genSalt(10);
                const newHashedPassword = await bcrypt.hash(req.body.password, newSalt);
                
                // Update user with new password hash
                await User.findByIdAndUpdate(rUser._id, {
                    password: newHashedPassword,
                    passwordMigrationStatus: 'completed',
                    migrationDate: new Date()
                });
                
                console.log(`Password migrated for user: ${rUser.email}`);
            } catch (migrationError) {
                console.error("Error during password migration:", migrationError);
                // Continue with login even if migration fails
                // Migration will retry on next login
            }
        }

        const token = generateAuthToken(rUser)

        res.status(200).json({'message':'Login successful', 'token': token})
        
    } catch (error) {
        console.error("Database operation error in login:", error);
        if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
            return res.status(503).json({ message: "Database connection timeout. Please try again." });
        }
        res.status(500).json({ message: "Server error", error: error.message });
    }
})

router.get('/getUser', async(req,res) => {
    try {
        const user = await User.findOne({email:req.query.userEmail}).maxTimeMS(5000)  
        if(!user) return res.status(400).send('email not found') 

        const userData = _.pick(user, [ 'name', 'email', 'address','dob']);
        res.status(200).json({ userData });
        
    } catch (error) {
        console.error("Database operation error in getUser:", error);
        if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
            return res.status(503).json({ message: "Database connection timeout. Please try again." });
        }
        res.status(500).json({ message: "Server error", error: error.message });
    }
})

router.post('/addFinanceApplication', async(req,res) => { 

    const user = await User.findOne({email:req.body.email}).maxTimeMS(5000)
    if(!user) return res.status(400).send('email not found')
    const userid = user._id;
    console.log("Extracted User id: ", userid);

    const newFinancial = new Financial({userid, income:req.body.income, assets:req.body.assets, expenses:req.body.expenses, liabilities:req.body.liabilities})
    console.log("New Financial object: ", newFinancial);

    try {
        
        await newFinancial.save();
        res.status(201).json({ message: "Financial application created successfully", });

        
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }

    




 })

router.get('/getFinanceApplication', async(req,res) => {

    //const user = await User.findOne({email:req.body.email})
    console.log("request query: ", req.query);
    const user = await User.findOne({email:req.query.userEmail}).maxTimeMS(5000)
    console.log("User object in get finance: ", user);
    if(!user) return res.status(400).send('email not found')
    const userid = user._id;
    try{
        const financials = await Financial.find({ userid: userid });
        console.log("Financials for ",req.query.email,": " ,financials);
        res.status(200).json({ financials });
    }catch(error){
        res.status(500).json({ message: "Server error", error: error.message });
    }
    } )

// router.delete('/deleteFinanceApplication', async(req,res) => {

//     const user = await User.findOne({email:req.body.email})
//     if(!user) return res.status(400).send('email not found')
//     const userid = user._id;
//     try{
//     const financial = await Financial.findOne({userid:userid,income:req.body.income,assets:req.body.assets,liabilities:req.body.liabilities})
//     const financialId = financial._id;
//     console.log("Financial object to be deleted: ", financial);
//     try{
//         const deletedFinancial = await Financial.findByIdAndDelete(financialId);
//         if (!deletedFinancial) {
//             return res.status(404).json({ message: "Financial record not found." });
//         }

//         res.status(200).json({ message: "Financial record deleted successfully.", data: deletedFinancial });
//     }catch(error){
//         console.log("Error in deleting financial application: ", error)
//         res.status(500).json({ message: "Server error", error: error.message });
//     }

// }catch(error){
//     console.log("Error in finding financial application: ", error)
// }})

router.delete('/deleteFinanceApplication', async (req, res) => {
    try {
      const { email, records } = req.body;

      console.log("Email: ", email);
  
      // Find the user by email
      const user = await User.findOne({ email: email }).maxTimeMS(5000);
      if (!user) {
        return res.status(400).json({ message: 'Email not found' });
      }
      const userId = user._id;
  
      // Validate that `records` is an array
      if (!Array.isArray(records) || records.length === 0) {
        return res.status(400).json({ message: 'No records to delete' });
      }
  
      // Build an $or array of conditions
      // Each element in the array matches one record to be deleted
      const conditions = records.map(r => ({
        userid: userId,
        income: r.income,
        assets: r.assets,
        liabilities: r.liabilities,
        expenses: r.expenses
      }));

      console.log("Conditions: ", conditions);
  
      // Delete all matching records in one go
      const deletedResult = await Financial.deleteMany({ $or: conditions });
  
      if (deletedResult.deletedCount === 0) {
        return res.status(404).json({ message: 'No matching financial records found to delete.' });
      }
  
      res.status(200).json({
        message: 'Financial records deleted successfully.',
        data: deletedResult
      });
    } catch (error) {
      console.error('Error in deleting financial applications:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });
  

// router.put('/updateFinanceApplication', async(req,res) => {

//     const user = await User.findOne({email:req.body.email})
//     if(!user) return res.status(400).send('email not found')
//     const userid = user._id;
//     const attributes = req.body.attributes;
//     const values = req.body.values;
//     const attrLength = attributes.length;

//         try{
//             const financial = await Financial.findOne({userid:userid,income:req.body.income,assets:req.body.assets,liabilities:req.body.liabilities})

//             for(let i=0;i<attrLength;i++){
//                 financial[attributes[i]] = values[i];
//             }

//             console.log("Financial object to be updated: ", financial);
//             try{
//                 const updatedFinancial = await financial.save();
//                 if (!updatedFinancial) {
//                     return res.status(404).json({ message: "Financial record not found." });
//                 }
        
//                 res.status(200).json({ message: "Financial record updated successfully.", data: updatedFinancial });
//             }catch(error){
//                 console.log("Error in updating financial application: ", error)
//                 res.status(500).json({ message: "Server error", error: error.message });
//             }
        
//         }catch(error){
//             console.log("Error in finding financial application: ", error)
//         }    







//     } )

router.put('/updateFinanceApplication', async (req, res) => {
    try {
      const { email, records } = req.body;
      const user = await User.findOne({ email }).maxTimeMS(5000);
      if (!user) return res.status(400).send('email not found');
      const userid = user._id;
  
      // Validate that the records array exists and is non-empty.
      if (!Array.isArray(records) || records.length === 0) {
        return res.status(400).json({ message: 'No records provided for update.' });
      }
  
      // Build an array of bulk operations.
      const bulkOps = records.map(record => {
        // Destructure the identifying fields and update instructions from each record.
        const { income, assets, liabilities, expenses, attributes, values } = record;
  
        // Validate that attributes and values arrays exist and match in length.
        if (!attributes || !values || attributes.length !== values.length) {
          throw new Error('Attributes and values arrays must be provided and have the same length.');
        }
  
        // Build the update object from the provided attributes.
        let updateObj = {};
        for (let i = 0; i < attributes.length; i++) {
          updateObj[attributes[i]] = values[i];
        }
  
        return {
          updateOne: {
            // Include expenses along with income, assets, and liabilities in the filter.
            filter: { userid, income, assets, liabilities, expenses },
            update: { $set: updateObj }
          }
        };
      });
  
      // Execute the bulk update operation.
      const result = await Financial.bulkWrite(bulkOps);
  
      res.status(200).json({
        message: 'Financial records updated successfully.',
        data: result
      });
    } catch (error) {
      console.error('Error in updating financial applications:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });
  

module.exports = router;