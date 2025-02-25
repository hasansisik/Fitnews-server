require('dotenv').config();
require('express-async-errors');
const cors = require("cors");
const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const connectDB = require('../config/connectDB');

const authRouter = require('../routers/auth');
const postRouter = require('../routers/post');
const advertisementRouter = require('../routers/advertisement');
const headerMenuRouter = require('../routers/headerMenu');
const reviewRouter = require('../routers/review');

const notFoundMiddleware = require('../middleware/not-found');
const erorHandlerMiddleware = require('../middleware/eror-handler');

const app = express();

// Middleware
app.use(cors());
app.use(morgan('tiny'));
app.use(express.json());
app.use(cookieParser(process.env.JWT_SECRET_KEY));
app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB(process.env.MONGO_URL);

// Routes
app.use('/v1/auth', authRouter);
app.use('/v1/post', postRouter);
app.use('/v1/ads', advertisementRouter);
app.use('/v1/menu', headerMenuRouter);
app.use('/v1/review', reviewRouter);

// Error handling
app.use(notFoundMiddleware);
app.use(erorHandlerMiddleware);

module.exports = app;
