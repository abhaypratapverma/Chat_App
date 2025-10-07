// import {TryCatch} from "../config/TryCatch.js";
// import { Request, Response } from "express";
// // import UserService from "../services/user.js";
// import { redisClient } from "../index.ts";
// import { publishToQueue } from "../config/rabbitmq.js";

// export const loginUser = TryCatch(async (req: Request, res: Response) => {
//   const { email } = req.body;

//   const rateLimitKey = `otp:ratelimit:${email}`;
//   const rateLimit = await redisClient.get(rateLimitKey);

//   if (rateLimit && parseInt(rateLimit) >= 5) {
//     return res.status(429).json({ message: "Too many requests. Please try again later." });
//   }

//   const otp = Math.floor(100000 + Math.random() * 900000).toString();
//   const otpKey = `otp:${email}`;

//   await redisClient.set(otpKey, otp, 'EX', 300); // OTP valid for 5 minutes
//   await redisClient.set(rateLimitKey, "true", 'EX', 60); // Rate limit for 1 minute

//   const message = {
//     to: email,
//     subject: "Your OTP Code",
//     body: `Your OTP code is ${otp}. It is valid for 5 minutes.`
//   };

//   await publishToQueue("send-otp", JSON.stringify(message));

//   // ✅ moved inside the function
//   res.status(200).json({ message: "OTP sent to email." });
// });
import TryCatch from "../config/TryCatch.js";
import type { Request, Response } from "express";
// import UserService from "../services/user.js";
import {User} from "../model/User.js";
import { redisClient } from "../index.js";
import { publishToQueue } from "../config/rabbitmq.js";
import {generateToken} from "../config/generateToken.js";

export const loginUser = TryCatch(async (req: Request, res: Response) => {
  const { email } = req.body;

  const rateLimitKey = `otp:ratelimit:${email}`;
  const otpKey = `otp:${email}`;

  const limit = 5; // max OTPs allowed
  const ttl = 60; // 1 minute window

  // get current count
  let currentCount = await redisClient.get(rateLimitKey);
  const count = currentCount ? parseInt(currentCount) : 0;

  if (count >= limit) {
    console.log(`🚫 Rate limited for ${email} - count: ${count}`);
    return res
      .status(429)
      .json({ message: "Too many requests. Please try again later." });
  }

  // Increment count (or create if not exists)
  if (count === 0) {
    // Create key with expiry if new
    await redisClient.set(rateLimitKey, 1, { EX: ttl });
  } else {
    await redisClient.incr(rateLimitKey);
  }

  // Log value for debug
  const after = await redisClient.get(rateLimitKey);
  console.log(`🔢 New rate count for ${email}: ${after}`);

  // Generate and store OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await redisClient.set(otpKey, otp, { EX: 300 });

  const message = {
    to: email,
    subject: "Your OTP Code",
    body: `Your OTP code is ${otp}. It is valid for 5 minutes.`,
  };

  await publishToQueue("send-otp", JSON.stringify(message));

  res.status(200).json({ message: "OTP sent to email." });
});

export const verifyUser = TryCatch(async (req: Request, res: Response) => {
  const { email, otp: enteredOtp } = req.body;

  if (!email || !enteredOtp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  const otpKey = `otp:${email}`;
  const storedOtp = await redisClient.get(otpKey);

  // ❌ OTP invalid or expired
  if (!storedOtp || storedOtp !== enteredOtp) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  // ✅ OTP is valid
  await redisClient.del(otpKey);

  let user = await User.findOne({ email });
  if (!user) {
    const name = email.split("@")[0];
    user = await User.create({ name, email });
  }

  const token = generateToken(user);

  return res.status(200).json({
    message: "OTP verified successfully",
    token,
    user,
  });
});
