var express = require('express');
// var surveyCtrl = require('./user.ctrl');
var inviteCtrl = require('./invitation.ctrl');
var authCtrl = require('../auth/auth.ctrl');

const router = express.Router()

router.param('surveyId', inviteCtrl.surveyByID)
router.param('questionId', inviteCtrl.questionByID)

router.use(authCtrl.requireSignin);

0 && router.use((req, res, next) => {
  console.log(req.url);
  next();
});


router.route('')
  .post(inviteCtrl.create)

router.route('/:surveyId')
  .post(inviteCtrl.answer)
  .get(inviteCtrl.read)

module.exports = router;
