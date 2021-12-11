const mongoose = require('mongoose');
const crypto = require('crypto');
const { STEP_TYPES } = require('../../config/config');

const AnswerSchema = new mongoose.Schema({

  surveyId: {   // title of survey
    type: String,
    // type: ObjectId,
    // unique: true,
    // index: true,
  },

  userId: {     //  owner of survey
    type: String,
    // unique: true,
    // index: true,
  },
  answers: [mongoose.SchemaTypes.Mixed]

}, { timestamps: true })


const StepSchema = new mongoose.Schema({

  type: {
    type: String,
    enum: [...Object.keys(STEP_TYPES)]
  },
  text: { type: String },
  config: {},

}, { timestamps: true })


const ProgramSchema = new mongoose.Schema({

  title: {
    type: String,
    // unique: true,
    // index: true,
  },

  ownerId: String,

  config: mongoose.SchemaTypes.Mixed,
  steps: [StepSchema],

}, { timestamps: true })

module.exports = {
  ProgramsCollection: mongoose.model('Programs', ProgramSchema),
}