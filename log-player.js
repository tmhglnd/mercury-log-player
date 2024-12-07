// 
// Mercury Log File Replayer
// 
// written by Timo Hoogland, 2024, www.timohoogland.com
// GNU GPL-3.0 License
// 
// Replay the log files from a performance based on the date created
// code is send as an osc-message to port 4880 on address /mercury-code
// this is the default port Mercury is listening to when using flok/pulsar
//

const fs = require('fs');
const fg = require('fast-glob');

const { program } = require('commander');
const { Client } = require('node-osc');

// the program options
program
	.option('-f --folder <path>')
	.option('-r --rate <playback rate>');

// parse the arguments
program.parse(process.argv);

const options = program.opts();

// initialize osc client to send code to server
const osc = new Client('localhost', 4880);

let playbackrate = 1;

if (process.argv.length < 3) {
	console.error('please provide options for folder and rate with -f and -r, more info with --help');
} else {
	
	// set the playbackrate (1 = same as performance, 2 = 2x faster)
	playbackrate = options.rate ? options.rate : 1;
	
	console.log('--folder:', options.folder);
	console.log('--rate:', playbackrate);
	
	if (!options.folder){
		console.error('please provide a folder path with option -f');
		return;
	}
	
	console.log(`getting files from path...`);
	let logs = getFiles(options.folder);
	let playfiles = processFiles(logs);

	console.log(`starting playback... quit by hitting: Ctrl + C`);

	play(playfiles);
}

function play(files) {
	// get the first file of the list and remove
	let current = files.shift();

	// if undefined playback is done and exit
	if (current === undefined) {
		console.log('playback done!');
		osc.close();
		process.exit();
		return;
	}
	// get the waiting time for next playback, based on rate
	let time = current.wait / playbackrate;
	console.log(`files left: ${files.length}, next in ${time}ms`);

	// send code over OSC-message for evaluating
	osc.send('/mercury-code', current.code);

	// set timeout for next playback
	setTimeout(() => { play(files) }, time);
}

function getFiles(path) {
	// get the files from the path
	let logs = fg.globSync(`${path}/**/*.txt`);
	// sort them ascending order based on the filename
	logs.sort();
	console.log(`found files: ${logs.length}`);

	return logs;
}

function processFiles(logs) {
	// the start time is 0
	let _time = 0;
	let _total = 0;

	let playfiles = [];

	for (let i = 0; i < logs.length; i++) {
		// get code content
		let code = fs.readFileSync(logs[i], 'utf-8');

		playfiles.push({
			code: code,
			time: 0,
			wait: undefined
		});

		// get the stats for date created
		let stats = fs.statSync(logs[i]);
		let wait = 0;

		if (_time > 0) {
			wait = stats.birthtime - _time;
			playfiles[i - 1].time = _time;
			playfiles[i - 1].wait = wait;
		}

		_total += wait;
		_time = stats.birthtime;
		// console.log(logs[i], _time, wait);
	}

	// print the total runtime in min:sec:ms
	console.log(`total performance time: ${ms2time(_total)}`);
	console.log(`runtime with playbackrate: ${ms2time(_total / playbackrate)}\n`);
	console.log();

	return playfiles;
}

function ms2time(ms){
	// convert milliseconds to min:sec:ms string for time display
	let mls = Math.floor(ms % 1000);
	let sec = Math.floor(ms / 1000) % 60;
	let min = Math.floor(ms / 60000) % 60;
	return `${min}:${sec}:${mls}`;
}