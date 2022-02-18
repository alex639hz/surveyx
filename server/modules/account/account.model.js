const mongoose = require('mongoose');

/** rawAccountSchema, the signed tx as received from the user  
 * 
 */
const AccountSchema = new mongoose.Schema({

  owner: {
    type: String,
    unique: true,
    index: true,
  },
  senderId: "",
  balance: 0,
  inTxs: [],
  outTxs: [],

}, {
  timestamps: true,
  collection: 'Account',
})


const Account = mongoose.model('Account', AccountSchema)

const _createTx = async ({
  sender,
  receiver,
  amount,
  raw
}) => {
  const session = await mongoose.startSession();
  let accountSender;

  await session.withTransaction(async () => {

    accountSender = await Account.findOneAndUpdate(
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

    const accountReceiver = await Account.findOneAndUpdate(
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
    
    return true;
  })

  session.endSession();
}

console.log("Account: ", Account)

module.exports = {
  Account,
  _createTx
}