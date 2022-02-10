const mongoose = require('mongoose');
const crypto = require('crypto');
const { STEP_TYPES } = require('../../config/config');
const {
  SurveySchema,
  QuestionSchema,
} = require('../survey/survey.model');


const StepSchema = new mongoose.Schema({

  type: {
    type: String,
    enum: [...Object.keys(STEP_TYPES)]
  },
  text: { type: String },
  completed: {
    type: Boolean,
    default: false
  },
  config: {},

}, { timestamps: true })


const ProgramSchema = new mongoose.Schema({

  title: {
    type: String,
    // unique: true,
    // index: true,
  },

  must: {
    type: Boolean,

  },

  userId: { type: mongoose.Schema.ObjectId, ref: 'User' },

  config: mongoose.SchemaTypes.Mixed,

  steps: [StepSchema],

  completions: [{}],

}, { timestamps: true })

module.exports = {
  ProgramCollection: mongoose.model('Program', ProgramSchema),
}