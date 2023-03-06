
const { program } = require("commander");
const assert = require("node:assert");

const users = require("../users");

program
	.action(async () => {
		// Load token
		const client = require("../client");

		// Fetch channels
		const response = await client.conversations.list({ types: 'im,private_channel,public_channel' });
		assert(response.ok);

		const channel_names = await Promise.all(response.channels.map(c => get_friendly_channel_name(c)));
		console.log('Channels: ', channel_names);
	})
	.parse()
	;

async function get_friendly_channel_name(ch) {
	if (ch.user)
		return (await users.fetch_user(ch.user)).profile.real_name;
	return ch.name || ch.id;
}