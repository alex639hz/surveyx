const request = require("supertest");
const app = require("../server/express");
const config = require("../server/config/config");
const { User } = require('../server/modules/user/user.model');
const { Keyword } = require('../server/modules/keyword/keyword.model');
const { Community } = require('../server/modules/community/community.model');
const { Post } = require('../server/modules/post/post.model');
const { Tx } = require('../server/modules/tx/tx.model');
const mongoose = require('mongoose');

/** user object:
{
  credentials: { password: 'aaaaaa', email: 'a@a.a' },
  _id: '615a9d1f98f842f6572d8625',
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MTVhOWQxZjk4Zjg0MmY2NTcyZDg2MjUiLCJpYXQiOjE2MzMzMjg0MTV9.ke-0u6sL8fJXzzSTkKRWGI1xiBlDT5ijv82tHZYPK30',
  country: 'IL'
}
 */
const user1 = {
  credentials: {
    password: "aaaaaa",
    email: `1a@a.a`,
  }
}

const user2 = {
  credentials: {
    password: "aaaaaa",
    email: `2a@a.a`,
  }
}

const tx1 = {
  senderId: "",
  receiverId: "",
  amount: 100,
  data: {
    hello: "amigo",
  }
}

const tx2 = {
  senderId: "",
  receiverId: "",
  amount: 100,
  data: {
    hello: "amigo",
  }
}


describe("Tx module test", () => {

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
    await Tx.deleteMany();

  });

  afterAll((done) => {
    mongoose.disconnect();
    // server.close(done);
  });

  describe("authorization user1", () => {

    test("signup", async () => {
      const response = await request(app)
        .post("/api/user")
        .send(user1.credentials);

      expect(response.statusCode).toBe(201);
      user1._id = response.body._id
    });

    test("signin", async () => {
      const response = await request(app)
        .post("/api/auth/signin")
        .send(user1.credentials);

      expect(response.statusCode).toBe(200);
      user1.token = 'Bearer ' + response.body.token
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
        .set('Authorization', user1.token)

      expect(response.statusCode).toBe(200);
    });
  })

  describe("authorization user2", () => {

    test("signup", async () => {
      const response = await request(app)
        .post("/api/user")
        .send(user2.credentials);

      expect(response.statusCode).toBe(201);
      user2._id = response.body._id
    });

    test("signin", async () => {
      const response = await request(app)
        .post("/api/auth/signin")
        .send(user2.credentials);

      expect(response.statusCode).toBe(200);
      user2.token = 'Bearer ' + response.body.token
    });

  })

  describe("TX test", () => {

    test("generate initial tx", async () => {
      const tx = {
        senderId: "init",
        receiverId : user1._id,
        amount: 100,
      }
      const response = await request(app)
        .post("/api/tx/initialize")
        .set('Authorization', user1.token)
        .send({ initialTx: tx });

      printIfError(response)
      expect(response.statusCode).toBe(201);
      // user1._id = response.body._id
    });

    test("should create tx", async () => {
      const tx = {
        senderId: user1._id,
        receiverId: user2._id,
        amount: 50,
      }
      const response = await request(app)
        .post("/api/tx")
        .set('Authorization', user1.token)
        .send({ tx });

      printIfError(response)
      expect(response.statusCode).toBe(201);
      // user1._id = response.body._id
    });

    // test("signin", async () => {
    //   const response = await request(app)
    //     .post("/api/auth/signin")
    //     .send(user.credentials);

    //   expect(response.statusCode).toBe(200);
    //   user.token = 'Bearer ' + response.body.token
    //   // user.country = response.body.country
    // });

    // test("faile without Bearer token", async () => {
    //   const response = await request(app)
    //     .get("/api/user")

    //   expect(response.statusCode).toBe(401);

    // });

    // test("pass with bearer token", async () => {
    //   const url = "/api/auth/secured-api-example"
    //   const response = await request(app)
    //     .get(url)
    //     .set('Authorization', user.token)

    //   expect(response.statusCode).toBe(200);
    // });
  })

  //============================
  // test("create account A", async () => {
  //   const url = "/api/account";
  //   const response = await request(app)
  //     .post(url)
  //     .set('Authorization', 'Bearer ' + user.token)
  //     .send({
  //       account: {
  //         owner: "1010",
  //         balance: 100,
  //         title: "initial",
  //       }
  //     })

  //   // console.log(response.body)
  //   printIfError(response)
  //   expect(response.statusCode).toBe(201);
  // });

  // for (let i = 0; i < 10; i++) {
  //   test("create tx", async () => {
  //     const url = "/api/account/tx";
  //     const response = await request(app)
  //       .post(url)
  //       .set('Authorization', 'Bearer ' + user.token)
  //       .send({
  //         tx: {
  //           sender: "1010",
  //           receiver: "1020",
  //           amount: 1,
  //           title: "initial" + i,
  //         }
  //       })

  //     // console.log('pppp', response.body)
  //     printIfError(response)
  //     expect(response.statusCode).toBe(201);
  //   });
  // }

  // test("should not accept duplicated tx", async () => {
  //   const url = "/api/account/tx";
  //   const response = await request(app)
  //     .post(url)
  //     .set('Authorization', 'Bearer ' + user.token)
  //     .send({
  //       tx: {
  //         sender: "1010",
  //         receiver: "1020",
  //         amount: 1,
  //         title: "initial0",
  //       }
  //     })

  //   // console.log('should not accept duplicated tx', response.body)
  //   // printIfError(response)
  //   expect(response.statusCode).toBe(400);
  //   // expect(response.body.message).toBe('tx already exist');
  // });

  // test("should not accept out of balance tx", async () => {
  //   const url = "/api/account/tx";
  //   const response = await request(app)
  //     .post(url)
  //     .set('Authorization', 'Bearer ' + user.token)
  //     .send({
  //       tx: {
  //         sender: "1010",
  //         receiver: "1020",
  //         amount: 500,
  //         title: "initial",
  //       }
  //     })

  //   // console.log('aaaaa', response.body)
  //   // printIfError(response)
  //   expect(response.statusCode).toBe(400);
  //   // expect(response.body.message).toBe('Failed to updated sender account!');
  // });

});

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

/** NOTE: scoreCalculator function is the example of 
 * how to calculate a score based on the post parameters and the rest of the posts 
 * 
 * @param {*} likesCounter the post likes count
 * @param {*} maxLikesCounter the post with highest likes count in the system
 * @param {*} postLength the post length
 * @param {*} maxPostLength the length of the 
 * @returns 
 */
function scoreCalculator(likesCounter, maxLikesCounter, postLength, maxPostLength) {
  return (likesCounter / maxLikesCounter) * 80 + (1 - postLength / maxPostLength) * 20
}

function generatePost(community = '', country = '', score, body = '') {
  return {
    title: randomSuffix("title-"),
    community,
    country,
    score,
    body: "my post body text includes word1 word2 word3.",
  }
}
