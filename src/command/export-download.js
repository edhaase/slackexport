/**
 * 
 */

const { program } = require("commander");
const { jsonWriter } = require("../writer");
const assert = require("node:assert");
const fs = require("node:fs/promises");
const path = require("node:path");
const thread = require("../thread.js");
const users = require("../users.js");

const BASE_PATH = process.env.APP_BASE_PATH;
assert(BASE_PATH != null);
const HISTORY_PATH = path.join(BASE_PATH, "history");

program
	.option("-a, --all", "download all data")
	.option("-c, --channel [name]", "download one or all channels (including threads)")
	.option("-f, --files", "download files")
	.option("-u, --users", "download user information (needed for parsing)")
	.action(async () => {
		const opts = program.opts();
		if (Object.keys(opts).length <= 0) {
			return program.help();
		}

		const client = require("../client");
		
		if (opts.all || opts.users) {
			await users.download_users(client);
		}

		if (opts.all || opts.channel) {
			if (typeof opts.channel === "string") {
				await download_channel(client, opts.channel);
			} else {
				await download_all_channels(client);
			}
		}

		if (opts.all || opts.files) {
			await require("../files").download_files(client);
		}

	})
	.parse()
	;

async function download_all_channels(client) {
	const { channels } = await client.conversations.list({ types: 'im,private_channel,public_channel' });
	await require("async").eachOfLimit(channels, 5, async (c) => await download_channel(client, c.id) );
}

async function download_channel(client, cid) {
	await fs.mkdir(path.join(BASE_PATH, "channel_info"), { recursive: true });
	await fs.mkdir(path.join(BASE_PATH, "history"), { recursive: true });
	// Find and save channel info
	const info = (await client.conversations.info({ channel: cid }));
	assert(info.ok);
	const c = info.channel;
	const filename = `${c.id}.json`;
	await fs.writeFile(path.join(BASE_PATH, "channel_info", filename), JSON.stringify(info.channel, null, 2));

	/* let dest_name = c.name || c.id;
	if (c.is_im) {
		const user = await users.fetch_user(c.user);
		console.log(`Downloading conversation history with ${user.profile.real_name || user.name} (${c.id})`);
		dest_name = user.name;
	} else if (c.is_private) {
		console.log(`Downloading private channel ${c.name || c.id} (${c.id})`);
	} else {
		console.log(`Downloading channel ${c.name || c.id} (${c.id})`);
	}
	await fs.mkdir(path.join(BASE_PATH, "history", dest_name), { recursive: true }); */

	let count = 0;

	const historyfilepath = path.join(HISTORY_PATH, filename);
	// Write conversation history to disk
	console.log(`Writing conversation history to ${historyfilepath}`)
	const writer = jsonWriter(historyfilepath);
	for await (const page of iter_history(client, c)) {
		count += 1;
		// const chunkpath = path.join(HISTORY_PATH, dest_name, `${count}.json`);
		// console.log(`Writing chunk ${chunkpath} to disk`);
		// await fs.writeFile(chunkpath, JSON.stringify(page, null, 2));
		for (const msg of page) {
			writer.next(msg);
			if (!msg.thread_ts) continue;
			await thread.download_replies(client, c.id, msg.thread_ts);
		}
	}
	writer.next(null); // close writer
}

async function* iter_history(client, c) {
	let has_next = true;
	let cursor = undefined;
	while (has_next) {
		const result = await client.conversations.history({
			channel: c.id,
			limit: 1000,
			cursor
		});
		assert(result.ok);
		yield result.messages;

		const { has_more, response_metadata } = result;
		has_next = has_more;
		cursor = response_metadata.next_cursor;
	}
}