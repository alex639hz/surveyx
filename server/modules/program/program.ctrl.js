const extend = require('lodash/extend');
const {
  ProgramCollection
} = require('./program.model');
const errorHandler = require('../../helpers/dbErrorHandler');
const { verify } = require('jsonwebtoken');

const config = require("../../config/config");
const { Error } = require('mongoose');

const create = async (req, res) => {
  const program = new ProgramCollection(req.body)
  try {
    await program.save()
    return res.status(201).json({
      id: program._id,
      message: "Successfully created program",
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

/** inject program document into req.program
 * 
 */
const programByID = async (req, res, next, id) => {
  try {
    let program = await ProgramCollection.findById(id).lean()
    if (!program)
      return res.status('400').json({
        error: "program not found"
      })
    req.program = { ...program }
    next()
    return { ...req.program }
  } catch (err) {
    return res.status('400').json({
      error: "Could not retrieve program"
    })
  }
}
/** inject program document into req.program
 * 
 */
const surveyByID = async (req, res, next, id) => {
  try {
    let program = await SurveyCollection.findById(id).lean()
    if (!program)
      return res.status('400').json({
        error: "program not found"
      })
    req.program = { ...program }
    next()
    return { ...req.program }
  } catch (err) {
    return res.status('400').json({
      error: "Could not retrieve program"
    })
  }
}
/** query program by title and inject the document into req.program
 * 
 */
const surveyByTitle = async (req, res, next, surveyId) => {
  try {
    let program = await SurveyCollection.findOne({ surveyId }).lean()
    if (!program)
      return res.status('400').json({
        error: "program not found by title"
      })
    req.program = { ...program }
    next()
    return { ...req.program } // TODO is this required?
  } catch (err) {
    return res.status('400').json({
      error: "Could not retrieve program by title"
    })
  }
}

const read = (req, res) => {
  // req.profile.hashed_password = undefined
  // req.profile.salt = undefined  return res.json(req.program)
  return res.json(req.program)

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

const verifyStep = (step, solution) => {

  switch (step.type) {
    case config.STEP_TYPES.DIALOG:
      const { items } = step.config;
      if (!items.includes(solution)) return false;
  }

  switch (step.event.type) {
    case config.STEP_EVENTS.COMPLETION:
      console.log(`Event Payload: ${JSON.stringify(step.event.payload)}`);
    default:
  }
}

const completeStep = async (req, res) => {
  try {
    const { stepIndex, answer, step } = req.body

    verifyStep(step, answer)

    let program = req.program

    res.json(program)
  } catch (err) {
    return res.status(400).json({
      error: err
    })
  }
}

const update = async (req, res) => {
  try {
    let program = req.profile
    program = extend(program, req.body)
    program.updated = Date.now()
    await program.save()
    program.hashed_password = undefined
    program.salt = undefined
    res.json(program)
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

const remove = async (req, res) => {
  try {
    let program = req.profile
    let deletedsurvey = await program.remove()
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

  if (0 && !verifyParticipation(program, req.user)) {
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
      // _id: program._id,
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

module.exports = {
  completeStep,
  create,
  programByID,
  answer,
  createQuestion,
  surveyByID,
  surveyByTitle,
  read,
  list,
  remove,
  update,
}
