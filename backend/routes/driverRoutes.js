import express from "express";
const router = express.Router();

// ✅ Sample drivers located in Attock
const drivers = [
  { id: 1, name: "Ali Khan", description: "Experienced driver", location: { lat: 33.7700, lng: 72.3600 }, cost: 500 },
  { id: 2, name: "Hassan Raza", description: "Safe driver", location: { lat: 33.7650, lng: 72.3550 }, cost: 450 },
  { id: 3, name: "Sara Ahmed", description: "Reliable service", location: { lat: 33.7800, lng: 72.3700 }, cost: 480 }
];

// ✅ API to get drivers
router.get("/", (req, res) => {
  res.json(drivers);
});

export default router;
