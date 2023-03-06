const assert = require("node:assert");
const fs = require("node:fs/promises");
const path = require("node:path");

const BASE_PATH = process.env.APP_BASE_PATH;
assert(BASE_PATH != null);
const USER_PATH = path.join(BASE_PATH, "users");

const USERS = {};
exports.fetch_user = async function(id) {
	if (!USERS[id]) {
		const str = await fs.readFile(path.join(USER_PATH, `${id}.json`));
		USERS[id] = JSON.parse(str);
	}
	return USERS[id];
}

exports.download_users = async function (client) {
	const response = await client.users.list();
	assert(response.ok);
	await fs.mkdir(USER_PATH, { recursive: true });
	for (const user of response.members) {
		console.log(`Writing user data for ${user.profile.real_name || user.name} (${user.id})`);
		const info = (await client.users.info({ user: user.id })).user;
		await fs.writeFile(`${USER_PATH}/${user.id}.json`, JSON.stringify(info, null, 2));
	}
}