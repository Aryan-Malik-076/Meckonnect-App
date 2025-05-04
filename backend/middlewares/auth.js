const express = require('express');
const router = express.Router();
const driverDocumentsController = require('../controllers/upload.controller');
const authMiddleware = require('../middleware/auth'); // Add this

// Route for uploading driver documents
router.post(
  '/documents/upload',
  authMiddleware, // Add authentication middleware
  driverDocumentsController.handleFileUpload,
  driverDocumentsController.uploadDocuments
);

// Route to get driver documents
router.get('/documents', async (req, res) => {
  try {
    const documents = await DriverDocuments.find(); // Fixed: findMany -> find

    if (!documents || documents.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No documents found',
      });
    }

    return res.status(200).json({
      success: true,
      data: documents,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching documents',
      error: error.message,
    });
  }
});

module.exports = router;