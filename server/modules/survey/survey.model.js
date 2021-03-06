const mongoose = require('mongoose');
const crypto = require('crypto');
const { SURVEY_TYPES } = require('../../config/config');

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


const QuestionSchema = new mongoose.Schema({

  type: { type: String },
  text: { type: String },
  config: mongoose.SchemaTypes.Mixed,

}, { timestamps: true })


const SurveySchema = new mongoose.Schema({

  type: {
    type: String,
    default: "_SURVEY"
  },

  title: {
    type: String,
    // unique: true,
    // index: true,
  },

  type: {
    type: String,
    enum: [...Object.keys(SURVEY_TYPES)],
    default: SURVEY_TYPES.SURVEY
  },

  ownerId: String,

  config: mongoose.SchemaTypes.Mixed,
  questions: [QuestionSchema],

  startedAt: {
    type: Date, // absolute timestamp when survey is voteable when first question answered
    // default: Date.now()
  },
  completedAt: Date, // absolute timestamp when survey is voteable when first question answered

  activateAt: Date, // absolute timestamp when survey is voteable when first question answered

  disactivateAt: Date, // absolute timestamp set when last question answered

}, { timestamps: true })

module.exports = {
  SurveySchema,
  QuestionSchema,
  createAnswerCollection: (title) => mongoose.model(title, AnswerSchema),
  createSurveyModel: (title) => mongoose.model(title, SurveySchema),
  SurveyCollection: mongoose.model('Survey', SurveySchema),
  PendingVotesCollection: mongoose.model('PendingVotes', AnswerSchema),
  QuestionsCollection: mongoose.model('Questions', QuestionSchema),
}