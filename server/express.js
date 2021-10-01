const express = require('express');
const app = express();

const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const compress = require('compression');
const cors = require('cors');
const helmet = require('helmet');
// const bodyParser = require('body-parser');

// const indexRouter = require('./routes/index.rtr');
const authRouter = require('./modules/auth/auth.rtr');
const userRouter = require('./modules/user/user.rtr');
const postRouter = require('./modules/post/post.rtr');
const communityRouter = require('./modules/community/community.rtr');
const wordRouter = require('./modules/keyword/keywords.rtr');

const swaggerUi = require("swagger-ui-express");
// const swaggerOptions = require('./docs');
const swaggerJsdoc = require('swagger-jsdoc');

// const swaggerOptions = ;

const CURRENT_WORKING_DIR = process.cwd()

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(compress())
app.use(helmet())
app.use(cors())
app.use(express.static(path.join(__dirname, 'public')))

// mount routes
app.use('/api/user', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/post', postRouter);
app.use('/api/community', communityRouter);
app.use('/api/keyword', wordRouter);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(require('./docs')));

app.use('*', (req, res) => {
  res.status(400).send({ status: 'returned by catch-all route' })
})

// Catch unauthorised errors
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({ "error": err.name + ": " + err.message })
  } else if (err) {
    res.status(400).json({ "error": err.name + ": " + err.message })
    console.log(err)
  }
})


module.exports = app;