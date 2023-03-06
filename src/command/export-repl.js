/**
 * Launch a repl with the slack client
 */
const repl = require("node:repl");

repl.start('> ').context.client = require("../client");