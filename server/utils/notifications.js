const nodemailer = require('nodemailer');
const qrcode = require('qrcode');

/**
 * For initial development, we'll log emails instead of sending real ones,
 * to avoid needing SMTP credentials. You can later supply EMAIL_USER and EMAIL_PASSWORD.
 */
let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });
}

exports.sendBookingEmail = async (studentEmail, type, bookingDetails) => {
    const { date, startTime, machineNumber, hostel } = bookingDetails;

    const subject = type === 'created'
        ? '✅ Laundry Slot Confirmed'
        : '❌ Laundry Slot Cancelled';

    const text = type === 'created'
        ? `Your booking is confirmed for Machine ${machineNumber} (${hostel}) on ${date} at ${startTime}. Please arrive on time and scan the QR code to check in.`
        : `Your booking for Machine ${machineNumber} (${hostel}) on ${date} at ${startTime} has been cancelled.`;

    if (transporter) {
        try {
            await transporter.sendMail({
                from: `"Laundry Admin" <${process.env.EMAIL_USER}>`,
                to: studentEmail,
                subject,
                text,
            });
            console.log(`✉️ Email sent to ${studentEmail}`);
        } catch (err) {
            console.error(`❌ Failed to send email to ${studentEmail}:`, err.message);
        }
    } else {
        console.log(`\n[MOCK EMAIL to ${studentEmail}]\nSubject: ${subject}\nBody: ${text}\n`);
    }
};

exports.generateCheckInQR = async (bookingId) => {
    try {
        const data = JSON.stringify({ action: 'checkin', bookingId });
        // Returns a base64 encoded png
        return await qrcode.toDataURL(data);
    } catch (err) {
        console.error('Failed to generate QR code', err);
        return null;
    }
};
