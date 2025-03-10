require('dotenv').config();
require('express-async-errors');
//express
const cors = require("cors");
const express = require('express');
const app = express();
app.use(cors());

// rest of the packages
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

//database
const connectDB = require('./config/connectDB');

//routers
const authRouter = require('./routers/auth');
const postRouter = require('./routers/post');
const advertisementRouter = require('./routers/advertisement');
const headerMenuRouter = require('./routers/headerMenu');
const reviewRouter = require('./routers/review');
const supplementRouter = require('./routers/supplement');
const postCategoryRouter = require('./routers/postCategory');
const footerRouter = require('./routers/footerRoutes');

//midlleware
const notFoundMiddleware = require('./middleware/not-found')
const erorHandlerMiddleware = require('./middleware/eror-handler')

//app
app.use(morgan('tiny'));
app.use(express.json());
app.use(cookieParser(process.env.JWT_SECRET_KEY));


app.use(express.urlencoded({ extended: true }));

app.use('/v1/auth', authRouter);
app.use('/v1/post', postRouter);
app.use('/v1/ads', advertisementRouter);
app.use('/v1/menu', headerMenuRouter);
app.use('/v1/review', reviewRouter);
app.use('/v1/supplement', supplementRouter);
app.use('/v1/post-category', postCategoryRouter);
app.use('/v1/footer', footerRouter);

app.use(notFoundMiddleware);
app.use(erorHandlerMiddleware);

const port = process.env.PORT || 3040

const start = async () => {
    try {
        await connectDB(process.env.MONGO_URL)
        app.listen(port,
            console.log(`MongoDb Connection Successful,App started on port ${port} : ${process.env.NODE_ENV}`),
        );
    } catch (error) {
        console.log(error);
    }
};

start();