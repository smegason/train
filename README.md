# train
"Train" is a completely visual programming language to teach 2-6 year olds how to code.

Programs in Train look just like a wooden toy train set. Executing a program means starting the engines and watching the trains move about the tracks. Each engine represents a seperate thread so a multithreaded program is just train tracks with multiple trains. Cars attached to an engine are variables/memory. Cargo that rest on cars is the value of the variable. There are several sets of cargo that represent different data types in Train including numbers, colors, letters, binary, and dinosaurs. Program control is provided by forks ("wyes") and physcial loops in the track which implement if/then and while/loop logic. Stations in Train allow wooden blocks to be operated on including adding a value to memory (adding a block to a car), freeing memory (removing a block from a car), incrementing, decrementing, addition, subtraction, multiplication, and division. Wyes include greater than, less than, lazy, sprung, prompt, and random. Slingshot and catapult station remove blocks from cars and place them on the ground as a form of output. "Magic" tunnels act as goto statements allowing for the creation of functions. Programs are created in Train by simply drawing them on the screen--drawing tracks and wyes and placing engines, cars, cargo, and stations.

The train editor/interpretor is written in Javascript. The javascript code is wrapped using Cordova to make apps for different device platforms. The graphics are all prerendered using Blender--engines, cars, and cargo are rendered as pngs from 64 directions to allow animation, while tracks and stations are rendered from 8 directions for different orientations. All code is open source under a GPLv2 license.

Train is being developed in the same spirit as Scratch from MIT but targeting a younger age group. The goal is to teach kids coding concepts as well as numbers, colors, math, and logic in the course of playing. Kids do not need to know how to read in order to program Train unlike other "visual" programming languages. Train simplifies and merges many concepts from other programming languages--for example in other programming languages source code, compiled code, memory, and output are all different things that together define a program's state whereas in Train the train track is everything (code, memory, output) so program state is simply the current physical location of all the tracks, stations, engines, cars, and blocks.

Train was inspired while I was playing with my then 2 year old son Noah who naturally loved to build using his wooden train sets and wooden blocks with letters, animals, etc. I was inspired by his natural curiosity and tenacity in building and by the non-trivial logic that the resulting tracks could provide using simple primitives (such as lazy wyes). Coding was an important part of my childhood. I discovered many concepts in mathematics, logic, and even art by coding. Coding helped drive my interest in science and lead me to my current profession of a professor/scientist. I see coding as a basic skill that everyone can benefit from and perhaps the best way to engage kids from all backgrounds to pursue STEM career paths. Tablets, phones, and computers are much more ubiquitous, safe, and cheaper than e.g. a chemistry set or other apperatuses required for science experiments. But through coding, kids can learn to explore their curiosity, to build, create, and learn logic.

PROGRAMMING GUIDE

www/js/train.js - this is the main javascript code file for Train

Train can be run on the web just with the www/ folder.

The source files for the rendered images in train can be found in ImgSource/ and can be rendered with Blender

Train can be wrapped in Cordova by installing Cordova and the Splashscreen plugin and then copying this www folder in place of the default one, and using this "config.xml" file.
