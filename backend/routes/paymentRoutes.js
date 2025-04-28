import express from "express";
import Payment from "../models/Payment.js";

const router = express.Router();

// Existing POST route (unchanged)
router.post("/", async (req, res) => {
  try {
    const payment = new Payment(req.body);
    await payment.save();
    res.status(201).json({ message: "Payment saved successfully", payment });
  } catch (error) {
    console.error("Error saving payment:", error);
    res.status(500).json({ message: "Failed to save payment", error: error.message });
  }
});

// New GET route to fetch all payments
router.get("/", async (req, res) => {
  try {
    const payments = await Payment.find();
    res.status(200).json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ message: "Failed to fetch payments", error: error.message });
  }
});

export default router;