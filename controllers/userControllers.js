const userCollection = require('../models/userCollection.js');
const bcrypt = require('bcrypt');


const getLogin = (req, res) => {
    if (req.session.user) {
        res.redirect('/api/user/userDashboard')
    } else {
        res.render('userLogin');
    }
}

const getSignup = (req, res) => {
    res.render('userSignup');
}

const postLogin = async (req, res) => {
    try {
        req.session.user = await userCollection.findOne({ email: req.body.email});
        if (req.session.user) {
            const passwordMatch = await bcrypt.compare(req.body.password, req.session.user.password);
            if(passwordMatch){
               const {_id} =  req.session.user
                res.redirect(`/api/user/userDashboard/${_id}`)
            }else{
                res.render('userLogin', { alert: 'Incorrect password' })
            }
        } else {
            res.render('userLogin', { alert: 'User not found' })
        }
    } catch (err) {
        console.log(err);
    }
}

const postSignup = async (req, res) => {
    try {
        let imageFileName;
        if (req.file) {       // for storing image 
            imageFileName = req.file.filename
        }
        req.body.imageFileName = imageFileName;
        const existing = await userCollection.findOne({ email: req.body.email })
        if (existing) {
            res.render('userSignup', { alert: 'User with given email exists, choose a different one..!' })
        } else {
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            req.body.password = hashedPassword;
            delete req.body.reEnterPassword;
            const userData = await new userCollection(req.body).save();
            res.render('userLogin', { alert: 'Account created! Login to continue..!', className: 'success-label' })
        }
    }
    catch (err) {
        console.error(err);
    }
}

const getDashboard = async (req, res) => {
    if (req.session.user) {
        const userId = req.params.id;
        const user = await userCollection.findOne({_id: userId})
        res.render('userDashboard', { title: 'User Dashboard', user })
    } else {
        res.render('userLogin', { alert: 'Session expired Login to continue..!', className: 'success-label' })
    }
}

const getLogout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log('Error destroying session', err)
            res.status(500).send('Internal server error')
        } else {
            res.redirect('/')
        }
    })
}

const getEditProfile = async (req, res) => {
    if (req.session.user) {
        const userId = req.params.id;
        const user = await userCollection.findOne({ _id: userId })
        res.render('editProfile', { title: 'user dashboard', user })
    } else {
        res.render('userLogin', { alert: 'Session expired Login to continue..!', className: 'success-label' })
    }
}

const putEditProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        const updatedData = req.body;
        if (req.file) {
            updatedData.imageFileName = req.file.filename
        }
        const updatedUser = await userCollection.findByIdAndUpdate(userId, updatedData);
        // OR
        // const updatedUser = await userCollection.updateOne({_id:userId},{$set: updatedData})
        console.log(updatedUser);

        if (!updatedUser) {
            return res.status(404).json('User not found')
        }
        res.json(updatedUser);
    } catch (error) {
        console.log(error);
        res.status(500).json('Internal Server Error')
    }
}


module.exports = {

    getLogin,
    getSignup,
    postLogin,
    postSignup,
    getDashboard,
    getLogout,
    getEditProfile,
    putEditProfile
}