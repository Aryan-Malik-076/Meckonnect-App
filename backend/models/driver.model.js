const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  carDetails: {
    numberPlate: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    carName: {
      type: String,
      required: true,
      trim: true
    },
    carModel: {
      type: String,
      required: true,
      trim: true
    }
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  licenseVerified: {
    type: Boolean,
    default: false
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Driver', driverSchema);