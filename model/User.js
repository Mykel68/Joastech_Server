const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: Number, required: true },
  location: { type: String, required: true },
  image: { type: String, default: "" },
  verified: { type: Boolean, default: false },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
