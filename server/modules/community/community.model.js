const mongoose = require('mongoose');
const {
  InvitationSchema,
  InvitationCollection
} = require('../invitation/invitation.model');
const { ProgramSchema } = require('../program/program.model');


const CommunitySchema = new mongoose.Schema({

  title: {
    type: String,
    trim: true,
    // index: true,
    // unique: 'Title already exists',
    // maxlength: 80,
    // required: 'Community title is required'
  },
  admins: [String],
  members: [{ type: mongoose.Schema.ObjectId, ref: 'User' }], // NOTE: switch to collection in production 
  pendingMembers: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  surveysIds: [{ type: mongoose.Schema.ObjectId, ref: 'Survey' }],
  programs: [{}],
  invitation: InvitationSchema,


}, { timestamps: true })


const MemberSchema = new mongoose.Schema({
  status: {
    type: String,
    default: "pending",
    enum: ["pending", "approved", "blocked"]
  },
  type: {
    type: String,
    default: "community",
    enum: ["user", "community"]
  },

  src: { type: mongoose.Schema.ObjectId, ref: 'User' },
  dest: "",

}, { timestamps: true })


module.exports = {
  Community: mongoose.model('Community', CommunitySchema),
  MemberCollection: mongoose.model('Member', MemberSchema)
}