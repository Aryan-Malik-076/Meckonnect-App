const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'passenger', 'driver', 'verified-passenger', 'driver-status-1', 'driver-status-2', 'verified-driver', 'admin'],
        default: 'user'
    },
    verificationStatus: {
        type: String,
        enum: ['not-verified', 'email-verified', 'verified-driver'],
        default: 'not-verified'
    },
    rating: {
        type: Number,
        default: 0
    },
    money: {
        type: Number,
        default: 0
    },
    otp: String,
    otpExpiry: Date,
    forgetOtp: String,
    forgetOtpExpiry: Date
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
