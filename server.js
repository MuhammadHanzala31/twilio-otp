require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const app = express();
 
app.use(cors());
app.use(express.json());
 
const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID, GHL_API_KEY, PORT } = process.env;
const twilio = require("twilio")(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
 
// Health check
cron.schedule("*/14 * * * *", () => {
  console.log("Har 14 minute baad ka kaam chalu...");
app.get("/", (req, res) => {
  res.json({ ok: true, message: "OTP server running" });
});
});
 
app.get("/", (req, res) => {
  res.json({ ok: true, message: "OTP server running" });
});
 
// Send OTP
app.post("/send-otp", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ ok: false, error: "Phone is required" });
 
    const verification = await twilio.verify.v2
      .services(TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({ to: phone, channel: "sms" });
 
    res.json({ ok: true, status: verification.status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});
 
// Verify OTP
app.post("/verify-otp", async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) return res.status(400).json({ ok: false, error: "Phone and code required" });
 
    const check = await twilio.verify.v2
      .services(TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({ to: phone, code });
 
    const success = check.status === "approved";
    res.json({ ok: success, status: check.status, token: success ? "verified" : null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});
 
// Submit form to GHL
app.post("/submit-form", async (req, res) => {
  try {
    const { state, mortgageBalance, monthlyPayment, beneficiary, medicalHistory, fullName, email, phone } = req.body;
    if (!state || !mortgageBalance || !monthlyPayment || !beneficiary || !medicalHistory || !fullName || !email || !phone) {
      return res.status(400).json({ ok: false, error: "All form fields are required" });
    }
 
    const nameParts = fullName.split(" ");
    const ghlData = {
      firstName: nameParts[0],
      lastName: nameParts.length > 1 ? nameParts.slice(1).join(" ") : "",
      email,
      phone,
      customFields: {
        state,
        mortgage_balance: mortgageBalance,
        monthly_payment: monthlyPayment,
        beneficiary,
        medical_history: medicalHistory
      }
    };
 
    const response = await axios.post(
      "https://rest.gohighlevel.com/v1/contacts/",
      ghlData,
      {
        headers: {
          Authorization: `Bearer ${GHL_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
 
    res.json({ ok: true, message: "Form submitted to GHL successfully", ghlResponse: response.data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message || "Failed to submit to GHL" });
  }
});
 
app.listen(PORT || 4000, () => {
  console.log(`Server on http://localhost:${PORT || 4000}`);
});
