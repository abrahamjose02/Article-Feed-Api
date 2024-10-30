const jwt = require('jsonwebtoken');
require('dotenv').config();

const createActivationToken = (user) => {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const token = jwt.sign(
        { user, activationCode },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );
    return { token, activationCode };
};

const verifyActivationToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        console.error("Invalid activation token:", error);
        return null;
    }
};

const generateAccessToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '5d' });
};

module.exports = {
    createActivationToken,
    verifyActivationToken,
    generateAccessToken,
    generateRefreshToken
};
