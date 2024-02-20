const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const helmet = require('helmet');
const serverDir = './server/';
const { auth } = require(`${serverDir}confAuth`);
const { exec } = require('child_process');
const pass = randomToken(8, true);

app.set('view engine', 'ejs');
app.set('views', './server/views');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
	helmet({
		contentSecurityPolicy: false,
	})
);

app.use((req, res, next) => {
	if (req.path.startsWith('/editbotconf')) {
		const originalUrl = encodeURIComponent(req.originalUrl);
		console.log(`This is your password to access your config dashboard:\n${pass}`);
		res.redirect(`http://localhost:5652/auth?redirect=${originalUrl}`);
		next();
	} else {
		next();
	}
});

app.post('/auth', (req, res) => {
	res.setHeader('Content-Type', 'text/html');
	return auth(req, res, pass);
});

app.use(
	express.static('./server/public', {
		extensions: ['html', 'htm', 'css', 'js', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'json', 'txt'],
	})
);
app.use(
	express.static('./server/views', {
		extensions: ['css'],
	})
);

app.listen(5652, '0.0.0.0', () => {
	exec(`start http://localhost:5652/editbotconf`, error => {
		if (error) {
			console.error(`Error: ${error}`);
			return;
		}
	});
});

function randomToken(number, symbols) {
	number = parseInt(number, 10);
	let text = '';
	let possible;
	if (symbols !== true) {
		possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	} else {
		possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789~!@#$%^&*()-_=+[]{}|;:/?><,.';
	}
	for (let i = 0; i < number; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
