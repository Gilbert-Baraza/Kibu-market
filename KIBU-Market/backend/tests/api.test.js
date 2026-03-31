import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "kibu-market-test-secret";
process.env.JWT_EXPIRES_IN = "1h";
process.env.CLIENT_URL = "http://localhost:5173";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(__dirname, "..", ".cache", "mongodb-binaries");
process.env.MONGOMS_PREFER_GLOBAL_PATH = "false";

const mongoose = (await import("mongoose")).default;
const request = (await import("supertest")).default;
const { MongoMemoryServer } = await import("mongodb-memory-server");

const { default: app } = await import("../src/app.js");
const { default: Message } = await import("../src/models/Message.js");

let mongoServer;

function buildUserPayload(overrides = {}) {
  const suffix = Math.random().toString(36).slice(2, 8);

  return {
    name: "Test Student",
    email: `student-${suffix}@kibu.test`,
    password: "campus123",
    phone: "0712345678",
    university: "Kibabii University",
    ...overrides,
  };
}

function buildListingPayload(overrides = {}) {
  return {
    title: "HP Scientific Calculator",
    description: "Clean calculator in good condition and ready for exams.",
    price: 1500,
    category: "Electronics",
    condition: "good",
    location: "Main Campus",
    tags: ["calculator", "math"],
    images: ["https://example.com/calculator.jpg"],
    ...overrides,
  };
}

async function clearDatabase() {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
}

async function registerUser(overrides = {}) {
  const payload = buildUserPayload(overrides);
  const response = await request(app).post("/api/auth/register").send(payload);

  assert.equal(response.statusCode, 201);

  return {
    payload,
    token: response.body.token,
    user: response.body.user,
  };
}

async function createListing(token, overrides = {}) {
  const response = await request(app)
    .post("/api/listings")
    .set("Authorization", `Bearer ${token}`)
    .send(buildListingPayload(overrides));

  assert.equal(response.statusCode, 201);
  return response.body.listing;
}

async function setupDatabase() {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), {
    dbName: "kibu-market-api-tests",
  });
}

async function teardownDatabase() {
  await mongoose.disconnect();

  if (mongoServer) {
    await mongoServer.stop();
  }
}

async function runScenario(name, fn) {
  await clearDatabase();

  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

async function testAuthApi() {
  const signupPayload = buildUserPayload();

  const registerResponse = await request(app)
    .post("/api/auth/register")
    .send(signupPayload);

  assert.equal(registerResponse.statusCode, 201);
  assert.ok(registerResponse.body.token);
  assert.equal(registerResponse.body.user.email, signupPayload.email.toLowerCase());
  assert.equal(registerResponse.body.user.password, undefined);

  const loginResponse = await request(app)
    .post("/api/auth/login")
    .send({
      email: signupPayload.email,
      password: signupPayload.password,
    });

  assert.equal(loginResponse.statusCode, 200);
  assert.ok(loginResponse.body.token);

  const meResponse = await request(app)
    .get("/api/auth/me")
    .set("Authorization", `Bearer ${loginResponse.body.token}`);

  assert.equal(meResponse.statusCode, 200);
  assert.equal(meResponse.body.email, signupPayload.email.toLowerCase());

  const updateResponse = await request(app)
    .patch("/api/users/me")
    .set("Authorization", `Bearer ${loginResponse.body.token}`)
    .send({
      name: "Updated Student",
      phone: "0799999999",
      university: "Kibu Main Campus",
    });

  assert.equal(updateResponse.statusCode, 200);
  assert.equal(updateResponse.body.user.name, "Updated Student");
  assert.equal(updateResponse.body.user.phone, "0799999999");
  assert.equal(updateResponse.body.user.university, "Kibu Main Campus");
}

async function testListingsApi() {
  const seller = await registerUser({ name: "Seller Student" });
  const stranger = await registerUser({ name: "Other Student" });

  const listing = await createListing(seller.token, {
    title: "Casio Calculator",
    price: 1800,
    location: "Library",
  });

  const filteredResponse = await request(app)
    .get("/api/listings")
    .query({
      search: "calculator",
      minPrice: 1000,
      maxPrice: 2000,
      location: "Library",
    });

  assert.equal(filteredResponse.statusCode, 200);
  assert.equal(filteredResponse.body.listings.length, 1);
  assert.equal(filteredResponse.body.listings[0].id, listing.id);

  const forbiddenUpdate = await request(app)
    .patch(`/api/listings/${listing.id}`)
    .set("Authorization", `Bearer ${stranger.token}`)
    .send({ price: 1900 });

  assert.equal(forbiddenUpdate.statusCode, 403);

  const ownerUpdate = await request(app)
    .patch(`/api/listings/${listing.id}`)
    .set("Authorization", `Bearer ${seller.token}`)
    .send({
      price: 1900,
      description: "Clean calculator in great shape for course work.",
    });

  assert.equal(ownerUpdate.statusCode, 200);
  assert.equal(ownerUpdate.body.listing.price, 1900);

  const mineResponse = await request(app)
    .get("/api/listings/mine")
    .set("Authorization", `Bearer ${seller.token}`);

  assert.equal(mineResponse.statusCode, 200);
  assert.equal(mineResponse.body.listings.length, 1);

  const soldResponse = await request(app)
    .patch(`/api/listings/${listing.id}/sold`)
    .set("Authorization", `Bearer ${seller.token}`);

  assert.equal(soldResponse.statusCode, 200);
  assert.equal(soldResponse.body.listing.status, "sold");
}

async function testSavedListingsApi() {
  const seller = await registerUser({ name: "Seller Student" });
  const buyer = await registerUser({ name: "Buyer Student" });
  const listing = await createListing(seller.token, { title: "Study Desk" });

  const saveResponse = await request(app)
    .post(`/api/saved/${listing.id}`)
    .set("Authorization", `Bearer ${buyer.token}`);

  assert.equal(saveResponse.statusCode, 201);

  const savedResponse = await request(app)
    .get("/api/saved")
    .set("Authorization", `Bearer ${buyer.token}`);

  assert.equal(savedResponse.statusCode, 200);
  assert.equal(savedResponse.body.listings.length, 1);
  assert.equal(savedResponse.body.listings[0].id, listing.id);

  const unsaveResponse = await request(app)
    .delete(`/api/saved/${listing.id}`)
    .set("Authorization", `Bearer ${buyer.token}`);

  assert.equal(unsaveResponse.statusCode, 200);

  const emptySavedResponse = await request(app)
    .get("/api/saved")
    .set("Authorization", `Bearer ${buyer.token}`);

  assert.equal(emptySavedResponse.statusCode, 200);
  assert.equal(emptySavedResponse.body.listings.length, 0);
}

async function testProfileApi() {
  const seller = await registerUser({ name: "Seller Student" });
  const buyer = await registerUser({ name: "Buyer Student" });
  const listing = await createListing(seller.token, { title: "Hostel Mattress" });

  await request(app)
    .post(`/api/saved/${listing.id}`)
    .set("Authorization", `Bearer ${buyer.token}`);

  const startConversationResponse = await request(app)
    .post(`/api/chat/start/${listing.id}`)
    .set("Authorization", `Bearer ${buyer.token}`);

  assert.equal(startConversationResponse.statusCode, 201);

  const dashboardResponse = await request(app)
    .get("/api/users/me/dashboard")
    .set("Authorization", `Bearer ${buyer.token}`);

  assert.equal(dashboardResponse.statusCode, 200);
  assert.equal(dashboardResponse.body.user.email, buyer.user.email);
  assert.equal(dashboardResponse.body.savedListings.length, 1);
  assert.equal(dashboardResponse.body.savedListings[0].id, listing.id);
  assert.equal(dashboardResponse.body.conversations.length, 1);
  assert.equal(
    String(dashboardResponse.body.conversations[0].product.id),
    String(listing.id),
  );
}

async function testChatApi() {
  const seller = await registerUser({ name: "Seller Student" });
  const buyer = await registerUser({ name: "Buyer Student" });
  const outsider = await registerUser({ name: "Outsider Student" });
  const listing = await createListing(seller.token, { title: "Office Chair" });

  const selfChatResponse = await request(app)
    .post(`/api/chat/start/${listing.id}`)
    .set("Authorization", `Bearer ${seller.token}`);

  assert.equal(selfChatResponse.statusCode, 400);

  const firstStartResponse = await request(app)
    .post(`/api/chat/start/${listing.id}`)
    .set("Authorization", `Bearer ${buyer.token}`);

  assert.equal(firstStartResponse.statusCode, 201);
  const conversationId = firstStartResponse.body.conversation.id;

  const secondStartResponse = await request(app)
    .post(`/api/chat/start/${listing.id}`)
    .set("Authorization", `Bearer ${buyer.token}`);

  assert.equal(secondStartResponse.statusCode, 201);
  assert.equal(secondStartResponse.body.conversation.id, conversationId);

  const outsiderAccessResponse = await request(app)
    .get(`/api/chat/conversations/${conversationId}`)
    .set("Authorization", `Bearer ${outsider.token}`);

  assert.equal(outsiderAccessResponse.statusCode, 403);

  const sendMessageResponse = await request(app)
    .post(`/api/chat/conversations/${conversationId}/messages`)
    .set("Authorization", `Bearer ${buyer.token}`)
    .send({ text: "Is the chair still available?" });

  assert.equal(sendMessageResponse.statusCode, 201);
  assert.equal(sendMessageResponse.body.sentMessage.text, "Is the chair still available?");
  assert.equal(sendMessageResponse.body.conversation.unreadCounts.seller, 1);
  assert.deepEqual(
    sendMessageResponse.body.sentMessage.readBy.map(String),
    [String(buyer.user.id)],
  );

  const sellerMessagesResponse = await request(app)
    .get(`/api/chat/conversations/${conversationId}/messages`)
    .set("Authorization", `Bearer ${seller.token}`);

  assert.equal(sellerMessagesResponse.statusCode, 200);
  assert.equal(sellerMessagesResponse.body.messages.length, 1);

  const markReadResponse = await request(app)
    .patch(`/api/chat/conversations/${conversationId}/read`)
    .set("Authorization", `Bearer ${seller.token}`);

  assert.equal(markReadResponse.statusCode, 200);
  assert.equal(markReadResponse.body.conversation.unreadCounts.seller, 0);

  const updatedMessage = await Message.findById(sendMessageResponse.body.sentMessage.id).lean();
  assert.equal(updatedMessage.readBy.length, 2);
}

try {
  await setupDatabase();

  await runScenario("Auth API", testAuthApi);
  await runScenario("Listings API", testListingsApi);
  await runScenario("Saved Listings API", testSavedListingsApi);
  await runScenario("Profile API", testProfileApi);
  await runScenario("Chat API", testChatApi);

  console.log("All backend API tests passed.");
} finally {
  await teardownDatabase();
}
