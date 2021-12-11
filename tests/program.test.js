const request = require("supertest");
const app = require("../server/express");
const config = require("../server/config/config");
const { ProgramCollection } = require('../server/modules/program/program.model');
const { User } = require('../server/modules/user/user.model');
// const {
//   SurveyCollection,
//   PendingVotesCollection
// } = require('../server/modules/survey/survey.model');
const mongoose = require('mongoose');
// const surveyContent = require('./survey.json');
const { STEP_TYPES } = require("../server/config/config");

const user = {
  credentials: {
    password: "aaaaaa",
    email: `a@a.a`,
    role: 'moderator'
  }
}

const generateQuestion = (
  type,
  content,
  options,
) => ({
  type,
  content,
  options
})

const question1 = {
  question: {
    type: config.QUESTION_TYPES.NUMERIC,
    text: "What is your age?",
    config: {
      min: 17,
      max: 120,
      step: 1,
      meta: {
        event: "LESS_THEN_SETPOINT",
        setpoint: 16
      }
    },
  },
  answer: 5
}

const question2 = {
  question: {
    type: "options",
    text: "Select colors",
    config: {
      items: [
        "White",
        "Black",
        "Yello",
        "Blue",
      ],
      meta: {
        event: config.QUESTION_EVENTS.SELECT_FROM_STACK, //"SELECT_FROM_STACK",
        stack: ["Black", "Yellow"]
      }
    },
  },
  answer: ["Blue"]
}

const step1 = {
  type: STEP_TYPES.DIALOG,
  text: "Welcome to our community",
  configs: {}
}

const step2 = {
  type: STEP_TYPES.SURVEY,
  text: "registration survey",
  configs: {
    surveyID: ""
  }
}

const program = {
  title: "new-program",
  steps: [step1, step2]
}

describe("Test survey module", () => {

  beforeAll(async () => {
    app.set('port', process.env.PORT || '3000');
    mongoose.Promise = global.Promise
    mongoose.connect(config.mongoUris[0],
      {
        // useNewUrlParser: true,
        // useCreateIndex: true,
        // useUnifiedTopology: true,
        // useFindAndModify: false
      })

    mongoose.connection.on('error', () => {
      throw new Error(`unable to connect to database: ${config.mongoUris[0]}`)
    })
    config.mongooseInit(mongoose, config.mongoUris[0])

    // await User.deleteMany();
    // await SurveyCollection.deleteMany();
    // await PendingVotesCollection.deleteMany();
    // await SurveyCollection.deleteMany();

  });

  afterAll((done) => {
    mongoose.disconnect();
    // server.close(done);
  });

  describe("authorization", () => {

    // test("signup", async () => {
    //   const response = await request(app)
    //     .post("/api/user")
    //     .send(user.credentials);

    //   expect(response.statusCode).toBe(201);
    //   user._id = response.body._id
    // });

    test("signin", async () => {
      const response = await request(app)
        .post("/api/auth/signin")
        .send(user.credentials);

      expect(response.statusCode).toBe(200);
      user.token = 'Bearer ' + response.body.token
      // user.country = response.body.country
    });

    test("faile without Bearer token", async () => {
      const response = await request(app)
        .get("/api/user")

      expect(response.statusCode).toBe(401);

    });

    test("pass with bearer token", async () => {
      const url = "/api/auth/secured-api-example"
      const response = await request(app)
        .get(url)
        .set('Authorization', user.token)

      expect(response.statusCode).toBe(200);
    });
  })

  describe("Test /program APIs", () => {
    let programId = "";
    let fetchedProgram;

    test("create program", async () => {
      const response = await request(app)
        .post("/api/program")
        .set('Authorization', user.token)
        .send(program)

      printIfError(response)
      expect(response.statusCode).toBe(201);
      programId = response.body.id;

    });

    test("fetch program", async () => {
      const response = await request(app)
        .get(`/api/program/${programId}`)
        .set('Authorization', user.token)

      printIfError(response)
      expect(response.statusCode).toBe(200);
      fetchedProgram = response.body;
      console.log(fetchedProgram)
    });

    // test("answer survey", async () => {
    //   const response = await request(app)
    //     .post(`/api/survey/${programId}`)
    //     .set('Authorization', user.token)
    //     .send({
    //       surveyId: `${programId}`,
    //       // index: fetchedSurvey.content.pages[0].elements[0].uid,
    //       answers: [
    //         {
    //           question: question1.question,
    //           value: question1.answer
    //         }
    //       ]
    //     })
    //   printIfError(response)
    //   expect(response.statusCode).toBe(201);
    //   // console.log(response.body);
    // });
  });
})

function printIfError(response, label = '') {
  if (response.statusCode >= 400) {
    console.log(
      label,
      response.statusCode,
      response.body,
    )
  }
}

function randomSuffix(prefix) {
  return '' + prefix + Math.floor(Math.random() * 10000)
}
