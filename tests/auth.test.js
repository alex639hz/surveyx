const request = require("supertest");
const app = require("../server/express");
const config = require("../server/config/config");
const { User } = require('../server/modules/user/user.model');
const {
  SurveyCollection,
  PendingVotesCollection
} = require('../server/modules/survey/survey.model');
const mongoose = require('mongoose');
const surveyContent = require('./survey.json');

const user = {
  credentials: {
    password: "aaaaaa",
    email: `a@a.a`,
  }
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

    await User.deleteMany();
    await SurveyCollection.deleteMany();
    await PendingVotesCollection.deleteMany();
    await SurveyCollection.deleteMany();

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
