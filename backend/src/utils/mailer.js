const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'test@gmail.com',
        pass: process.env.EMAIL_PASS || 'password'
    }
});

const sendPassNotification = async (email, passDetails) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your Visitor Pass',
            text: `Your pass has been generated. Details: ${passDetails}`
        });
        console.log('Email notification sent successfully');
    } catch (error) {
        console.error('Email notification skipped or failed. Check .env credentials.');
    }
};

module.exports = sendPassNotification;