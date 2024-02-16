const express = require('express');
const http = require('http');
const { exec } = require('child_process');
const { server } = require('./config');

const app = express();
app.use(express.json());

const monitorPort = 3661;
let monitoredAppPID = null;

app.post('/register', (req, res) => {
	monitoredAppPID = req.body.pid;
	console.log(`Registered monitored app with PID: ${monitoredAppPID}`);
	res.status(200).send({ message: 'Monitored app registered successfully' });
});

const monitoredAppURL = `http://localhost:${server.PORT}/heartbeat`;
const timeoutMs = 5000;

function checkHeartbeat() {
	const request = http.get(monitoredAppURL, res => {
		let data = '';
		res.on('data', chunk => (data += chunk));
		res.on('end', () => {
			return;
		});
	});

	request.on('error', err => {
		console.error('Error checking monitored app:', err.message);
		terminateMonitoredApp();
	});

	request.setTimeout(timeoutMs, () => {
		console.log('Monitored app is unresponsive, terminating...');
		request.abort();
		terminateMonitoredApp();
	});
}

function terminateMonitoredApp() {
	if (monitoredAppPID) {
		// eslint-disable-next-line no-unused-vars
		exec(`kill -SIGINT ${monitoredAppPID}`, (error, stdout, stderr) => {
			if (error) {
				console.error(`Error terminating monitored app: ${error}`);
				return;
			}
			console.log(`Monitored app terminated.`);
		});
	} else {
		console.log('Monitored app PID not set.');
	}
}

app.listen(monitorPort, () => {
	console.log(`Monitor app listening on port ${monitorPort}`);
	setInterval(checkHeartbeat, 10000);
});
