const User = require("../model/User");
const PasswordResetOTP = require("../model/PasswordResetOTP");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const OTP = require("../model/OTP");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const otpGenerator = require("otp-generator");

const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, location, confirm_password } =
      req.body;
    if (
      !name ||
      !email ||
      !password ||
      !confirm_password ||
      !phone ||
      !location
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered" });
    }
    if (password !== confirm_password) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      location,
    });
    await newUser.save();

    const otp = await new OTP({
      userId: newUser._id,
      OTP: crypto.randomBytes(32).toString("hex"),
    }).save();

    // console.log("OTP:", otp); // Log the OTP object to check if it's generated correctly

    const url = `${process.env.CLIENT_URL}/users/${newUser._id}/verify/${otp.OTP}`;

    await sendEmail(
      newUser.email,
      "Verify your email",
      `Hello ${newUser.name},\n\nThank you for signing up with Joastech. To complete your registration and verify your email address, please click the link below:\n\n${url}\n\nIf you did not request this verification, you can safely ignore this email.\n\nThank you,\nJoastech Team`
    );

    res.status(201).json({ message: "An email sent to your email" });
  } catch (error) {
    next(error);
  }
};
const confirmEmail = async (req, res, next) => {
  try {
    console.log("Request parameters:", req.params); // Print request parameters
    const { id, otp } = req.params;
    console.log("User ID:", id); // Print user ID
    console.log("OTP:", otp); // Print OTP

    const user = await User.findById(id);
    console.log("User:", user); // Print user object
    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: "User not found" });
    }

    const token = await OTP.findOne({
      userId: user._id,
      otp: otp,
    });
    console.log("Token:", token); // Print token object

    if (!token) {
      console.log("Invalid token");
      return res.status(400).json({ message: "Invalid token" });
    }

    await User.updateOne({ _id: user._id }, { verified: true });
    console.log("User updated successfully");

    await token.remove();
    console.log("Token removed successfully");

    res.status(200).json({ message: "Email verified successfully" });
  } catch (err) {
    console.error("Error:", err); // Print any error that occurs
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if the user with the provided email exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if the password is correct
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Incorrect Password" });
    }

    if (!user.verified) {
      let OTP = await OTP.findOne({ userId: user._id });
      if (!OTP) {
        OTP = await new OTP({
          userId: user._id,
          token: crypto.randomBytes(32).toString("hex"),
        }).save();
        const url = `${process.env.CLIENT_URL}/users/${user._id}/verify/${OTP.token}`;
        await sendEmail(user.email, "Verify your email", url);
      }
      return res.status(401).json({ message: "Please verify your email" });
    }

    // Generate JWT token with userType included in payload
    const tokenPayload = {
      userType: user.userType,
      section: user.section,
      id: user._id,
    };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });

    res.json({ token });
  } catch (error) {
    next(error);
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const sendPasswordResetOTP = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Generate OTP
    const otp = otpGenerator.generate(6, {
      upperCase: false,
      specialChars: false,
      alphabets: false,
    });

    // Save OTP to database
    await PasswordResetOTP.create({ email, otp });

    // Send OTP to user via email
    await sendEmail(
      user.email,
      "Password Reset OTP",
      `Your OTP for password reset is: ${otp}`
    );

    res.status(200).json({ message: "OTP sent successfully." });
  } catch (error) {
    console.error("Error generating OTP and sending email:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

const verifyPasswordResetOTP = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const otpRecord = await PasswordResetOTP.findOneAndDelete({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid OTP." });
    }

    // Clear the OTP from the database once it's been used
    // The OTP record is already deleted above

    // Set the new password
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = {
  register,
  confirmEmail,
  login,
  sendPasswordResetOTP,
  verifyPasswordResetOTP,
};
