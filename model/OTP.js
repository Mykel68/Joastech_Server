const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const OTPSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "user", // Ensure the reference to the User model is correct
    unique: true,
  },
  OTP: { type: String, required: true },
  createdAt: { type: Date, required: true, default: Date.now(), expires: 3600 }, // 1 hour in seconds
});

const OTP = mongoose.model("OTP", OTPSchema);

module.exports = OTP;
