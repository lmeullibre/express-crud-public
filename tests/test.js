const request = require("supertest");
const app = require("../app");

describe("GET /items/list", () => {
  it("should return status code 200", (done) => {
    request(app)
      .get("/sentences/list")
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
});

describe("GET /sentences", () => {
  it("responds with a list of sentences", async () => {
    const response = await request(app).get("/sentences");
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toHaveProperty("id");
    expect(response.body[0]).toHaveProperty("text");
    expect(response.body[0]).toHaveProperty("categories");
  });
});
