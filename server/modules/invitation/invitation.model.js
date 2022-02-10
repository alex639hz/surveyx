const mongoose = require('mongoose');
const crypto = require('crypto');
const config = require('../../config/config');


const InvitationSchema = new mongoose.Schema({

  inviteeId: "", // user _id which is invited by this invitation  
  inviter: "", // user _id which created an invitation 
  entity: { // where this invitation is for
    type: String,
    enum: ["community", "chat", "connection"]
  },
  surveys: []

}, { timestamps: true })

module.exports = {
  InvitationSchema,
  InvitationCollection: mongoose.model('Invitations', InvitationSchema),
}