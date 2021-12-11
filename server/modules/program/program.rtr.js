var express = require('express');
// var surveyCtrl = require('./user.ctrl');
// var surveyCtrl = require('./survey.ctrl');
var authCtrl = require('../auth/auth.ctrl');
var programCtrl = require('./program.ctrl');

const router = express.Router()

// router.param('surveyId', surveyCtrl.surveyByID)
router.param('programId', programCtrl.programByID)

router.use(authCtrl.requireSignin);

router.route('')
  .post(programCtrl.create)

router.route('/:programId')
  .get(programCtrl.read)

module.exports = router;
