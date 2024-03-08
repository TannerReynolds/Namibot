const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');

const fg = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
};
const endColor = '\x1b[0m';

const psChocoInstall = `@"%SystemRoot%\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -NoProfile -InputFormat None -ExecutionPolicy Bypass -Command "[System.Net.ServicePointManager]::SecurityProtocol = 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))" && SET "PATH=%PATH%;%ALLUSERSPROFILE%\\chocolatey\\bin"`;
const chocoPSQLInstall = `choco install postgresql --version 16.1.0 -y`;

function copyAndReplaceConfigFiles() {
    console.log(`${fg.blue}CREATING PROPER CONFIG FILES${endColor}`);

    const configFiles = [
        { src: '../example.env', dest: '../.env' },
        { src: './example.config.json', dest: './config.json' },
    ];

    configFiles.forEach(({ src, dest }) => {
        const originalFile = path.join(__dirname, src);
        const newFile = path.join(__dirname, dest);

        if (!fs.existsSync(originalFile)) {
            console.log(`${fg.red}ERROR: FILE ${originalFile} DOES NOT EXIST... CONTINUING WITHOUT CREATING THIS FILE${endColor}`);
            return;
        }

        fs.copyFileSync(originalFile, newFile);
        fs.unlinkSync(originalFile);
        console.log(`${fg.green}SUCCESSFULLY REPLACED ${originalFile} WITH ${newFile}${endColor}`);
    });

    console.log(`${fg.green}SUCCESSFULLY CREATED CONFIG FILES${endColor}`);
}

function checkChocolateyInstalled(callback) {
    exec('choco --version', (error, stdout, stderr) => {
        if (error) {
            console.log(`${fg.red}Chocolatey is not installed. Installing Chocolatey...${endColor}`);
            exec(psChocoInstall, (error, stdout, stderr) => {
                if (error) {
                    console.error(`${fg.red}Failed to install Chocolatey: ${stderr}${endColor}`);
                    process.exit(1);
                } else {
                    console.log(`${fg.green}Chocolatey installed successfully.${endColor}`);
                    callback();
                }
            });
        } else {
            console.log(`${fg.green}Chocolatey is already installed.${endColor}`);
            callback();
        }
    });
}

function checkAndInstallPostgreSQL() {
    const dbPath = {
        win32: path.join('C:', 'Program Files', 'PostgreSQL'),
        linux: '/usr/local/pgsql',
    }[os.platform()];

    if (!dbPath || !fs.existsSync(dbPath)) {
        console.log(`${fg.blue}PostgreSQL is not installed. Installing PostgreSQL...${endColor}`);
        exec(chocoPSQLInstall, (error, stdout, stderr) => {
            if (error) {
                console.log(`${fg.red}ERROR WHILE RUNNING INSTALL SCRIPT FOR POSTGRESQL: ${stderr}${endColor}`);
            } else {
                console.log(`${fg.green}PostgreSQL installed successfully.${endColor}`);
            }
        });
    } else {
        console.log(`${fg.green}PostgreSQL is already installed.${endColor}`);
    }
}

function main() {
    copyAndReplaceConfigFiles();
    checkChocolateyInstalled(checkAndInstallPostgreSQL);
}

main();