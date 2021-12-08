const mongoose = require('mongoose');
const crypto = require('crypto');
const config = require('../../config/config');
const { ObjectId } = require('mongodb');

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

  // index: {
  //   type: Number,
  //   unique: true,
  //   index: true,
  // },

  questionId: { type: mongoose.Schema.ObjectId, ref: 'Question' },

  answerType: { // question content view - how the question should be displayed to user
    type: String,
    enum: [
      'text',
      'number',
      'option',
      'options',
      'email',
    ],
    default: 'text'
  },

  answerContent: {}

}, { timestamps: true })


const QuestionSchema = new mongoose.Schema({

  pageIndex: 0,

  bodyType: { // question content view - how the question should be displayed to user
    type: String,
    enum: [
      'texts',
      'images',
      'videos',
    ],
    default: 'texts'
  },

  bodyContent: {}, // question content to display to user

  answerType: { // answers type - how the question should be displayed to user
    type: String,
    enum: [
      'numeric',
      'text',
      'single-option',
      'multi-option',
    ],
    default: 'texts'
  },

  answersContent: {}, //answers content to display to user

}, { timestamps: true })


const SurveySchema = new mongoose.Schema({

  surveyTitle: {
    type: String,
    unique: true,
    index: true,
  },

  ownerId: String,

  content: mongoose.SchemaTypes.Mixed,

  questions: [QuestionSchema],

  startedAt: Date, // absolute timestamp when survey is voteable when first question answered

  completedAt: Date, // absolute timestamp when survey is voteable when first question answered

  activateAt: Date, // absolute timestamp when survey is voteable when first question answered

  disactivateAt: Date, // absolute timestamp set when last question answered

}, { timestamps: true })

module.exports = {
  createAnswerCollection: (title) => mongoose.model(title, AnswerSchema),
  createSurveyModel: (title) => mongoose.model(title, SurveySchema),
  SurveyCollection: mongoose.model('Survey', SurveySchema),
  PendingVotesCollection: mongoose.model('PendingVotes', AnswerSchema),
}