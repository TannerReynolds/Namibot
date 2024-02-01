const fs = require('fs');
const path = require('path');

const fg = {
	red: '\x1b[31m',
	green: '\x1b[32m',
	blue: '\x1b[44m',
};
const endColor = '\x1b[0m';

console.log(`${fg.blue}CREATING PROPER CONFIG FILES${endColor}`);

function copyAndDelete(originalFile, newFile) {
	if (!fs.existsSync(originalFile)) {
		console.log(`${fg.red}ERROR: FILE ${originalFile} DOES NOT EXIST... CONTINUING WITHOUT CREATING THIS FILE${endColor}`);
		return;
	}

	fs.copyFileSync(originalFile, newFile);
	fs.unlinkSync(originalFile);
	console.log(`${fg.green}SUCCESSFULLY REPLACED ${originalFile} WITH ${newFile}${endColor}`);
}

const exampleEnvPath = path.join('../', 'example.env');
const envPath = path.join('../', '.env');

const exampleConfigPath = path.join('./', 'example.config.json');
const configPath = path.join('./', 'config.json');

console.log(`${fg.blue}REPLACING EXAMPLE.ENV WITH .ENV${endColor}`);
copyAndDelete(exampleEnvPath, envPath);
console.log(`${fg.blue}REPLACING EXAMPLE.CONFIG.JSON WITH CONFIG.JSON${endColor}`);
copyAndDelete(exampleConfigPath, configPath);

console.log(`${fg.green}SUCCESSFULLY CREATED CONFIG FILES${endColor}`);
