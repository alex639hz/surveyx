const mongoose = require('mongoose');

/** rawAccountSchema, the signed tx as received from the user  
 * 
 */
const TokenSchema = new mongoose.Schema({

  senderId: {
    type: String,
    index: true,
  },
  receiverId: {
    type: String,
    index: true,
  },
  amount: 0,
  data: {}

}, {
  timestamps: true,
  collection: 'Token',
})


module.exports = {
  Account: mongoose.model('Token', TokenSchema)
}