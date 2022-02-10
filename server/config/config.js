const mongooseInit = async (mongoose) => {
  mongoose.pluralize(null);
  mongoose.set('debug', false);
  mongoose.set('autoIndex', true);
  mongoose.Promise = Promise
}

const config = {

  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || "YOUR_secret_key",
  mongoUris: [
    `mongodb://${(process.env.IP || 'localhost')}:${(process.env.MONGO_PORT || '27017')}/SURVEYX`,
  ],

  mongooseInit,

  mongoDropDb: async () => { await mongoose.connection.db.dropDatabase() },

  topicsNames: {
    keywordAlertTopic: 'keyword-alert',
    serviceGetStatusOfFailedTx: 'tx-failure',
  },

  SURVEY_TYPES: {
    SURVEY: "SURVEY",
    PROGRAM: "PROGRAM",
  },
  STEP_TYPES: {
    SURVEY: "SURVEY",
    DIALOG: "DIALOG",
  },

  QUESTION_TYPES: {
    NUMERIC: "NUMERIC",
    TEXT: "TEXT",
    OPTION: "SINGLE_OPTION",
    MULTI_OPTIONS: "MULTI_OPTIONS",
  },

  QUESTION_EVENTS: {
    LESS_THEN_SETPOINT: "LESS_THEN_SETPOINT",
    SELECT_FROM_STACK: "SELECT_FROM_STACK",
  },

  STEP_EVENTS: {
    COMPLETION: "COMPLETION",
  }


}




module.exports = config;
