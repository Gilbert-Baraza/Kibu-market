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
const { clearRateLimitStore } = await import("../src/middleware/rateLimit.js");
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

const tinyPngBuffer = Buffer.from(
  "89504e470d0a1a0a0000000d4948445200000001000000010802000000907753de0000000c49444154789c636060000000040001f61738550000000049454e44ae426082",
  "hex",
);

function buildOversizedBuffer() {
  return Buffer.alloc((5 * 1024 * 1024) + 1024, 0x41);
}

function parseAuditEntries(messages) {
  return messages
    .filter((entry) => typeof entry === "string" && entry.startsWith("[audit] "))
    .map((entry) => JSON.parse(entry.slice(8)));
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
  clearRateLimitStore();
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

  const noPhonePayload = buildUserPayload({ phone: "" });
  const noPhoneRegisterResponse = await request(app)
    .post("/api/auth/register")
    .send(noPhonePayload);

  assert.equal(noPhoneRegisterResponse.statusCode, 201);
  assert.equal(noPhoneRegisterResponse.body.user.phone, "");

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

async function testSecurityHeadersApi() {
  const healthResponse = await request(app).get("/health");

  assert.equal(healthResponse.statusCode, 200);
  assert.equal(healthResponse.body.environment, "test");
  assert.equal(healthResponse.headers["cache-control"], "no-store");
  assert.equal(healthResponse.headers["x-frame-options"], "SAMEORIGIN");
  assert.equal(healthResponse.headers["x-content-type-options"], "nosniff");
  assert.equal(healthResponse.headers["referrer-policy"], "no-referrer");
  assert.match(healthResponse.headers["permissions-policy"], /camera=\(\)/i);
  assert.equal(healthResponse.headers["x-powered-by"], undefined);

  const authPayload = buildUserPayload({ name: "Header Check User" });
  const authResponse = await request(app)
    .post("/api/auth/register")
    .send(authPayload);

  assert.equal(authResponse.statusCode, 201);
  assert.equal(authResponse.headers["cache-control"], "no-store");
}
async function testListingsApi() {
  const seller = await registerUser({ name: "Seller Student" });
  const stranger = await registerUser({ name: "Other Student" });

  const missingImagesResponse = await request(app)
    .post("/api/listings")
    .set("Authorization", "Bearer " + seller.token)
    .send(buildListingPayload({ images: [] }));

  assert.equal(missingImagesResponse.statusCode, 400);
  assert.equal(missingImagesResponse.body.message, "Validation failed.");
  assert.ok(missingImagesResponse.body.details.some((error) => /between 1 and 3 images/i.test(error.message)));

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

async function testUploadsApi() {
  const user = await registerUser({ name: "Upload Tester" });

  const validUploadResponse = await request(app)
    .post("/api/uploads")
    .set("Authorization", `Bearer ${user.token}`)
    .attach("file", tinyPngBuffer, {
      filename: "campus-chair.png",
      contentType: "image/png",
    });

  assert.equal(validUploadResponse.statusCode, 201);
  assert.match(validUploadResponse.body.url, /\/uploads\//i);
  assert.equal(validUploadResponse.body.file.mimetype, "image/png");
  assert.match(validUploadResponse.body.file.filename, /\.png$/i);

  const multiUploadResponse = await request(app)
    .post("/api/uploads")
    .set("Authorization", `Bearer ${user.token}`)
    .attach("files", tinyPngBuffer, {
      filename: "campus-chair-front.png",
      contentType: "image/png",
    })
    .attach("files", tinyPngBuffer, {
      filename: "campus-chair-side.png",
      contentType: "image/png",
    })
    .attach("files", tinyPngBuffer, {
      filename: "campus-chair-back.png",
      contentType: "image/png",
    });

  assert.equal(multiUploadResponse.statusCode, 201);
  assert.equal(multiUploadResponse.body.urls.length, 3);
  assert.equal(multiUploadResponse.body.files.length, 3);

  const fakeImageResponse = await request(app)
    .post("/api/uploads")
    .set("Authorization", `Bearer ${user.token}`)
    .attach("file", Buffer.from("not really an image"), {
      filename: "notes.png",
      contentType: "image/png",
    });

  assert.equal(fakeImageResponse.statusCode, 400);
  assert.match(fakeImageResponse.body.message, /not a valid supported image/i);

  const oversizedUploadResponse = await request(app)
    .post("/api/uploads")
    .set("Authorization", `Bearer ${user.token}`)
    .attach("file", buildOversizedBuffer(), {
      filename: "huge.png",
      contentType: "image/png",
    });

  assert.equal(oversizedUploadResponse.statusCode, 400);
  assert.match(oversizedUploadResponse.body.message, /5mb or smaller/i);
}
async function testAuditLoggingApi() {
  const auditMessages = [];
  const originalConsoleInfo = console.info;
  console.info = (message) => {
    auditMessages.push(message);
  };

  try {
    const seller = await registerUser({ name: "Audit Seller" });

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: seller.payload.email,
        password: seller.payload.password,
      });

    assert.equal(loginResponse.statusCode, 200);

    const profileResponse = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${loginResponse.body.token}`)
      .send({
        name: "Audit Seller Updated",
        phone: "0799999999",
      });

    assert.equal(profileResponse.statusCode, 200);

    const listing = await createListing(loginResponse.body.token, { title: "Audit Chair" });

    const deleteResponse = await request(app)
      .delete(`/api/listings/${listing.id}`)
      .set("Authorization", `Bearer ${loginResponse.body.token}`);

    assert.equal(deleteResponse.statusCode, 200);
  } finally {
    console.info = originalConsoleInfo;
  }

  const entries = parseAuditEntries(auditMessages);
  const loginEntry = entries.find((entry) => entry.action === "auth.login" && entry.status === "success");
  const profileEntry = entries.find((entry) => entry.action === "user.profile.update");
  const listingDeleteEntry = entries.find((entry) => entry.action === "listing.delete");

  assert.ok(loginEntry);
  assert.equal(loginEntry.target.type, "user");
  assert.ok(loginEntry.request.id);

  assert.ok(profileEntry);
  assert.deepEqual(profileEntry.metadata.changedFields.sort(), ["name", "phone"]);

  assert.ok(listingDeleteEntry);
  assert.equal(listingDeleteEntry.target.type, "listing");
  assert.equal(listingDeleteEntry.metadata.title, "Audit Chair");
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

async function testRateLimitingApi() {
  const loginUser = await registerUser({ name: "Rate Limited Login User" });

  clearRateLimitStore();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: loginUser.payload.email,
        password: loginUser.payload.password,
      });

    assert.equal(loginResponse.statusCode, 200);
  }

  const blockedLoginResponse = await request(app)
    .post("/api/auth/login")
    .send({
      email: loginUser.payload.email,
      password: loginUser.payload.password,
    });

  assert.equal(blockedLoginResponse.statusCode, 429);
  assert.match(blockedLoginResponse.body.message, /too many authentication attempts/i);
  assert.ok(blockedLoginResponse.headers["retry-after"]);

  clearRateLimitStore();
  const seller = await registerUser({ name: "Rate Limited Seller" });
  clearRateLimitStore();

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const listingResponse = await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${seller.token}`)
      .send(buildListingPayload({ title: `Rate Limited Listing ${attempt}` }));

    assert.equal(listingResponse.statusCode, 201);
  }

  const blockedListingResponse = await request(app)
    .post("/api/listings")
    .set("Authorization", `Bearer ${seller.token}`)
    .send(buildListingPayload({ title: "Rate Limited Listing Blocked" }));

  assert.equal(blockedListingResponse.statusCode, 429);
  assert.match(blockedListingResponse.body.message, /too many listing updates/i);

  clearRateLimitStore();
  const buyer = await registerUser({ name: "Rate Limited Buyer" });
  const chatListing = await createListing(seller.token, { title: "Chat Rate Limit Chair" });

  clearRateLimitStore();

  const startConversationResponse = await request(app)
    .post(`/api/chat/start/${chatListing.id}`)
    .set("Authorization", `Bearer ${buyer.token}`);

  assert.equal(startConversationResponse.statusCode, 201);

  for (let attempt = 0; attempt < 19; attempt += 1) {
    const chatResponse = await request(app)
      .get("/api/chat/conversations")
      .set("Authorization", `Bearer ${buyer.token}`);

    assert.equal(chatResponse.statusCode, 200);
  }

  const blockedChatResponse = await request(app)
    .get("/api/chat/conversations")
    .set("Authorization", `Bearer ${buyer.token}`);

  assert.equal(blockedChatResponse.statusCode, 429);
  assert.match(blockedChatResponse.body.message, /too many chat requests/i);
}

try {
  await setupDatabase();

  await runScenario("Auth API", testAuthApi);
  await runScenario("Security Headers API", testSecurityHeadersApi);
  await runScenario("Listings API", testListingsApi);
  await runScenario("Saved Listings API", testSavedListingsApi);
  await runScenario("Uploads API", testUploadsApi);
  await runScenario("Audit Logging API", testAuditLoggingApi);
  await runScenario("Profile API", testProfileApi);
  await runScenario("Chat API", testChatApi);
  await runScenario("Rate Limiting API", testRateLimitingApi);

  console.log("All backend API tests passed.");
} finally {
  await teardownDatabase();
}















