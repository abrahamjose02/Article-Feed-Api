
const User = require("../model/userModal");
const { createActivationToken, generateAccessToken, generateRefreshToken, verifyActivationToken } = require("../utils/tokenUtils");
const bcrypt = require("bcryptjs");
const  sendEmail  = require("../utils/emailService");

exports.registerUser = async (req, res) => {
  const { firstName, lastName, phone, email, dob, password, preferences } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(404).json({ success: false, message: "User already exists" });
      return;
    }

    const { token, activationCode } = createActivationToken({ firstName, lastName, phone, email, dob, password, preferences });

    await sendEmail(email, 'Activate your account', `Your activation code is: ${activationCode}`);

    res.status(201).json({
      success: true,
      message: 'Activation code sent to your email. Please verify to complete registration.',
      token,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.activateUser = async (req, res) => {
  const { token, activationCode } = req.body;

  try {
    const verified = verifyActivationToken(token);

    if (!verified || verified.activationCode !== activationCode) {
      res.status(400).json({ success: false, message: "Invalid Activation Code" });
      return;
    }

    const existingUser = await User.findOne({ email: verified.user.email });
    if (existingUser) {
      res.status(400).json({ success: false, message: "User already exists" });
      return;
    }

    const hashPassword = await bcrypt.hash(verified.user.password, 10);
    const newUser = new User({
      ...verified.user,
      password: hashPassword,
    });

    await newUser.save();

    res.status(201).json({ success: true, message: "User Registered Successfully", user: newUser });
  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const userId = user._id.toString();
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      maxAge: 15 * 60 * 1000,
      sameSite: 'none',
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      maxAge: 5 * 24 * 60 * 60 * 1000,
      sameSite: 'none',
    });

    res.status(200).json({ message: 'Login successful', user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateUser = async (req, res) => {
  const { firstName, lastName, phone, dob, preferences, password } = req.body;
  const userId = req.user?.id;

  try {
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.phone = phone || user.phone;
    user.dob = dob || user.dob;
    user.preferences = preferences || user.preferences;

    await user.save();

    res.status(200).json({ success: true, message: 'User updated successfully', user });
  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.status(200).json({ message: 'Logged out successfully' });
};

exports.getUserProfile = async (req, res) => {
  const userId = req.user?.id;

  try {
    const user = await User.findById(userId).select('-password');

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.status(200).json({ success: true, user });
  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


exports.refreshToken = async (req, res) => {
    const { refreshToken } = req.cookies;

    console.log("RefreshToken",refreshToken)

    console.log("Refresh Token called")
  
    if (!refreshToken) {
      res.status(401).json({ message: 'No refresh token' });
      return;
    }
  
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      console.log(decoded)

      console.log("Decode id",decoded.id)

      if (!decoded.id) {
         res.status(401).json({ message: 'Invalid refresh token' });
         return
      }

      
      const accessToken = generateAccessToken(decoded.id);
  
      res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 15 * 60 * 1000 });
  
       res.status(200).json({ message: 'Access token refreshed successfully' });
       return;
    } catch (error) {
      console.error(error);
      res.status(403).json({ message: 'Invalid refresh token' });
    }
  };