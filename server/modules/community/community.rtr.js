var express = require('express');
var userCtrl = require('../user/user.ctrl');
var authCtrl = require('../auth/auth.ctrl');
var commCtrl = require('../community/community.ctrl');

const router = express.Router()

router.param('userId', userCtrl.userByID)
router.param('community', commCtrl.communityByID) //inject title string into req.community

router.route('')
  .post(
    authCtrl.requireSignin,
    commCtrl.create)
  .get(
    authCtrl.requireSignin,
    commCtrl.list)

router.route('/:community')
  .get(
    authCtrl.requireSignin,
    commCtrl.read)

router.route('/member-request/:community')
  .patch(
    authCtrl.requireSignin,
    commCtrl.requestMembership)

router.route('/member-approve/:community')
  .patch(
    authCtrl.requireSignin,
    authCtrl.injectUserProfile,
    authCtrl.isModerator,
    commCtrl.approveMembership)

router.route('/member/request/:community')
  .patch(
    authCtrl.requireSignin,
    commCtrl.requestMembershipV2)

router.route('/member/approve/:community')
  .patch(
    authCtrl.requireSignin,
    authCtrl.injectUserProfile,
    authCtrl.isModerator,
    commCtrl.approveMembership)

module.exports = router;
