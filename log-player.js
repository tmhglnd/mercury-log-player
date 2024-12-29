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
const path = require('path');

const { program } = require('commander');
const { Client } = require('node-osc');
const { log } = require('console');

// the program options
program
	.option('-f --folder <path>')
	.option('-r --rate <playback rate>')
	.option('-l --length <specify length in seconds>')
	.option('-d --dateCreated <use date created instead of filename>');

// parse the arguments
program.parse(process.argv);

const options = program.opts();

// initialize osc client to send code to server
const osc = new Client('localhost', 4880);

if (process.argv.length < 3) {
	console.error('please provide options for folder and rate with -f and -r, more info with --help');
} else {
	
	// set the playbackrate (1 = same as performance, 2 = 2x faster)
	options.rate = options.rate ? options.rate : 1;
	options.length = options.length ? options.length : null;
	options.dateCreated = options.dateCreated ? parseInt(options.dateCreated) : 1;
	
	console.log('--folder:', options.folder);
	console.log('--rate:', options.rate);
	console.log('--length:', options.length);
	console.log('--dateCreated:', options.dateCreated);
	
	if (!options.folder){
		console.error('please provide a folder path with option -f');
		return;
	}
	
	console.log(`getting files from path...`);
	let logs = getFiles(options.folder);
	let playfiles = processFiles(logs);

	console.log(`starting playback... quit by hitting: Ctrl + C`);

	play(playfiles, options.rate);
}

function play(files, rate) {
	// get the first file of the list and remove
	let current = files.shift();

	// if undefined playback is done and exit
	if (current === undefined) {
		console.log('playback done!');
		return;
	}
	// get the waiting time for next playback, based on rate
	let time = current.wait / rate;
	console.log(`files left: ${files.length}, next in ${time}ms`);

	// send code over OSC-message for evaluating
	osc.send('/mercury-code', current.code);

	// set timeout for next playback
	setTimeout(() => { play(files, rate) }, time);
}

function getFiles(path) {
	// get the files from the path
	let logs = fg.globSync(`${path}/**/*.txt`);
	// sort them ascending order based on the filename
	// even if the file doesn't contain a timestamp it is sorted as well
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

		// get the date from the filename
		let file = path.parse(logs[i]);
		// JS Date string format: YYYY-MM-DDTHH:mm:ss.sssZ
		// Also works with format: YYYY.MM.DD_HH.mm.ss
		
		let d = file.name.match(/(\d+)/g);
		let logtime = '';		
		if (d){
			d.push('000');
			logtime = `${d[0]}-${d[1]}-${d[2]}T${d[3]}:${d[4]}:${d[5]}.${d[6]}`;
			logtime = Date.parse(logtime);
		}

		// if the timestamp is invalid or no stamp was detected use the
		// the specified option --length= in seconds
		if (isNaN(logtime) || !d){
			console.log('no time stamp in filename detected, using --length instead');
			if (options.length === null){
				console.error('specify length in seconds when not using timestamps');
				process.exit();
			}
		}

		// get the stats for date created
		let stats = fs.statSync(logs[i]);
		let wait = 0;

		if (_time > 0) {
			// if no total length specified
			if (!options.length){
				// if using the date created from the file stats
				if (options.dateCreated){
					wait = stats.birthtime - _time;
				} else {
					console.log('using logtime');
					wait = logtime - _time;
				}
			} else {
				// if using a total time and no timestamps divide evenly
				wait = Math.floor((options.length * 1000) / logs.length);
			}
			console.log('wait', wait);

			playfiles[i - 1].time = _time;
			playfiles[i - 1].wait = wait;
		}

		_total += wait;
		_time = options.dateCreated ? stats.birthtime : logtime;
	}

	// print the total runtime in min:sec:ms
	console.log(`total performance time: ${ms2time(_total)}`);
	console.log(`runtime with playbackrate: ${ms2time(_total / options.rate)}\n`);
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