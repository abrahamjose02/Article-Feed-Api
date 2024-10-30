const express = require('express');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const articleRouter = require('./src/route/articleRoutes');
const authRouter = require('./src/route/authRoutes');
const connectDB = require('./src/config/db');
const cors = require('cors');

dotenv.config();

const app = express();


connectDB();

app.use(express.json());

app.use(cors({
    origin: "https://article-feed-frontend.vercel.app",
    credentials: true
}));

app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/articles', articleRouter);

const port = process.env.PORT || 10000;

app.listen(port, () => {
    console.log(`Server running on PORT: ${port}`);
});
