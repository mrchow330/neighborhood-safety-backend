const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendStatusUpdateEmail(to, reportId, newStatus) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'Update on Your Report',
    text: `Your report (ID: ${reportId}) status has been updated to: ${newStatus}.`
  };

  await transporter.sendMail(mailOptions);
}

module.exports = sendStatusUpdateEmail;
