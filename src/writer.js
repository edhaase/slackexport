const fs = require("node:fs");
/**
 * Writes a sequence of objects to a json file, while keeping the cruft out of the way
 * 
 * const writer = jsonWriter(path.join(FILES_PATH, "metadata.json"));
 * writer.next(obj);  // to send an object to file
 * writer.next(null); // to close
 * 
 * @param {} filepath 
 */
exports.jsonWriter = function jsonWriter(filepath) {
	// This little IIFE creates and primes the generator to fix an issue with the first
	// .next call droping an item.
	const g = (function* gen() {
		const file = fs.createWriteStream(filepath);
		file.write("[\n");
		let first = true;
		try {
			let obj;
			while ((obj = yield) != null) {
				if (!first) file.write(",\n");
				file.write(JSON.stringify(obj, null, 2));
				first = false;
			}
		} finally {
			file.write("]");
			file.close();
		}
	})();
	g.next();
	return g;
}