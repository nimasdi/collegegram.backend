import nodemailer from 'nodemailer';

// Define the transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587,                 
  secure: false,            
  auth: {
    user: process.env.SMTP_USER, 
    pass: process.env.SMTP_PASS, 
  },
});

// Define the email sending function
export const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
  try {
    const mailOptions = {
      from: '"Collegram" <copeperteams@gmail.com>', 
      to: to,                                      
      subject: subject,                           
      text: text,                                
      html: html,                                  
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Message sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`Error sending email: ${error}`);
    throw error;
  }
};
