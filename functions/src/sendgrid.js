require("dotenv/config");
const sgMail = require("@sendgrid/mail");
const functions = require("firebase-functions");
const { logger } = require("firebase-functions");


sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendMail = async ({ to, subject, html }) => {
    const msg = {
        to,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject,
        html,
        text: html.replace(/<[^>]+>/g, ""),
    };

    try {
        const [resp] = await sgMail.send(msg);
        console.log("Email sent ✅", resp.statusCode);
        logger.info("Email sent ✅", { statusCode: resp.statusCode, to, subject });
        return { ok: true, status: resp.statusCode };
    } catch (err) {
        console.error("SendGrid error ❌", err.response?.body || err.message);
        logger.error("SendGrid error ❌", { error: err.response?.body || err.message, to, subject });
        return { ok: false, error: err.response?.body || err.message };
    }
};

module.exports = { sendMail };
