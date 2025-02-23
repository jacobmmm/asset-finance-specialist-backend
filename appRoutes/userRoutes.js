const express = require('express')
const router = express.Router();
const bcrypt = require('bcrypt');
const moment = require('moment');
// const _ = require('lodash');

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
const {connectDB} = require('../startup/database')

let reqCounter=0;

router.use((req, res, next)=>{
  console.log("User router called")
  next()
})

router.post('/register', async(req,res) => {

    console.log("Body of register", req.body)
    
    const salt = await bcrypt.genSalt(18);
    const password = await bcrypt.hash(req.body.password, salt);
    const name = req.body.firstName + " " + req.body.lastName;
    const email = req.body.email;
    const dob = moment(req.body.DOB, "DD-MM-YYYY").toDate();
    console.log("state: ", req.body.state);
    if(req.body.address2){
        address = req.body.address1 + ",\t" + req.body.address2+ ",\t" + req.body.suburb + ",\t" + req.body.state + ",\t" + req.body.postcode;
    }
    else{
        address = req.body.address1 + ", " + req.body.suburb + ", " + req.body.state + ", " + req.body.postcode;
    }
    const newUser = new User({ name, email, dob, address, password });

    

        // Check if the email is already registered
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

       try {
        
        await newUser.save();

        //res.status(201).json({ message: "User created successfully", user: newUser });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }

    const userObj = await User.findOne({ email:newUser.email });
    console.log("User objectid after insertion", userObj._id);





   

    

       const token = generateAuthToken(userObj)

       res.status(201).json({'token':token})

}
)

router.get('/login', async(req,res) => {

    const rUser = await User.findOne({email:req.body.email})

    if(!rUser)return res.status(400).send('Invalid email')

    const validPassword = await bcrypt.compare(req.body.password, rUser.password)
    if(!validPassword) return res.status(400).send('Invalid  password')

    const token = generateAuthToken(rUser)

    res.status(200).json({'message':'Login successful'})
    
    
    //res.header('x-auth-token', token).send(_.pick(rUser,['regId','phoneNumber']))

})

router.post('/addFinanceApplication', async(req,res) => { 

    const user = await User.findOne({email:req.body.email})
    if(!user) return res.status(400).send('email not found')
    const userid = user._id;
    console.log("Extracted User id: ", userid);

    const newFinancial = new Financial({userid, income:req.body.income, assets:req.body.assets, liabilities:req.body.liabilities})
    console.log("New Financial object: ", newFinancial);

    try {
        
        await newFinancial.save();

        
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }

    res.status(201).json({ message: "Financial application created successfully", });




 })

router.get('/getFinanceApplication', async(req,res) => {

    const user = await User.findOne({email:req.body.email})
    if(!user) return res.status(400).send('email not found')
    const userid = user._id;
    try{
        const financials = await Financial.find({ userid: userid });
        console.log("Financials for ",req.body.email,": " ,financials);
        res.status(200).json({ financials });
    }catch(error){
        res.status(500).json({ message: "Server error", error: error.message });
    }
    } )

router.delete('/deleteFinanceApplication', async(req,res) => {

    const user = await User.findOne({email:req.body.email})
    if(!user) return res.status(400).send('email not found')
    const userid = user._id;
    try{
    const financial = await Financial.findOne({userid:userid,income:req.body.income,assets:req.body.assets,liabilities:req.body.liabilities})
    const financialId = financial._id;
    console.log("Financial object to be deleted: ", financial);
    try{
        const deletedFinancial = await Financial.findByIdAndDelete(financialId);
        if (!deletedFinancial) {
            return res.status(404).json({ message: "Financial record not found." });
        }

        res.status(200).json({ message: "Financial record deleted successfully.", data: deletedFinancial });
    }catch(error){
        console.log("Error in deleting financial application: ", error)
        res.status(500).json({ message: "Server error", error: error.message });
    }

}catch(error){
    console.log("Error in finding financial application: ", error)
}})

router.put('/updateFinanceApplication', async(req,res) => {

    const user = await User.findOne({email:req.body.email})
    if(!user) return res.status(400).send('email not found')
    const userid = user._id;

        try{
            const financial = await Financial.findOne({userid:userid,income:req.body.income,assets:req.body.assets,liabilities:req.body.liabilities})
        
        }catch(error){
            console.log("Error in finding financial application: ", error)
        }    







    } )

module.exports = router;