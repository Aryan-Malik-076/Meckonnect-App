// D:\Projects\Code\MecKoonect Web\She-Cab\She-Cab\backend\models\Payment.js
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  driverId: { type: Number, required: true },
  rideDetails: {
    pickupLocation: String,
    dropoffLocation: String,
    distance: String,
    duration: String,
    baseAmount: Number,
    tax: Number,
    totalAmount: Number,
  },
  cardNumber: { type: String, required: true },
  cardholderName: { type: String, required: true },
  expiryDate: { type: String, required: true },
  cvv: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Payment", paymentSchema);