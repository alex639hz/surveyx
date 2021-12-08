var express = require('express');
// var surveyCtrl = require('./user.ctrl');
var surveyCtrl = require('./survey.ctrl');
var authCtrl = require('../auth/auth.ctrl');

const router = express.Router()

router.param('surveyId', surveyCtrl.surveyByID)

router.use(authCtrl.requireSignin);

0 && router.use((req, res, next) => {
  console.log(req.url);
  next();
});


router.route('').post(surveyCtrl.create)
// router.route('/feed').get(surveyCtrl.list)
router.route('/:surveyId')
  .post(surveyCtrl.answer)
  .get(surveyCtrl.read)
// router.route('/:surveyId').put(surveyCtrl.update)
// router.route('/:surveyId').delete(surveyCtrl.remove)

module.exports = router;


/**
 * survey module:
 * 
 * 1) create survey in db POST /api/survey
 *  
 * 2) get survey from db  GET /api/survey/surveyId
 * 
 * 3) answer survey POST /api/survey/surveyId
 * 
 */