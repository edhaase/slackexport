const assert = require("node:assert");
const fs = require("node:fs/promises");
const path = require("node:path");

const BASE_PATH = process.env.APP_BASE_PATH;
assert(BASE_PATH != null);
const THREAD_PATH = path.join(BASE_PATH, "threads");

exports.replies = async function* replies(client, channel, ts, limit = 1000) {
	assert(client != null);
	assert(channel != null);
	assert(ts != null);
	let has_next = true;
	let cursor = undefined;
	while (has_next) {
		const result = await client.conversations.replies({
			channel, ts,
			limit,
			cursor
		});
		assert(result.ok);
		for (const m of result.messages)
			yield m;

		const { has_more, response_metadata } = result;
		has_next = has_more;
		cursor = response_metadata.next_cursor;
	}
}

exports.download_replies = async function (client, channel, threadId) {
	await fs.mkdir(THREAD_PATH, { recursive: true });
	const tssanitized = threadId.toString().replace('.', '_');
	const filepath = path.join(THREAD_PATH, `${channel}_${tssanitized}.json`);

	const collection = [];
	for await (const message of exports.replies(client, channel, threadId)) {
		collection.push(message);
	}
	await fs.writeFile(filepath, JSON.stringify(collection, null, 2));
}