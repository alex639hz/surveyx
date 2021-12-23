const request = require("supertest");
const app = require("../server/express");
const config = require("../server/config/config");
const { Community: CommunityCollection } = require('../server/modules/community/community.model');
const { User } = require('../server/modules/user/user.model');
// const {
//   SurveyCollection,
//   PendingVotesCollection
// } = require('../server/modules/survey/survey.model');
const mongoose = require('mongoose');
// const surveyContent = require('./survey.json');
const { STEP_TYPES, STEP_EVENTS } = require("../server/config/config");

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
  step: {
    type: STEP_TYPES.DIALOG,
    text: "Welcome to our community",
    config: {
      items: ["No", "Yes"]
    },
    event: {
      type: STEP_EVENTS.COMPLETION,
      payload: { some: "data" }
    }
  },
  solution: {
    answer: "Yes"
  }
};

const step2 = {
  step: {
    type: STEP_TYPES.SURVEY,
    text: "registration survey",
    config: {
      survey: {},
      surveyID: ""
    }
  },
  solution: {
    answer: "Yes"
  }
}

const community = {
  title: "new-program",
}

describe("Test community module", () => {

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

    await CommunityCollection.deleteMany();
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

  describe("Test /community APIs", () => {
    let communityId = "";
    let fetchedCommunity;

    test("create community", async () => {
      const response = await request(app)
        .post("/api/community")
        .set('Authorization', user.token)
        .send(community)

      printIfError(response)
      expect(response.statusCode).toBe(201);
      communityId = response.body._id;
      console.log("===554433", response.body)

    });

    test("fetch community", async () => {
      const response = await request(app)
        .get(`/api/community/${communityId}`)
        .set('Authorization', user.token)

      printIfError(response)
      expect(response.statusCode).toBe(200);
      fetchedCommunity = response.body.community;
      console.log("===54544", fetchedCommunity)
    });

    // test("complete step", async () => {
    //   const response = await request(app)
    //     .post(`/api/program/complete/${programId}`)
    //     .set('Authorization', user.token)
    //     .send({
    //       stepIndex: 0,
    //       step: step1.step,
    //       answer: step1.solution.answer,
    //     })
    //   printIfError(response)
    //   expect(response.statusCode).toBe(200);
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
