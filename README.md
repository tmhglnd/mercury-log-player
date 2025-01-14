# 🌕 Mercury Log Player

**Welcome to Mercury! ✌️ ☮️ Make Music, Not War!** ☮️ ✌️

This is a package for the *Mercury Live Coding Environment*. With this package you can play back log files that were saved during a live coding performance with the Mercury4Max version. To save these log files make sure you enable `Auto Log Sketch` in the Mercury Window. Afterwards you can move the files you wanna replay to a folder, then load that folder in this script and the code will be played back.

[![](https://img.shields.io/static/v1?label=Join%20the%20Discord&message=%E2%9D%A4&logo=Discord)](https://discord.gg/vt59NYU)
[![](https://img.shields.io/static/v1?label=Support%20on%20Ko-Fi&message=%E2%9D%A4&logo=Kofi)](https://ko-fi.com/I2I3SV7FX)
[![](https://img.shields.io/static/v1?label=Support%20on%20Patreon&message=%E2%9D%A4&logo=Patreon)](https://www.patreon.com/bePatron?u=9649817)

## 📟 Mercury? 

**Mercury is a free/open-source, beginner-friendly, minimal and human-readable language for the live coding of algorithmic electronic music performances**

[**🚀 Go to the Mercury4Max Project**](https://github.com/tmhglnd/mercury)

[**👾 Or start sketching in the browser:**](https://mercury.timohoogland.com)

# 🚀 How to use this Log Player

## Install

Clone the repo in your prefered location

`$ git clone https://github.com/tmhglnd/mercury-log-player.git`

`$ cd mercury-log-player`

Install the node modules

`$ npm install`

## Usage

Create a folder with Mercury Log Files you like to replay. If you don't have any log files, you can create them by turning on `Auto Log Sketch` in the Mercury window, and start performing. The player looks at the `date created` info in all the files and based on that determines when the next file should be executed. In general a Mercury log file also includes the the time in the filename, for example: `sketch_2024.11.24_00.13.20.txt`, but this timestamp is not needed when using the date created.

In the repository run:

`$ node log-player.js --folder ~/Path/To/Files`

This will start the playback, sending code as OSC-message to port `4880` with address `/mercury-code`. Make sure you have Mercury4Max running to hear the playback.

Optionally you can adjust the playback rate:

`$ node log-player.js --folder <path> --rate 4`

This will play the files back 4x faster, so if the original performance was 20 minutes, this will be 5 minutes.

To disable the usage of "date created" info in the file and use your custom timestamps in the form of: `yyyy.mm.dd_hh.mm.ss` run:

`$ node log-player.js --folder <path> --dateCreated=0` or `-d 0`

When using filenames that don't have any timestamp, and you also don't want to use the "date created" info, you can specify a total length for the piece in `seconds` and the total time will be divided by the number of files and the evaluation-time will be split evenly.

`$ node log-player.js --folder <path> --dateCreated=false --length=240` or `-l 240`

Shorthand for options:

`$ node log-player.js -f <path> -r <number>`