// Processing all regex in another thread to deter blocking the main thread
const { Worker } = require('worker_threads');

function matchRegex(regexPattern, message) {
	// Return a Promise from the function
	return new Promise((resolve, reject) => {
		const worker = new Worker(`${__dirname}/workerThreads/matchRegex.js`, { workerData: { regex: regexPattern, message } });

		const timeoutId = setTimeout(() => {
			worker.terminate().then(() => {
				reject(new Error('Regex processing worker operation timed out')); // Reject the Promise on timeout
			});
		}, 3000);

		worker.on('message', result => {
			clearTimeout(timeoutId);
			resolve(result); // Resolve the Promise with the worker's result
		});

		worker.on('error', e => {
			reject(new Error(`Worker error: ${e.message}`)); // Reject the Promise on worker error
		});

		worker.on('exit', code => {
			clearTimeout(timeoutId);
			if (code !== 0) {
				reject(new Error(`Worker stopped with exit code ${code}`)); // Reject the Promise if worker exits with error code
			}
		});
	});
}

module.exports = { matchRegex };
