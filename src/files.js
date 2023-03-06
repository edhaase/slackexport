const { jsonWriter } = require("./writer");
const assert = require("node:assert");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const https = require("node:https"); // or 'https' for https:// URLs
const path = require("node:path");

const BASE_PATH = process.env.APP_BASE_PATH ?? "output/";
const FILES_PATH = path.join(BASE_PATH, "files");

/**
 * Download all files to a path
 * @param {*} client 
 */
exports.download_files = async function (client, concurrentLimit = 5) {
	assert(client != null);
	await fsp.mkdir(FILES_PATH, { recursive: true });

	let count = 0;
	const writer = jsonWriter(path.join(FILES_PATH, "metadata.json"));
	const itr = exports.iter_files(client);
	await require("async").eachOfLimit(itr, concurrentLimit, async (f) => {
		count++;
		writer.next(f);
		const sz = humanFileSize(f.size);
		console.log(`[${f.id}] [${f.name}] [${sz}] [${f.mode}] [${f.filetype}]`);
		if (f.url_private) {
			await download_file(f.url_private, FILES_PATH, `${f.id}_${f.name}`);
		}
	});
	writer.next(null);
	console.log(`Found ${count} files`);

}

function humanFileSize(size) {
	var i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
	return (size / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
}

exports.iter_files = async function* iter_files(client) {
	assert(client != null);
	let max_page = Infinity;
	let p = 0;
	// for (p= 1; p < max_page; p++) {
	while (++p < max_page) {
		const result = await client.files.list({
			page: p
		});
		assert(result.ok);
		for (const f of result.files)
			yield f;

		const { pages } = result.paging;
		// console.log(result.files.length);
		max_page = pages ?? 1;
	}
}

async function download_file(url, dir, name) {
	assert(url);
	await fsp.mkdir(dir, { recursive: true });
	const filepath = path.join(dir, name);
	return new Promise((res, rej) => {
		const file = fs.createWriteStream(filepath);
		console.log(`Downloading ${url} to ${filepath}`)
		const request = https.get(url, {
			headers: {
				"Authorization": `Bearer ${process.env.TOKEN}`
			}
		}, function (response) {
			response.pipe(file);

			// after download completed close filestream
			file.on("finish", () => {
				file.close();
				res();
			});
		});
	});

}
