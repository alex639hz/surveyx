const request = require('request');
const extend = require('lodash/extend');
const config = require('../../config/config');
const {
  Community,
  MemberCollection
} = require('./community.model');
const errorHandler = require('../../helpers/dbErrorHandler');
const { User } = require('../user/user.model');


/** inject survey document into req.survey
 * 
 */
const communityByID = async (req, res, next, id) => {
  try {
    let community = await Community.findById(id).lean()
    if (!community)
      return res.status('400').json({
        error: "question not found"
      })
    req.community = { ...community }
    next()
    return community
  } catch (err) {
    return res.status('400').json({
      error: "Could not retrieve question"
    })
  }
}

/** inject community document into req.community
 * 
 */
const communityByTitle = async (req, res, next, title) => {
  try {
    req.community = await Community.findOne({ title }, 'title')
    if (!req.community)
      return res.status('400').json({
        error: "Community not found"
      })
    next()
  } catch (err) {
    return res.status('400').json({
      error: "Could not retrieve community",
      catch: err
    })
  }
}

const isMember = async (req, res, next) => {
  try {
    const result = await Community.findOne(
      {
        title: req.body.post.community,
        members: req.auth._id
      }
    )

    if (result) next()
    else throw 1

  } catch (err) {
    return res.status('400').json({
      error: 'User not a community member',
      catch: err
    })
  }
}

const create = async (req, res) => {
  const community = new Community(req.body)
  try {
    await community.save()
    return res.status(201).json(community)
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

const read = (req, res) => {
  // TODO should senitize returned data 
  return res.json(req.community)
}

const list = async (req, res) => {
  try {
    let communities = await Community.find().select('title')
    res.json(communities)
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

const update = async (req, res) => {
  try {
    let community = req.profile
    community = extend(community, req.body)
    community.updated = Date.now()
    await community.save()
    community.hashed_password = undefined
    community.salt = undefined
    res.json(community)
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

const remove = async (req, res) => {
  try {
    let community = req.profile
    let deletedCommunity = await community.remove()
    deletedCommunity.hashed_password = undefined
    deletedCommunity.salt = undefined
    res.json(deletedCommunity)
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

const requestMembership = async (req, res) => {
  try {
    let community = await Community.findOneAndUpdate(
      {
        title: req.community.title,
        members: { $ne: req.auth._id },
      },
      {
        $addToSet: {
          pendingMembers: req.auth._id
        }
      },
      { new: true }
    )

    res.json({
      status: "OK",
      message: "Waiting for approval"
    })
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err),
      err
    })
  }
}

const requestMembershipV2 = async (req, res) => {
  try {
    let membership = await MemberCollection.create(
      {
        type: "community",
        src: req.profile._id,
        dest: req.body.dest,
      },
    );
    res.json({
      status: "OK",
      message: "Waiting for approval"
    })
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err),
      err
    })
  }
}

const approveMembership = async (req, res) => {

  try {
    let community = await Community.findOneAndUpdate(
      {
        title: req.community.title,
        // members: { $ne: req.body.pendingMember },
        // pendingMembers: req.body.pendingMember
      },
      {
        $addToSet: {
          members: req.body.pendingMember
        },
        $pull: {
          pendingMembers: req.body.pendingMember
        }
      },
      {
        new: true,
        lean: true,
      }
    )
    if (!community) {
      return res.status(400).json({
        error: 'failed to find and update community'
      })
    }

    let user = await User.findByIdAndUpdate(
      req.body.pendingMember,
      {
        $addToSet: {
          communities: req.community.title
        }
      },
      {
        new: true,
        lean: true
      }
    )
    res.json({
      status: "OK",
      message: `Membership approved at ${community.title}`
    })
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}


module.exports = {
  create,
  communityByTitle,
  communityByID,
  read,
  list,
  remove,
  update,
  requestMembership,
  requestMembershipV2,
  approveMembership,
  isMember,
}
