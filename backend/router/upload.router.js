// File: routes/driverRoutes.js
const express = require('express');
const router = express.Router();
const driverDocumentsController = require('../controllers/upload.controller');

// Route for uploading driver documents
router.post(
  '/documents/upload',
  driverDocumentsController.handleFileUpload, // Middleware to handle file upload
  driverDocumentsController.uploadDocuments // Controller to process the upload
);

// Route to get driver documents
router.get(
  '/documents',
  async (req, res) => {
    try {
      const documents = await DriverDocuments.findMany();

      if (!documents) {
        return res.status(404).json({
          success: false,
          message: 'No documents found for this user'
        });
      }

      return res.status(200).json({
        success: true,
        data: documents
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error fetching documents',
        error: error.message
      });
    }
  }
);

module.exports = router;
