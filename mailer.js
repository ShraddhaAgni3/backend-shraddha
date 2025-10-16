import nodemailer from "nodemailer";

// transporter setup (Gmail example)
export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // your email address
    pass: process.env.EMAIL_PASS, // app password (not your real password)
  },
});
