const express = require('express');
const bcrypt = require('bcrypt');
const { User, Driver } = require('../models');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

const router = express.Router();

router.get('/myprofile/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      verificationStatus: user.verificationStatus,
      money: user.money,

    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

router.post('/role', async (req, res) => {
  const { role, email } = req.body;
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update the user's role based on the role received
    if (role === 'verified-passenger') {
      user.role = 'verified-passenger';
    } else if (role === 'driver-status-1') {
      user.role = 'driver-status-1';
    } else {
      return res.status(400).json({ message: 'Invalid role' });
    }

    await user.save();

    res.status(200).json({ message: 'Account created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

router.post('/driver/signup', async (req, res) => {
  const {
    username,
    email,
    password,
    numberPlate,
    carName,
    carModel,
    licenseNumber
  } = req.body;

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(202).send({ message: '202' });

    // Check if number plate or license is already registered
    const driverExists = await Driver.findOne({
      $or: [
        { 'carDetails.numberPlate': numberPlate },
        { licenseNumber: licenseNumber }
      ]
    });
    if (driverExists) {
      return res.status(400).json({
        message: 'Vehicle number plate or license number already registered'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(10000 + Math.random() * 90000).toString();

    // Create new user with driver role
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: 'driver', // Initial driver status
      otp,
      verificationStatus: 'not-verified',
      otpExpiry: Date.now() + 600000, // Expires in 10 minutes
    });

    const savedUser = await newUser.save();

    // Create driver profile
    const newDriver = new Driver({
      userId: savedUser._id,
      carDetails: {
        numberPlate,
        carName,
        carModel
      },
      licenseNumber
    });

    await newDriver.save();

    // Send verification email
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: 'Driver Registration - Email Verification OTP',
      text: `Your OTP for driver registration is ${otp}. This code will expire in 10 minutes.`,
    };
    await transporter.sendMail(mailOptions);
    res.status(201).json({ message: 'Driver account created. OTP sent to email.' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error', error });
  }
});

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ success: false, message: 'User not found' });
    }

    // Generate OTP and set expiry (10 minutes)
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000;
    try {
      user.forgetOtp = otp;
      user.forgetOtpExpiry = otpExpiry;
      await user.save();
    } catch (error) {
      console.log(error)
    }


    // Send OTP via email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your Password Reset OTP',
      text: `Your OTP code is ${otp}. It will expire in 10 minutes.`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ success: false, message: 'Failed to send email' });
      }
      res.json({ success: true, message: 'OTP sent successfully' });
    });
  } catch (error) {
    console.log('Error during forgot password:', error); // Add detailed logging
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ success: false, message: 'User not found' });
    }

    if (user.forgetOtp !== otp) {
      return res.status(200).json({ success: false, message: 'Invalid OTP' });
    }

    if (Date.now() > user.forgetOtpExpiry) {
      return res.status(200).json({ success: false, message: 'OTP expired' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.forgetOtp = null;  // Clear OTP
    user.forgetOtpExpiry = null;
    await user.save();

    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// Verify OTP route
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ success: false, message: 'User not found' });
    }
    if (user.verificationStatus === 'email-verified') {
      return res.status(300).json({ success: false, message: 'User already verified' });
    }

    if (user.otp !== otp) {
      return res.status(300).json({ success: false, message: 'Invalid OTP' });
    }

    if (Date.now() > user.otpExpiry) {
      return res.status(300).json({ success: false, message: 'OTP has expired' });
    }

    user.verificationStatus = 'email-verified';
    if (user.role === 'passenger') {
      user.role = 'verified-passenger'
    } else if (user.role === 'driver') {
      console.log('Driver role', user)
      user.role = 'driver-status-1'
    }
    await user.save();

    const token = generateToken(user._id);

    res.json({ success: true, message: 'OTP verified', token, user });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});
router.post('/resend-otp', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ success: false, message: 'User not found' });
    }

    // Generate a new OTP and expiration time
    const newOtp = Math.floor(10000 + Math.random() * 90000).toString();
    const otpExpiry = Date.now() + 600000; // 2 minutes from now

    user.otp = newOtp;
    user.otpExpiry = otpExpiry;
    await user.save();

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP for Email Verification',
      text: `Your OTP is ${newOtp}. It will expire in 2 minutes.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending email:', error); // Add detailed logging
        return res.status(500).json({ success: false, message: 'Failed to send OTP email' });
      }
      res.json({ success: true, message: 'OTP sent successfully', otp: newOtp });
    });
  } catch (error) {
    console.log('Error during OTP resend:', error); // Add detailed logging
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(202).send({ message: '202' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(10000 + Math.random() * 90000).toString();

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      otp,
      verificationStatus: 'not-verified',
      otpExpiry: Date.now() + 600000, // Expires in 1 hour
      role: 'passenger',
    });

    await newUser.save();

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: 'Email Verification OTP',
      text: `Your OTP is ${otp}`,
    };

    await transporter.sendMail(mailOptions);
    res.status(201).json({ message: 'User created. OTP sent to email.' });
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Server error', error });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check verification status and redirect accordingly
    if (user.verificationStatus !== 'email-verified') {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.otp = otp;
      user.otpExpiry = Date.now() + 3600000;
      await user.save();

      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Email Verification OTP',
        text: `Your OTP is ${otp}`,
      };

      await transporter.sendMail(mailOptions);
      return res.status(401).json({
        message: 'Please verify your email first. OTP has been sent.',
      });
    }


    // Create JWT token after successful login
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        verificationStatus: user.verificationStatus,
        role: user.role, // Assuming the user model has a role field
      },
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Server error', error });
  }
});

router.post('/submit-form', async (req, res) => {
  const { userId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user role to driver-status-2
    user.role = 'driver-status-2';
    await user.save();

    res.status(200).json({ message: 'User role updated to driver-status-2' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

module.exports = router;
