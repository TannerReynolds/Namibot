/*
const { remove } = require('confusables');
const log = require('../../utils/log');

async function wordFilter(content, message, modChannels) {
	let preProcessedContent = content;
	// Delete all zero width spaces
	preProcessedContent = preProcessedContent.replace(/\u200B/g, '');
	// Replace all whitespace/blank characters with a normal space
	preProcessedContent = preProcessedContent.replace(/\u3164/g, ' ');
	let cleanedContent = remove(preProcessedContent, '');
	
	const words = cleanedContent.split(' ');

	// To-do: Figure out how to properly process spaced inbetween characters for filter evasion
	//words.push(detectLookAlikes(words.join("")));

	let counter = 0;

	bannedsearch: for (let word of words) {
		counter++;
		if (counter > 30000) {
			break;
		}

		// Replace common characters with every letter of the alphabet to ensure they're not being used to bypass filter
		//if (word.toLowerCase().includes("x")) replaceAlphabet(/[xX]/g);
		if (word.toLowerCase().includes('*')) replaceAlphabet(/[\*]/g);
		if (word.toLowerCase().includes('@')) replaceAlphabet(/[\@]/g);
		if (word.toLowerCase().includes('!')) replaceAlphabet(/[\!]/g);
		if (word.toLowerCase().includes('#')) replaceAlphabet(/[\#]/g);
		if (word.toLowerCase().includes('$')) replaceAlphabet(/[\$]/g);
		if (word.toLowerCase().includes('%')) replaceAlphabet(/[\%]/g);
		if (word.toLowerCase().includes('1')) replaceAlphabet(/[\1]/g);

		// Replace any and all unicode characters with every letter of the alphabet
		if (/[^\u0000-\u007f]/.test(word.toLowerCase())) {
			let xReg = /[^\u0000-\u007f]/g;
			replaceAlphabet(xReg);
		}

		function replaceAlphabet(xReg) {
			words.push(word.replace(xReg, 'a'));
			words.push(word.replace(xReg, 'b'));
			words.push(word.replace(xReg, 'c'));
			words.push(word.replace(xReg, 'd'));
			words.push(word.replace(xReg, 'e'));
			words.push(word.replace(xReg, 'f'));
			words.push(word.replace(xReg, 'g'));
			words.push(word.replace(xReg, 'h'));
			words.push(word.replace(xReg, 'i'));
			words.push(word.replace(xReg, 'j'));
			words.push(word.replace(xReg, 'k'));
			words.push(word.replace(xReg, 'l'));
			words.push(word.replace(xReg, 'm'));
			words.push(word.replace(xReg, 'n'));
			words.push(word.replace(xReg, 'o'));
			words.push(word.replace(xReg, 'p'));
			words.push(word.replace(xReg, 'q'));
			words.push(word.replace(xReg, 'r'));
			words.push(word.replace(xReg, 's'));
			words.push(word.replace(xReg, 't'));
			words.push(word.replace(xReg, 'u'));
			words.push(word.replace(xReg, 'v'));
			words.push(word.replace(xReg, 'w'));
			words.push(word.replace(xReg, 'y'));
			words.push(word.replace(xReg, 'z'));
		}

		if (detectLookAlikes(word) !== word) {
			words.push(detectLookAlikes(word));
		}

		for (let bannedWord of bannedWords) {
			if (word.toLowerCase().includes(bannedWord.toLowerCase())) {
				
				message.reply('Banned word detected, please read and follow our rules regarding allowed language.').then(r => {
					modChannels[message.guild.id].send(`<@${message.author.id}>(${message.author.id}) sent banned word: \`${word}\``);
					message.delete();
					setTimeout(() => {
						r.delete();
					}, 4000);
				});
				break bannedsearch;
			}
		}
	}
	function detectLookAlikes(word) {
		return word.replace(/3/g, 'e').replace(/4/g, 'a').replace(/0/g, 'o').replace(/vV/g, 'u');
	}
}

module.exports = { wordFilter };*/
