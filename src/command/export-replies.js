
const { program } = require("commander");

program
	.description("Manually download thread replies")
	.argument("<channel>", "Id of channel")
	.argument("<thread>", "Thread timestamp id")
	.action(async (ch, tid) => {
		const client = require("../client");
		const thread = require("../thread.js");
		await thread.download_replies(client, ch, tid)
	})
	.parse();