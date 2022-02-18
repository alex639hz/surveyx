const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

/** rawAccountSchema, the signed tx as received from the user  
 * 
 */
const TxSchema = new mongoose.Schema({
  _id: {
    type: String,
    index: true,
    unique: true,
    default: uuidv4()
  },
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
  collection: 'Tx',
})


module.exports = {
  Tx: mongoose.model('Tx', TxSchema)
}