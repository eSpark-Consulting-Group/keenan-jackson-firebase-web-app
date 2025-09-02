require("dotenv").config(); // instead of require("dotenv/config")
const sgMail = require("@sendgrid/mail");
const { logger } = require("firebase-functions");

sgMail.setApiKey("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");

const sendMail = async ({ to, subject, html }) => {
    const msg = {
        to,
        from: "admin@squaretrivia.com",
        subject,
        html,
        // text: html.replace(/<[^>]+>/g, ""),
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
