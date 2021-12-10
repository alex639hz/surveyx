const extend = require('lodash/extend');
const {
  PendingVotesCollection,
  SurveyCollection,
  createAnswerCollection,
  QuestionsCollection
} = require('./survey.model');
const errorHandler = require('../../helpers/dbErrorHandler');
const { verify } = require('jsonwebtoken');

const config = require("../../config/config");

const create = async (req, res) => {
  const survey = new SurveyCollection(req.body)
  try {
    await survey.save()
    return res.status(201).json({
      surveyId: survey._id,
      message: "Successfully signed up!",
    })
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

const createQuestion = async (req, res) => {
  const question = new QuestionsCollection(req.body)
  try {
    await question.save()
    return res.status(201).json({
      id: question._id,
      message: "Successfully created question!",
    })
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

/** inject survey document into req.survey
 * 
 */
const questionByID = async (req, res, next, id) => {
  try {
    let question = await QuestionsCollection.findById(id).lean()
    if (!question)
      return res.status('400').json({
        error: "question not found"
      })
    req.question = { ...question }
    next()
    return { ...req.question }
  } catch (err) {
    return res.status('400').json({
      error: "Could not retrieve question"
    })
  }
}
/** inject survey document into req.survey
 * 
 */
const surveyByID = async (req, res, next, id) => {
  try {
    let survey = await SurveyCollection.findById(id).lean()
    if (!survey)
      return res.status('400').json({
        error: "survey not found"
      })
    req.survey = { ...survey }
    next()
    return { ...req.survey }
  } catch (err) {
    return res.status('400').json({
      error: "Could not retrieve survey"
    })
  }
}
/** query survey by title and inject the document into req.survey
 * 
 */
const surveyByTitle = async (req, res, next, surveyId) => {
  try {
    let survey = await SurveyCollection.findOne({ surveyId }).lean()
    if (!survey)
      return res.status('400').json({
        error: "survey not found by title"
      })
    req.survey = { ...survey }
    next()
    return { ...req.survey } // TODO is this required?
  } catch (err) {
    return res.status('400').json({
      error: "Could not retrieve survey by title"
    })
  }
}

const read = (req, res) => {
  // req.profile.hashed_password = undefined
  // req.profile.salt = undefined
  return res.json(req.survey)
}

const list = async (req, res) => {
  try {
    let surveys = await SurveyCollection.find().select('email groups')
    res.json(surveys)
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

const update = async (req, res) => {
  try {
    let survey = req.profile
    survey = extend(survey, req.body)
    survey.updated = Date.now()
    await survey.save()
    survey.hashed_password = undefined
    survey.salt = undefined
    res.json(survey)
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

const remove = async (req, res) => {
  try {
    let survey = req.profile
    let deletedsurvey = await survey.remove()
    deletedsurvey.hashed_password = undefined
    deletedsurvey.salt = undefined
    res.json(deletedsurvey)
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}


const answer = async (req, res) => {

  if (0 && !verifyParticipation(survey, req.user)) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }

  req.body.userId = req.auth._id;
  const answerDocument = new PendingVotesCollection(req.body)

  try {
    await answerDocument.save()

    answerDocument.answers.map((answer) => {
      return verifyAnswer(answer);
    })

    return res.status(201).json({
      // _id: survey._id,
      message: `Successfully answered`,
      answerDocument,
      // results,
    })
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

function verifyParticipation(filters = [], userProfile) {
  return true;
}

const verifyAnswer = (answer) => {
  const temp = {};
  // return true

  switch (answer.question.config.meta.event) {
    case config.QUESTION_EVENTS.LESS_THEN_SETPOINT:
      if (+answer.answer < answer.question.config.meta.setpoint)
        console.log("EVENT-1 fired");

    case config.QUESTION_EVENTS.SELECT_FROM_STACK:

    default:
  }
}

module.exports = {
  answer,
  create,
  createQuestion,
  surveyByID,
  questionByID,
  surveyByTitle,
  read,
  list,
  remove,
  update,
}
