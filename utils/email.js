const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Sends a personalized, styled email to notify the user of a status update.
 * @param {string} to - Recipient email address
 * @param {string} reportId - Report ID
 * @param {string} newStatus - New status value
 * @param {string} [firstName] - Optional user's first name
 */
async function sendStatusUpdateEmail(to, reportId, newStatus, firstName = '') {
  const nameGreeting = firstName ? `Hi ${firstName},` : `Hello,`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="color: #4CAF50;">Report Status Update</h2>
      <p>${nameGreeting}</p>
      <p>We're writing to let you know that the status of your report <strong>(ID: ${reportId})</strong> has been updated.</p>
      <p><strong>New Status:</strong> <span style="color: #4CAF50;">${newStatus}</span></p>
      <p>Thank you for helping us improve our community!</p>
      <br>
      <p>– Team Prodigies</p>
    </div>
  `;

  const mailOptions = {
    from: `"Report Updates" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your Report Status Has Been Updated',
    html: htmlContent
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}:`, result.response);
  } catch (err) {
    console.error(`Error sending email to ${to}:`, err);
  }
}

module.exports = sendStatusUpdateEmail;
