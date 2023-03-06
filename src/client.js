/**
 * Common file for creating and loading the API client in a consistent way
 */
const assert = require("node:assert");

require("dotenv").config();
assert(process.env.TOKEN != null, "No token supplied");

const { WebClient } = require("@slack/web-api");
client = new WebClient(process.env.TOKEN);

assert(client != null, "Failed to create API client");

module.exports = client;