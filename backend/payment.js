const express = require('express');
const Stripe = require('stripe');
const cors = require('cors');
require('dotenv').config();

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // Accessing the Stripe secret key from environment variables

app.use(cors());
app.use(express.json());

// Endpoint to create a Payment Intent
app.post('/create-payment-intent', async (req, res) => {
  const { amount } = req.body;

  try {
    // Convert the fare to cents (Stripe requires amounts in cents)
    const amountInCents = Math.round(amount * 100); // Round to avoid decimal issues

    // Create a Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents, // Amount in cents
      currency: 'usd', // Currency
    });

    // Send the client secret to the frontend
    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Error creating Payment Intent:", error);
    res.status(400).send({ error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Payment server running on http://localhost:${PORT}`);
});