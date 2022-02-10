const extend = require('lodash/extend');
const { Tx } = require('./tx.model');
// const utils = require('./account.util');
const { Keyword } = require('../keyword/keyword.model');
const errorHandler = require('../../helpers/dbErrorHandler');
const { serviceGetStatusOfFailedTx } = require('../../config/config').topicsNames

// const Redis = require('ioredis');
// const redisPub = new Redis()

const accountByID = async (req, res, next, id) => {
  try {
    let account = await Tx.findById(id).lean()
    if (!account)
      return res.status('400').json({
        error: "Tx not found"
      })
    req.account = account
    next()
  } catch (err) {
    return res.status('400').json({
      error: "Could not retrieve account"
    })
  }
}

const createInitial = async (req, res) => {
  const account = new Tx(req.body.account)

  try { await account.save() }
  catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }

  return res.status(201).json({
    message: "Tx created successfully!",
    account
  })

}

// https://stackoverflow.com/questions/47250116/find-balance-from-debit-and-credit-entries-mongodb
// https://docs.mongodb.com/manual/reference/operator/aggregation/cond/
// https://stackoverflow.com/questions/49047239/mongodb-multiple-match-conditions-and-return-documents-with-common-name
const create = async (req, res) => {
  const txSenderId = req.body.tx.senderId

  const senderAccount = await Tx.aggregate([
    {
      $match: {
        $or: [
          { senderId: txSenderId },
          { receiverId: txSenderId },
        ]
      }
    },
    {
      $group: {
        balance: {
          $sum: {
            $cond: {
              if: { $eq: ["$receiverId", txSenderId] },
              then: "$amount",
              else: { $multiply: ["$amount", -1] },
            }
          }
        },
        outputTx: {
          $sum: {
            $cond: {
              if: { $eq: ["$receiverId", txSenderId] },
              then: 0,
              else: 1,
            }
          }
        },
      }
    }
  ])



  const tx = new Tx(req.body.tx)

  try { await tx.save() }
  catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }

  return res.status(201).json({
    message: "Tx created successfully!",
    tx
  })
}

const createX = async (req, res) => {
  const sender = req.body.tx.sender || ''
  const receiver = req.body.tx.receiver || ''
  const amount = req.body.tx.amount || 0
  const title = req.body.tx.title || ''
  const raw = `${sender},${receiver},${amount},${title}`
  let accountSender;

  // try to update sender account
  try {
    accountSender = await Tx.findOneAndUpdate(
      {
        owner: sender,
        balance: { $gte: amount },
        outTxs: { $ne: raw }
      },
      {
        $inc: { balance: -amount },
        $addToSet: { outTxs: raw }
      },
      {
        new: true,
        lean: true,
      }
    )
  }
  catch (err) {
    return res.status(500).json({
      error: errorHandler.getErrorMessage(err)
    })
  }

  // get failed tx error and generate response message
  if (!accountSender) {
    if (0) {
      redisPub.publish(serviceGetStatusOfFailedTx, `${JSON.stringify("any data...")}`);

      accountSender = await Tx.findOne(
        {
          owner: sender,
        },
        {
          balance: true,
          txs: true,
        },
        {
          lean: true,
        }
      )

      const message = !accountSender ?
        "sender account not fount" : accountSender.balance < amount ?
          "Balance Failure" : accountSender.txs.includes(raw) ?
            "tx already exist" : 'unknown tx failure';

      return res.status(400).json({
        message,
        accountSender,
      })
    } else {
      return res.status(400).json({
        message: "sender account not found`",
      })
    }
  }

  //  update receiver account
  const accountReceiver = await Tx.findOneAndUpdate(
    { owner: receiver },
    {
      $inc: { balance: +amount },
      $addToSet: { inTxs: raw },
    },
    {
      new: true,
      lean: true,
      upsert: true
    },
  )

  return res.status(201).json({
    message: "Tx created successfully!",
    accountSender: accountSender || {},
    accountReceiver: accountReceiver || {},
  })



}


const read = async (req, res) => {
  const result = await Tx.aggregate([
    {
      $match: {
        // check sender account balance
        receiver: "1001"
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" },
        count: { $sum: 1 }
      }
    }
  ]);


  return res.json(result)
}

const read_example = (req, res) => {
  req.profile.hashed_password = undefined
  req.profile.salt = undefined
  return res.json(req.profile)
}

/** list accounts 
 * DONE: A section In the app where the user sees accounts which are “recommended” to him. Ranked by “relevance” score - descending 
 * 
 * Tx A author is from the same country as the requesting user, account B isn’t. A is ranked higher then B (returned first in the array) even if B has a higher weighted score
 * Tx A and B authors are from the same country as the requesting user. The account with the highest weighted score is returned first
 * Tx A and B authors are not from the same country as the requesting user. The account with the highest weighted score is returned first 
 * No accounts are found from one of the users communities - the feed is empty (empty array response)
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const listByCommunity = async (req, res) => {
  const myArr = await Tx.aggregate(
    [
      { $match: { community: req.community.title } },
      { $sort: { "score": -1 } },
      {
        $group: {
          _id: { country: "$country" },
          docs: {
            $push: {
              title: "$title",
              body: "$body",
              score: "$score",
              country: "$country",
              community: req.community.title
            }
          },
        }
      },

    ]
  )

  res.json([
    ...myArr['0'].docs,
    ...myArr['1'].docs,
  ])

}

const listFeed = async (req, res) => {

  const result = await Tx.aggregate([
    {
      $match: {
        community: { $in: req.profile.communities },
        status: "approved",
      }
    },
    {
      $facet: {
        "local": [
          { $match: { country: req.profile.country } },
          { $sort: { "score": -1 } },
        ],
        "nonLocal": [
          { $match: { country: { $ne: req.profile.country } } },
          { $sort: { "score": -1 } },
        ],
      },
    }
  ])

  res.json(
    [...result[0].local, ...result[0].nonLocal],
  )

}

const update = async (req, res) => {
  try {
    let account = req.profile
    account = extend(account, req.body)
    account.updated = Date.now()
    await account.save()
    account.hashed_password = undefined
    account.salt = undefined
    res.json(account)
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

const remove = async (req, res) => {
  try {
    let account = req.profile
    let deletedUser = await account.remove()
    deletedUser.hashed_password = undefined
    deletedUser.salt = undefined
    res.json(deletedUser)
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

const approveTx = async (req, res) => {
  try {
    const result = await Tx.findOneAndUpdate({
      _id: req.account._id,
      status: "pending",
    }, {
      status: "approved",
    }, {
      new: true,
      lean: true
    })

    if (!result) {
      return res.status(400).json({
        error: 'Cannot approve account: ' + req.account._id
      })
    }

    res.status(200).json({ result })


  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

/**
 * 1 verify account signature of content (ie. account instructions)
 * 2 verify the account content ie. balance
 * 3 store account as document in db
 */
const sendTx = async (req, res) => {
  const sender = "";
  const receiver = "";
  const hash = "";
  const prevHash = "";
  const title = "";
  const data = "";
  const amount = 0;
  const fee = 0;

  const result = await Tx.aggregate([
    {
      $match: {
        receiver: "1001"
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" },
        count: { $sum: 1 }
      }
    },
    {
      $match: {
        // check sender account balance
        total: { $gte: 10 }
      },
    },
  ]);

  /**
   * https://docs.mongodb.com/manual/reference/operator/aggregation/match/#perform-a-count
   */

  const account = new Tx({
    userTxBody,
    userTxSignature,
    hash,
  })

}

/**
 * 1 get all accounts where receiver is account.sender 
 * 2 return calculated account income balance
 */
const getBalance = async (req, res) => {
  //  
  // 
  const arr = [10, 20, 30]
}

module.exports = {
  create,
  createTx,
  createInitial,
  accountByID,
  read,
  update,
  remove,
  listByCommunity,
  listFeed,
  approveTx,
  sendTx,
  getBalance,
}
