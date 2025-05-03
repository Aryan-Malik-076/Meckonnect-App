const mongoose = require('mongoose');


const DriverDocumentsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  vehicleReg: {
    url: { type: String, default: null },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    updatedAt: { type: Date, default: Date.now }
  },
  drivingLicenseFront: {
    url: { type: String, default: null },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    updatedAt: { type: Date, default: Date.now }
  },
  drivingLicenseBack: {
    url: { type: String, default: null },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    updatedAt: { type: Date, default: Date.now }
  },
  idCardFront: {
    url: { type: String, default: null },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    updatedAt: { type: Date, default: Date.now }
  },
  idCardBack: {
    url: { type: String, default: null },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    updatedAt: { type: Date, default: Date.now }
  },
  overallStatus: {
    type: String,
    enum: ['incomplete', 'pending', 'approved', 'rejected'],
    default: 'incomplete'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('DriverDocuments', DriverDocumentsSchema);