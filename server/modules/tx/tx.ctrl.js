const extend = require('lodash/extend');
const { Tx } = require('./tx.model');
// const utils = require('./account.util');
const { Keyword } = require('../keyword/keyword.model');
const errorHandler = require('../../helpers/dbErrorHandler');
const { serviceGetStatusOfFailedTx } = require('../../config/config').topicsNames
const { v4: uuidv4 } = require('uuid');

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
  const tx = new Tx(req.body.initialTx)

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

// https://stackoverflow.com/questions/47250116/find-balance-from-debit-and-credit-entries-mongodb
// https://docs.mongodb.com/manual/reference/operator/aggregation/cond/
// https://stackoverflow.com/questions/49047239/mongodb-multiple-match-conditions-and-return-documents-with-common-name
const create = async (req, res) => {
  const txSenderId = req.body.tx.senderId
  const txReceiverId = req.body.tx.receiverId

  // console.log('req.body ',req.body)
  // console.log('txSenderId ',txSenderId)

  const senderAccountState = (await Tx.aggregate([
    { // collect all sender txs (in and out) 
      $match: {
        $or: [
          { senderId: txSenderId },
          { receiverId: txSenderId },
        ]
      }
    },
    { // squash all tx into a single summary document
      $group: {
        _id: uuidv4(),

        balance: {
          $sum: {
            $cond: {
              if: { $eq: ["$receiverId", txSenderId] },
              then: "$amount",  // inc balance for in_txs
              else: { $multiply: ["$amount", -1] }, // dec balance for out_txs 
            }
          }
        },
        outTx: {
          $sum: {
            $cond: {
              if: { $eq: ["$receiverId", txSenderId] },
              then: 0,
              else: 1,
            }
          }
        },
        inTx: {
          $sum: {
            $cond: {
              if: { $eq: ["$senderId", txSenderId] },
              then: 0,
              else: 1,
            }
          }
        }
      },
    },
    {
      $addFields: {
        senderId: { $literal: txSenderId },
        receiverId: { $literal: `${txReceiverId}` },
      },
    },
    // { $merge: { into: "Tx" } } // add new document into existing collection
  ]))[0]
  
  console.log('req.body.tx: ', req.body.tx)
  console.log('senderAccountState: ', senderAccountState)
  
  const balanceDiff = senderAccountState.balance - req.body.tx.amount
  if (balanceDiff >=0 ) {
    senderAccountState.amount = balanceDiff;

    // const newTx = await Tx.create(senderAccountState)
    const newTx = await Tx.create(senderAccountState)

    console.log('newTx: ', newTx)
  } else {
    console.log('Failed to tx due to low balance')
  }



  try {
    // const tx = await Tx.create(req.body.tx)
    // console.log('tx:', newTx[0])
    return res.status(201).json({
      message: "Tx created successfully!",
      tx: senderAccountState[0]
    })
  }
  catch (err) {
    return res.status(400).json({
      error: err
    })
  }


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



const getBalance = async (req, res) => {

}

module.exports = {
  create,
  // createTx,
  createInitial,
  accountByID,
  read,
  update,
  remove,
  listByCommunity,
  listFeed,
  // approveTx,
  // sendTx,
  getBalance,
}
