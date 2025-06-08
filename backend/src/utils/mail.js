import nodemailer from 'nodemailer';
import Mailgen from 'mailgen';

const sendMail = async ({ email, subject, mailGenContent }) => {
    const mailGenerator = new Mailgen({
        theme: 'default',
        product: {
            name: 'Chai Aur DSA',
            link: 'https://www.chaiaurdsa.xyz/',
        },
    });

    const emailHtml = mailGenerator.generate(mailGenContent);
    const emailText = mailGenerator.generatePlaintext(mailGenContent);

    const transporter = nodemailer.createTransport({
        host: "smtp.sendgrid.net",
        port: 587, 
        secure: false,
        auth: {
            user: "apikey",
            pass: process.env.SENDGRID_API,
        },
});

    const mail = {
        from: 'chaiaurdsa@gmail.com',
        to: email,
        subject,
        text: emailText,
        html: emailHtml,
    };

    await transporter.sendMail(mail);
};

const emailVerificationMailContent = (username, verificationUrl) => ({
    body: {
        name: username,
        intro: "Welcome to Leet Lab! We're excited to have you.",
        action: {
            instructions: 'Click the button below to verify your email:',
            button: {
                color: '#22BC66',
                text: 'Verify Email',
                link: verificationUrl,
            },
        },
        outro: 'Need help? Just reply to this email.',
    },
});

export { sendMail, emailVerificationMailContent };
