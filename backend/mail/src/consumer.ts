import amqp from 'amqplib';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';


dotenv.config();

export const startSendOtpConsumer = async () => {
  try {
    const connection = await amqp.connect({
      protocol: 'amqp',
      hostname: process.env.Rabbitmq_Host,
      port: 5672,
      username: process.env.Rabbitmq_Username || 'guest',
      password: process.env.Rabbitmq_Password || 'guest',
    });
    const channel = await connection.createChannel();
    const queueName = 'send-otp';

    await channel.assertQueue(queueName, { durable: true });
    console.log("✅ Mail Service consumer started, listening for OTP emails");

    channel.consume(queueName, async (msg) => {
      if (msg) {
        const { to, subject, body } = JSON.parse(msg.content.toString());

        // Create a transporter
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_Host || 'smtp.gmail.com',
          port: Number(process.env.SMTP_Port) || 465,
          secure: true, // true for 465, false for other ports
          auth: {
            user: process.env.SMTP_Username,
            pass: process.env.SMTP_Password,
          },
        });

        // Send mail
        const info = await transporter.sendMail({
          from: process.env.FROM_EMAIL,
          to,
          subject,
          text: body,
        });

        console.log('📩 Message sent: %s', info.messageId);
        channel.ack(msg);
      }
    });
  } catch (error) {
    console.error('❌ Failed to Send OTP', error);
    process.exit(1);
  }
};


// async function testMail() {
//   const transporter = nodemailer.createTransport({
//     host: "smtp.gmail.com",
//     port: 465,
//     secure: true,
//     auth: {
//       user: "abhaypratapverma6969@gmail.com",
//       pass: "ubntgwcyiuhncafc",
//     },
//   });

//   try {
//     await transporter.verify();
//     console.log("✅ SMTP connection successful!");
//   } catch (err) {
//     console.error("❌ SMTP connection failed:", err);
//   }
// }

// testMail();

