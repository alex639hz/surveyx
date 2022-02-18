var express = require('express');
var txCtrl = require('./tx.ctrl');
var authCtrl = require('../auth/auth.ctrl');
var userCtrl = require('../user/user.ctrl');
var commCtrl = require('../community/community.ctrl');

const router = express.Router()

// router.param('userId', userCtrl.userByID) //inject object into req.profile
// router.param('community', commCtrl.communityByTitle) //inject title string into req.community
// router.param('accountId', accountCtrl.accountByID) //inject title string into req.community
// const isMember = function (req, res, next) { commCtrl.isMember(req, res, next, req.body.account.community) }


router.route('/initialize')
  .post(
    // authCtrl.requireSignin,
    // authCtrl.injectUserProfile,
    // commCtrl.isMember,
    txCtrl.createInitial
  )
router.route('')
  .post(
    // authCtrl.requireSignin,
    // authCtrl.injectUserProfile,
    // commCtrl.isMember,
    txCtrl.create
  )


router.route('')
  .get(
    // authCtrl.requireSignin,
    // authCtrl.injectUserProfile,
    txCtrl.getBalance
  )

module.exports = router;
