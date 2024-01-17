const { toENTime } = require('../src/utils/toEN');

async function ok() {
	let res = await toENTime('十時間');
}

ok();
