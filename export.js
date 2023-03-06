/**
 *
 */
const { program } = require("commander");
const { version } = require("./package.json");
const fs = require("node:fs");

require("dotenv").config()
process.env.APP_BASE_PATH ??= "output";

program
	.name("export")
	.description("Create a local download of your slack data for safe keeping.\n\n" + fs.readFileSync("usage.txt"))
	.version(version)
	.executableDir("src/command")
	.command("download", "download history for one or more channels")
	.command("list", "list channels user is in")
	.command("parse [channel]", "parse downloaded history")
	.command("repl", "launch slack client repl")
	.command("replies <channel> <thread>", "manually download thread replies")
	.parse()
	;