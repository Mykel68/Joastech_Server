const express = require("express");
const router = express.Router();
const authControllers = require("../controllers/authControllers");

router.post("/register", authControllers.register);

// route for frontend to confrim otp
// router.get("/users/:id/verify/:OTP", authControllers.confirmOTP);

// const url = `${process.env.CLIENT_URL}/users/${newUser._id}/verify/${otp.token}`;

router.get("/:id/verify/:token", authControllers.confirmEmail);

router.post("/login", authControllers.login);
router.post("/password-reset/send-otp", authControllers.sendPasswordResetOTP);
router.post(
  "/password-reset/verify-otp",
  authControllers.verifyPasswordResetOTP
);

module.exports = router;
