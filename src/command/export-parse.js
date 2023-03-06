
const fs = require("node:fs/promises");
const path = require("node:path");
const { program } = require("commander");
const users = require("../users.js");

const BASE_PATH = process.env.APP_BASE_PATH ?? "output/";
const HISTORY_PATH = path.join(BASE_PATH, "history");


async function* walk(dir) {
	for await (const d of await fs.opendir(dir)) {
		const entry = path.join(dir, d.name);
		if (d.isDirectory()) yield* walk(entry);
		else if (d.isFile()) yield entry;
	}
}


async function parse(filepath) {
	console.log(`Reading ${filepath}`);
	const parts = path.parse(filepath);
	const pt = parts.dir;
	const collection = [];
	const str = await fs.readFile(filepath, 'utf8');
	const obj = JSON.parse(str);
	for (const item of obj) {
		if (!item.user)
			continue;
		const user = await users.fetch_user(item.user);
		const entry = [item.ts, user.profile.real_name, item.type, item.subtype, item.text];
		collection.push(entry);
	}

	collection.sort();
	collection.forEach(x => x[0] = (new Date(x[0] * 1000)).toISOString());
	const dest_path = path.join(HISTORY_PATH, `${parts.name}.csv`);
	console.log(`Writing to ${dest_path}`);
	const file = await fs.open(dest_path, "w");
	try {
		const stream = await file.createWriteStream();
		for (const row of collection) {
			const line = row.map(col => `"${col}"`).join(',');
			stream.write(line);
			stream.write("\n")
		}
	} finally {
		await file?.close();
	}
}

program
	.argument("[channel]", "The channel id to parse", null)
	.action(async (id) => {
		if (id) {
			return await parse(path.join(HISTORY_PATH, `${id}.json`));
		} else {
			await require("async").eachOfLimit(await fs.opendir(HISTORY_PATH), 10, async (e) => {
				if (e.isFile() && e.name.endsWith("json"))
					await parse(path.join(HISTORY_PATH, e.name));
			});
		}
	})
	.parse()
	;
