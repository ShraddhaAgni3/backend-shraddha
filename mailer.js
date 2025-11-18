//import nodemailer from "nodemailer";

// // transporter setup (Gmail example)
// export const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER, // your email address
//     pass: process.env.EMAIL_PASS, // app password (not your real password)
//   },
// });


import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.EMAIL_USER, // Gmail (full email)
    pass: process.env.EMAIL_PASS, // Gmail App Password (16-character)
  },
});
