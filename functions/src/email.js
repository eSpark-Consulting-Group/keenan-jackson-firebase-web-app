require("dotenv").config(); // instead of require("dotenv/config")
const functions = require("firebase-functions");
const sgMail = require("@sendgrid/mail");

// Load API key from Firebase env config
sgMail.setApiKey(process.env.SENDGRID_API_KEY || "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");

exports.sendContactEmail = functions.https.onCall(async (data, context) => {
  const { name, email, message } = data;

  if (!name || !email || !message) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Name, email, and message are required"
    );
  }

  const msg = {
    to: "your-email@example.com", // 📩 where you want to receive the form data
    from: process.env.SENDGRID_FROM_EMAIL || "admin@squaretrivia.com", // ✅ must be verified in SendGrid
    subject: `New contact form submission from ${name}`,
    html: `
      <h2>New Contact Submission</h2>
      <p><b>Name:</b> ${name}</p>
      <p><b>Email:</b> ${email}</p>
      <p><b>Message:</b></p>
      <p>${message}</p>
    `,
  };

  try {
    await sgMail.send(msg);
    return { success: true };
  } catch (error) {
    console.error("SendGrid error:", error.response?.body || error.message);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to send email"
    );
  }
});
