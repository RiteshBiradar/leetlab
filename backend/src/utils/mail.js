import nodemailer from 'nodemailer';
import Mailgen from 'mailgen';
import { ApiError } from "./ApiError.js";

const sendMail = async (options) => {
    const mailGenerator = new Mailgen({
        theme: 'default',
        product: {
            name: 'Leet Lab',
            link: 'https://mailgen.js/',
        },
    });

    const emailHtml = mailGenerator.generate(options.mailGenContent);
    const emailText = mailGenerator.generatePlaintext(options.mailGenContent);

    const transporter = nodemailer.createTransport({
        host: process.env.MAILTRAP_SMTP_HOST,
        port: process.env.MAILTRAP_SMTP_PORT,
        secure: false,
        auth: {
            user: process.env.MAILTRAP_SMTP_USER,
            pass: process.env.MAILTRAP_SMTP_PASS,
        },
    });

    const mail = {
        from: 'mail@leetlab.com',
        to: options.email,
        subject: options.subject,
        text: emailText,
        html: emailHtml,
    };

    try {
        await transporter.sendMail(mail);
    } catch (error) {
        throw new ApiError(500,"Error in nodeemailer")
    }
};

const emailVerificationMailContent = (username, verificationUrl) => {
    return {
        body: {
            name: username,
            intro: "Welcome to Leet Lab! We're very excited to have you on board.",
            action: {
                instructions: 'To get started with Leet Lab, please click here:',
                button: {
                    color: '#22BC66',
                    text: 'Confirm your account',
                    link: verificationUrl,
                },
            },
            outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.',
        },
    };
};

const forgotPasswordMailContent = (username, passwordResetUrl) => {
    return {
        body: {
            name: username,
            intro: 'We have received a request to change your account password.',
            action: {
                instructions: 'To change account password, please click here:',
                button: {
                    color: '#FF0000',
                    text: 'Reset password',
                    link: passwordResetUrl,
                },
            },
            outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.',
        },
    };
};

export { sendMail, emailVerificationMailContent, forgotPasswordMailContent };
