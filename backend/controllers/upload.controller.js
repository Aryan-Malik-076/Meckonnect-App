const mongoose = require('mongoose');
const DriverDocuments = require('../models/document.model');
const User = require('../models/user.model');
const { s3, BUCKET_NAME } = require('../lib/aws');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Configure multer for temporary storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

// Helper function to upload file to S3
const uploadToS3 = async (file) => {
  const fileStream = fs.createReadStream(file.path);

  const params = {
    Bucket: BUCKET_NAME,
    Key: `driver-documents/${uuidv4()}-${path.basename(file.filename)}`,
    Body: fileStream,
    ContentType: file.mimetype,
  };

  try {
    const uploadResult = await s3.upload(params).promise();
    fs.unlinkSync(file.path); // Delete the temporary file
    return uploadResult.Location;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
};

exports.uploadDocuments = async (req, res) => {
  try {
    const userId = req.user; // Get userId from auth middleware
    console.log('Request body:', req.body); // Debug log
    console.log('Request files:', req.files); // Debug log
    console.log('userId from req.user:', userId); // Debug log

    // Validate userId
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user_id format',
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if files are present
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded',
      });
    }

    // Extract files
    const {
      vehicleReg,
      drivingLicenseFront,
      drivingLicenseBack,
      idCardFront,
      idCardBack,
    } = req.files;

    // Upload each file to S3
    const vehicleRegUrl = vehicleReg ? await uploadToS3(vehicleReg[0]) : null;
    const drivingLicenseFrontUrl = drivingLicenseFront ? await uploadToS3(drivingLicenseFront[0]) : null;
    const drivingLicenseBackUrl = drivingLicenseBack ? await uploadToS3(drivingLicenseBack[0]) : null;
    const idCardFrontUrl = idCardFront ? await uploadToS3(idCardFront[0]) : null;
    const idCardBackUrl = idCardBack ? await uploadToS3(idCardBack[0]) : null;

    // Find or create driver documents
    let driverDocs = await DriverDocuments.findOne({ userId });

    if (driverDocs) {
      // Update existing document
      driverDocs.vehicleReg.url = vehicleRegUrl || driverDocs.vehicleReg.url;
      driverDocs.drivingLicenseFront.url = drivingLicenseFrontUrl || driverDocs.drivingLicenseFront.url;
      driverDocs.drivingLicenseBack.url = drivingLicenseBackUrl || driverDocs.drivingLicenseBack.url;
      driverDocs.idCardFront.url = idCardFrontUrl || driverDocs.idCardFront.url;
      driverDocs.idCardBack.url = idCardBackUrl || driverDocs.idCardBack.url;
      driverDocs.updatedAt = Date.now();
      driverDocs.overallStatus = 'pending'; // Update status
    } else {
      // Create new document
      driverDocs = new DriverDocuments({
        userId,
        vehicleReg: { url: vehicleRegUrl },
        drivingLicenseFront: { url: drivingLicenseFrontUrl },
        drivingLicenseBack: { url: drivingLicenseBackUrl },
        idCardFront: { url: idCardFrontUrl },
        idCardBack: { url: idCardBackUrl },
        overallStatus: 'pending',
      });
    }

    await driverDocs.save();

    // Update user role to driver-status-2
    await User.findByIdAndUpdate(userId, {
      role: 'driver-status-2',
    });

    return res.status(200).json({
      success: true,
      message: 'Documents uploaded successfully',
      data: driverDocs,
    });
  } catch (error) {
    console.error('Error in document upload:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user_id format',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Error uploading documents',
      error: error.message,
    });
  }
};

// Helper middleware for handling file uploads
exports.handleFileUpload = (req, res, next) => {
  upload.fields([
    { name: 'vehicleReg', maxCount: 1 },
    { name: 'drivingLicenseFront', maxCount: 1 },
    { name: 'drivingLicenseBack', maxCount: 1 },
    { name: 'idCardFront', maxCount: 1 },
    { name: 'idCardBack', maxCount: 1 },
  ])(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: 'File upload error',
        error: err.message,
      });
    } else if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server error during file upload',
        error: err.message,
      });
    }
    next();
  });
};