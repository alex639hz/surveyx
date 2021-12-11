var express = require('express');
// var surveyCtrl = require('./user.ctrl');
var surveyCtrl = require('./survey.ctrl');
var authCtrl = require('../auth/auth.ctrl');

const router = express.Router()

router.param('surveyId', surveyCtrl.surveyByID)
router.param('questionId', surveyCtrl.questionByID)

router.use(authCtrl.requireSignin);

0 && router.use((req, res, next) => {
  console.log(req.url);
  next();
});


router.route('')
  .post(surveyCtrl.create)

router.route('/:surveyId')
  .post(surveyCtrl.answer)
  .get(surveyCtrl.read)

module.exports = router;
