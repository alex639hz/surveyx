const request = require("supertest");
const app = require("../server/express");
const config = require("../server/config/config");
const { User } = require('../server/modules/user/user.model');
const {
  SurveyCollection: Survey,
  PendingVotesCollection
} = require('../server/modules/survey/survey.model');
const mongoose = require('mongoose');
const surveyContent = require('./survey.json');

// console.log(surveyContent)
// 
/** user object:
{
  credentials: { password: 'aaaaaa', email: 'a@a.a' },
  _id: '615a9d1f98f842f6572d8625',
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MTVhOWQxZjk4Zjg0MmY2NTcyZDg2MjUiLCJpYXQiOjE2MzMzMjg0MTV9.ke-0u6sL8fJXzzSTkKRWGI1xiBlDT5ijv82tHZYPK30',
  country: 'IL'
}
 */
const user = {
  credentials: {
    password: "aaaaaa",
    email: `a@a.a`,
    role: 'moderator'
  }
}

// let surveys = [
//   createSurvey("A", "US", 100, "word? word1 word2 word3"),
//   createSurvey("A", "IL", 90, "word? word? word? word?"),
// ]

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

    await User.deleteMany();
    await Survey.deleteMany();
    await PendingVotesCollection.deleteMany();

  });

  afterAll((done) => {
    mongoose.disconnect();
    // server.close(done);
  });

  describe("authorization", () => {

    test("signup", async () => {
      const response = await request(app)
        .post("/api/user")
        .send(user.credentials);

      expect(response.statusCode).toBe(201);
      user._id = response.body._id
    });

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

  describe("Test survey logic", () => {
    const surveyTitle = "my-survey-title";
    let surveyId = "";

    test("create survey", async () => {
      const response = await request(app)
        .post("/api/survey")
        .set('Authorization', user.token)
        .send({
          surveyId: surveyTitle,
          content: surveyContent,

        })

      printIfError(response)
      expect(response.statusCode).toBe(201);
      surveyId = response.body.surveyId;
      // console.log("[444]===>", surveyId)

    });

    test("fetch survey", async () => {
      const response = await request(app)
        .get(`/api/survey/${surveyId}`)
        .set('Authorization', user.token)


      printIfError(response)
      expect(response.statusCode).toBe(200);
      // console.log(response.body);
    });

    test("answer survey", async () => {
      const response = await request(app)
        .post(`/api/survey/${surveyId}`)
        .set('Authorization', user.token)
        .send({
          surveyId: `${surveyId}`,
          userId: `${surveyId}`,
          questionId: `${surveyId}`,
          answerType: 'text',
          answerContent: 'my answer content',
        })
      printIfError(response)
      expect(response.statusCode).toBe(201);
      // console.log(response.body);
    });


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

const createSurvey = (community = '', country = '', score, body = '') => {
  return {
    title: randomSuffix("title-"),
    community,
    country,
    score,
    body: "my post body text includes word1 word2 word3.",
  }
}
