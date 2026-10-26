	// Written by Sean Megason, megason@hms.harvard.edu
	
	/*  Copyright (c) 2018, Sean Gregory Megason, Harvard Univeristy
		All rights reserved.
		
		Train source code is licensed under GPLv2.0
		as found here (https://opensource.org/licenses/GPL-2.0)
        
---------------
        Licenses for art:
        Bear- made by Oriole from http://www.blendswap.com/blends/view/76070 is CC-BY
        Toy Rabbit purchased (by alesya5enot on TurboSquid) Royalty free license

	 */
	
	
	
 //import GoogleAnalytics;

Storage.prototype.setObject = function(key, value) {
    this.setItem(key, JSON.stringify(JSON.decycle(value)));
}

Storage.prototype.getObject = function(key) {
	//console.log("Get object key"+key);
    var value = this.getItem(key);
    return value && JSON.retrocycle(JSON.parse(value));
}
	

$(document).ready(function(){

	var debugMode = false; 
	var allLevelsUnlocked = false;
	var platform = "ios"; //["web","ios","android"]
	
	console.log("READY");
	console.log("press shift for pan, and option for zoom.");
		
    window.addEventListener('orientationchange', doOnOrientationChange);
       
    window.addEventListener('mousewheel', function(e){
    	doMouseWheel(e);
    }, false);
	
	//touch detection
    window.addEventListener('touchstart', function(e){
		doTouchStart(e);
		e.stopPropagation();
		e.preventDefault();
    }, false);
    
    window.addEventListener('touchend', function(e){
		doTouchEnd(e);
		e.stopPropagation();
		e.preventDefault();
    }, false);
    
    window.addEventListener('touchmove', function(e){
		doTouchMove(e);
		e.stopPropagation();
		e.preventDefault();
    }, false);
 
	// mouse detection
	window.addEventListener('mousedown', function(e){
        onClickDown(e.clientX, e.clientY, e);
	}, false);

	window.addEventListener('mousemove', function(e){
        onClickMove(e.clientX, e.clientY, e);
	}, false);

	window.addEventListener('mouseup', function(e){
        onClickUp(e.clientX, e.clientY, e);
	}, false);

	var shiftIsPressed = false;
 	var optionIsPressed = false;
 	window.addEventListener('keydown', function(event) {
 		//console.log ("Key="+event.keyCode);
        if (!showToolBar) return; //if toolbar hidden then ignore events

 		else if (event.keyCode == 16) { //pan
 			shiftIsPressed = true;
 			document.getElementById("canvas").style.cursor = 'move';
 		}
 		else if (event.keyCode == 18) { //zoom
 			optionIsPressed = true;
 			document.getElementById("canvas").style.cursor = 'zoom-in';
 		}
 		//else if (event.keyCode == 224) {
 		//	commandIsPressed = true;
 		//	console.log("command down");
		 //}
		else if (event.keyCode == 73) {
			if (optionIsPressed) readTrx();
		}
		else if (event.keyCode == 87) {
			if (optionIsPressed) writeTrx();
		}
		else if (event.keyCode == 67) {
			if (optionIsPressed) clearAll();
		}
 		//else if (event.keyCode == 90) {
 		//	if (shiftIsPressed && commandIsPressed) redoTrx();
 		//	if (!shiftIsPressed && commandIsPressed) undoTrx();
 		//}
	});   

 	window.addEventListener('keyup', function(event) {
 		if (event.keyCode == 16) {
 			shiftIsPressed = false;
 			isPanning = false;
// 			console.log("shift up");
 			document.getElementById("canvas").style.cursor = 'crosshair';
 		}
 		else if (event.keyCode == 18) {
 			optionIsPressed = false;
 			isZooming = false;
// 			console.log("option up");
 			document.getElementById("canvas").style.cursor = 'crosshair';
 		}
 		//else if (event.keyCode == 224) {
 		//	commandIsPressed = false;
 		//	console.log("command up");
 		//}
	});    

	// "constants"
	var oct1 = Math.SQRT2/(2+2*Math.SQRT2);
	var oct2 = (Math.SQRT2 + 2)/(2+2*Math.SQRT2);

	//globals
    var canvas = $("#canvas")[0];
   // var canvas2 = $("#canvas2")[0];
 
 	//passed params
 	// options:
 	//e.g. train.html?resize=0&toolbar=0&trx=[[[null%2Cn...
 	// resize=boolean  Allow automatic resizing?
 	// toolbar=boolean    Show toolbar?
 	// scale=percent Zoom level of canvas. 100%=normal
 	// trx=URIencoded(JSONstringified(trx)   If pass a trx it will display this in the trx[1] position. Can't be too long for URL though...
 	// trackID=111  Display trx with the given trackID
 	// showBrowse=0 hide or show the browse iframe
 	
 	var params, data;
 	if (location.href.split('?')[1]) {
		params = location.href.split('?')[1].split('&');
		data = {};
		for (x in params) {
			data[params[x].split('=')[0]] = params[x].split('=')[1];
		}
	}
	
	var buttonDims = [];
	var buttonDimLevels = [];
	var orientationIsLandscape = true;
	var showTitleScreen = true;
	var interactionState = 'TitleScreen';
	var showToolBar = true;
	var passedTrx;
	var passedTrackID;
	var zoomScale = 1.5; //zoom for track area
	var zoomMultiplier = 1.1;	
	var globalScale =1; //scale to shrink the canvas to the device screen size
	var adjustGlobalScale = true; // allow globalScale to adjust to fit device screen size. If global scale is passed then this is set to false
	var panStartX, panStartY, zoomStartX, zoomStartY, startZoomScale; 
	var startTimePlay; //time when play pressed
	var animationFrame = 0; //used for keeping track of frames for animation of star after successfully completing track
	var imgfolder = "renders200-opt";
	var iconscale = 1;
	var lastUniqueID = 1;
	var allTilesDirty = true; //redraws everything if true

	if (data) {
		if (data["resize"]) {
			if (data["resize"]==0) {
				resizeCanvas = false;
			}
		}
		passedStrTrx = data["trx"];
		if (passedStrTrx) {
			passedTrx = decodeURIComponent(passedStrTrx);
			interactionState = 'Freeplay';
		}
		if (data["toolbar"]) {
			if (data["toolbar"]==0) {
				showToolBar = false;
				interactionState = 'Freeplay';
			}
		}
		if (data["showBrowse"]) {
	//		var objx = parent.document.getElementById('browseframeid');
			if (data["showBrowse"]==0) objx.height = 0;
			else objx.height = 750;
		}
		
		if (data["showTrain"]) { ///////
			var objx = parent.document.getElementById('trainframeid');
			if (objx) {
				if (data["showTrain"]==0) objx.height = 0;
				else objx.height = 750;
			}
		}
		
		if (data["trackID"]) {
			passedTrackID = data["trackID"];
			interactionState = 'Freeplay';
		}
		
/*		if (data["iconscale"]) {
			iconscale = data["iconscale"];
			if (iconscale == 0.25) imgfolder = "renders25";
			else if (iconscale == 0.5) imgfolder = "renders50";
			else if (iconscale == 1) imgfolder = "renders100";
			else if (iconscale == 2) imgfolder = "renders200";
			else if (iconscale == 4) imgfolder = "renders400";
			else {
				imgfolder = "renders200";
				iconscale = 2;
			}
		}
		console.log("imgfolder="+imgfolder);
*/		
		if (data["scale"]) {
			zoomScale = data["scale"]/100;
    		if (zoomScale<0.2) zoomScale = 0.2;
    		if (zoomScale>5) zoomScale = 5;
		}
		
		if (data["global"]) {
			globalScale = data["global"]/100;
    		if (globalScale<0.2) globalScale = 0.2;
			if (globalScale>5) globalScale = 5;
			adjustGlobalScale = false;
		}
	}
   
	var ctx = canvas.getContext("2d");
    var canvasWidth;
    var canvasHeight;
	var centerTileX=0; //which tile to put in the center of the canvas. This plus zoomScale determines frame of tracks to view
	var centerTileY=0; 
	var startCenterTileX, startCenterTileY; //used for panning
	var buttonWidth = 76;
	var buttonPadding = 5;
	var buttonMultiplier = 1.07;
	var toolBarWidthLevels = buttonWidth+2*buttonPadding; //width of toolbar in pixels
	var toolBarWidthFreeplay  //width of toolbar in pixels
	var toolBarHeight; //height of toolbar in pixels
	var tracksWidth; //width of the tracks area in pixels
	var tracksHeight; //height of the tracks area in pixels
    var tileRatio = 57/63; //aspect ratio of tiles
	var tileWidth=60;
	var useAdvancedToolbar = false;
	if (localStorage.getObject('useAdvancedToolbar') == "TRUE") useAdvancedToolbar = true;
	if (debugMode) useAdvancedToolbar = true;
	calculateLayout();
	var insetWidth = 0.35*tileWidth;
	var tracks = {};
	var engines = [];
	var cars = [];
	var trains = []
	var poofs = []; //used for animating explosions after crash
	var trainStationLog = []; //used for storing number of actions for a key pair of engine and tracks
	var modalTrack; // used to store value of the current modal track. Used for wye prompts so know which wye to change after mouse interaction
	
	var useOctagons = false; //use square or octagon shaped tiles for drawing
	var interval = 0;	
	var skip = 10; // only interpret and draw every skip steps so as to allow acceleration of train
	var isDrawingTrack = false;
	var isDrawingEngine = false;
	var isDrawingCar = false;
	var isErasing = false;
	var isSelecting = false;
	var isMoving = false; //for moving a selection
	var isPanning = false;
	var isZooming = false;
	var drawingPointsTrackX = new Array();
	var drawingPointsTrackY = new Array();
	var drawingPointsECX = new Array();
	var drawingPointsECY = new Array();
	var currentXTile; //for drawing track
	var currentYTile;
	var enteringOrientation; //for drawing track
	var exitingOrientation;
	var startXPoint; //for drawing engine
	var startYPoint;
	var startSelectXTile; //for drawing selection
	var startSelectYTile;
	var endSelectXTile; //for drawing selection
	var endSelectYTile;
	var startMoveXTile; //for moving selection
	var startMoveYTile;
	var endMoveXTile; //for moving selection
	var endMoveYTile;
	var currentCaptionedObject; //for making caption bubble for engine or car
	var captionX; //upper left x,y tile for caption bubble
	var captionY; //upper left x,y tile for caption bubble
	var captionWidth; //width in units of tile
	var captionHeight;// height in units of tile
	var secondaryCaption; //reference to array containing info about secondary caption
	var captionSecondaryX; //upper left x,y tile for secondary caption bubble (caption bubble off of primary bubble used as submenu)
	var captionSecondaryY; //upper left x,y tile for secondary caption bubble
	var captionSecondaryWidth; //
	var captionSecondaryHeight; //
	var maxEngineSpeed = 200; //in millitiles/iteration
	var nNumSpeeds = 20; //number of tick marks on speed controller for engine. Rounds to nearest tick mark
	var currentCaptionedButton; //used for track toolbutton caption
	var buttonCaptionX;
	var buttonCaptionY;
	var lastClickUp; //position in world coords of mouse cursor on last click up
	var pinchStartX1 = 0;
	var pinchStartX2 = 0;
	var pinchStartY1 = 0;
	var pinchStartY2 = 0;
	var currentUserID = localStorage.getObject('currentUserID');
	var currentUsername = localStorage.getObject('username');
	if (!currentUserID) currentUserID = 1;
	if (!currentUsername) currentUsername = " ";
	console.log("Current user="+currentUsername+" ID="+currentUserID);
		
//	var trainerLevelNames = ['Hobo', 'Trainee', 'Caboose captain', 'Breakman', 'Switchman', 'Conductor', 'Engineer', 'Yard Master', 'Train Master'];
	var trainerLevelNames = ['levelA', 'levelB', 'levelC', 'levelD', 'levelE', 'levelF', 'levelG', 'levelH'];
	var currentTrackSet; // text name of current track set. Must be one of above trainerLevelNames
	
	//cargo
	var cargoValues = []; // array of arrays of different types of cargo
	cargoValues.push( ['numbers', '0','1','2','3','4','5','6','7','8','9']);
	cargoValues.push( ['uppercase','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']); //26
	cargoValues.push( ['lowercase','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']); //26
	cargoValues.push( ['colors','white', 'black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'cyan', 'purple']); //10
	cargoValues.push( ['blocks','1','2','3','4','5','6','7','8','9', '10']);
	var gColors = ['white', 'black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'cyan', 'purple'];
	cargoValues.push( ['binary','yes', 'no']); //2
	//cargoValues.push( ['shapes', 'point', 'line', 'triangle', 'square', 'pentagon', 'hexagon']); //6
	//cargoValues.push( ['safarianimals','aardvark', 'cheetah', 'elephant', 'giraffe', 'hippo', 'lion', 'osterich', 'rhino', 'warthog', 'zebra']); //10
	cargoValues.push( ['dinosaurs', 'raptor', 'triceratops', 'stegosaurus', 'tyranisaurus', 'brontosaurus']); //5
	cargoValues.push( ['stuffedanimals', 'bear', 'bunny']);
	//var cargoJungleAnimals
	//var cargoAustralianAnimals
	//var cargoAmericanAnimals
	
	//buttonArrays - used to store the order in which buttons are displayed in captions
	var buttonsStation = [["none","pickdrop","supply","dump"],["increment","decrement","slingshot","catapult"],["add","subtract","multiply","divide"],["home","greentunnel","redtunnel","bluetunnel"]];
	var buttonsStationTrack = [["none","pickdrop","supply","dump"],["increment","decrement","slingshot","catapult"],["add","subtract","multiply","divide"],["greentunnel","redtunnel","bluetunnel"]];
 	var buttonsWye = [["sprung", "lazy","alternate", "random"],["prompt", "compareequal","compareless","comparegreater"]];
 	var buttonsCargoTypes = [["numbers","uppercase","lowercase","colors"],["blocks","binary","dinosaurs","stuffedanimals"]] //needs to match the 0th element of each cargo subarray and be in same order as cargoValues

	//images
	console.log("load images");
	// load buttons for title screens

	var imgBadgeIcon = new Image(); imgBadgeIcon.src = 'img/ribbon-small.png';
	var imgBadgeIconSmall = new Image(); imgBadgeIconSmall.src = 'img/ribbon-smaller.png';
	var imgArrowIcon = new Image(); imgArrowIcon.src = 'img/arrow-icon.png';
	var imgLockedIcon = new Image(); imgLockedIcon.src = 'img/lockedIcon.png';
	var imgUnlockedIcon = new Image(); imgUnlockedIcon.src = 'img/unlockedIcon.png';
	var imgLoadIcon = new Image(); imgLoadIcon.src = 'img/loadicon.png';
	var imgSaveIcon = new Image(); imgSaveIcon.src = 'img/saveicon.png';
	var imgReadIcon = new Image(); imgReadIcon.src = 'img/readicon.png';
	var imgWriteIcon = new Image(); imgWriteIcon.src = 'img/writeicon.png';
	var imgDownloadIcon = new Image(); imgDownloadIcon.src = 'img/downloadicon.png';
	var imgUploadIcon = new Image(); imgUploadIcon.src = 'img/uploadicon.png';
	var imgSigninIcon = new Image(); imgSigninIcon.src = 'img/kids.png';
	var imgPoof = new Image(); imgPoof.src = 'img/poof-small.png';
	var imgGear = new Image(); imgGear.src = 'img/gearIcon.png';
	var imgUnlockLevels = new Image(); imgUnlockLevels.src = 'img/UnlockLevels.png';
	var imgAdvancedToolbar = new Image(); imgAdvancedToolbar.src = 'img/advancedToolbar.png';
	var imgBasicToolbar = new Image(); imgBasicToolbar.src = 'img/basicToolbar.png';
	var imgHelloWorld = new Image(); imgHelloWorld.src = 'img/HelloWorld.png';
	var imgRate = new Image(); imgRate.src = 'img/rate.png';
	var imgLogo = new Image(); imgLogo.src = 'img/logo-small-opt.png';
	var imgTrashIcon = new Image(); imgTrashIcon.src = 'img/trash-red.png';
	var imgUndoIcon = new Image(); imgUndoIcon.src = 'img/undo-small.png';
	var imgRedoIcon = new Image(); imgRedoIcon.src = 'img/redo-small.png';
	var imgBack = new Image(); imgBack.src = 'img/grayOutline-small2.png';
	var imgRepeat = new Image(); imgRepeat.src = 'img/repeatHand-small2.png';
	var imgForward = new Image(); imgForward.src = 'img/yellow-arrow2.png';
	var imgLevelsIcon = new Image(); imgLevelsIcon.src = 'img/levels-opt.png';
	var imgFreeplayIcon = new Image(); imgFreeplayIcon.src = 'img/freeplay-nocarpet.png';
	var imgWaterTile0 = new Image(); imgWaterTile0.src = 'img/water-tile-0.png';
	var imgWaterTile1 = new Image(); imgWaterTile1.src = 'img/water-tile-1.png';
	var imgWaterTile2adj = new Image(); imgWaterTile2adj.src = 'img/water-tile-2adj.png';
	var imgWaterTile2opp = new Image(); imgWaterTile2opp.src = 'img/water-tile-2opp.png';
	var imgWaterTile3 = new Image(); imgWaterTile3.src = 'img/water-tile-3.png';
	var imgWaterTile4 = new Image(); imgWaterTile4.src = 'img/water-tile-4.png';
	
    var imgTitleScreen = new Image();
    imgTitleScreen.src = 'img/titlePage4.jpg';
    imgTitleScreen.onload = function() {  doOnOrientationChange();} //force draw when done loading image
	
 	var imgButtonHome = new Image(); imgButtonHome.src = 'img/homeicon.png';
	var imgStar = new Image(); imgStar.src = 'img/star.png';
		
	//load images for buttons in captions for choosing station type
	var imgCaptionNone = new Image(); imgCaptionNone.src = 'img/'+imgfolder+'/CaptionButtons/none.png';
	var imgCaptionAdd = new Image(); imgCaptionAdd.src = 'img/'+imgfolder+'/CaptionButtons/add.png';
	var imgCaptionCatapult = new Image(); imgCaptionCatapult.src = 'img/'+imgfolder+'/CaptionButtons/catapult.png';
	var imgCaptionDecrement = new Image(); imgCaptionDecrement.src = 'img/'+imgfolder+'/CaptionButtons/decrement.png';
	var imgCaptionDivide = new Image(); imgCaptionDivide.src = 'img/'+imgfolder+'/CaptionButtons/divide.png';
	var imgCaptionDump = new Image(); imgCaptionDump.src = 'img/'+imgfolder+'/CaptionButtons/dump.png';
	var imgCaptionIncrement = new Image(); imgCaptionIncrement.src = 'img/'+imgfolder+'/CaptionButtons/increment.png';
	var imgCaptionMultiply = new Image(); imgCaptionMultiply.src = 'img/'+imgfolder+'/CaptionButtons/multiply.png';
	var imgCaptionPickDrop = new Image(); imgCaptionPickDrop.src = 'img/'+imgfolder+'/CaptionButtons/pickDrop.png';
	var imgCaptionSlingshot = new Image(); imgCaptionSlingshot.src = 'img/'+imgfolder+'/CaptionButtons/slingshot.png';
	var imgCaptionSubtract = new Image(); imgCaptionSubtract.src = 'img/'+imgfolder+'/CaptionButtons/subtract.png';
	var imgCaptionSupply = new Image(); imgCaptionSupply.src = 'img/'+imgfolder+'/CaptionButtons/supply.png';
	var imgCaptionHome = new Image(); imgCaptionHome.src = 'img/'+imgfolder+'/CaptionButtons/home.png';
	var imgCaptionGreenTunnel = new Image(); imgCaptionGreenTunnel.src = 'img/'+imgfolder+'/CaptionButtons/greenTunnel.png';
	var imgCaptionRedTunnel = new Image(); imgCaptionRedTunnel.src = 'img/'+imgfolder+'/CaptionButtons/redTunnel.png';
	var imgCaptionBlueTunnel = new Image(); imgCaptionBlueTunnel.src = 'img/'+imgfolder+'/CaptionButtons/blueTunnel.png';

	//load images for buttons in captions for choosing wye type
	var imgCaptionAlternate = new Image(); imgCaptionAlternate.src = 'img/'+imgfolder+'/CaptionButtons/alternate.png';
	var imgCaptionEqual = new Image(); imgCaptionEqual.src = 'img/'+imgfolder+'/CaptionButtons/equal.png';
	var imgCaptionGreater = new Image(); imgCaptionGreater.src = 'img/'+imgfolder+'/CaptionButtons/greater.png';
	var imgCaptionLazy = new Image(); imgCaptionLazy.src = 'img/'+imgfolder+'/CaptionButtons/lazy.png';
	var imgCaptionLesser = new Image(); imgCaptionLesser.src = 'img/'+imgfolder+'/CaptionButtons/lesser.png';
	var imgCaptionPrompt = new Image(); imgCaptionPrompt.src = 'img/'+imgfolder+'/CaptionButtons/prompt.png';
	var imgCaptionSprung = new Image(); imgCaptionSprung.src = 'img/'+imgfolder+'/CaptionButtons/sprung.png';
	var imgCaptionRandom = new Image(); imgCaptionRandom.src = 'img/'+imgfolder+'/CaptionButtons/random.png';

	//load the array of parquet tiles
	var imgParquet = [];
	for (var i=0; i<3; i++) {
		imgParquet[i] = new Image();
		var name = 'img/carpetTileBeige';
		//if (i<9) name += '0';
		name += (i+1);
		name += '.jpg';
		imgParquet[i].src = name;
	}

	//load the array of parquet tiles for octagon
	var imgParquetOct = [];
	for (var i=0; i<3; i++) {
		imgParquetOct[i] = new Image();
		var name = 'img/carpetTileBeigeOct';
		//if (i<9) name += '0';
		name += (i+1);
		name += '.jpg';
		imgParquetOct[i].src = name;
	}

	//load the array of images for animating the engines. The images are renderings of a model from Blender from 64 different angles
	var imgEngine = [];
	for (var i=0; i<64; i++) {
		imgEngine[i] = new Image();
		var name = 'img/'+imgfolder+'/Engine/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgEngine[i].src = name;
		//console.log("NAme="+name);
	}
	var imgEngineWidth = 92;
	
	//load the array of images for animating the cars. The images are renderings of a model from Blender from 64 different angles
	var imgCar = [];
	for (var i=0; i<32; i++) { //cars are symetrical front to back so just need 32 instead of 64 angles
		imgCar[i] = new Image();
		var name = 'img/'+imgfolder+'/Car/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgCar[i].src = name;
	}
	var imgCarWidth = 92;

	//tracks
	//load the array of images for TrackStraight. The images are renderings of a model from Blender from 8 different angles
	var imgTrackStraight = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackStraight[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackStraight/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackStraight[i].src = name;
	}
	var imgTrackWidth = 92;
	var captionIconWidth = 0.4*imgTrackWidth;
	
	var imgTrackDiagonalSquare = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackDiagonalSquare[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackDiagonalSquare/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackDiagonalSquare[i].src = name;
	}

	var imgTrack90 = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrack90[i] = new Image();
		var name = 'img/'+imgfolder+'/Track90/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrack90[i].src = name;
	}

	var imgTrack45 = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrack45[i] = new Image();
		var name = 'img/'+imgfolder+'/Track45/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrack45[i].src = name;
	}

	var imgTrackCross = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackCross[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackCross/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackCross[i].src = name;
	}
	
	var imgRedTunnel = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgRedTunnel[i] = new Image();
		var name = 'img/'+imgfolder+'/TunnelRed/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgRedTunnel[i].src = name;
	}
	
	var imgGreenTunnel = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgGreenTunnel[i] = new Image();
		var name = 'img/'+imgfolder+'/TunnelGreen/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgGreenTunnel[i].src = name;
	}
	
	var imgBlueTunnel = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgBlueTunnel[i] = new Image();
		var name = 'img/'+imgfolder+'/TunnelBlue/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgBlueTunnel[i].src = name;
	}
	
// WyeLeft
	var imgTrackWyeLeftAlternateL = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeLeftAlternateL[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWyeLeft-Alternate-L/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeLeftAlternateL[i].src = name;
	}

	var imgTrackWyeLeftAlternateR = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeLeftAlternateR[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWyeLeft-Alternate-R/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeLeftAlternateR[i].src = name;
	}

	var imgTrackWyeLeftLazyL = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeLeftLazyL[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWyeLeft-Lazy-L/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeLeftLazyL[i].src = name;
	}

	var imgTrackWyeLeftLazyR = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeLeftLazyR[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWyeLeft-Lazy-R/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeLeftLazyR[i].src = name;
	}	

	var imgTrackWyeLeftLesserL = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeLeftLesserL[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWyeLeft-Lesser-L/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeLeftLesserL[i].src = name;
	}

	var imgTrackWyeLeftLesserR = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeLeftLesserR[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWyeLeft-Lesser-R/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeLeftLesserR[i].src = name;
	}

	var imgTrackWyeLeftGreaterL = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeLeftGreaterL[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWyeLeft-Greater-L/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeLeftGreaterL[i].src = name;
	}

	var imgTrackWyeLeftGreaterR = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeLeftGreaterR[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWyeLeft-Greater-R/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeLeftGreaterR[i].src = name;
	}

	var imgTrackWyeLeftEqualL = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeLeftEqualL[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWyeLeft-Equal-L/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeLeftEqualL[i].src = name;
	}

	var imgTrackWyeLeftEqualR = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeLeftEqualR[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWyeLeft-Equal-R/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeLeftEqualR[i].src = name;
	}

	var imgTrackWyeLeftPromptL = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeLeftPromptL[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWyeLeft-Prompt-L/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeLeftPromptL[i].src = name;
	}

	var imgTrackWyeLeftPromptR = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeLeftPromptR[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWyeLeft-Prompt-R/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeLeftPromptR[i].src = name;
	}

	var imgTrackWyeLeftRandomL = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeLeftRandomL[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWyeLeft-Random-L/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeLeftRandomL[i].src = name;
	}

	var imgTrackWyeLeftRandomR = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeLeftRandomR[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWyeLeft-Random-R/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeLeftRandomR[i].src = name;
	}

	var imgTrackWyeLeftSprungL = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeLeftSprungL[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWyeLeft-Sprung-L/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeLeftSprungL[i].src = name;
	}

	var imgTrackWyeLeftSprungR = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeLeftSprungR[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWyeLeft-Sprung-R/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeLeftSprungR[i].src = name;
	}
	console.log("Loading wyes");
	
// WyeRight
	var imgTrackWyeRightAlternateL = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeRightAlternateL[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWyeRight-Alternate-L/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeRightAlternateL[i].src = name;
	}

	var imgTrackWyeRightAlternateR = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeRightAlternateR[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWyeRight-Alternate-R/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeRightAlternateR[i].src = name;
	}

	var imgTrackWyeRightLazyL = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeRightLazyL[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWyeRight-Lazy-L/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeRightLazyL[i].src = name;
	}

	var imgTrackWyeRightLazyR = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeRightLazyR[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWyeRight-Lazy-R/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeRightLazyR[i].src = name;
	}

	var imgTrackWyeRightLesserL = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeRightLesserL[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWyeRight-Lesser-L/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeRightLesserL[i].src = name;
	}

	var imgTrackWyeRightLesserR = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeRightLesserR[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWyeRight-Lesser-R/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeRightLesserR[i].src = name;
	}

	var imgTrackWyeRightGreaterL = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeRightGreaterL[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWyeRight-Greater-L/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeRightGreaterL[i].src = name;
	}

	var imgTrackWyeRightGreaterR = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeRightGreaterR[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWyeRight-Greater-R/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeRightGreaterR[i].src = name;
	}

	var imgTrackWyeRightEqualL = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeRightEqualL[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWyeRight-Equal-L/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeRightEqualL[i].src = name;
	}

	var imgTrackWyeRightEqualR = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeRightEqualR[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWyeRight-Equal-R/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeRightEqualR[i].src = name;
	}

	var imgTrackWyeRightPromptL = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeRightPromptL[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWyeRight-Prompt-L/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeRightPromptL[i].src = name;
	}

	var imgTrackWyeRightPromptR = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeRightPromptR[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWyeRight-Prompt-R/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeRightPromptR[i].src = name;
	}

	var imgTrackWyeRightRandomL = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeRightRandomL[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWyeRight-Random-L/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeRightRandomL[i].src = name;
	}

	var imgTrackWyeRightRandomR = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeRightRandomR[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWyeRight-Random-R/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeRightRandomR[i].src = name;
	}

	var imgTrackWyeRightSprungL = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeRightSprungL[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWyeRight-Sprung-L/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeRightSprungL[i].src = name;
	}

	var imgTrackWyeRightSprungR = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeRightSprungR[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWyeRight-Sprung-R/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeRightSprungR[i].src = name;
	}

// Wye
	var imgTrackWyeAlternateL = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeAlternateL[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWye-Alternate-L/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeAlternateL[i].src = name;
	}

	var imgTrackWyeAlternateR = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeAlternateR[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWye-Alternate-R/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeAlternateR[i].src = name;
	}

	var imgTrackWyeLazyL = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeLazyL[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWye-Lazy-L/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeLazyL[i].src = name;
	}

	var imgTrackWyeLazyR = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeLazyR[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWye-Lazy-R/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeLazyR[i].src = name;
	}

	var imgTrackWyeLesserL = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeLesserL[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWye-Lesser-L/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeLesserL[i].src = name;
	}

	var imgTrackWyeLesserR = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeLesserR[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWye-Lesser-R/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeLesserR[i].src = name;
	}

	var imgTrackWyeGreaterL = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeGreaterL[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWye-Greater-L/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeGreaterL[i].src = name;
	}

	var imgTrackWyeGreaterR = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeGreaterR[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWye-Greater-R/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeGreaterR[i].src = name;
	}

	var imgTrackWyeEqualL = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeEqualL[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWye-Equal-L/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeEqualL[i].src = name;
	}

	var imgTrackWyeEqualR = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeEqualR[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWye-Equal-R/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeEqualR[i].src = name;
	}

	var imgTrackWyePromptL = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyePromptL[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWye-Prompt-L/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyePromptL[i].src = name;
	}

	var imgTrackWyePromptR = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyePromptR[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWye-Prompt-R/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyePromptR[i].src = name;
	}

	var imgTrackWyeRandomL = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeRandomL[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWye-Random-L/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeRandomL[i].src = name;
	}

	var imgTrackWyeRandomR = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeRandomR[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWye-Random-R/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeRandomR[i].src = name;
	}

	var imgTrackWyeSprungL = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeSprungL[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWye-Sprung-L/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeSprungL[i].src = name;
	}

	var imgTrackWyeSprungR = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgTrackWyeSprungR[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackWye-Sprung-R/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackWyeSprungR[i].src = name;
	}
//
	var imgTrackCargo = [];
	for (var i=0; i<2; i++) { //one for each orientation
		imgTrackCargo[i] = new Image();
		var name = 'img/'+imgfolder+'/TrackCargo/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgTrackCargo[i].src = name;
	}

//stations
	console.log("Loading stations");
	var imgStationIncrement = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgStationIncrement[i] = new Image();
		var name = 'img/'+imgfolder+'/StationIncrement/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgStationIncrement[i].src = name;
	}

	var imgStationDecrement = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgStationDecrement[i] = new Image();
		var name = 'img/'+imgfolder+'/StationDecrement/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgStationDecrement[i].src = name;
	}

	var imgStationSupply = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgStationSupply[i] = new Image();
		var name = 'img/'+imgfolder+'/StationSupply/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgStationSupply[i].src = name;
	}

	var imgStationDump = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgStationDump[i] = new Image();
		var name = 'img/'+imgfolder+'/StationDump/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgStationDump[i].src = name;
	}

	var imgStationSlingshot = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgStationSlingshot[i] = new Image();
		var name = 'img/'+imgfolder+'/StationSlingshot/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgStationSlingshot[i].src = name;
	}

	var imgStationCatapult = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgStationCatapult[i] = new Image();
		var name = 'img/'+imgfolder+'/StationCatapult/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgStationCatapult[i].src = name;
	}

	var imgStationMultiply = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgStationMultiply[i] = new Image();
		var name = 'img/'+imgfolder+'/StationMultiply/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgStationMultiply[i].src = name;
	}

	var imgStationDivide = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgStationDivide[i] = new Image();
		var name = 'img/'+imgfolder+'/StationDivide/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgStationDivide[i].src = name;
	}

	var imgStationAdd = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgStationAdd[i] = new Image();
		var name = 'img/'+imgfolder+'/StationAdd/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgStationAdd[i].src = name;
	}

	var imgStationSubtract = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgStationSubtract[i] = new Image();
		var name = 'img/'+imgfolder+'/StationSubtract/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgStationSubtract[i].src = name;
	}

	var imgStationPickDrop = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgStationPickDrop[i] = new Image();
		var name = 'img/'+imgfolder+'/StationPickDrop/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgStationPickDrop[i].src = name;
	}

	var imgStationHome = [];
	for (var i=0; i<8; i++) { //one for each orientation
		imgStationHome[i] = new Image();
		var name = 'img/'+imgfolder+'/StationHome/00';
		if (i<9) name += '0';
		name += (i+1);
		name += '.png';
		imgStationHome[i].src = name;
	}

//cargo
	var imgCargoStuffedAnimals = [];
	for (var j=0; j<2; j++) {
		imgCargoStuffedAnimals[j] = [];
		for (var i=0; i<64; i++) { //one for each orientation
			imgCargoStuffedAnimals[j][i] = new Image();
			var name = 'img/'+imgfolder+'/CargoStuffedAnimal/Cargo-' + j + '/00';
			if (i<9) name += '0';
			name += (i+1);
			name += '.png';
			imgCargoStuffedAnimals[j][i].src = name;
//			console.log ("name="+name);
		}
	}

	console.log ("Loading cargo lower");

	lowercase = "abcdefghijklmnopqrstuvwxyz";
	uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	var imgCargoLowercase = [];
	for (var j=0; j<26; j++) {
		imgCargoLowercase[j] = [];
		for (var i=0; i<64; i++) { //one for each orientation
			imgCargoLowercase[j][i] = new Image();
			var name = 'img/'+imgfolder+'/CargoLowercase/Cargo-' + lowercase.charAt(j) + '/00';
			if (i<9) name += '0';
			name += (i+1);
			name += '.png';
			imgCargoLowercase[j][i].src = name;
		}
	}

	console.log ("Loading cargo Upper");
	var imgCargoUppercase = []; ///need to render uppercase and switch this from lower to upper
	for (var j=0; j<26; j++) {
		imgCargoUppercase[j] = [];
		for (var i=0; i<64; i++) { //one for each orientation
			imgCargoUppercase[j][i] = new Image();
			var name = 'img/'+imgfolder+'/CargoUppercase/Cargo-' + uppercase.charAt(j) + '/00';
			if (i<9) name += '0';
			name += (i+1);
			name += '.png';
			imgCargoUppercase[j][i].src = name;
			//console.log("name="+name);
		}
	}

	console.log ("Loading cargo dino");
	var imgCargoDinosaurs = [];
	for (var j=0; j<5; j++) {
		imgCargoDinosaurs[j] = [];
		for (var i=0; i<64; i++) { //one for each orientation
			imgCargoDinosaurs[j][i] = new Image();
			var name = 'img/'+imgfolder+'/CargoDinosaurs/Cargo-' + j + '/00';
			if (i<9) name += '0';
			name += (i+1);
			name += '.png';
			imgCargoDinosaurs[j][i].src = name;
			//console.log("file="+name);
		}
	}

	console.log ("Loading cargo binary");
	var imgCargoBinary = [];
	for (var j=0; j<2; j++) {
		imgCargoBinary[j] = [];
		for (var i=0; i<64; i++) { //one for each orientation
			imgCargoBinary[j][i] = new Image();
			var name = 'img/'+imgfolder+'/CargoBinary/Cargo-' + j + '/00';
//			var name = 'img/'+imgfolder+'/Cargo-' + j + '/00';
			if (i<9) name += '0';
			name += (i+1);
			name += '.png';
			imgCargoBinary[j][i].src = name;
			//console.log ("name="+name);
		}
	}

	console.log ("Loading cargo blocks");
	var imgCargoBlocks = [];
	for (var j=0; j<10; j++) {
		imgCargoBlocks[j] = [];
		for (var i=0; i<64; i++) { //one for each orientation
			imgCargoBlocks[j][i] = new Image();
			jp = j+1; //blocks start at 1 instead of 0
			var name = 'img/'+imgfolder+'/CargoBlocks/Cargo-' + jp + '/00';
			if (i<9) name += '0';
			name += (i+1);
			name += '.png';
			imgCargoBlocks[j][i].src = name;
			//console.log ("name="+name);
		}
	}

	console.log ("Loading cargo numbers");
	var imgCargoNumbers = [];
	for (var j=0; j<10; j++) {
		imgCargoNumbers[j] = [];
		for (var i=0; i<64; i++) { //one for each orientation
			imgCargoNumbers[j][i] = new Image();
			var name = 'img/'+imgfolder+'/CargoNumbers/Cargo-' + j + '/00';
			if (i<9) name += '0';
			name += (i+1);
			name += '.png';
			imgCargoNumbers[j][i].src = name;
			//console.log ("name="+name);
		}
	}

	console.log ("Loading cargo color");
	var imgCargoColors = [];
	for (var j=0; j<10; j++) {
		imgCargoColors[j] = [];
		for (var i=0; i<64; i++) { //one for each orientation
			imgCargoColors[j][i] = new Image();
			var name = 'img/'+imgfolder+'/CargoColors/Cargo-' + gColors[j] + '/00';
			if (i<9) name += '0';
			name += (i+1);
			name += '.png';
			//console.log("name="+name);
			imgCargoColors[j][i].src = name;
		}
	}

	var imgCargoSafariAnimals = [];
/*	for (var j=0; j<10; j++) {
		imgCargoSafariAnimals[j] = [];
		for (var i=0; i<64; i++) { //one for each orientation
			imgCargoSafariAnimals[j][i] = new Image();
			var name = 'img/'+imgfolder+'/CargoSafariAnimals/Cargo-' + j + '/00';
			if (i<9) name += '0';
			name += (i+1);
			name += '.png';
			imgCargoSafariAnimals[j][i].src = name;
		}
	}
*/
	
	//colors
	var fontColor = "black";
	var buttonColor = "lightgray";//"rgba(111,111,155,0.9)";
	var buttonBorderColor = "gray";//"rgba(34,34,155,0.9)";
	var buttonColorGreen = "rgba(92,205,92,0.9)";
	var buttonBorderColorGreen = "rgba(34,178,34,0.9)";
	var toolBarBackColor = "gray";
	var tracksBackColor = "DarkOliveGreen";
	var gridColor =  "rgba(200,106,49,0.5)";
	var gridColorDark = "rgba(200,106,49,1.0)";
	var tieColor = "#2A1506";
	var railColor = "Gray";
	var engineColor = "FireBrick";
	var captionColor = "rgba(208, 208, 208, 0.8)";
	var secondaryCaptionColor = "rgba(188, 188, 188, 0.8)";
	var aboutColor = "rgba(176,168,139,0.8)";;
	var starColor = "rgba(176,168,139,0.8)";;
	var insetStrokeColor = "lightslategray";
	var insetFillColor = "gainsboro";
	var highlightColor = "yellow";
	var carColor = "brown"; //"lightsteelblue";
	var cargoColor = "lightyellow";
	var trackImmutableColorFill = "rgba(77,44,44,0.165)";
	//var trackImmutableColorFill = "rgba(176,168,139,0.3)";
	var trackImmutableColorBorder = "rgba(176,168,139,0.7)";
	var saveButtonColors= [];
	var currentTrackScore = 0;
	var newHighScore = false;
	saveButtonColors[0] = "red";
	saveButtonColors[1] = "orange";
	saveButtonColors[2] = "yellow";
	saveButtonColors[3] = "green";
	saveButtonColors[4] = "blue";
	saveButtonColors[5] = "indigo";
	saveButtonColors[6] = "violet";
	saveButtonColors[7] = "brown";
	saveButtonColors[8] = "black";
	
	var toolButtonsLevels = [];
	var toolButtonsFreeplay = [];
	var undoHistory = [];
	var undoCurrentIndex = 0;

	//Sounds
	var sounds = [];
	sounds["crash"] = new Audio("sound/crashShort.wav");
	sounds["switch"] = new Audio("sound/switch.wav");
	sounds["connect"] = new Audio("sound/TrainConnect.wav");
	sounds["choochoo"] = new Audio("sound/ChooChoo.wav");
	sounds["stop"] = new Audio("sound/TrainStop.wav");
	sounds["increment"] = new Audio("sound/BeepUp.wav");
	sounds["decrement"] = new Audio("sound/BeepDown.wav");
	sounds["dump"] = new Audio("sound/dump.wav");
	sounds["slingshot"] = new Audio("sound/sloop.wav");
	sounds["catapult"] = new Audio("sound/catapult-launch.wav");
	sounds["catapultWindup"] = new Audio("sound/catapult-windup.wav");
	sounds["supply"] = new Audio("sound/supply.wav");
	sounds["pickdrop"] = new Audio("sound/pickdrop.wav");
	sounds["pickdropreverse"] = new Audio("sound/pickdrop-reverse.wav");
	sounds["home"] = new Audio("sound/success.wav");
	sounds["tunnel"] = new Audio("sound/Tunnel.wav");
	sounds["tunnelReverse"] = new Audio("sound/TunnelReverse.wav");
	sounds["tada1"] = new Audio("sound/tada-f.wav");
	sounds["tada2"] = new Audio("sound/tada-g.wav");
	sounds["tada3"] = new Audio("sound/tada-a.wav");
	sounds["failure"] = new Audio("sound/failure.wav");
	sounds["open"] = new Audio("sound/open.wav");
	sounds["save"] = new Audio("sound/save.wav");
	sounds["add"] = new Audio("sound/add.wav");
	sounds["subtract"] = new Audio("sound/subtract.wav");
	sounds["multiply"] = new Audio("sound/multiply.wav");
	sounds["divide"] = new Audio("sound/divide.wav");
	sounds["complete"] = new Audio("sound/LevelComplete.wav");

	// swap is used for compressing/decompressing. Compressed string uses cap, decompressed does not
	//swap array for "TRXv1.0:"
	// "TRXv1.1 adds centerx, y, and zoom"
	var swap = {};
	swap['"gridy":'] 		= 'A';
	swap['"gridx":'] 		= 'B';
	swap['"orientation":'] 	= 'C';
	swap['"state":'] 		= 'D';
	swap['"trackstraight"'] = 'E';
	swap['"track90"'] 		= 'F';
	swap['"left"'] 			= 'G';
	swap['"right"'] 		= 'H';
	swap['"subtype":'] 		= 'I';
	swap['"immutable":'] 	= 'J';
	swap['false'] 			= 'K';
	swap['"type":'] 		= 'L';
	swap['"enginebasic"'] 	= 'M';
	swap['"carbasic"'] 		= 'N';
	swap['"tunnelfrom":'] 	= 'O';
	swap['"tunnelto":'] 	= 'P';
	swap['"speed":'] 		= 'Q';
	swap['"position":'] 	= 'R';
	swap['"trackwyeright"'] = 'S';
	swap['"trackwyeleft"'] 	= 'T';
	swap['"sprung"'] 		= 'U';
	swap['"trackwye"'] 		= 'V';
	swap['"trackcross"'] 	= 'W';
	swap['"comparegreater"']= 'X';
	swap['"trackcargo"'] 	= 'Y';
	swap['"blocks"'] 		= 'Z';
	
	///trx
	trxHelloWorld ='TRXv1.0:[{"-5,0":{B-5,A0,LE,C4,DG,I"",JK},"-5,1":{B-5,A1,LT,C4,DH,IU,JK},"-4,1":{B-4,A1,LE,C2,DG,I"",JK},"3,1":{B3,A1,LE,C6,DG,I"",JK},"2,1":{B2,A1,LE,C6,DG,I"",JK},"1,1":{B1,A1,LE,C6,DG,I"",JK},"0,1":{B0,A1,LE,C6,DG,I"",JK},"-1,1":{B-1,A1,LE,C6,DG,I"",JK},"-2,1":{B-2,A1,LE,C6,DG,I"",JK},"-3,1":{B-3,A1,LE,C6,DG,I"",JK},"5,1":{B5,A1,LE,C6,DG,I"",JK},"4,1":{B4,A1,LE,C6,DG,I"",JK},"2,2":{B2,A2,LE,C6,DG,I"",JK},"1,2":{B1,A2,LE,C6,DG,I"",JK},"0,2":{B0,A2,LE,C6,DG,I"",JK},"-1,2":{B-1,A2,LE,C6,DG,I"",JK},"-2,2":{B-2,A2,LE,C6,DG,I"",JK},"-3,2":{B-3,A2,LF,C6,DG,I"",JK},"-3,3":{B-3,A3,LE,C4,DG,I"slingshot",JK},"-3,4":{B-3,A4,LS,C4,DH,IU,JK},"-3,5":{B-3,A5,LF,C4,DG,I"",JK},"-2,5":{B-2,A5,LE,C2,DG,I"",JK},"-1,5":{B-1,A5,LE,C2,DG,I"",JK},"0,5":{B0,A5,LE,C2,DG,I"",JK},"1,5":{B1,A5,LE,C2,DG,I"",JK},"2,5":{B2,A5,LE,C2,DG,I"",JK},"3,5":{B3,A5,LV,C4,DG,IU,JK},"3,4":{B3,A4,LE,C0,DG,I"slingshot",JK},"3,3":{B3,A3,LS,C0,DH,IU,JK},"3,2":{B3,A2,LF,C0,DG,I"",JK},"4,3":{B4,A3,LE,C2,DG,I"",JK},"5,3":{B5,A3,LE,C2,DG,I"",JK},"6,3":{B6,A3,LF,C0,DG,I"",JK},"6,4":{B6,A4,LE,C4,DG,I"",JK},"6,5":{B6,A5,LF,C2,DG,I"",JK},"5,5":{B5,A5,LE,C6,DG,I"",JK},"4,5":{B4,A5,LE,C6,DG,I"",JK},"-4,4":{B-4,A4,LE,C6,DG,I"",JK},"-5,4":{B-5,A4,LF,C4,DG,I"",JK},"-5,3":{B-5,A3,LE,C0,DG,I"",JK},"-5,2":{B-5,A2,LE,C0,DG,I"",JK},"-2,0":{B-2,A0,LE,C2,DG,I"",JK},"-1,0":{B-1,A0,LE,C6,DG,I"",JK},"0,0":{B0,A0,LE,C6,DG,I"",JK},"1,-3":{B1,A-3,LT,C6,DH,IU,JK},"1,-2":{B1,A-2,LE,C4,DG,I"increment",JK},"1,-1":{B1,A-1,LF,C4,DG,I"",JK},"1,0":{B1,A0,LE,C6,DG,I"",JK},"2,-4":{B2,A-4,LY,C0,DG,I"","cargo":{"value":3,L0},JK},"2,-3":{B2,A-3,LS,C2,DG,IX,JK},"2,-2":{B2,A-2,LE,C0,DG,I"increment",JK},"2,0":{B2,A0,LE,C6,DG,I"",JK},"3,-4":{B3,A-4,LY,C0,DG,I"","cargo":{"value":0,L0},JK},"3,-3":{B3,A-3,LE,C6,DG,I"dump",JK},"3,-2":{B3,A-2,LY,C0,DG,I"","cargo":{"value":1,L0},JK},"3,0":{B3,A0,LE,C6,DG,I"",JK},"4,-2":{B4,A-2,LE,C0,DG,I"increment",JK},"5,-2":{B5,A-2,LY,C0,DG,I"","cargo":{"value":0,L4},JK},"5,-3":{B5,A-3,LE,C6,DG,I"dump",JK},"4,-3":{B4,A-3,LS,C2,DH,IX,JK},"-4,-3":{B-4,A-3,LE,C6,DG,I"supply",JK},"-5,-3":{B-5,A-3,LF,C6,DG,I"",JK},"4,-4":{B4,A-4,LY,C0,DG,I"","cargo":{"value":3,L4},JK},"-4,-4":{B-4,A-4,LY,C0,DG,I"","cargo":{"value":0,L4},JK},"-3,-3":{B-3,A-3,LT,C6,DG,IU,JK},"-3,-2":{B-3,A-2,LE,C4,DG,I"",JK},"-3,-1":{B-3,A-1,LE,C4,DG,I"",JK},"-3,0":{B-3,A0,LF,C4,DG,I"",JK},"-2,-3":{B-2,A-3,LE,C6,DG,I"supply",JK},"-2,-4":{B-2,A-4,LY,C0,DG,I"","cargo":{"value":1,L0},JK},"-1,-3":{B-1,A-3,LE,C2,DG,I"",JK},"2,-1":{B2,A-1,LF,C2,DG,I"",JK},"4,-1":{B4,A-1,LE,C4,DG,I"",JK},"4,0":{B4,A0,LF,C2,DG,I"",JK},"5,-4":{B5,A-4,LY,C0,DG,I"","cargo":{"value":0,L4},JK},"6,-3":{B6,A-3,LF,C0,DG,I"",JK},"6,-2":{B6,A-2,LE,C0,DG,I"",JK},"6,-1":{B6,A-1,LE,C0,DG,I"",JK},"6,0":{B6,A0,LE,C4,DG,I"",JK},"6,1":{B6,A1,LF,C2,DG,I"",JK},"0,-3":{B0,A-3,LE,C2,DG,I"",JK},"-5,-1":{B-5,A-1,LE,C0,DG,I"",JK},"-5,-2":{B-5,A-2,LE,C0,DG,I"supply",JK},"-4,-2":{B-4,A-2,LY,C0,DG,I"","cargo":{"value":0,L1},JK},"0,-2":{B0,A-2,LY,C0,DG,I"","cargo":{"value":0,L1},JK}},[{B-2,A2,LM,C6,D"",Q20,R0.5,JK,O[],P[]},{B2,A5,LM,C2,D"",Q20,R0.5,JK,O[],P[]}],[{B-1,A2,LN,C6,D"",Q20,R0.5,"cargo":{"value":14,L2},JK,O[],P[]},{B0,A2,LN,C6,D"",Q20,R0.5,"cargo":{"value":11,L2},JK,O[],P[]},{B1,A2,LN,C6,D"",Q20,R0.5,"cargo":{"value":11,L2},JK,O[],P[]},{B2,A2,LN,C6,D"",Q20,R0.5,"cargo":{"value":4,L2},JK,O[],P[]},{B3,A2,LN,C0,D"",Q20,R0.5,"cargo":{"value":7,L1},JK,O[],P[]},{B1,A5,LN,C2,D"",Q20,R0.5,"cargo":{"value":22,L1},JK,O[],P[]},{B0,A5,LN,C2,D"",Q20,R0.5,"cargo":{"value":14,L2},JK,O[],P[]},{B-1,A5,LN,C2,D"",Q20,R0.5,"cargo":{"value":17,L2},JK,O[],P[]},{B-2,A5,LN,C2,D"",Q20,R0.5,"cargo":{"value":11,L2},JK,O[],P[]},{B-3,A5,LN,C4,D"",Q20,R0.5,"cargo":{"value":3,L2},JK,O[],P[]}]]';

	//////// trx for levels //////////////////////////////////////////
	var trxLevels = [];
	var bestTrackTime = [];

	/// 1. A - just connecting, maze
	trxLevels[trainerLevelNames[0]] = [];

	//draw single gap straight
	trxLevels[trainerLevelNames[0]][0] ='TRXv1.1:0~0~1.5~[{"-3,-3":{B-3,A-3,LE,C6,DG,I"",JK},"-4,-3":{B-4,A-3,LF,C6,DG,I"",JK},"-4,-2":{B-4,A-2,LE,C4,DG,I"",JK},"-4,-1":{B-4,A-1,LE,C4,DG,I"",JK},"-4,0":{B-4,A0,LF,C4,DG,I"",JK},"-3,0":{B-3,A0,LE,C2,DG,I"",JK},"-2,0":{B-2,A0,LE,C2,DG,I"",JK},"-1,0":{B-1,A0,LE,C2,DG,I"",JK},"0,0":{B0,A0,LE,C2,DG,I"",JK},"1,0":{B1,A0,LE,C2,DG,I"",JK},"2,0":{B2,A0,LE,C2,DG,I"",JK},"3,0":{B3,A0,LF,C2,DG,I"",JK},"3,-1":{B3,A-1,LE,C0,DG,I"",JK},"3,-2":{B3,A-2,LE,C0,DG,I"",JK},"2,-3":{B2,A-3,LE,C6,DG,I"",JK},"-2,-3":{B-2,A-3,LE,C6,DG,I"home",Jtrue},"-2,-4":{B-2,A-4,LY,C0,DG,I"",Jtrue},"0,-3":{B0,A-3,LE,C6,DG,I"",JK},"-1,-3":{B-1,A-3,LE,C6,DG,I"",JK},"3,-3":{B3,A-3,LF,C0,DG,I"",JK}},[{B-1,A0,LM,C2,D"",Q20,R0.5,JK,O[],P[]}],[{B-2,A0,LN,C2,D"",Q20,R0.5,"cargo":{"value":0,L7},JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[0]+'-0'] = 20000;

	//draw bigger gap straight
	trxLevels[trainerLevelNames[0]][1] ='TRXv1.1:0~0~1.5~[{"-3,-3":{B-3,A-3,LE,C6,DG,I"",JK},"-4,-3":{B-4,A-3,LF,C6,DG,I"",JK},"-4,-2":{B-4,A-2,LE,C4,DG,I"",JK},"-4,-1":{B-4,A-1,LE,C4,DG,I"",JK},"-4,0":{B-4,A0,LF,C4,DG,I"",JK},"-3,0":{B-3,A0,LE,C2,DG,I"",JK},"-2,0":{B-2,A0,LE,C2,DG,I"",JK},"-1,0":{B-1,A0,LE,C2,DG,I"",JK},"0,0":{B0,A0,LE,C2,DG,I"",JK},"1,0":{B1,A0,LE,C2,DG,I"",JK},"2,0":{B2,A0,LE,C2,DG,I"",JK},"3,0":{B3,A0,LF,C2,DG,I"",JK},"3,-1":{B3,A-1,LE,C0,DG,I"",JK},"3,-2":{B3,A-2,LE,C0,DG,I"",JK},"3,-3":{B3,A-3,LF,C0,DG,I"",JK},"2,-3":{B2,A-3,LE,C6,DG,I"",JK},"-2,-3":{B-2,A-3,LE,C6,DG,I"home",Jtrue},"-2,-4":{B-2,A-4,LY,C0,DG,I"",Jtrue}},[{B1,A0,LM,C2,D"",Q20,R0.420000000000001,JK,O[],P[]}],[{B0,A0,LN,C2,D"",Q20,R0.420000000000001,"cargo":{"value":0,L7},JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[0]+'-1'] = 20000;

	//draw single curve
	trxLevels[trainerLevelNames[0]][2] ='TRXv1.1:0~0~1.5~[{"-3,-3":{B-3,A-3,LE,C6,DG,I"",JK},"-4,-3":{B-4,A-3,LF,C6,DG,I"",JK},"-4,-2":{B-4,A-2,LE,C4,DG,I"",JK},"-4,-1":{B-4,A-1,LE,C4,DG,I"",JK},"-4,0":{B-4,A0,LF,C4,DG,I"",JK},"-3,0":{B-3,A0,LE,C2,DG,I"",JK},"-2,0":{B-2,A0,LE,C2,DG,I"",JK},"-1,0":{B-1,A0,LE,C2,DG,I"",JK},"0,0":{B0,A0,LE,C2,DG,I"",JK},"1,0":{B1,A0,LE,C2,DG,I"",JK},"2,0":{B2,A0,LE,C2,DG,I"",JK},"3,0":{B3,A0,LF,C2,DG,I"",JK},"3,-1":{B3,A-1,LE,C0,DG,I"",JK},"1,-3":{B1,A-3,LE,C6,DG,I"",JK},"-2,-3":{B-2,A-3,LE,C6,DG,I"home",Jtrue},"-1,-3":{B-1,A-3,LE,C6,DG,I"",JK},"-2,-4":{B-2,A-4,LY,C0,DG,I"",Jtrue},"0,-3":{B0,A-3,LE,C6,DG,I"",JK}},[{B-1,A0,LM,C2,D"",Q20,R0.5,JK,O[],P[]}],[{B-2,A0,LN,C2,D"",Q20,R0.5,"cargo":{"value":0,L7},JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[0]+'-2'] = 20000;

	//draw curve and fill gap in two different places
	trxLevels[trainerLevelNames[0]][3]='TRXv1.1:0~0~1.5~[{"-3,-3":{B-3,A-3,LE,C6,DG,I"",JK},"-4,-3":{B-4,A-3,LF,C6,DG,I"",JK},"-4,-2":{B-4,A-2,LE,C4,DG,I"",JK},"-4,-1":{B-4,A-1,LE,C4,DG,I"",JK},"-4,0":{B-4,A0,LF,C4,DG,I"",JK},"-3,0":{B-3,A0,LE,C2,DG,I"",JK},"-2,0":{B-2,A0,LE,C2,DG,I"",JK},"-1,0":{B-1,A0,LE,C2,DG,I"",JK},"0,0":{B0,A0,LE,C2,DG,I"",JK},"1,0":{B1,A0,LE,C2,DG,I"",JK},"2,0":{B2,A0,LE,C2,DG,I"",JK},"3,0":{B3,A0,LF,C2,DG,I"",JK},"3,-1":{B3,A-1,LE,C0,DG,I"",JK},"3,-2":{B3,A-2,LE,C0,DG,I"",JK},"2,-3":{B2,A-3,LE,C6,DG,I"",JK},"1,-3":{B1,A-3,LE,C6,DG,I"",JK},"-2,-3":{B-2,A-3,LE,C6,DG,I"home",Jtrue},"-2,-4":{B-2,A-4,LY,C0,DG,I"",Jtrue},"0,-3":{B0,A-3,LE,C6,DG,I"",JK}},[{B-1,A0,LM,C2,D"",Q20,R0.5,JK,O[],P[]}],[{B-2,A0,LN,C2,D"",Q20,R0.5,"cargo":{"value":0,L7},JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[0]+'-3'] = 20000;

	//draw cross
	trxLevels[trainerLevelNames[0]][4]='TRXv1.1:0~0~1.5~[{"-3,-3":{B-3,A-3,LE,C6,DG,I"",JK},"-4,-3":{B-4,A-3,LF,C6,DG,I"",JK},"-4,-2":{B-4,A-2,LE,C4,DG,I"",JK},"-4,-1":{B-4,A-1,LE,C4,DG,I"",JK},"-4,0":{B-4,A0,LF,C4,DG,I"",JK},"-3,0":{B-3,A0,LE,C2,DG,I"",JK},"-2,0":{B-2,A0,LE,C2,DG,I"",JK},"-1,0":{B-1,A0,LE,C2,DG,I"",JK},"0,0":{B0,A0,LE,C2,DG,I"",JK},"1,0":{B1,A0,LF,C2,DG,I"",Jtrue},"2,0":{B2,A0,LF,C4,DG,I"",Jtrue},"3,0":{B3,A0,LF,C2,DG,I"",Jtrue},"3,-1":{B3,A-1,LE,C4,DG,I"",Jtrue},"3,-2":{B3,A-2,LF,C0,DG,I"",Jtrue},"1,-3":{B1,A-3,LE,C6,DG,I"",JK},"-2,-3":{B-2,A-3,LE,C6,DG,I"home",Jtrue},"-1,-3":{B-1,A-3,LE,C6,DG,I"",JK},"-2,-4":{B-2,A-4,LY,C0,DG,I"",Jtrue},"1,-1":{B1,A-1,LE,C0,DG,I"",Jtrue},"1,-2":{B1,A-2,LF,C6,DG,I"",Jtrue},"2,-2":{B2,A-2,LE,C2,DG,I"",JK},"0,-3":{B0,A-3,LE,C6,DG,I"",JK}},[{B-1,A0,LM,C2,D"",Q20,R0.5,JK,O[],P[]}],[{B-2,A0,LN,C2,D"",Q20,R0.5,"cargo":{"value":0,L7},JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[0]+'-4'] = 28000;

	//many crosses
	trxLevels[trainerLevelNames[0]][5] ='TRXv1.1:0~0~1.5~[{"-3,-3":{B-3,A-3,LS,C2,DH,IU,Jtrue},"-4,-3":{B-4,A-3,LF,C6,DG,I"",Jtrue},"-3,0":{B-3,A0,LE,C2,DG,I"",JK},"-2,0":{B-2,A0,LE,C2,DG,I"",JK},"-1,0":{B-1,A0,LE,C2,DG,I"",JK},"0,0":{B0,A0,LE,C2,DG,I"",Jtrue},"1,0":{B1,A0,LW,C0,DG,I"",Jtrue},"3,0":{B3,A0,LF,C2,DG,I"",Jtrue},"3,-1":{B3,A-1,LF,C0,DG,I"",Jtrue},"3,-2":{B3,A-2,LF,C2,DG,I"",Jtrue},"3,-3":{B3,A-3,LF,C0,DG,I"",Jtrue},"2,-3":{B2,A-3,LF,C6,DG,I"",Jtrue},"1,-3":{B1,A-3,LF,C0,DG,I"",Jtrue},"-2,-3":{B-2,A-3,LE,C6,DG,I"home",Jtrue},"-1,-3":{B-1,A-3,LE,C6,DG,I"",Jtrue},"-2,-4":{B-2,A-4,LY,C0,DG,I"",Jtrue},"2,-1":{B2,A-1,LW,C0,DG,I"",Jtrue},"1,-1":{B1,A-1,LW,C6,DG,I"",Jtrue},"0,-1":{B0,A-1,LF,C4,DG,I"",Jtrue},"0,-2":{B0,A-2,LF,C6,DG,I"",Jtrue},"1,-2":{B1,A-2,LW,C0,DG,I"",Jtrue},"2,1":{B2,A1,LF,C2,DG,I"",Jtrue},"1,1":{B1,A1,LF,C4,DG,I"",Jtrue},"0,-3":{B0,A-3,LE,C6,DG,I"",Jtrue},"-4,-2":{B-4,A-2,LF,C4,DG,I"",Jtrue},"-3,-2":{B-3,A-2,LF,C2,DG,I"",Jtrue},"-4,0":{B-4,A0,L"trackwater",C0,DG,I"",JK},"-3,-1":{B-3,A-1,L"trackwater",C0,DG,I"",JK},"-4,-1":{B-4,A-1,L"trackwater",C0,DG,I"",JK},"-4,1":{B-4,A1,L"trackwater",C0,DG,I"",JK},"-3,1":{B-3,A1,L"trackwater",C0,DG,I"",JK}},[{B-1,A0,LM,C2,D"",Q20,R0.5,JK,O[],P[]}],[{B-2,A0,LN,C2,D"",Q20,R0.5,"cargo":{"value":0,L7},JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[0]+'-5'] = 50000;

	//pickup bunny from station
	trxLevels[trainerLevelNames[0]][6]='TRXv1.1:0~0~1.5~[{"-1,2":{B-1,A2,LE,C2,DG,I"",Jtrue},"0,2":{B0,A2,LE,C2,DG,I"",Jtrue,"uniqueid":3},"1,2":{B1,A2,LE,C2,DG,I"",Jtrue,"uniqueid":2},"2,-3":{B2,A-3,LE,C0,DG,I"home",Jtrue},"2,-4":{B2,A-4,LF,C0,DG,I"",Jtrue},"1,-4":{B1,A-4,LS,C2,DG,IU,Jtrue},"0,-4":{B0,A-4,LF,C6,DG,I"",Jtrue},"0,-3":{B0,A-3,LF,C4,DG,I"",Jtrue},"3,-3":{B3,A-3,LY,C0,DG,I"",Jtrue},"1,-3":{B1,A-3,LF,C2,DG,I"",Jtrue},"1,-2":{B1,A-2,LE,C2,DG,I"",Jtrue},"-3,2":{B-3,A2,LF,C4,DG,I"",Jtrue},"-2,-2":{B-2,A-2,LW,C2,DG,I"",Jtrue},"-2,-3":{B-2,A-3,LE,C0,DG,I"",Jtrue},"-2,-4":{B-2,A-4,LF,C0,DG,I"",Jtrue},"-3,-4":{B-3,A-4,LE,C6,DG,I"",Jtrue},"-4,-4":{B-4,A-4,LF,C6,DG,I"",Jtrue},"-4,-3":{B-4,A-3,LE,C4,DG,I"",Jtrue},"-3,-2":{B-3,A-2,LE,C6,DG,I"",Jtrue},"-1,-2":{B-1,A-2,LE,C2,DG,I"",Jtrue},"-3,1":{B-3,A1,LE,C0,DG,I"",Jtrue},"-3,0":{B-3,A0,LE,C0,DG,I"",Jtrue},"-2,-1":{B-2,A-1,LF,C2,DG,I"",Jtrue},"-4,-1":{B-4,A-1,LF,C4,DG,I"",Jtrue},"0,-1":{B0,A-1,LE,C4,DG,I"",Jtrue},"0,0":{B0,A0,LW,C2,DG,I"",Jtrue},"0,1":{B0,A1,LF,C2,DG,I"",Jtrue},"-1,1":{B-1,A1,LF,C4,DG,I"",Jtrue},"-1,0":{B-1,A0,LF,C6,DG,I"",Jtrue},"1,0":{B1,A0,LE,C2,DG,I"",Jtrue},"2,0":{B2,A0,LF,C2,DG,I"",Jtrue},"2,-1":{B2,A-1,LE,C0,DG,I"",Jtrue},"-2,2":{B-2,A2,LE,C6,DG,I"supply",Jtrue},"-2,1":{B-2,A1,LY,C0,DG,I"","cargo":{"value":0,L7},Jtrue},"2,-2":{B2,A-2,LE,C0,DG,I"",Jtrue}},[{B-1,A2,LM,C6,D"",Q20,R0.34000000000000136,JK,O[],P[],"uniqueid":1}],[{B0,A2,LN,C6,D"",Q20,R0.34000000000000136,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[0]+'-6'] = 32000;

	//maze1
	trxLevels[trainerLevelNames[0]][7]='TRXv1.1:0~0~1.5~[{"-3,-3":{B-3,A-3,LE,C6,DG,I"",JK},"-4,-3":{B-4,A-3,LF,C6,DG,I"",JK},"-4,-2":{B-4,A-2,LE,C4,DG,I"",JK},"-4,-1":{B-4,A-1,LE,C4,DG,I"",JK},"-4,0":{B-4,A0,LF,C4,DG,I"",JK},"-3,0":{B-3,A0,LE,C2,DG,I"",JK},"-2,0":{B-2,A0,LE,C2,DG,I"",JK},"-1,0":{B-1,A0,LE,C2,DG,I"",JK},"0,0":{B0,A0,LE,C2,DG,I"",Jtrue},"-2,-3":{B-2,A-3,LE,C6,DG,I"home",Jtrue},"-1,-3":{B-1,A-3,LE,C6,DG,I"",Jtrue},"-2,-4":{B-2,A-4,LY,C0,DG,I"",Jtrue},"1,-1":{B1,A-1,LF,C0,DG,I"",Jtrue},"0,-1":{B0,A-1,LE,C6,DG,I"",Jtrue},"-1,-1":{B-1,A-1,LE,C6,DG,I"",Jtrue},"-2,-1":{B-2,A-1,L"trackwater",C0,DG,I"",JK},"-3,-1":{B-3,A-1,L"trackwater",C0,DG,I"",JK},"1,1":{B1,A1,LW,C2,DG,I"",Jtrue},"0,2":{B0,A2,LE,C6,DG,I"",Jtrue},"-1,2":{B-1,A2,LE,C6,DG,I"",Jtrue},"-2,2":{B-2,A2,LF,C4,DG,I"",Jtrue},"-2,1":{B-2,A1,LF,C6,DG,I"",Jtrue},"-1,1":{B-1,A1,LE,C2,DG,I"",Jtrue},"0,1":{B0,A1,LE,C2,DG,I"",Jtrue},"2,1":{B2,A1,LF,C0,DG,I"",Jtrue},"2,2":{B2,A2,LE,C4,DG,I"",Jtrue},"2,3":{B2,A3,LF,C4,DG,I"",Jtrue},"3,3":{B3,A3,LF,C2,DG,I"",Jtrue},"3,2":{B3,A2,LE,C0,DG,I"",Jtrue},"3,1":{B3,A1,LE,C0,DG,I"",Jtrue},"2,0":{B2,A0,LF,C4,DG,I"",Jtrue},"2,-1":{B2,A-1,LE,C0,DG,I"",Jtrue},"2,-2":{B2,A-2,LE,C0,DG,I"",Jtrue},"2,-3":{B2,A-3,LW,C6,DG,I"",Jtrue},"2,-4":{B2,A-4,LF,C6,DG,I"",Jtrue},"3,-4":{B3,A-4,LF,C0,DG,I"",Jtrue},"3,-3":{B3,A-3,LF,C2,DG,I"",Jtrue},"1,-3":{B1,A-3,LE,C6,DG,I"",Jtrue},"0,-3":{B0,A-3,LE,C6,DG,I"",Jtrue},"1,3":{B1,A3,L"trackwater",C0,DG,I"",JK},"3,-1":{B3,A-1,LE,C0,DG,I"",Jtrue},"3,-2":{B3,A-2,L"trackwater",C0,DG,I"",JK}},[{B-1,A0,LM,C2,D"",Q20,R0.5,JK,O[],P[]}],[{B-2,A0,LN,C2,D"",Q20,R0.5,"cargo":{"value":0,L7},JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[0]+'-7'] = 55000;

	//maze and pickup bunny
	trxLevels[trainerLevelNames[0]][8]='TRXv1.1:0~0~1.5~[{"-3,-3":{B-3,A-3,LE,C6,DG,I"",JK},"-4,-3":{B-4,A-3,LF,C6,DG,I"",JK},"-4,-2":{B-4,A-2,LE,C4,DG,I"",JK},"-4,-1":{B-4,A-1,LE,C4,DG,I"",JK},"-4,0":{B-4,A0,LF,C4,DG,I"",JK},"-3,0":{B-3,A0,LE,C2,DG,I"",JK},"-2,0":{B-2,A0,LE,C2,DG,I"",JK},"-1,0":{B-1,A0,LE,C2,DG,I"",JK},"0,0":{B0,A0,LE,C2,DG,I"",Jtrue},"-2,-3":{B-2,A-3,LE,C6,DG,I"home",Jtrue},"-1,-3":{B-1,A-3,LE,C6,DG,I"",Jtrue},"-2,-4":{B-2,A-4,LY,C0,DG,I"",JK},"-3,2":{B-3,A2,LE,C4,DG,I"pickdrop",Jtrue},"-4,2":{B-4,A2,LY,C0,DG,I"","cargo":{"value":0,L7},Jtrue},"1,-1":{B1,A-1,L"trackwater",C0,DG,I"",JK},"1,-2":{B1,A-2,L"trackwater",C0,DG,I"",JK},"0,-3":{B0,A-3,LE,C2,DG,I"",JK},"1,1":{B1,A1,LW,C2,DG,I"",Jtrue},"2,2":{B2,A2,LE,C2,DG,I"",Jtrue},"3,2":{B3,A2,LF,C2,DG,I"",Jtrue},"1,3":{B1,A3,LF,C2,DG,I"",Jtrue},"0,3":{B0,A3,LE,C6,DG,I"",Jtrue},"-1,3":{B-1,A3,LE,C6,DG,I"",Jtrue},"-2,3":{B-2,A3,LE,C6,DG,I"",Jtrue},"-3,3":{B-3,A3,LF,C4,DG,I"",Jtrue},"-3,1":{B-3,A1,LF,C6,DG,I"",Jtrue},"-2,1":{B-2,A1,LE,C2,DG,I"",Jtrue},"-1,1":{B-1,A1,LE,C2,DG,I"",Jtrue},"0,1":{B0,A1,LE,C2,DG,I"",Jtrue},"2,1":{B2,A1,LE,C2,DG,I"",Jtrue},"3,0":{B3,A0,LE,C0,DG,I"",Jtrue},"2,-1":{B2,A-1,L"trackwater",C0,DG,I"",JK},"0,-1":{B0,A-1,L"trackwater",C0,DG,I"",JK},"0,-2":{B0,A-2,L"trackwater",C0,DG,I"",JK},"0,-4":{B0,A-4,L"trackwater",C0,DG,I"",JK},"1,-4":{B1,A-4,L"trackwater",C0,DG,I"",JK},"2,-4":{B2,A-4,L"trackwater",C0,DG,I"",JK},"3,-4":{B3,A-4,L"trackwater",C0,DG,I"",JK},"2,-3":{B2,A-3,LE,C6,DG,I"",Jtrue},"3,-2":{B3,A-2,LE,C0,DG,I"",Jtrue},"2,0":{B2,A0,L"trackwater",C0,DG,I"",JK},"2,-2":{B2,A-2,L"trackwater",C0,DG,I"",JK}},[{B-1,A0,LM,C2,D"",Q20,R0.5,JK,O[],P[]}],[{B-2,A0,LN,C2,D"",Q20,R0.5,"cargo":null,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[0]+'-8'] = 55000;

	//many diagonals through maze and pickup bunny 
	trxLevels[trainerLevelNames[0]][9]='TRXv1.1:0~0~1.5~[{"-3,-3":{B-3,A-3,LE,C6,DG,I"",JK},"-4,-3":{B-4,A-3,LF,C6,DG,I"",JK},"-4,-2":{B-4,A-2,LE,C4,DG,I"",JK},"-4,-1":{B-4,A-1,LE,C4,DG,I"",JK},"-4,0":{B-4,A0,LF,C4,DG,I"",JK},"-3,0":{B-3,A0,LE,C2,DG,I"",JK},"-2,0":{B-2,A0,LE,C2,DG,I"",JK},"-1,0":{B-1,A0,LE,C2,DG,I"",JK},"0,0":{B0,A0,LW,C0,DG,I"",Jtrue},"-2,-3":{B-2,A-3,LE,C6,DG,I"home",Jtrue},"-1,-3":{B-1,A-3,LE,C6,DG,I"",Jtrue},"-2,-4":{B-2,A-4,LY,C0,DG,I"",Jtrue},"3,-1":{B3,A-1,LE,C4,DG,I"supply",Jtrue},"2,-1":{B2,A-1,LY,C0,DG,I"","cargo":{"value":0,L7},Jtrue},"1,-1":{B1,A-1,LE,C0,DG,I"",Jtrue},"2,0":{B2,A0,L"trackwater",C0,DG,I"",JK},"3,0":{B3,A0,LE,C0,DG,I"",Jtrue},"1,-3":{B1,A-3,LW,C6,DG,I"",Jtrue},"1,-4":{B1,A-4,L"trackwater",C0,DG,I"",JK},"2,-4":{B2,A-4,L"trackwater",C0,DG,I"",JK},"3,-4":{B3,A-4,L"trackwater",C0,DG,I"",JK},"1,-2":{B1,A-2,LW,C2,DG,I"",Jtrue},"1,1":{B1,A1,LE,C4,DG,I"",Jtrue},"2,2":{B2,A2,L"trackwater",C0,DG,I"",JK},"3,2":{B3,A2,LE,C4,DG,I"",Jtrue},"3,1":{B3,A1,LE,C0,DG,I"",Jtrue},"0,-1":{B0,A-1,LE,C0,DG,I"",Jtrue},"0,-2":{B0,A-2,LF,C6,DG,I"",Jtrue},"2,-2":{B2,A-2,LE,C2,DG,I"",Jtrue},"0,2":{B0,A2,LW,C0,DG,I"",Jtrue},"-1,2":{B-1,A2,LE,C6,DG,I"",Jtrue},"-2,2":{B-2,A2,LE,C6,DG,I"",Jtrue},"-3,2":{B-3,A2,LF,C6,DG,I"",Jtrue},"-3,3":{B-3,A3,LF,C4,DG,I"",Jtrue},"-2,3":{B-2,A3,LE,C2,DG,I"",Jtrue},"-1,3":{B-1,A3,LE,C2,DG,I"",Jtrue},"0,1":{B0,A1,LE,C0,DG,I"",Jtrue},"2,-3":{B2,A-3,LE,C6,DG,I"",Jtrue},"0,-3":{B0,A-3,LE,C6,DG,I"",Jtrue},"1,3":{B1,A3,LE,C2,DG,I"",Jtrue},"2,3":{B2,A3,LE,C2,DG,I"",Jtrue},"3,3":{B3,A3,LF,C2,DG,I"",Jtrue},"2,1":{B2,A1,L"trackwater",C0,DG,I"",JK}},[{B-1,A0,LM,C2,D"",Q20,R0.5,JK,O[],P[]}],[{B-2,A0,LN,C2,D"",Q20,R0.5,"cargo":null,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[0]+'-9'] = 45000;

	/// 2. B  - spring wyes, Lazy wyes, prompt wye, connect cars
	trxLevels[trainerLevelNames[1]] = [];

	// two choices for sprung wyes
	trxLevels[trainerLevelNames[1]][0]='TRXv1.1:0~0~1.5~[{"-1,2":{B-1,A2,LE,C2,DG,I"",Jtrue},"0,2":{B0,A2,LE,C2,DG,I"",Jtrue,"uniqueid":3},"1,2":{B1,A2,LE,C2,DG,I"",Jtrue,"uniqueid":2},"2,-3":{B2,A-3,LE,C0,DG,I"home",Jtrue},"2,-4":{B2,A-4,LF,C0,DG,I"",Jtrue},"1,-4":{B1,A-4,LS,C2,DG,IU,Jtrue},"0,-4":{B0,A-4,LF,C6,DG,I"",Jtrue},"0,-3":{B0,A-3,LF,C4,DG,I"",Jtrue},"3,-3":{B3,A-3,LY,C0,DG,I"",Jtrue},"1,-3":{B1,A-3,LF,C2,DG,I"",Jtrue},"2,-2":{B2,A-2,LT,C0,DH,IU,Jtrue},"1,-2":{B1,A-2,LE,C2,DG,I"",Jtrue},"2,2":{B2,A2,LE,C6,DG,I"",JK},"-3,2":{B-3,A2,LF,C4,DG,I"",Jtrue},"-2,-2":{B-2,A-2,LW,C2,DG,I"",Jtrue},"-2,-3":{B-2,A-3,LE,C0,DG,I"",Jtrue},"-2,-4":{B-2,A-4,LF,C0,DG,I"",Jtrue},"-3,-4":{B-3,A-4,LE,C6,DG,I"",Jtrue},"-4,-4":{B-4,A-4,LF,C6,DG,I"",Jtrue},"-4,-3":{B-4,A-3,LE,C4,DG,I"",Jtrue},"-4,-2":{B-4,A-2,LT,C4,DG,IU,Jtrue},"-3,-2":{B-3,A-2,LE,C6,DG,I"",Jtrue},"-1,-2":{B-1,A-2,LE,C2,DG,I"",Jtrue},"-3,1":{B-3,A1,LE,C0,DG,I"",Jtrue},"-3,0":{B-3,A0,LE,C0,DG,I"",Jtrue},"-2,-1":{B-2,A-1,LF,C2,DG,I"",Jtrue},"-4,-1":{B-4,A-1,LF,C4,DG,I"",Jtrue},"0,-1":{B0,A-1,LE,C4,DG,I"",Jtrue},"0,0":{B0,A0,LW,C2,DG,I"",Jtrue},"0,1":{B0,A1,LF,C2,DG,I"",Jtrue},"-1,1":{B-1,A1,LF,C4,DG,I"",Jtrue},"-1,0":{B-1,A0,LF,C6,DG,I"",Jtrue},"1,0":{B1,A0,LE,C2,DG,I"",Jtrue},"2,0":{B2,A0,LF,C2,DG,I"",Jtrue},"2,-1":{B2,A-1,LE,C0,DG,I"",Jtrue},"3,2":{B3,A2,LE,C6,DG,I"",JK},"-2,2":{B-2,A2,LE,C6,DG,I"supply",Jtrue},"-2,1":{B-2,A1,LY,C0,DG,I"","cargo":{"value":0,L7},Jtrue}},[{B-1,A2,LM,C6,D"",Q20,R0.34000000000000136,JK,O[],P[],"uniqueid":1}],[{B0,A2,LN,C6,D"",Q20,R0.34000000000000136,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[1]+'-0'] = 38000;

	// two choices for sprung wyes to avoid loop backs
	trxLevels[trainerLevelNames[1]][1]='TRXv1.1:0~0~1.5~[{"-1,2":{B-1,A2,LE,C2,DG,I"",Jtrue},"0,2":{B0,A2,LE,C2,DG,I"",Jtrue},"1,2":{B1,A2,LE,C2,DG,I"",Jtrue},"2,-3":{B2,A-3,LE,C0,DG,I"home",Jtrue},"2,-4":{B2,A-4,LF,C0,DG,I"",Jtrue},"1,-4":{B1,A-4,LS,C2,DG,IU,Jtrue},"0,-4":{B0,A-4,LF,C6,DG,I"",Jtrue},"0,-3":{B0,A-3,LF,C4,DG,I"",Jtrue},"3,-3":{B3,A-3,LY,C0,DG,I"",JK},"1,-3":{B1,A-3,LF,C2,DG,I"",Jtrue},"2,2":{B2,A2,LE,C6,DG,I"",JK},"-3,2":{B-3,A2,LF,C4,DG,I"",Jtrue},"-3,1":{B-3,A1,LE,C0,DG,I"",Jtrue},"-3,0":{B-3,A0,LE,C0,DG,I"",Jtrue},"3,2":{B3,A2,LE,C6,DG,I"",JK},"-2,2":{B-2,A2,LE,C6,DG,I"supply",Jtrue},"-2,1":{B-2,A1,LY,C0,DG,I"","cargo":{"value":0,L7},JK},"-3,-1":{B-3,A-1,LF,C6,DG,I"",Jtrue},"-2,-1":{B-2,A-1,LT,C2,DG,IU,Jtrue},"-1,-1":{B-1,A-1,LT,C2,DG,IU,Jtrue},"0,-1":{B0,A-1,LS,C6,DH,IU,Jtrue},"1,-1":{B1,A-1,LS,C2,DH,IU,Jtrue},"2,-1":{B2,A-1,LV,C4,DG,IU,Jtrue},"2,-2":{B2,A-2,LE,C0,DG,I"",Jtrue},"3,-1":{B3,A-1,LF,C0,DG,I"",Jtrue},"3,0":{B3,A0,LT,C0,DH,IU,Jtrue},"3,1":{B3,A1,LF,C2,DG,I"",Jtrue}},[{B2,A2,LM,C6,D"",Q20,R0.5,JK,O[],P[]}],[{B3,A2,LN,C6,D"",Q20,R0.5,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[1]+'-1'] = 32000;
	
	// third demo of sprung wyes
	trxLevels[trainerLevelNames[1]][2]= 'TRXv1.1:0~0~1.5~[{"-3,2":{B-3,A2,LT,C4,DG,IU,Jtrue},"-3,1":{B-3,A1,LT,C0,DG,IU,Jtrue},"-4,1":{B-4,A1,LF,C4,DG,I"",Jtrue},"-2,1":{B-2,A1,LT,C4,DG,IU,Jtrue},"-2,0":{B-2,A0,LE,C0,DG,I"",Jtrue},"-2,-1":{B-2,A-1,LT,C0,DG,IU,Jtrue},"-3,-1":{B-3,A-1,LF,C4,DG,I"",Jtrue},"-1,0":{B-1,A0,LT,C4,DG,IU,Jtrue},"-1,-1":{B-1,A-1,LE,C0,DG,I"",Jtrue},"-1,-2":{B-1,A-2,LE,C0,DG,I"",Jtrue},"-1,-3":{B-1,A-3,LT,C0,DG,IU,Jtrue},"-2,-3":{B-2,A-3,LF,C4,DG,I"",Jtrue},"-2,2":{B-2,A2,LS,C6,DH,IU,Jtrue},"-1,2":{B-1,A2,LE,C2,DG,I"",Jtrue},"0,2":{B0,A2,LS,C2,DH,IU,Jtrue},"0,3":{B0,A3,LF,C4,DG,I"",Jtrue},"-1,1":{B-1,A1,LS,C6,DH,IU,Jtrue},"0,1":{B0,A1,LE,C2,DG,I"",Jtrue},"1,1":{B1,A1,LE,C2,DG,I"",Jtrue},"2,1":{B2,A1,LS,C2,DH,IU,Jtrue},"2,2":{B2,A2,LF,C4,DG,I"",Jtrue},"0,0":{B0,A0,LE,C2,DG,I"",Jtrue},"1,0":{B1,A0,LE,C6,DG,I"home",Jtrue},"-3,3":{B-3,A3,LF,C4,DG,I"",Jtrue},"-2,3":{B-2,A3,LE,C2,DG,I"",JK},"-1,3":{B-1,A3,LE,C2,DG,I"",JK},"2,0":{B2,A0,LS,C6,DH,IU,Jtrue},"3,0":{B3,A0,LF,C2,DG,I"",Jtrue},"3,-1":{B3,A-1,LF,C0,DG,I"",Jtrue},"2,-1":{B2,A-1,LF,C6,DG,I"",Jtrue},"1,-1":{B1,A-1,LY,C0,DG,I"",JK},"-4,-1":{B-4,A-1,L"trackwater",C0,DG,I"",Jtrue},"-5,-1":{B-5,A-1,L"trackwater",C0,DG,I"",Jtrue},"-5,0":{B-5,A0,L"trackwater",C0,DG,I"",Jtrue},"1,4":{B1,A4,L"trackwater",C0,DG,I"",Jtrue},"2,4":{B2,A4,L"trackwater",C0,DG,I"",Jtrue},"2,3":{B2,A3,L"trackwater",C0,DG,I"",Jtrue},"-4,-2":{B-4,A-2,L"trackwater",C0,DG,I"",Jtrue},"-4,-3":{B-4,A-3,L"trackwater",C0,DG,I"",Jtrue},"-3,-3":{B-3,A-3,L"trackwater",C0,DG,I"",Jtrue},"-3,-4":{B-3,A-4,L"trackwater",C0,DG,I"",Jtrue},"-3,-5":{B-3,A-5,L"trackwater",C0,DG,I"",Jtrue},"-2,-5":{B-2,A-5,L"trackwater",C0,DG,I"",Jtrue},"-1,-5":{B-1,A-5,L"trackwater",C0,DG,I"",Jtrue},"0,-5":{B0,A-5,L"trackwater",C0,DG,I"",Jtrue},"0,-4":{B0,A-4,L"trackwater",C0,DG,I"",Jtrue},"3,3":{B3,A3,L"trackwater",C0,DG,I"",Jtrue},"4,3":{B4,A3,L"trackwater",C0,DG,I"",Jtrue},"4,2":{B4,A2,L"trackwater",C0,DG,I"",Jtrue},"4,1":{B4,A1,L"trackwater",C0,DG,I"",Jtrue},"-5,-2":{B-5,A-2,L"trackwater",C0,DG,I"",Jtrue},"-4,-4":{B-4,A-4,L"trackwater",C0,DG,I"",Jtrue},"-5,-3":{B-5,A-3,L"trackwater",C0,DG,I"",Jtrue},"-5,-4":{B-5,A-4,L"trackwater",C0,DG,I"",Jtrue},"-5,-5":{B-5,A-5,L"trackwater",C0,DG,I"",Jtrue},"-4,-5":{B-4,A-5,L"trackwater",C0,DG,I"",Jtrue},"3,4":{B3,A4,L"trackwater",C0,DG,I"",Jtrue},"4,4":{B4,A4,L"trackwater",C0,DG,I"",Jtrue}},[{B-2,A3,LM,C6,D"",Q20,R0.5,JK,O[],P[]}],[{B-1,A3,LN,C6,D"",Q20,R0.5,"cargo":{"value":0,L7},JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[1]+'-2'] = 90000;

	// simple lazy wyes
	trxLevels[trainerLevelNames[1]][3]='TRXv1.1:0~0~1.5~[{"-1,2":{B-1,A2,LS,C2,DH,I"lazy",Jtrue},"0,2":{B0,A2,LE,C2,DG,I"",Jtrue},"1,2":{B1,A2,LE,C2,DG,I"",Jtrue},"2,-3":{B2,A-3,LE,C0,DG,I"home",Jtrue},"2,-4":{B2,A-4,LF,C0,DG,I"",Jtrue},"1,-4":{B1,A-4,LS,C2,DG,IU,Jtrue},"0,-4":{B0,A-4,LF,C6,DG,I"",Jtrue},"0,-3":{B0,A-3,LF,C4,DG,I"",Jtrue},"3,-3":{B3,A-3,LY,C0,DG,I"",JK},"1,-3":{B1,A-3,LF,C2,DG,I"",Jtrue},"2,2":{B2,A2,LE,C6,DG,I"",JK},"-3,2":{B-3,A2,LF,C4,DG,I"",Jtrue},"-3,1":{B-3,A1,LE,C0,DG,I"",Jtrue},"-3,0":{B-3,A0,LE,C0,DG,I"",Jtrue},"3,2":{B3,A2,LE,C6,DG,I"",JK},"-2,2":{B-2,A2,LE,C6,DG,I"supply",Jtrue},"-2,1":{B-2,A1,LY,C0,DG,I"","cargo":{"value":0,L7},JK},"1,-5":{B1,A-5,LY,C0,DG,I"",JK},"2,-2":{B2,A-2,LT,C0,DH,IU,Jtrue},"2,-1":{B2,A-1,LT,C0,DG,I"lazy",Jtrue},"1,-1":{B1,A-1,L"trackwater",C0,DG,I"",Jtrue},"0,-1":{B0,A-1,L"trackwater",C0,DG,I"",Jtrue},"0,0":{B0,A0,L"trackwater",C0,DG,I"",Jtrue},"1,0":{B1,A0,L"trackwater",C0,DG,I"",Jtrue}},[{B0,A2,LM,C6,D"",Q20,R8.881784197001252e-16,JK,O[],P[]}],[{B1,A2,LN,C6,D"",Q20,R8.881784197001252e-16,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[1]+'-3'] = 30000;

	// two lazy wyes
	trxLevels[trainerLevelNames[1]][4]='TRXv1.1:0~0~1.5~[{"-1,2":{B-1,A2,LS,C2,DH,I"lazy",Jtrue},"0,2":{B0,A2,LE,C2,DG,I"",Jtrue},"1,2":{B1,A2,LE,C2,DG,I"",Jtrue},"2,-3":{B2,A-3,LE,C0,DG,I"home",Jtrue},"2,-4":{B2,A-4,LF,C0,DG,I"",Jtrue},"1,-4":{B1,A-4,LS,C2,DG,IU,Jtrue},"0,-4":{B0,A-4,LF,C6,DG,I"",Jtrue},"0,-3":{B0,A-3,LF,C4,DG,I"",Jtrue},"3,-3":{B3,A-3,LY,C0,DG,I"",JK},"1,-3":{B1,A-3,LF,C2,DG,I"",Jtrue},"2,2":{B2,A2,LE,C6,DG,I"",JK},"-3,2":{B-3,A2,LF,C4,DG,I"",Jtrue},"-3,1":{B-3,A1,LE,C0,DG,I"",Jtrue},"3,2":{B3,A2,LE,C6,DG,I"",JK},"-2,2":{B-2,A2,LE,C6,DG,I"supply",Jtrue},"-2,1":{B-2,A1,LY,C0,DG,I"","cargo":{"value":0,L7},JK},"1,-5":{B1,A-5,LY,C0,DG,I"",JK},"2,-2":{B2,A-2,LT,C0,DH,IU,Jtrue},"2,-1":{B2,A-1,LT,C0,DG,I"lazy",Jtrue},"-3,-1":{B-3,A-1,L"trackwater",C0,DG,I"",JK},"-3,-2":{B-3,A-2,L"trackwater",C0,DG,I"",JK},"-2,-2":{B-2,A-2,L"trackwater",C0,DG,I"",JK},"-2,-3":{B-2,A-3,L"trackwater",C0,DG,I"",JK},"-3,-3":{B-3,A-3,L"trackwater",C0,DG,I"",JK},"-1,-3":{B-1,A-3,L"trackwater",C0,DG,I"",JK}},[{B0,A2,LM,C6,D"",Q20,R8.881784197001252e-16,JK,O[],P[]}],[{B1,A2,LN,C6,D"",Q20,R8.881784197001252e-16,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[1]+'-4'] = 30000;

	// three lazy wyes
	trxLevels[trainerLevelNames[1]][5]='TRXv1.1:0~0~1.5~[{"-1,2":{B-1,A2,LS,C2,DG,I"lazy",Jtrue},"0,2":{B0,A2,LE,C2,DG,I"",Jtrue},"1,2":{B1,A2,LE,C2,DG,I"",Jtrue},"2,-3":{B2,A-3,LE,C0,DG,I"home",Jtrue},"2,-4":{B2,A-4,LF,C0,DG,I"",Jtrue},"1,-4":{B1,A-4,LS,C2,DG,IU,Jtrue},"0,-4":{B0,A-4,LF,C6,DG,I"",Jtrue},"0,-3":{B0,A-3,LF,C4,DG,I"",Jtrue},"3,-3":{B3,A-3,LY,C0,DG,I"",Jtrue},"1,-3":{B1,A-3,LF,C2,DG,I"",Jtrue},"2,2":{B2,A2,LE,C6,DG,I"",JK},"-3,2":{B-3,A2,LF,C4,DG,I"",Jtrue},"-3,1":{B-3,A1,LE,C0,DG,I"",Jtrue},"3,2":{B3,A2,LE,C6,DG,I"",JK},"-2,2":{B-2,A2,LE,C6,DG,I"supply",Jtrue},"-2,1":{B-2,A1,LY,C0,DG,I"","cargo":{"value":0,L7},JK},"2,-2":{B2,A-2,LE,C4,DG,I"",Jtrue},"2,-1":{B2,A-1,LF,C2,DG,I"",Jtrue},"1,-1":{B1,A-1,LT,C2,DH,IU,Jtrue},"0,-1":{B0,A-1,LS,C2,DH,I"lazy",Jtrue},"-1,-1":{B-1,A-1,LT,C2,DG,I"lazy",Jtrue},"-2,-1":{B-2,A-1,LE,C6,DG,I"",Jtrue}},[{B2,A2,LM,C6,D"",Q20,R0.5,JK,O[],P[]}],[{B3,A2,LN,C6,D"",Q20,R0.5,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[1]+'-5'] = 40000;

	// loose car to connect
	trxLevels[trainerLevelNames[1]][6]='TRXv1.1:0~0~1.5~[{"2,2":{B2,A2,LE,C6,DG,I"",JK},"1,2":{B1,A2,LE,C6,DG,I"",Jtrue},"0,2":{B0,A2,LE,C6,DG,I"",Jtrue},"-1,2":{B-1,A2,LE,C6,DG,I"",Jtrue},"-2,2":{B-2,A2,LE,C6,DG,I"",Jtrue},"-2,0":{B-2,A0,LE,C2,DG,I"",Jtrue},"-1,0":{B-1,A0,LE,C2,DG,I"supply",Jtrue},"3,-3":{B3,A-3,LS,C4,DH,IU,Jtrue},"3,-2":{B3,A-2,LE,C4,DG,I"home",Jtrue},"2,-2":{B2,A-2,LY,C0,DG,I"",Jtrue},"3,-4":{B3,A-4,LF,C0,DG,I"",Jtrue},"2,-3":{B2,A-3,LF,C4,DG,I"",Jtrue},"-2,-2":{B-2,A-2,LE,C2,DG,I"",Jtrue},"-1,-2":{B-1,A-2,LE,C2,DG,I"",Jtrue},"-1,1":{B-1,A1,LY,C0,DG,I"","cargo":{"value":0,L7},Jtrue},"2,-4":{B2,A-4,LF,C6,DG,I"",Jtrue}},[{B2,A2,LM,C6,D"",Q20,R0.5,JK,O[],P[]}],[{B-2,A-2,LN,C2,D"",Q0,R0.5,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[1]+'-6'] = 32000;

	// loose car and wye
	trxLevels[trainerLevelNames[1]][7]='TRXv1.1:0~0~1.5~[{"2,2":{B2,A2,LE,C6,DG,I"",JK},"1,2":{B1,A2,LE,C6,DG,I"",Jtrue},"0,2":{B0,A2,LE,C6,DG,I"",Jtrue},"-1,2":{B-1,A2,LE,C6,DG,I"",Jtrue},"-2,2":{B-2,A2,LE,C6,DG,I"",Jtrue},"-2,0":{B-2,A0,LE,C2,DG,I"",Jtrue},"-1,0":{B-1,A0,LE,C2,DG,I"supply",Jtrue},"3,-3":{B3,A-3,LS,C4,DH,IU,Jtrue},"3,-2":{B3,A-2,LE,C4,DG,I"home",Jtrue},"2,-2":{B2,A-2,LY,C0,DG,I"",Jtrue},"3,-4":{B3,A-4,LF,C0,DG,I"",Jtrue},"2,-3":{B2,A-3,LF,C4,DG,I"",Jtrue},"-2,-2":{B-2,A-2,LE,C2,DG,I"",Jtrue},"-1,-2":{B-1,A-2,LE,C2,DG,I"",Jtrue},"-1,1":{B-1,A1,LY,C0,DG,I"","cargo":{"value":0,L7},Jtrue},"2,-4":{B2,A-4,LF,C6,DG,I"",Jtrue},"-1,-1":{B-1,A-1,LE,C6,DG,I"",Jtrue},"-2,-1":{B-2,A-1,LE,C6,DG,I"",Jtrue},"0,-2":{B0,A-2,LT,C2,DH,I"lazy",Jtrue},"-3,-2":{B-3,A-2,LT,C6,DG,I"lazy",Jtrue},"1,-2":{B1,A-2,LE,C2,DG,I"",Jtrue}},[{B1,A2,LM,C6,D"",Q20,R0.980000000000001,JK,O[],P[]}],[{B-2,A-2,LN,C2,D"",Q0,R0.5,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[1]+'-7'] = 35000;

	// prompt wye maze
	trxLevels[trainerLevelNames[1]][8]='TRXv1.1:0~0~1.5~[{"3,-3":{B3,A-3,LS,C4,DH,IU,JK},"3,-4":{B3,A-4,LF,C0,DG,I"",JK},"2,-4":{B2,A-4,LF,C6,DG,I"",JK},"2,-3":{B2,A-3,LF,C4,DG,I"",JK},"3,-2":{B3,A-2,LE,C4,DG,I"home",JK},"3,-1":{B3,A-1,LE,C4,DG,I"",JK},"2,-2":{B2,A-2,LY,C0,DG,I"",JK},"0,3":{B0,A3,LE,C6,DG,I"",JK},"-1,3":{B-1,A3,LE,C6,DG,I"",JK},"-2,3":{B-2,A3,LF,C4,DG,I"",JK},"-2,2":{B-2,A2,LV,C0,DG,I"prompt",JK},"-1,2":{B-1,A2,LF,C2,DG,I"",JK},"-3,2":{B-3,A2,LF,C4,DG,I"",JK},"-1,1":{B-1,A1,LE,C0,DG,I"",JK},"-3,1":{B-3,A1,L"trackwater",C0,DG,I"",JK},"-2,1":{B-2,A1,L"trackwater",C0,DG,I"",JK},"-2,0":{B-2,A0,L"trackwater",C0,DG,I"",JK},"-3,0":{B-3,A0,L"trackwater",C0,DG,I"",JK},"-4,1":{B-4,A1,L"trackwater",C0,DG,I"",JK},"-4,0":{B-4,A0,L"trackwater",C0,DG,I"",JK},"-1,0":{B-1,A0,LE,C0,DG,I"",JK},"-1,-1":{B-1,A-1,LV,C0,DH,I"prompt",JK},"-2,-1":{B-2,A-1,LF,C4,DG,I"",JK},"-2,-2":{B-2,A-2,LE,C0,DG,I"",JK},"-2,-3":{B-2,A-3,LF,C6,DG,I"",JK},"-1,-3":{B-1,A-3,LE,C2,DG,I"",JK},"0,-3":{B0,A-3,LF,C0,DG,I"",JK},"0,-2":{B0,A-2,LE,C4,DG,I"",JK},"0,-1":{B0,A-1,LT,C0,DG,IU,JK},"0,0":{B0,A0,LE,C4,DG,I"",JK},"0,1":{B0,A1,LF,C4,DG,I"",JK},"1,1":{B1,A1,LV,C2,DH,I"prompt",JK},"1,0":{B1,A0,LF,C6,DG,I"",JK},"1,2":{B1,A2,LF,C4,DG,I"",JK},"2,2":{B2,A2,LE,C2,DG,I"supply",JK},"3,2":{B3,A2,LF,C2,DG,I"",JK},"3,1":{B3,A1,LE,C0,DG,I"",JK},"3,0":{B3,A0,LS,C4,DH,IU,JK},"2,0":{B2,A0,LE,C2,DG,I"",JK},"2,3":{B2,A3,LY,C0,DG,I"","cargo":{"value":0,L7},JK}},[{B0,A3,LM,C6,D"",Q20,R0.5,JK,O[],P[]}],[{B-2,A-2,LN,C0,D"",Q0,R0.5,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[1]+'-8'] = 33000;

	// prompt wye maze 2
	trxLevels[trainerLevelNames[1]][9]='TRXv1.1:0~0~1.5~[{"2,2":{B2,A2,LE,C6,DG,I"",JK},"1,2":{B1,A2,LE,C6,DG,I"",Jtrue},"0,2":{B0,A2,LE,C6,DG,I"",Jtrue},"-1,2":{B-1,A2,LE,C6,DG,I"",Jtrue},"-2,2":{B-2,A2,LE,C6,DG,I"",Jtrue},"3,-3":{B3,A-3,LS,C4,DH,IU,Jtrue},"3,-2":{B3,A-2,LE,C4,DG,I"home",Jtrue},"2,-2":{B2,A-2,LY,C0,DG,I"",Jtrue},"3,-4":{B3,A-4,LF,C0,DG,I"",Jtrue},"2,-3":{B2,A-3,LF,C4,DG,I"",Jtrue},"2,-4":{B2,A-4,LF,C6,DG,I"",Jtrue},"-2,-1":{B-2,A-1,LE,C0,DG,I"supply",Jtrue},"-1,-1":{B-1,A-1,LY,C0,DG,I"","cargo":{"value":0,L7},Jtrue},"0,-1":{B0,A-1,LE,C4,DG,I"supply",Jtrue},"-3,2":{B-3,A2,LF,C4,DG,I"",Jtrue},"-1,1":{B-1,A1,LE,C2,DG,I"",Jtrue},"0,1":{B0,A1,LE,C2,DG,I"",Jtrue},"1,1":{B1,A1,LT,C2,DH,I"prompt",Jtrue},"1,0":{B1,A0,LT,C0,DG,I"prompt",Jtrue},"0,0":{B0,A0,LV,C4,DH,I"prompt",Jtrue},"1,-1":{B1,A-1,LE,C0,DG,I"",Jtrue},"1,-2":{B1,A-2,LT,C0,DH,I"prompt",Jtrue},"0,-2":{B0,A-2,LV,C6,DG,I"prompt",Jtrue},"-1,-2":{B-1,A-2,LE,C6,DG,I"",Jtrue},"-2,-2":{B-2,A-2,LT,C4,DH,I"prompt",Jtrue},"1,-3":{B1,A-3,LF,C0,DG,I"",Jtrue},"0,-3":{B0,A-3,LT,C6,DH,I"prompt",Jtrue},"-1,-3":{B-1,A-3,LE,C6,DG,I"",Jtrue},"-2,-3":{B-2,A-3,LF,C6,DG,I"",Jtrue},"-2,0":{B-2,A0,LV,C6,DH,I"prompt",Jtrue},"-3,1":{B-3,A1,LF,C6,DG,I"",Jtrue},"-2,1":{B-2,A1,LS,C6,DG,I"prompt",Jtrue},"2,1":{B2,A1,LE,C2,DG,I"",Jtrue},"3,1":{B3,A1,LF,C2,DG,I"",Jtrue},"3,0":{B3,A0,LE,C0,DG,I"",Jtrue},"3,-1":{B3,A-1,LE,C0,DG,I"",Jtrue},"-1,0":{B-1,A0,LE,C6,DG,I"",Jtrue}},[{B1,A2,LM,C6,D"",Q20,R0.980000000000001,JK,O[],P[]}],[{B1,A-1,LN,C0,D"",Q0,R0.5,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[1]+'-9'] = 48000;

	/// 3. C- blocks, greater wyes, supply, dump
	trxLevels[trainerLevelNames[2]] = [];

	// greater
	trxLevels[trainerLevelNames[2]][0]='TRXv1.1:0~0~1.5~[{"3,-3":{B3,A-3,LS,C4,DH,IU,Jtrue},"3,-2":{B3,A-2,LE,C4,DG,I"home",Jtrue},"2,-2":{B2,A-2,LY,C0,DG,I"",Jtrue},"3,-4":{B3,A-4,LF,C0,DG,I"",Jtrue},"2,-3":{B2,A-3,LF,C4,DG,I"",Jtrue},"2,-4":{B2,A-4,LF,C6,DG,I"",Jtrue},"3,3":{B3,A3,LE,C6,DG,I"",Jtrue},"2,3":{B2,A3,LE,C6,DG,I"",Jtrue},"1,3":{B1,A3,LE,C6,DG,I"",Jtrue},"0,3":{B0,A3,LE,C6,DG,I"",Jtrue},"-1,3":{B-1,A3,LE,C6,DG,I"",Jtrue},"-2,3":{B-2,A3,LE,C6,DG,I"",Jtrue},"0,1":{B0,A1,LV,C2,DH,IX,Jtrue},"0,0":{B0,A0,LF,C6,DG,I"",Jtrue},"1,0":{B1,A0,LE,C2,DG,I"",Jtrue},"2,0":{B2,A0,LE,C2,DG,I"",Jtrue},"3,0":{B3,A0,LF,C2,DG,I"",Jtrue},"3,-1":{B3,A-1,LE,C0,DG,I"",Jtrue},"0,2":{B0,A2,LF,C4,DG,I"",Jtrue},"1,2":{B1,A2,LE,C2,DG,I"",Jtrue},"2,2":{B2,A2,L"trackwater",C0,DG,I"",JK},"1,1":{B1,A1,LY,C0,DG,I"","cargo":{"value":1,L4},Jtrue},"-1,1":{B-1,A1,LE,C2,DG,I"",Jtrue},"3,2":{B3,A2,L"trackwater",C0,DG,I"",JK},"3,1":{B3,A1,L"trackwater",C0,DG,I"",JK},"-2,-1":{B-2,A-1,LT,C0,DG,IU,Jtrue},"-2,0":{B-2,A0,LE,C4,DG,I"",Jtrue},"-2,1":{B-2,A1,LF,C4,DG,I"",Jtrue},"-4,0":{B-4,A0,LE,C4,DG,I"",Jtrue},"-4,1":{B-4,A1,LE,C4,DG,I"",Jtrue},"-4,2":{B-4,A2,LE,C4,DG,I"",Jtrue},"-4,3":{B-4,A3,LF,C4,DG,I"",Jtrue},"-2,-2":{B-2,A-2,LF,C0,DG,I"",Jtrue},"-3,3":{B-3,A3,LE,C2,DG,I"",Jtrue},"-3,-2":{B-3,A-2,LE,C6,DG,I"supply",Jtrue},"-3,-1":{B-3,A-1,LE,C2,DG,I"supply",Jtrue},"-3,-3":{B-3,A-3,LY,C0,DG,I"","cargo":{"value":3,L4},Jtrue},"-3,0":{B-3,A0,LY,C0,DG,I"","cargo":{"value":0,L4},Jtrue},"2,1":{B2,A1,L"trackwater",C0,DG,I"",JK}},[{B1,A3,LM,C6,D"",Q20,R0.34000000000000047,JK,O[],P[]}],[{B2,A3,LN,C6,D"",Q20,R0.34000000000000047,"cargo":{"value":0,L7},JK,O[],P[]},{B3,A3,LN,C6,D"",Q20,R0.34000000000000047,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[2]+'-2'] = 36000;

	// less
	trxLevels[trainerLevelNames[2]][1]='TRXv1.1:0~0~1.5~[{"3,-3":{B3,A-3,LS,C4,DH,IU,Jtrue},"3,-2":{B3,A-2,LE,C4,DG,I"home",Jtrue},"2,-2":{B2,A-2,LY,C0,DG,I"",Jtrue},"3,-4":{B3,A-4,LF,C0,DG,I"",Jtrue},"2,-3":{B2,A-3,LF,C4,DG,I"",Jtrue},"2,-4":{B2,A-4,LF,C6,DG,I"",Jtrue},"3,3":{B3,A3,LE,C6,DG,I"",Jtrue},"2,3":{B2,A3,LE,C6,DG,I"",Jtrue},"1,3":{B1,A3,LE,C6,DG,I"",Jtrue},"0,3":{B0,A3,LE,C6,DG,I"",Jtrue},"-1,3":{B-1,A3,LE,C6,DG,I"",Jtrue},"-2,3":{B-2,A3,LE,C6,DG,I"",Jtrue},"0,1":{B0,A1,LV,C2,DH,I"compareless",Jtrue},"0,0":{B0,A0,LF,C6,DG,I"",Jtrue},"1,0":{B1,A0,LE,C2,DG,I"",Jtrue},"2,0":{B2,A0,LE,C2,DG,I"",Jtrue},"3,0":{B3,A0,LF,C2,DG,I"",Jtrue},"3,-1":{B3,A-1,LE,C0,DG,I"",Jtrue},"0,2":{B0,A2,LF,C4,DG,I"",Jtrue},"1,2":{B1,A2,LE,C2,DG,I"",Jtrue},"2,2":{B2,A2,L"trackwater",C0,DG,I"",JK},"1,1":{B1,A1,LY,C0,DG,I"","cargo":{"value":1,L4},Jtrue},"-1,1":{B-1,A1,LE,C2,DG,I"",Jtrue},"3,2":{B3,A2,L"trackwater",C0,DG,I"",JK},"3,1":{B3,A1,L"trackwater",C0,DG,I"",JK},"-2,-1":{B-2,A-1,LT,C0,DG,IU,Jtrue},"-2,0":{B-2,A0,LE,C4,DG,I"",Jtrue},"-2,1":{B-2,A1,LF,C4,DG,I"",Jtrue},"-4,0":{B-4,A0,LE,C4,DG,I"",Jtrue},"-4,1":{B-4,A1,LE,C4,DG,I"",Jtrue},"-4,2":{B-4,A2,LE,C4,DG,I"",Jtrue},"-4,3":{B-4,A3,LF,C4,DG,I"",Jtrue},"-2,-2":{B-2,A-2,LF,C0,DG,I"",Jtrue},"-3,3":{B-3,A3,LE,C2,DG,I"",Jtrue},"-3,-2":{B-3,A-2,LE,C6,DG,I"supply",Jtrue},"-3,-1":{B-3,A-1,LE,C2,DG,I"supply",Jtrue},"-3,-3":{B-3,A-3,LY,C0,DG,I"","cargo":{"value":3,L4},Jtrue},"-3,0":{B-3,A0,LY,C0,DG,I"","cargo":{"value":0,L4},Jtrue},"2,1":{B2,A1,L"trackwater",C0,DG,I"",JK}},[{B1,A3,LM,C6,D"",Q20,R0.34000000000000047,JK,O[],P[]}],[{B2,A3,LN,C6,D"",Q20,R0.34000000000000047,"cargo":{"value":0,L7},JK,O[],P[]},{B3,A3,LN,C6,D"",Q20,R0.34000000000000047,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[2]+'-3'] = 36000;

	// 
	trxLevels[trainerLevelNames[2]][2]='TRXv1.1:0.016666666666666666~-0.5157894736842106~1.4438902539842515~[{"3,-3":{B3,A-3,LS,C4,DH,IU,Jtrue},"3,-2":{B3,A-2,LE,C4,DG,I"home",Jtrue},"2,-2":{B2,A-2,LY,C0,DG,I"",Jtrue},"3,-4":{B3,A-4,LF,C0,DG,I"",Jtrue},"2,-3":{B2,A-3,LF,C4,DG,I"",Jtrue},"2,-4":{B2,A-4,LF,C6,DG,I"",Jtrue},"3,3":{B3,A3,LE,C6,DG,I"",Jtrue},"2,3":{B2,A3,LE,C6,DG,I"",Jtrue},"1,3":{B1,A3,LE,C6,DG,I"",Jtrue},"0,3":{B0,A3,LE,C6,DG,I"",Jtrue},"-1,3":{B-1,A3,LE,C6,DG,I"",Jtrue},"-2,3":{B-2,A3,LE,C6,DG,I"",Jtrue},"3,-1":{B3,A-1,LE,C0,DG,I"",Jtrue},"3,2":{B3,A2,LF,C2,DG,I"",Jtrue},"3,1":{B3,A1,LE,C0,DG,I"",Jtrue},"-4,0":{B-4,A0,LE,C4,DG,I"",Jtrue},"-4,1":{B-4,A1,LE,C4,DG,I"",Jtrue},"-4,2":{B-4,A2,LE,C4,DG,I"",Jtrue},"-4,3":{B-4,A3,LF,C4,DG,I"",Jtrue},"-3,3":{B-3,A3,LE,C2,DG,I"",Jtrue},"3,0":{B3,A0,LE,C0,DG,I"",Jtrue},"-3,-5":{B-3,A-5,LE,C2,DG,I"",Jtrue},"-3,-4":{B-3,A-4,LE,C2,DG,I"",Jtrue},"-3,-3":{B-3,A-3,LE,C2,DG,I"",Jtrue},"-2,-3":{B-2,A-3,LE,C2,DG,I"",Jtrue},"-2,-4":{B-2,A-4,LE,C2,DG,I"",Jtrue},"-2,-5":{B-2,A-5,LE,C2,DG,I"",JK},"-1,-5":{B-1,A-5,LF,C0,DG,I"",Jtrue},"-1,-4":{B-1,A-4,LT,C0,DG,IU,Jtrue},"-1,-3":{B-1,A-3,LT,C0,DG,IU,Jtrue},"-1,-2":{B-1,A-2,LE,C4,DG,I"",Jtrue},"-1,-1":{B-1,A-1,LV,C4,DG,IX,Jtrue},"-2,-1":{B-2,A-1,LF,C6,DG,I"",Jtrue},"0,-1":{B0,A-1,LF,C0,DG,I"",Jtrue},"-1,0":{B-1,A0,LY,C0,DG,I"","cargo":{"value":3,L4},Jtrue},"-2,0":{B-2,A0,LE,C4,DG,I"",Jtrue},"-2,1":{B-2,A1,LV,C4,DG,IX,Jtrue},"-3,1":{B-3,A1,LF,C6,DG,I"",Jtrue},"-3,2":{B-3,A2,LE,C4,DG,I"",Jtrue},"-1,1":{B-1,A1,LF,C0,DG,I"",Jtrue},"-1,2":{B-1,A2,LF,C4,DG,I"",Jtrue},"0,2":{B0,A2,LE,C2,DG,I"",Jtrue},"1,2":{B1,A2,LE,C2,DG,I"",Jtrue},"2,2":{B2,A2,LE,C2,DG,I"",Jtrue},"-2,2":{B-2,A2,LY,C0,DG,I"","cargo":{"value":1,L4},Jtrue},"0,0":{B0,A0,LE,C4,DG,I"",Jtrue},"0,1":{B0,A1,LE,C4,DG,I"",Jtrue}},[{B2,A3,LM,C6,D"",Q20,R0.5,JK,O[],P[]}],[{B3,A3,LN,C6,D"",Q20,R0.5,"cargo":{"value":0,L7},JK,O[],P[]},{B-2,A-3,LN,C2,D"",Q0,R0.5,"cargo":{"value":0,L4},JK,O[],P[]},{B-2,A-4,LN,C2,D"",Q0,R0.5,"cargo":{"value":2,L4},JK,O[],P[]},{B-2,A-5,LN,C2,D"",Q0,R0.5,"cargo":{"value":4,L4},JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[2]+'-4'] = 65000;

	// 
	trxLevels[trainerLevelNames[2]][3]='TRXv1.1:0~0~1.5~[{"-4,-4":{B-4,A-4,LE,C4,DG,I"",JK},"-4,-3":{B-4,A-3,LE,C4,DG,I"",JK},"-2,-2":{B-2,A-2,LE,C2,DG,I"",JK},"-2,-1":{B-2,A-1,LE,C2,DG,I"",JK},"-2,0":{B-2,A0,LE,C2,DG,I"",JK},"-2,1":{B-2,A1,LE,C2,DG,I"",JK},"0,0":{B0,A0,LE,C2,DG,I"",Jtrue},"1,0":{B1,A0,LV,C2,DH,I"compareless",Jtrue},"2,0":{B2,A0,LY,C0,DG,I"","cargo":{"value":1,L4},Jtrue},"1,-1":{B1,A-1,LE,C0,DG,I"",Jtrue},"1,-2":{B1,A-2,LF,C6,DG,I"",Jtrue},"2,-2":{B2,A-2,LV,C2,DH,IX,Jtrue},"1,1":{B1,A1,LE,C4,DG,I"",Jtrue},"1,2":{B1,A2,LF,C4,DG,I"",Jtrue},"2,2":{B2,A2,LV,C2,DG,I"compareless",Jtrue},"3,-2":{B3,A-2,LY,C0,DG,I"","cargo":{"value":1,L4},Jtrue},"3,2":{B3,A2,LY,C0,DG,I"","cargo":{"value":3,L4},Jtrue},"2,3":{B2,A3,LF,C4,DG,I"",Jtrue},"3,3":{B3,A3,LE,C2,DG,I"",Jtrue},"4,3":{B4,A3,LF,C2,DG,I"",Jtrue},"4,2":{B4,A2,LE,C0,DG,I"",Jtrue},"4,1":{B4,A1,LE,C0,DG,I"",Jtrue},"4,0":{B4,A0,LE,C4,DG,I"home",Jtrue},"4,-1":{B4,A-1,LE,C0,DG,I"",Jtrue},"4,-2":{B4,A-2,LE,C0,DG,I"",Jtrue},"4,-3":{B4,A-3,LF,C0,DG,I"",Jtrue},"3,-3":{B3,A-3,LE,C6,DG,I"",Jtrue},"2,-3":{B2,A-3,LF,C6,DG,I"",Jtrue},"2,-1":{B2,A-1,L"trackwater",C0,DG,I"",Jtrue},"2,1":{B2,A1,L"trackwater",C0,DG,I"",Jtrue},"3,0":{B3,A0,LY,C0,DG,I"",Jtrue},"-4,-2":{B-4,A-2,LE,C4,DG,I"",JK},"-4,-1":{B-4,A-1,LE,C4,DG,I"",JK},"-4,0":{B-4,A0,LV,C6,DG,IU,JK},"-4,1":{B-4,A1,LE,C4,DG,I"",JK},"-4,2":{B-4,A2,LS,C0,DH,IU,JK},"-4,3":{B-4,A3,LF,C4,DG,I"",JK},"-3,3":{B-3,A3,LF,C2,DG,I"",JK},"-3,2":{B-3,A2,LF,C0,DG,I"",JK},"-2,2":{B-2,A2,LE,C2,DG,I"",JK}},[{B-4,A-3,LM,C4,D"",Q20,R0.5,JK,O[],P[]}],[{B-2,A-2,LN,C2,D"",Q0,R0.5,"cargo":{"value":0,L4},JK,O[],P[]},{B-2,A-1,LN,C2,D"",Q0,R0.5,"cargo":{"value":1,L4},JK,O[],P[]},{B-2,A0,LN,C2,D"",Q0,R0.5,"cargo":{"value":2,L4},JK,O[],P[]},{B-2,A1,LN,C2,D"",Q0,R0.5,"cargo":{"value":3,L4},JK,O[],P[]},{B-4,A-4,LN,C4,D"",Q20,R0.5,"cargo":{"value":0,L7},JK,O[],P[]},{B-2,A2,LN,C2,D"",Q0,R0.5,"cargo":{"value":4,L4},JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[2]+'-0'] = 38000;

	// 
	trxLevels[trainerLevelNames[2]][4]='TRXv1.1:0~0~1.5~[{"-4,-4":{B-4,A-4,LE,C4,DG,I"",JK},"-4,-3":{B-4,A-3,LE,C4,DG,I"",JK},"-2,-2":{B-2,A-2,LE,C2,DG,I"",JK},"-2,-1":{B-2,A-1,LE,C2,DG,I"",JK},"-2,0":{B-2,A0,LE,C2,DG,I"",JK},"-2,1":{B-2,A1,LE,C2,DG,I"",JK},"0,0":{B0,A0,LE,C2,DG,I"",JK},"1,0":{B1,A0,LV,C2,DH,I"compareless",Jtrue},"2,0":{B2,A0,LY,C0,DG,I"","cargo":{"value":1,L4},Jtrue},"1,-1":{B1,A-1,LE,C0,DG,I"",Jtrue},"1,-2":{B1,A-2,LF,C6,DG,I"",Jtrue},"2,-2":{B2,A-2,LV,C2,DH,IX,Jtrue},"1,1":{B1,A1,LE,C4,DG,I"",Jtrue},"1,2":{B1,A2,LF,C4,DG,I"",Jtrue},"2,2":{B2,A2,LV,C2,DG,IX,Jtrue},"3,-2":{B3,A-2,LY,C0,DG,I"","cargo":{"value":3,L4},Jtrue},"3,2":{B3,A2,LY,C0,DG,I"","cargo":{"value":3,L4},Jtrue},"2,3":{B2,A3,LF,C4,DG,I"",Jtrue},"3,3":{B3,A3,LE,C2,DG,I"",Jtrue},"4,3":{B4,A3,LF,C2,DG,I"",Jtrue},"4,2":{B4,A2,LE,C0,DG,I"",Jtrue},"4,1":{B4,A1,LE,C0,DG,I"",Jtrue},"4,0":{B4,A0,LE,C4,DG,I"home",Jtrue},"4,-1":{B4,A-1,LE,C0,DG,I"",Jtrue},"4,-2":{B4,A-2,LE,C0,DG,I"",Jtrue},"4,-3":{B4,A-3,LF,C0,DG,I"",Jtrue},"3,-3":{B3,A-3,LE,C6,DG,I"",Jtrue},"2,-3":{B2,A-3,LF,C6,DG,I"",Jtrue},"2,-1":{B2,A-1,L"trackwater",C0,DG,I"",Jtrue},"2,1":{B2,A1,L"trackwater",C0,DG,I"",Jtrue},"3,0":{B3,A0,LY,C0,DG,I"",Jtrue},"-4,-2":{B-4,A-2,LE,C4,DG,I"",JK},"-4,-1":{B-4,A-1,LE,C4,DG,I"",JK},"-4,0":{B-4,A0,LV,C6,DG,IU,JK},"-4,1":{B-4,A1,LE,C4,DG,I"",JK},"-4,2":{B-4,A2,LS,C0,DH,IU,JK},"-4,3":{B-4,A3,LF,C4,DG,I"",JK},"-3,3":{B-3,A3,LF,C2,DG,I"",JK},"-3,2":{B-3,A2,LF,C0,DG,I"",JK},"-2,2":{B-2,A2,LE,C2,DG,I"",JK}},[{B-4,A-3,LM,C4,D"",Q20,R0.5,JK,O[],P[]}],[{B-2,A-2,LN,C2,D"",Q0,R0.5,"cargo":{"value":0,L4},JK,O[],P[]},{B-2,A-1,LN,C2,D"",Q0,R0.5,"cargo":{"value":1,L4},JK,O[],P[]},{B-2,A0,LN,C2,D"",Q0,R0.5,"cargo":{"value":2,L4},JK,O[],P[]},{B-2,A1,LN,C2,D"",Q0,R0.5,"cargo":{"value":3,L4},JK,O[],P[]},{B-4,A-4,LN,C4,D"",Q20,R0.5,"cargo":{"value":0,L7},JK,O[],P[]},{B-2,A2,LN,C2,D"",Q0,R0.5,"cargo":{"value":4,L4},JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[2]+'-1'] = 35000;

	// 
	trxLevels[trainerLevelNames[2]][5]='TRXv1.1:-0.9833333333333334~0.6280701754385964~1.304313494358981~[{"4,4":{B4,A4,LE,C6,DG,I"",Jtrue},"-6,-2":{B-6,A-2,LY,C0,DG,I"","cargo":{"value":0,L4},Jtrue},"-5,-2":{B-5,A-2,LE,C4,DG,I"supply",Jtrue},"-5,-1":{B-5,A-1,LF,C4,DG,I"",Jtrue},"-4,-2":{B-4,A-2,LE,C0,DG,I"supply",Jtrue},"-4,-1":{B-4,A-1,LT,C0,DG,IU,Jtrue},"-4,0":{B-4,A0,LS,C4,DH,I"compareless",Jtrue},"-4,1":{B-4,A1,LE,C4,DG,I"none",Jtrue},"-4,2":{B-4,A2,LE,C4,DG,I"dump",Jtrue},"-4,3":{B-4,A3,LE,C4,DG,I"none",Jtrue},"-4,4":{B-4,A4,LF,C4,DG,I"",Jtrue},"-3,-2":{B-3,A-2,LY,C0,DG,I"","cargo":{"value":3,L4},Jtrue},"-3,0":{B-3,A0,LY,C0,DG,I"","cargo":{"value":1,L4},Jtrue},"-3,3":{B-3,A3,LY,C0,DG,I"","cargo":{"value":0,L7},Jtrue},"-3,4":{B-3,A4,LE,C6,DG,I"supply",Jtrue},"-2,-2":{B-2,A-2,LE,C0,DG,I"",Jtrue},"-2,-1":{B-2,A-1,LE,C0,DG,I"",Jtrue},"-2,0":{B-2,A0,LE,C0,DG,I"",Jtrue},"-2,1":{B-2,A1,LE,C0,DG,I"",Jtrue},"-2,2":{B-2,A2,LE,C0,DG,I"",Jtrue},"-2,3":{B-2,A3,LE,C0,DG,I"",Jtrue},"-2,4":{B-2,A4,LV,C4,DH,IU,Jtrue},"-1,-2":{B-1,A-2,LY,C0,DG,I"","cargo":{"value":0,L4},Jtrue},"-1,0":{B-1,A0,LY,C0,DG,I"","cargo":{"value":2,L4},Jtrue},"-1,4":{B-1,A4,LE,C6,DG,I"",Jtrue},"0,-2":{B0,A-2,LE,C4,DG,I"supply",Jtrue},"0,-1":{B0,A-1,LS,C0,DH,IU,Jtrue},"0,0":{B0,A0,LT,C4,DG,I"compareless",Jtrue},"0,1":{B0,A1,LE,C4,DG,I"none",Jtrue},"0,2":{B0,A2,LE,C4,DG,I"",Jtrue},"0,3":{B0,A3,LF,C4,DG,I"",Jtrue},"0,4":{B0,A4,LE,C6,DG,I"",Jtrue},"1,-2":{B1,A-2,LE,C0,DG,I"supply",Jtrue},"1,-1":{B1,A-1,LF,C2,DG,I"",Jtrue},"1,3":{B1,A3,LE,C2,DG,I"",Jtrue},"1,4":{B1,A4,LE,C6,DG,I"",Jtrue},"2,-2":{B2,A-2,LY,C0,DG,I"","cargo":{"value":4,L4},Jtrue},"2,3":{B2,A3,LE,C2,DG,I"",Jtrue},"2,4":{B2,A4,LE,C6,DG,I"",Jtrue},"3,-3":{B3,A-3,LF,C6,DG,I"",Jtrue},"3,-2":{B3,A-2,LF,C4,DG,I"",Jtrue},"3,-1":{B3,A-1,LY,C0,DG,I"",Jtrue},"3,3":{B3,A3,LE,C6,DG,I"",Jtrue},"3,4":{B3,A4,LE,C6,DG,I"",Jtrue},"4,-3":{B4,A-3,LF,C0,DG,I"",Jtrue},"4,-2":{B4,A-2,LS,C4,DH,IU,Jtrue},"4,-1":{B4,A-1,LE,C4,DG,I"home",Jtrue},"4,0":{B4,A0,LE,C0,DG,I"",Jtrue},"4,1":{B4,A1,LE,C0,DG,I"",Jtrue},"4,2":{B4,A2,LE,C0,DG,I"",Jtrue},"4,3":{B4,A3,LF,C2,DG,I"",Jtrue},"-5,0":{B-5,A0,L"trackwater",C0,DG,I"",Jtrue},"-5,1":{B-5,A1,L"trackwater",C0,DG,I"",Jtrue},"-6,1":{B-6,A1,L"trackwater",C0,DG,I"",Jtrue},"-6,0":{B-6,A0,L"trackwater",C0,DG,I"",Jtrue},"1,0":{B1,A0,L"trackwater",C0,DG,I"",Jtrue},"1,1":{B1,A1,L"trackwater",C0,DG,I"",Jtrue},"2,1":{B2,A1,L"trackwater",C0,DG,I"",Jtrue},"2,0":{B2,A0,L"trackwater",C0,DG,I"",Jtrue}},[{B2,A4,LM,C6,D"",Q20,R0.44000000000000056,JK,O[],P[]}],[{B3,A4,LN,C6,D"",Q20,R0.44000000000000056,"cargo":null,JK,O[],P[]},{B4,A4,LN,C6,D"",Q20,R0.44000000000000056,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[2]+'-5'] = 120000;

	// 
	trxLevels[trainerLevelNames[2]][6]='TRXv1.1:-2.25~-0.6798245614035089~1.304313494358981~[{"3,-3":{B3,A-3,LS,C4,DH,IU,Jtrue},"3,-2":{B3,A-2,LE,C4,DG,I"home",Jtrue},"2,-2":{B2,A-2,LY,C0,DG,I"",Jtrue},"3,-4":{B3,A-4,LF,C0,DG,I"",Jtrue},"2,-4":{B2,A-4,LF,C6,DG,I"",Jtrue},"3,3":{B3,A3,LE,C6,DG,I"",Jtrue},"2,3":{B2,A3,LE,C6,DG,I"",Jtrue},"1,3":{B1,A3,LE,C6,DG,I"",Jtrue},"0,3":{B0,A3,LE,C6,DG,I"",Jtrue},"-1,3":{B-1,A3,LE,C6,DG,I"",Jtrue},"-2,3":{B-2,A3,LE,C6,DG,I"",Jtrue},"3,-1":{B3,A-1,LE,C0,DG,I"",Jtrue},"3,2":{B3,A2,LF,C2,DG,I"",Jtrue},"3,1":{B3,A1,LE,C0,DG,I"",Jtrue},"3,0":{B3,A0,LE,C0,DG,I"",Jtrue},"-2,-1":{B-2,A-1,LY,C0,DG,I"",Jtrue,"cargo":{"value":2,L4}},"-1,-2":{B-1,A-2,LS,C0,DH,IU,Jtrue},"-1,-1":{B-1,A-1,LT,C4,DG,I"compareless",Jtrue},"-1,0":{B-1,A0,LE,C4,DG,I"none",Jtrue},"-1,1":{B-1,A1,LE,C4,DG,I"",Jtrue},"0,-2":{B0,A-2,LF,C2,DG,I"",Jtrue},"-3,3":{B-3,A3,LV,C4,DH,IU,Jtrue},"-3,2":{B-3,A2,LE,C0,DG,I"",Jtrue},"-3,1":{B-3,A1,LE,C0,DG,I"",Jtrue},"-3,0":{B-3,A0,LE,C0,DG,I"",Jtrue},"-3,-1":{B-3,A-1,LE,C0,DG,I"",Jtrue},"-3,-2":{B-3,A-2,LE,C0,DG,I"",Jtrue},"-5,-2":{B-5,A-2,LT,C0,DG,IU,Jtrue},"-5,-1":{B-5,A-1,LS,C4,DH,I"compareless",Jtrue},"-5,0":{B-5,A0,LE,C4,DG,I"none",Jtrue},"-5,1":{B-5,A1,LE,C4,DG,I"dump",Jtrue},"-6,-2":{B-6,A-2,LF,C4,DG,I"",Jtrue},"-5,2":{B-5,A2,LE,C4,DG,I"none",Jtrue},"-5,3":{B-5,A3,LF,C4,DG,I"",Jtrue},"-1,2":{B-1,A2,LF,C4,DG,I"",Jtrue},"0,2":{B0,A2,LE,C2,DG,I"",Jtrue},"1,2":{B1,A2,LE,C2,DG,I"",Jtrue},"2,2":{B2,A2,LE,C6,DG,I"",Jtrue},"-4,3":{B-4,A3,LE,C6,DG,I"supply",Jtrue},"-4,2":{B-4,A2,LY,C0,DG,I"","cargo":{"value":0,L7},Jtrue},"-4,-1":{B-4,A-1,LY,C0,DG,I"","cargo":{"value":4,L4},Jtrue},"-6,-1":{B-6,A-1,L"trackwater",C0,DG,I"",Jtrue},"-7,-1":{B-7,A-1,L"trackwater",C0,DG,I"",Jtrue},"-7,0":{B-7,A0,L"trackwater",C0,DG,I"",Jtrue},"-6,0":{B-6,A0,L"trackwater",C0,DG,I"",Jtrue},"0,-1":{B0,A-1,L"trackwater",C0,DG,I"",Jtrue},"0,0":{B0,A0,L"trackwater",C0,DG,I"",Jtrue},"1,0":{B1,A0,L"trackwater",C0,DG,I"",Jtrue},"1,-1":{B1,A-1,L"trackwater",C0,DG,I"",Jtrue},"-7,-4":{B-7,A-4,LY,C0,DG,I"","cargo":{"value":6,L4},Jtrue},"-6,-4":{B-6,A-4,LE,C4,DG,I"supply",Jtrue},"-5,-4":{B-5,A-4,LE,C0,DG,I"supply",Jtrue},"-4,-4":{B-4,A-4,LY,C0,DG,I"","cargo":{"value":3,L4},Jtrue},"-3,-4":{B-3,A-4,LE,C0,DG,I"",Jtrue},"-2,-4":{B-2,A-4,LY,C0,DG,I"","cargo":{"value":4,L4},Jtrue},"-1,-4":{B-1,A-4,LE,C4,DG,I"supply",Jtrue},"0,-4":{B0,A-4,LE,C0,DG,I"supply",Jtrue},"1,-4":{B1,A-4,LY,C0,DG,I"","cargo":{"value":1,L4},Jtrue},"-3,-3":{B-3,A-3,LE,C0,DG,I"",Jtrue},"-5,-3":{B-5,A-3,LE,C4,DG,I"",Jtrue},"-6,-3":{B-6,A-3,LE,C4,DG,I"",Jtrue},"0,-3":{B0,A-3,LE,C4,DG,I"",Jtrue},"-1,-3":{B-1,A-3,LE,C4,DG,I"",Jtrue},"2,-3":{B2,A-3,LF,C4,DG,I"",Jtrue}},[{B1,A3,LM,C6,D"",Q20,R0.44000000000000056,JK,O[],P[]}],[{B2,A3,LN,C6,D"",Q20,R0.44000000000000056,"cargo":null,JK,O[],P[]},{B3,A3,LN,C6,D"",Q20,R0.44000000000000056,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[2]+'-6'] = 100000;

	// 
	trxLevels[trainerLevelNames[2]][7]='TRXv1.1:-1.1166666666666667~-0.12894736842105264~1.5~[{"-5,-4":{B-5,A-4,LE,C4,DG,I"",Jtrue},"-5,-3":{B-5,A-3,LE,C4,DG,I"",Jtrue},"-5,-2":{B-5,A-2,LE,C4,DG,I"",Jtrue},"-5,1":{B-5,A1,LE,C0,DG,I"home",Jtrue},"-4,1":{B-4,A1,LY,C0,DG,I"",Jtrue},"-5,2":{B-5,A2,LV,C6,DG,IU,Jtrue},"-4,2":{B-4,A2,LF,C0,DG,I"",Jtrue},"-4,3":{B-4,A3,LF,C2,DG,I"",Jtrue},"-5,3":{B-5,A3,LF,C4,DG,I"",Jtrue},"-1,1":{B-1,A1,LE,C4,DG,I"",Jtrue},"-1,2":{B-1,A2,LF,C4,DG,I"",Jtrue},"0,2":{B0,A2,LV,C2,DH,I"compareless",Jtrue},"0,1":{B0,A1,LF,C6,DG,I"",Jtrue},"2,1":{B2,A1,LE,C2,DG,I"supply",Jtrue},"2,2":{B2,A2,LY,C0,DG,I"","cargo":{"value":0,L7},Jtrue},"1,1":{B1,A1,LE,C2,DG,I"",Jtrue},"0,3":{B0,A3,LF,C4,DG,I"",Jtrue},"1,3":{B1,A3,LE,C2,DG,I"",Jtrue},"2,3":{B2,A3,L"trackwater",C0,DG,I"",JK},"3,3":{B3,A3,L"trackwater",C0,DG,I"",JK},"3,2":{B3,A2,L"trackwater",C0,DG,I"",JK},"3,1":{B3,A1,LS,C4,DG,IU,JK},"1,2":{B1,A2,LY,C0,DG,I"","cargo":{"value":3,L4},Jtrue},"-1,-4":{B-1,A-4,LE,C2,DG,I"supply",Jtrue},"2,-2":{B2,A-2,LE,C0,DG,I"supply",Jtrue},"3,-2":{B3,A-2,LY,C0,DG,I"","cargo":{"value":5,L4},Jtrue},"-1,-3":{B-1,A-3,LY,C0,DG,I"","cargo":{"value":1,L4},Jtrue},"-1,-1":{B-1,A-1,LE,C6,DG,I"",Jtrue}},[{B-5,A-3,LM,C4,D"",Q20,R0.5,JK,O[],P[]}],[{B-5,A-4,LN,C4,D"",Q20,R0.5,JK,O[],P[]},{B-1,A-1,LN,C6,D"",Q0,R0.5,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[2]+'-7'] = 68000;

	// 
	trxLevels[trainerLevelNames[2]][8]='TRXv1.1:-2.1500000000000004~-0.16578947368421054~1.5~[{"-1,1":{B-1,A1,LS,C4,DH,IX,Jtrue},"-1,0":{B-1,A0,LE,C0,DG,I"none",Jtrue},"-1,-1":{B-1,A-1,LE,C0,DG,I"",Jtrue},"-1,-2":{B-1,A-2,LE,C0,DG,I"supply",Jtrue},"-1,2":{B-1,A2,LE,C0,DG,I"home",Jtrue},"0,2":{B0,A2,LY,C0,DG,I"",Jtrue},"1,-2":{B1,A-2,LE,C4,DG,I"supply",Jtrue},"1,2":{B1,A2,LE,C4,DG,I"home",Jtrue},"1,1":{B1,A1,LT,C4,DG,I"compareless",Jtrue},"0,1":{B0,A1,LY,C0,DG,I"","cargo":{"value":2,L4},Jtrue},"1,3":{B1,A3,LF,C2,DG,I"",Jtrue},"0,3":{B0,A3,LE,C6,DG,I"",Jtrue},"-1,3":{B-1,A3,LF,C4,DG,I"",Jtrue},"-5,-1":{B-5,A-1,LE,C4,DG,I"supply",Jtrue},"-4,-1":{B-4,A-1,LE,C0,DG,I"supply",Jtrue},"-3,-1":{B-3,A-1,LY,C0,DG,I"","cargo":{"value":4,L4},Jtrue},"-6,-1":{B-6,A-1,LY,C0,DG,I"","cargo":{"value":0,L4,"uniqueid":-1006000},Jtrue},"0,-4":{B0,A-4,LE,C2,DG,I"",Jtrue},"1,-1":{B1,A-1,LE,C4,DG,I"",Jtrue},"1,0":{B1,A0,LE,C4,DG,I"",Jtrue},"0,-2":{B0,A-2,LY,C0,DG,I"",Jtrue},"2,1":{B2,A1,L"trackwater",C0,DG,I"",Jtrue},"-2,1":{B-2,A1,L"trackwater",C0,DG,I"",Jtrue}},[{B-1,A0,LM,C0,D"",Q20,R0.5,JK,O[],P[]}],[{B0,A-4,LN,C2,D"",Q0,R0.5,JK,O[],P[]},{B-1,A1,LN,C0,D"",Q20,R0.5,"cargo":{"value":0,L7},JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[2]+'-8'] = 50000;

	// 
	trxLevels[trainerLevelNames[2]][9]='TRXv1.1:-1.9833333333333334~-0.4605263157894737~1.5~[{"2,3":{B2,A3,LE,C6,DG,I"",Jtrue},"1,3":{B1,A3,LE,C6,DG,I"",Jtrue},"1,-4":{B1,A-4,LT,C6,DG,IU,Jtrue},"2,-4":{B2,A-4,LF,C0,DG,I"",Jtrue},"2,-3":{B2,A-3,LF,C2,DG,I"",Jtrue},"1,-3":{B1,A-3,LF,C4,DG,I"",Jtrue},"0,-4":{B0,A-4,LE,C2,DG,I"home",Jtrue},"0,-3":{B0,A-3,LY,C0,DG,I"",Jtrue},"-2,-3":{B-2,A-3,LE,C2,DG,I"",Jtrue},"-1,-4":{B-1,A-4,LS,C2,DG,IU,Jtrue},"-2,-4":{B-2,A-4,LT,C2,DG,I"lazy",Jtrue},"-1,-3":{B-1,A-3,LT,C2,DH,I"compareless",Jtrue},"-1,-2":{B-1,A-2,LY,C0,DG,I"","cargo":{"value":3,L4},Jtrue},"-2,1":{B-2,A1,LE,C0,DG,I"supply",Jtrue},"-1,1":{B-1,A1,LY,C0,DG,I"",Jtrue},"-4,1":{B-4,A1,LE,C4,DG,I"dump",Jtrue},"-5,1":{B-5,A1,LY,C0,DG,I"",Jtrue},"2,0":{B2,A0,LE,C2,DG,I"supply",Jtrue},"2,1":{B2,A1,LY,C0,DG,I"","cargo":{"value":1,L4},Jtrue},"2,-1":{B2,A-1,LE,C6,DG,I"supply",Jtrue},"2,-2":{B2,A-2,LY,C0,DG,I"","cargo":{"value":4,L4},Jtrue},"0,1":{B0,A1,LE,C4,DG,I"supply",Jtrue}},[{B1,A3,LM,C6,D"",Q20,R0.5,JK,O[],P[]}],[{B2,A3,LN,C6,D"",Q20,R0.5,"cargo":{"value":0,L7},JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[2]+'-9'] = 90000;
	
	/// 4. D- blocks, lesser wyes, swap, second train, dump, alternate
	trxLevels[trainerLevelNames[3]] = [];

	// 
	trxLevels[trainerLevelNames[3]][0]='TRXv1.1:0~0~1.5~[{"-2,-1":{B-2,A-1,LE,C0,DG,I"pickdrop",Jtrue},"-1,-1":{B-1,A-1,LY,C0,DG,I"",Jtrue},"2,3":{B2,A3,LE,C6,DG,I"",Jtrue},"1,3":{B1,A3,LE,C6,DG,I"",Jtrue},"3,3":{B3,A3,LE,C6,DG,I"",Jtrue},"2,2":{B2,A2,LE,C6,DG,I"",Jtrue},"1,2":{B1,A2,LE,C6,DG,I"",Jtrue},"1,-1":{B1,A-1,LE,C0,DG,I"home",Jtrue},"2,-1":{B2,A-1,LY,C0,DG,I"",Jtrue},"1,0":{B1,A0,LF,C4,DG,I"",Jtrue},"2,0":{B2,A0,LE,C2,DG,I"",Jtrue},"3,0":{B3,A0,LF,C2,DG,I"",Jtrue},"3,-1":{B3,A-1,LE,C0,DG,I"",Jtrue},"3,-2":{B3,A-2,LF,C0,DG,I"",Jtrue},"2,-2":{B2,A-2,LE,C6,DG,I"",Jtrue},"1,-2":{B1,A-2,LS,C0,DH,IU,Jtrue},"1,-3":{B1,A-3,LV,C2,DH,IX,Jtrue},"2,-3":{B2,A-3,LY,C0,DG,I"","cargo":{"value":3,L4},Jtrue},"0,-1":{B0,A-1,LE,C4,DG,I"pickdrop",Jtrue}},[{B1,A2,LM,C6,D"",Q20,R0.5,JK,O[],P[]},{B1,A3,LM,C6,D"",Q20,R0.5,JK,O[],P[]}],[{B2,A2,LN,C6,D"",Q20,R0.5,"cargo":{"value":0,L7},JK,O[],P[]},{B2,A3,LN,C6,D"",Q20,R0.5,"cargo":{"value":2,L4},JK,O[],P[]},{B3,A3,LN,C6,D"",Q20,R0.5,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[3]+'-0'] = 32000;

	// 
	trxLevels[trainerLevelNames[3]][1]='TRXv1.1:0~0~1.5~[{"-2,-1":{B-2,A-1,LE,C0,DG,I"pickdrop",Jtrue},"-1,-1":{B-1,A-1,LY,C0,DG,I"",Jtrue},"2,3":{B2,A3,LE,C6,DG,I"",Jtrue},"1,3":{B1,A3,LE,C6,DG,I"",Jtrue},"3,3":{B3,A3,LE,C6,DG,I"",Jtrue},"2,2":{B2,A2,LE,C6,DG,I"",Jtrue},"1,2":{B1,A2,LE,C6,DG,I"",Jtrue},"1,-1":{B1,A-1,LE,C0,DG,I"home",Jtrue},"2,-1":{B2,A-1,LY,C0,DG,I"",Jtrue},"1,0":{B1,A0,LF,C4,DG,I"",Jtrue},"2,0":{B2,A0,LE,C2,DG,I"",Jtrue},"3,0":{B3,A0,LF,C2,DG,I"",Jtrue},"3,-1":{B3,A-1,LE,C0,DG,I"",Jtrue},"3,-2":{B3,A-2,LF,C0,DG,I"",Jtrue},"2,-2":{B2,A-2,LE,C6,DG,I"",Jtrue},"1,-2":{B1,A-2,LS,C0,DH,IU,Jtrue},"1,-3":{B1,A-3,LV,C2,DG,IX,Jtrue},"2,-3":{B2,A-3,LY,C0,DG,I"","cargo":{"value":3,L4},Jtrue},"0,-1":{B0,A-1,LE,C4,DG,I"pickdrop",Jtrue},"1,-4":{B1,A-4,L"trackwater",C0,DG,I"",Jtrue}},[{B1,A2,LM,C6,D"",Q20,R0.5,JK,O[],P[]},{B1,A3,LM,C6,D"",Q20,R0.5,JK,O[],P[]}],[{B2,A2,LN,C6,D"",Q20,R0.5,"cargo":{"value":0,L7},JK,O[],P[]},{B2,A3,LN,C6,D"",Q20,R0.5,"cargo":{"value":2,L4},JK,O[],P[]},{B3,A3,LN,C6,D"",Q20,R0.5,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[3]+'-1'] = 32000;

	// 
	trxLevels[trainerLevelNames[3]][2]='TRXv1.1:0~0~1.5~[{"1,2":{B1,A2,LE,C0,DG,I"home",Jtrue},"2,2":{B2,A2,LY,C0,DG,I"",Jtrue},"1,3":{B1,A3,LF,C4,DG,I"",Jtrue},"2,3":{B2,A3,LE,C2,DG,I"",Jtrue},"3,3":{B3,A3,LF,C2,DG,I"",Jtrue},"3,2":{B3,A2,LE,C0,DG,I"",Jtrue},"1,1":{B1,A1,LF,C6,DG,I"",Jtrue},"2,1":{B2,A1,LS,C6,DH,IU,Jtrue},"3,1":{B3,A1,LF,C0,DG,I"",Jtrue},"2,0":{B2,A0,LT,C4,DG,I"compareless",Jtrue},"3,0":{B3,A0,LS,C6,DH,IU,Jtrue},"4,0":{B4,A0,LF,C2,DG,I"",Jtrue},"3,-1":{B3,A-1,LE,C4,DG,I"",JK},"1,0":{B1,A0,LY,C0,DG,I"","cargo":{"value":0,L4},Jtrue},"-2,1":{B-2,A1,LE,C0,DG,I"",JK},"-2,2":{B-2,A2,LE,C0,DG,I"",JK},"-2,3":{B-2,A3,LE,C0,DG,I"",JK},"-3,2":{B-3,A2,LE,C0,DG,I"",JK},"-3,3":{B-3,A3,LE,C0,DG,I"",JK},"-3,1":{B-3,A1,LE,C0,DG,I"",JK},"4,-1":{B4,A-1,LE,C0,DG,I"",JK},"4,-2":{B4,A-2,LE,C0,DG,I"",JK},"4,-3":{B4,A-3,LE,C0,DG,I"",JK},"4,-4":{B4,A-4,LF,C0,DG,I"",JK},"3,-4":{B3,A-4,LF,C6,DG,I"",JK},"3,-3":{B3,A-3,LE,C4,DG,I"",JK},"3,-2":{B3,A-2,LE,C4,DG,I"",JK},"-2,-3":{B-2,A-3,LE,C2,DG,I"pickdrop",JK},"-1,-3":{B-1,A-3,LE,C2,DG,I"",JK},"-3,-3":{B-3,A-3,LE,C6,DG,I"pickdrop",JK},"-3,-4":{B-3,A-4,LY,C0,DG,I"",JK},"-2,-2":{B-2,A-2,LY,C0,DG,I"",JK},"-4,1":{B-4,A1,LE,C0,DG,I"",JK},"-4,2":{B-4,A2,LE,C0,DG,I"",JK}},[{B-2,A1,LM,C0,D"",Q20,R0.5,JK,O[],P[]},{B-3,A2,LM,C0,D"",Q20,R0.5,JK,O[],P[]},{B-4,A1,LM,C0,D"",Q20,R0.5,JK,O[],P[]}],[{B-2,A2,LN,C0,D"",Q20,R0.5,JK,O[],P[]},{B-2,A3,LN,C0,D"",Q20,R0.5,JK,O[],P[]},{B-3,A3,LN,C0,D"",Q20,R0.5,"cargo":{"value":0,L7},JK,O[],P[]},{B-4,A2,LN,C0,D"",Q20,R0.5,"cargo":{"value":2,L4},JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[3]+'-2'] = 55000;

	// alternating wyes. must use 4 trains to line up
	trxLevels[trainerLevelNames[3]][3]='TRXv1.1:0~0~1.5~[{"-4,-4":{B-4,A-4,LF,C6,DG,I"",JK},"-3,-4":{B-3,A-4,LE,C6,DG,I"",JK},"-2,-4":{B-2,A-4,LE,C6,DG,I"",JK},"-1,-4":{B-1,A-4,LS,C2,DH,I"alternate",Jtrue},"0,-4":{B0,A-4,LE,C2,DG,I"",Jtrue},"1,-4":{B1,A-4,LS,C2,DH,I"alternate",Jtrue},"2,-4":{B2,A-4,LT,C6,DG,IU,Jtrue},"2,-3":{B2,A-3,LE,C0,DG,I"",Jtrue},"2,-2":{B2,A-2,LF,C4,DG,I"",Jtrue},"3,-4":{B3,A-4,LE,C2,DG,I"",Jtrue},"3,-3":{B3,A-3,LY,C0,DG,I"",Jtrue},"3,-2":{B3,A-2,LE,C6,DG,I"home",Jtrue},"4,-4":{B4,A-4,LF,C0,DG,I"",Jtrue},"4,-3":{B4,A-3,LE,C4,DG,I"",Jtrue},"4,-2":{B4,A-2,LF,C2,DG,I"",Jtrue},"1,-3":{B1,A-3,LT,C0,DG,IU,JK},"1,-2":{B1,A-2,LF,C2,DG,I"",JK},"0,-2":{B0,A-2,LF,C4,DG,I"",JK},"0,-3":{B0,A-3,LF,C6,DG,I"",JK},"-1,-3":{B-1,A-3,LT,C0,DG,IU,JK},"-1,-2":{B-1,A-2,LF,C2,DG,I"",JK},"-2,-2":{B-2,A-2,LE,C6,DG,I"",JK},"-2,-3":{B-2,A-3,LE,C2,DG,I"",JK},"-4,2":{B-4,A2,LE,C0,DG,I"",JK},"-2,2":{B-2,A2,LE,C0,DG,I"",JK},"-2,3":{B-2,A3,LE,C0,DG,I"",JK},"-4,3":{B-4,A3,LE,C0,DG,I"",JK},"0,2":{B0,A2,LE,C0,DG,I"",JK},"0,3":{B0,A3,LE,C0,DG,I"",JK},"2,2":{B2,A2,LE,C0,DG,I"",JK},"2,3":{B2,A3,LE,C0,DG,I"",JK},"3,1":{B3,A1,LE,C2,DG,I"supply",Jtrue},"3,2":{B3,A2,LY,C0,DG,I"","cargo":{"value":0,L7},Jtrue},"-3,-2":{B-3,A-2,LF,C4,DG,I"",JK},"-3,-3":{B-3,A-3,LF,C6,DG,I"",JK}},[{B-4,A2,LM,C0,D"",Q20,R0.5,JK,O[],P[]},{B-2,A2,LM,C0,D"",Q20,R0.5,JK,O[],P[]},{B0,A2,LM,C0,D"",Q20,R0.5,JK,O[],P[]},{B2,A2,LM,C0,D"",Q20,R0.5,JK,O[],P[]}],[{B-4,A3,LN,C0,D"",Q20,R0.5,"cargo":null,JK,O[],P[]},{B-2,A3,LN,C0,D"",Q20,R0.5,JK,O[],P[]},{B0,A3,LN,C0,D"",Q20,R0.5,JK,O[],P[]},{B2,A3,LN,C0,D"",Q20,R0.5,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[3]+'-3'] = 60000;

	// alternating wyes as above but bear on second train. Must put short detour on train3 to avoid crash
	trxLevels[trainerLevelNames[3]][4]='TRXv1.1:0~0~1.5~[{"-4,-4":{B-4,A-4,LF,C6,DG,I"",JK},"-3,-4":{B-3,A-4,LE,C6,DG,I"",JK},"-2,-4":{B-2,A-4,LE,C6,DG,I"",JK},"-1,-4":{B-1,A-4,LS,C2,DH,I"alternate",Jtrue},"0,-4":{B0,A-4,LE,C2,DG,I"",Jtrue},"1,-4":{B1,A-4,LS,C2,DH,I"alternate",Jtrue},"2,-4":{B2,A-4,LT,C6,DG,IU,Jtrue},"2,-3":{B2,A-3,LE,C0,DG,I"",Jtrue},"2,-2":{B2,A-2,LF,C4,DG,I"",Jtrue},"3,-4":{B3,A-4,LE,C2,DG,I"",Jtrue},"3,-3":{B3,A-3,LY,C0,DG,I"",Jtrue},"3,-2":{B3,A-2,LE,C6,DG,I"home",Jtrue},"4,-4":{B4,A-4,LF,C0,DG,I"",Jtrue},"4,-3":{B4,A-3,LE,C4,DG,I"",Jtrue},"4,-2":{B4,A-2,LF,C2,DG,I"",Jtrue},"1,-3":{B1,A-3,LT,C0,DG,IU,JK},"1,-2":{B1,A-2,LF,C2,DG,I"",JK},"0,-2":{B0,A-2,LF,C4,DG,I"",JK},"0,-3":{B0,A-3,LF,C6,DG,I"",JK},"-1,-3":{B-1,A-3,LT,C0,DG,IU,JK},"-1,-2":{B-1,A-2,LF,C2,DG,I"",JK},"-2,-2":{B-2,A-2,LE,C6,DG,I"",JK},"-2,-3":{B-2,A-3,LE,C2,DG,I"",JK},"-4,2":{B-4,A2,LE,C0,DG,I"",JK},"-2,2":{B-2,A2,LE,C0,DG,I"",JK},"-2,3":{B-2,A3,LE,C0,DG,I"",JK},"-4,3":{B-4,A3,LE,C0,DG,I"",JK},"0,2":{B0,A2,LE,C0,DG,I"",JK},"0,3":{B0,A3,LE,C0,DG,I"",JK},"2,2":{B2,A2,LE,C0,DG,I"",JK},"2,3":{B2,A3,LE,C0,DG,I"",JK},"-3,-2":{B-3,A-2,LF,C4,DG,I"",JK},"-3,-3":{B-3,A-3,LF,C6,DG,I"",JK}},[{B-4,A2,LM,C0,D"",Q20,R0.5,JK,O[],P[]},{B-2,A2,LM,C0,D"",Q20,R0.5,JK,O[],P[]},{B0,A2,LM,C0,D"",Q20,R0.5,JK,O[],P[]},{B2,A2,LM,C0,D"",Q20,R0.5,JK,O[],P[]}],[{B-4,A3,LN,C0,D"",Q20,R0.5,"cargo":null,JK,O[],P[]},{B-2,A3,LN,C0,D"",Q20,R0.5,JK,O[],P[],"cargo":{"value":0,L7}},{B0,A3,LN,C0,D"",Q20,R0.5,JK,O[],P[]},{B2,A3,LN,C0,D"",Q20,R0.5,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[3]+'-4'] = 62000;

	// 
	trxLevels[trainerLevelNames[3]][5]='TRXv1.1:0~0~1.5~[{"-1,-2":{B-1,A-2,LF,C6,DG,I"",JK},"-1,-1":{B-1,A-1,LF,C4,DG,I"",JK},"-1,0":{B-1,A0,LY,C0,DG,I"","cargo":{"value":6,L4},Jtrue},"-1,1":{B-1,A1,LE,C6,DG,I"supply",Jtrue},"0,-4":{B0,A-4,LY,C0,DG,I"","cargo":{"value":2,L4},Jtrue},"0,-3":{B0,A-3,LS,C2,DH,I"compareless",Jtrue},"0,-2":{B0,A-2,LT,C0,DG,IU,JK},"0,-1":{B0,A-1,LF,C2,DG,I"",JK},"1,-3":{B1,A-3,LE,C2,DG,I"",Jtrue},"1,-2":{B1,A-2,LF,C6,DG,I"",JK},"1,-1":{B1,A-1,LF,C4,DG,I"",JK},"1,0":{B1,A0,LY,C0,DG,I"","cargo":{"value":1,L4},Jtrue},"1,1":{B1,A1,LE,C6,DG,I"supply",Jtrue},"2,-3":{B2,A-3,LS,C2,DH,I"alternate",Jtrue},"2,-2":{B2,A-2,LT,C0,DG,IU,JK},"2,-1":{B2,A-1,LF,C2,DG,I"",JK},"3,-4":{B3,A-4,LY,C0,DG,I"",Jtrue},"3,-3":{B3,A-3,LE,C6,DG,I"home",Jtrue},"3,-2":{B3,A-2,LF,C6,DG,I"",JK},"3,-1":{B3,A-1,LF,C4,DG,I"",JK},"3,0":{B3,A0,LY,C0,DG,I"","cargo":{"value":0,L7},Jtrue},"3,1":{B3,A1,LE,C6,DG,I"supply",Jtrue},"4,-3":{B4,A-3,LF,C0,DG,I"",JK},"4,-2":{B4,A-2,LT,C0,DG,IU,JK},"4,-1":{B4,A-1,LF,C2,DG,I"",JK},"-4,-4":{B-4,A-4,LE,C4,DG,I"",JK},"-4,-3":{B-4,A-3,LE,C4,DG,I"",JK},"-3,-4":{B-3,A-4,LE,C4,DG,I"",JK},"-3,-3":{B-3,A-3,LE,C4,DG,I"",JK},"-4,-2":{B-4,A-2,LE,C0,DG,I"",JK}},[{B-3,A-3,LM,C4,D"",Q20,R0.5,JK,O[],P[]},{B-4,A-2,LM,C4,D"",Q20,R0.5,JK,O[],P[]}],[{B-3,A-4,LN,C4,D"",Q20,R0.5,JK,O[],P[]},{B-4,A-4,LN,C4,D"",Q20,R0.5,JK,O[],P[]},{B-4,A-3,LN,C4,D"",Q20,R0.5,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[3]+'-5'] = 95000;

	// type specific dump
	trxLevels[trainerLevelNames[3]][6]='TRXv1.1:0~0~1.5~[{"0,-3":{B0,A-3,LE,C6,DG,I"supply",Jtrue},"0,-4":{B0,A-4,LY,C0,DG,I"","cargo":{"value":0,L4},Jtrue},"2,3":{B2,A3,LE,C6,DG,I"",Jtrue},"1,3":{B1,A3,LE,C6,DG,I"",Jtrue},"3,3":{B3,A3,LE,C6,DG,I"",Jtrue},"-1,0":{B-1,A0,LE,C0,DG,I"dump",Jtrue},"0,0":{B0,A0,LY,C0,DG,I"",Jtrue},"-4,0":{B-4,A0,LE,C0,DG,I"dump",Jtrue},"-3,0":{B-3,A0,LY,C0,DG,I"","cargo":{"value":3,L4},Jtrue},"-2,1":{B-2,A1,LE,C0,DG,I"",Jtrue},"-2,0":{B-2,A0,LE,C0,DG,I"",Jtrue},"-2,-1":{B-2,A-1,LE,C0,DG,I"",Jtrue},"-1,1":{B-1,A1,LE,C0,DG,I"",Jtrue},"-1,-1":{B-1,A-1,LE,C0,DG,I"",Jtrue},"-4,-1":{B-4,A-1,LE,C0,DG,I"",Jtrue},"-4,1":{B-4,A1,LE,C0,DG,I"",Jtrue},"1,-3":{B1,A-3,LE,C6,DG,I"none",Jtrue},"4,-3":{B4,A-3,LF,C0,DG,I"",Jtrue},"2,-3":{B2,A-3,LE,C6,DG,I"none",Jtrue},"3,-4":{B3,A-4,LY,C0,DG,I"","cargo":{"value":1,L4},Jtrue},"3,-3":{B3,A-3,LS,C2,DH,I"compareless",Jtrue},"4,-2":{B4,A-2,LE,C4,DG,I"home",Jtrue},"4,-1":{B4,A-1,LT,C0,DG,IU,Jtrue},"3,-2":{B3,A-2,LY,C0,DG,I"",Jtrue},"4,0":{B4,A0,LF,C2,DG,I"",Jtrue},"3,0":{B3,A0,LF,C4,DG,I"",Jtrue},"3,-1":{B3,A-1,LF,C6,DG,I"",Jtrue}},[{B1,A3,LM,C6,D"",Q20,R0.5,JK,O[],P[]}],[{B3,A3,LN,C6,D"",Q20,R0.5,"cargo":{"value":9,L4},JK,O[],P[]},{B2,A3,LN,C6,D"",Q20,R0.5,"cargo":{"value":0,L7},JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[3]+'-6'] = 35000;

	// type specific dump flipped
	trxLevels[trainerLevelNames[3]][7]='TRXv1.1:0~0~1.5~[{"0,-3":{B0,A-3,LE,C6,DG,I"supply",Jtrue},"0,-4":{B0,A-4,LY,C0,DG,I"","cargo":{"value":0,L4},Jtrue},"2,3":{B2,A3,LE,C6,DG,I"",Jtrue},"1,3":{B1,A3,LE,C6,DG,I"",Jtrue},"3,3":{B3,A3,LE,C6,DG,I"",Jtrue},"-1,0":{B-1,A0,LE,C0,DG,I"dump",Jtrue},"0,0":{B0,A0,LY,C0,DG,I"",Jtrue,"cargo":{"value":0,L4}},"-4,0":{B-4,A0,LE,C0,DG,I"dump",Jtrue},"-3,0":{B-3,A0,LY,C0,DG,I"","cargo":{"value":0,L7},Jtrue},"-2,1":{B-2,A1,LE,C0,DG,I"",Jtrue},"-2,0":{B-2,A0,LE,C0,DG,I"",Jtrue},"-2,-1":{B-2,A-1,LE,C0,DG,I"",Jtrue},"-1,1":{B-1,A1,LE,C0,DG,I"",Jtrue},"-1,-1":{B-1,A-1,LE,C0,DG,I"",Jtrue},"-4,-1":{B-4,A-1,LE,C0,DG,I"",Jtrue},"-4,1":{B-4,A1,LE,C0,DG,I"",Jtrue},"1,-3":{B1,A-3,LE,C6,DG,I"none",Jtrue},"4,-3":{B4,A-3,LF,C0,DG,I"",Jtrue},"2,-3":{B2,A-3,LE,C6,DG,I"none",Jtrue},"3,-4":{B3,A-4,LY,C0,DG,I"","cargo":{"value":1,L4},Jtrue},"3,-3":{B3,A-3,LS,C2,DH,I"compareless",Jtrue},"4,-2":{B4,A-2,LE,C4,DG,I"home",Jtrue},"4,-1":{B4,A-1,LT,C0,DG,IU,Jtrue},"3,-2":{B3,A-2,LY,C0,DG,I"",Jtrue},"4,0":{B4,A0,LF,C2,DG,I"",Jtrue},"3,0":{B3,A0,LF,C4,DG,I"",Jtrue},"3,-1":{B3,A-1,LF,C6,DG,I"",Jtrue}},[{B1,A3,LM,C6,D"",Q20,R0.5,JK,O[],P[]}],[{B3,A3,LN,C6,D"",Q20,R0.5,"cargo":{"value":9,L4},JK,O[],P[]},{B2,A3,LN,C6,D"",Q20,R0.5,"cargo":{"value":0,L7},JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[3]+'-7'] = 25000;

	// must make dump type specfic before bear goes by
	trxLevels[trainerLevelNames[3]][8]='TRXv1.1:0~0~1.5~[{"2,3":{B2,A3,LE,C6,DG,I"",Jtrue},"1,3":{B1,A3,LE,C6,DG,I"",Jtrue},"3,3":{B3,A3,LE,C6,DG,I"",Jtrue},"-4,1":{B-4,A1,LE,C2,DG,I"",JK},"-3,1":{B-3,A1,LE,C2,DG,I"",JK},"1,-3":{B1,A-3,LT,C6,DG,IU,Jtrue},"2,-3":{B2,A-3,LE,C2,DG,I"home",Jtrue},"3,-3":{B3,A-3,LF,C0,DG,I"",Jtrue},"3,-2":{B3,A-2,LE,C4,DG,I"",Jtrue},"3,-1":{B3,A-1,LF,C2,DG,I"",Jtrue},"2,-1":{B2,A-1,LE,C6,DG,I"",Jtrue},"1,-1":{B1,A-1,LF,C4,DG,I"",Jtrue},"1,-2":{B1,A-2,LE,C0,DG,I"",Jtrue},"2,-2":{B2,A-2,LY,C0,DG,I"",Jtrue},"-1,-3":{B-1,A-3,LE,C2,DG,I"dump",Jtrue},"-1,-2":{B-1,A-2,LY,C0,DG,I"",Jtrue},"-1,-1":{B-1,A-1,LE,C6,DG,I"pickdrop",Jtrue},"0,-3":{B0,A-3,LE,C6,DG,I"",Jtrue}},[{B1,A3,LM,C6,D"",Q20,R0.44000000000000056,JK,O[],P[]},{B-3,A1,LM,C2,D"",Q20,R0.44000000000000056,JK,O[],P[]}],[{B2,A3,LN,C6,D"",Q20,R0.44000000000000056,"cargo":{"value":0,L7},JK,O[],P[]},{B-4,A1,LN,C2,D"",Q20,R0.44000000000000056,"cargo":{"value":3,L4},JK,O[],P[]},{B3,A3,LN,C6,D"",Q20,R0.44000000000000056,"cargo":{"value":3,L4},JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[3]+'-8'] = 30000;

	// must make dump type specific, dump excess cargo, reload, then drop off bear
	trxLevels[trainerLevelNames[3]][9]='TRXv1.1:0~0~1.5~[{"-1,-1":{B-1,A-1,LE,C0,DG,I"pickdrop",Jtrue},"-3,-1":{B-3,A-1,LE,C4,DG,I"supply",Jtrue},"0,-1":{B0,A-1,LY,C0,DG,I"",Jtrue},"1,-1":{B1,A-1,LE,C4,DG,I"dump",Jtrue},"-4,-1":{B-4,A-1,LY,C0,DG,I"","cargo":{"value":1,L4},Jtrue},"2,-3":{B2,A-3,LS,C2,DH,I"compareless",Jtrue},"2,-2":{B2,A-2,LE,C4,DG,I"",Jtrue},"2,-1":{B2,A-1,L"trackwater",C0,DG,I"",Jtrue},"-4,3":{B-4,A3,LE,C2,DG,I"",JK},"-3,3":{B-3,A3,LE,C2,DG,I"",JK},"2,-4":{B2,A-4,LY,C0,DG,I"","cargo":{"value":2,L4},Jtrue},"3,-3":{B3,A-3,LF,C0,DG,I"",Jtrue},"3,-2":{B3,A-2,LE,C4,DG,I"",Jtrue},"3,-1":{B3,A-1,LE,C0,DG,I"home",Jtrue},"3,0":{B3,A0,LS,C0,DH,IU,Jtrue},"3,1":{B3,A1,LF,C4,DG,I"",Jtrue},"4,1":{B4,A1,LF,C2,DG,I"",Jtrue},"4,0":{B4,A0,LF,C0,DG,I"",Jtrue},"4,-1":{B4,A-1,LY,C0,DG,I"",Jtrue},"1,3":{B1,A3,LE,C6,DG,I"",Jtrue},"2,3":{B2,A3,LE,C6,DG,I"",Jtrue},"3,3":{B3,A3,LE,C6,DG,I"",Jtrue},"4,3":{B4,A3,LE,C6,DG,I"",Jtrue}},[{B-3,A3,LM,C2,D"",Q20,R0.5,JK,O[],P[]},{B2,A3,LM,C6,D"",Q20,R0.5,JK,O[],P[]}],[{B-4,A3,LN,C2,D"",Q20,R0.5,JK,O[],P[]},{B3,A3,LN,C6,D"",Q20,R0.5,JK,O[],P[],"cargo":{"value":8,L4}},{B4,A3,LN,C6,D"",Q20,R0.5,"cargo":{"value":0,L7},JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[3]+'-9'] = 60000;

	/// 5. E- blocks, numbers, increment, decrement 
	trxLevels[trainerLevelNames[4]] = [];

	// 
	trxLevels[trainerLevelNames[4]][0]='TRXv1.1:0~0~1.5~[{"1,-3":{B1,A-3,LS,C2,DH,IX,Jtrue},"2,-3":{B2,A-3,LE,C6,DG,I"home",Jtrue},"3,-3":{B3,A-3,LF,C0,DG,I"",Jtrue},"3,-2":{B3,A-2,LT,C0,DG,IU,Jtrue},"3,-1":{B3,A-1,LF,C2,DG,I"",Jtrue},"2,-1":{B2,A-1,LF,C4,DG,I"",Jtrue},"2,-2":{B2,A-2,LF,C6,DG,I"",Jtrue},"2,-4":{B2,A-4,LY,C0,DG,I"",Jtrue},"1,-4":{B1,A-4,LY,C0,DG,I"","cargo":{"value":1,L4},Jtrue},"1,-2":{B1,A-2,L"trackwater",C0,DG,I"",Jtrue},"1,-1":{B1,A-1,L"trackwater",C0,DG,I"",Jtrue},"0,-1":{B0,A-1,L"trackwater",C0,DG,I"",Jtrue},"0,-2":{B0,A-2,L"trackwater",C0,DG,I"",Jtrue},"2,3":{B2,A3,LE,C6,DG,I"",JK},"1,3":{B1,A3,LE,C6,DG,I"",JK},"3,3":{B3,A3,LE,C6,DG,I"",JK},"0,-3":{B0,A-3,LE,C6,DG,I"",Jtrue},"-2,1":{B-2,A1,LE,C4,DG,I"",Jtrue},"-3,1":{B-3,A1,LE,C4,DG,I"increment",Jtrue},"-1,-3":{B-1,A-3,LE,C6,DG,I"supply",Jtrue},"-1,-4":{B-1,A-4,LY,C0,DG,I"","cargo":{"value":0,L7},Jtrue}},[{B1,A3,LM,C6,D"",Q20,R0.5,JK,O[],P[]}],[{B3,A3,LN,C6,D"",Q20,R0.5,"cargo":null,JK,O[],P[]},{B2,A3,LN,C6,D"",Q20,R0.5,"cargo":{"value":0,L4},JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[4]+'-0'] = 25000; 

	// 
	trxLevels[trainerLevelNames[4]][1]='TRXv1.1:0~0~1.5~[{"1,-3":{B1,A-3,LS,C2,DH,IX,Jtrue},"2,-3":{B2,A-3,LE,C6,DG,I"home",Jtrue},"3,-3":{B3,A-3,LF,C0,DG,I"",Jtrue},"3,-2":{B3,A-2,LT,C0,DG,IU,Jtrue},"3,-1":{B3,A-1,LF,C2,DG,I"",Jtrue},"2,-1":{B2,A-1,LF,C4,DG,I"",Jtrue},"2,-2":{B2,A-2,LF,C6,DG,I"",Jtrue},"2,-4":{B2,A-4,LY,C0,DG,I"",Jtrue},"1,-4":{B1,A-4,LY,C0,DG,I"","cargo":{"value":1,L4},Jtrue},"1,-2":{B1,A-2,L"trackwater",C0,DG,I"",Jtrue},"1,-1":{B1,A-1,L"trackwater",C0,DG,I"",Jtrue},"0,-1":{B0,A-1,L"trackwater",C0,DG,I"",Jtrue},"0,-2":{B0,A-2,L"trackwater",C0,DG,I"",Jtrue},"2,3":{B2,A3,LE,C6,DG,I"",JK},"1,3":{B1,A3,LE,C6,DG,I"",JK},"3,3":{B3,A3,LE,C6,DG,I"",JK},"0,-3":{B0,A-3,LE,C6,DG,I"",Jtrue},"-3,1":{B-3,A1,LY,C0,DG,I"","cargo":{"value":1,L4},Jtrue},"-2,1":{B-2,A1,LE,C4,DG,I"increment",Jtrue},"-1,1":{B-1,A1,LE,C0,DG,I"increment",Jtrue},"0,1":{B0,A1,LY,C0,DG,I"","cargo":{"value":0,L7},Jtrue}},[{B1,A3,LM,C6,D"",Q20,R0.5,JK,O[],P[]}],[{B3,A3,LN,C6,D"",Q20,R0.5,"cargo":{"value":0,L7},JK,O[],P[]},{B2,A3,LN,C6,D"",Q20,R0.5,"cargo":{"value":0,L4},JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[4]+'-1'] = 25000;

	// make loop with increment
	trxLevels[trainerLevelNames[4]][2]='TRXv1.1:0~0~1.5~[{"1,-3":{B1,A-3,LS,C2,DH,IX,Jtrue},"2,-3":{B2,A-3,LE,C6,DG,I"home",Jtrue},"3,-3":{B3,A-3,LF,C0,DG,I"",Jtrue},"3,-2":{B3,A-2,LT,C0,DG,IU,Jtrue},"3,-1":{B3,A-1,LF,C2,DG,I"",Jtrue},"2,-1":{B2,A-1,LF,C4,DG,I"",Jtrue},"2,-2":{B2,A-2,LF,C6,DG,I"",Jtrue},"2,-4":{B2,A-4,LY,C0,DG,I"",Jtrue},"1,-4":{B1,A-4,LY,C0,DG,I"","cargo":{"value":4,L4},Jtrue},"1,-2":{B1,A-2,L"trackwater",C0,DG,I"",Jtrue},"1,-1":{B1,A-1,L"trackwater",C0,DG,I"",Jtrue},"0,-1":{B0,A-1,L"trackwater",C0,DG,I"",Jtrue},"0,-2":{B0,A-2,L"trackwater",C0,DG,I"",Jtrue},"2,3":{B2,A3,LE,C6,DG,I"",JK},"1,3":{B1,A3,LE,C6,DG,I"",JK},"3,3":{B3,A3,LE,C6,DG,I"",JK},"0,-3":{B0,A-3,LE,C6,DG,I"",Jtrue},"-1,-3":{B-1,A-3,LE,C6,DG,I"supply",Jtrue},"-1,-4":{B-1,A-4,LY,C0,DG,I"","cargo":{"value":0,L7},Jtrue},"-3,-1":{B-3,A-1,LS,C0,DH,IX,Jtrue},"-4,-1":{B-4,A-1,LY,C0,DG,I"","cargo":{"value":4,L4},Jtrue},"-2,1":{B-2,A1,LE,C4,DG,I"increment",Jtrue}},[{B1,A3,LM,C6,D"",Q20,R0.5,JK,O[],P[]}],[{B3,A3,LN,C6,D"",Q20,R0.5,"cargo":null,JK,O[],P[]},{B2,A3,LN,C6,D"",Q20,R0.5,"cargo":{"value":0,L4},JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[4]+'-2'] = 70000;

	// number block with increments
	trxLevels[trainerLevelNames[4]][3]='TRXv1.1:0~0~1.5~[{"3,3":{B3,A3,LE,C6,DG,I"",JK},"2,3":{B2,A3,LE,C6,DG,I"",JK},"1,3":{B1,A3,LE,C6,DG,I"",JK},"-2,2":{B-2,A2,LE,C0,DG,I"supply",Jtrue},"-1,2":{B-1,A2,LY,C0,DG,I"","cargo":{"value":1,L0},Jtrue},"1,0":{B1,A0,LE,C2,DG,I"increment",Jtrue},"-4,0":{B-4,A0,LE,C0,DG,I"increment",Jtrue},"-1,-2":{B-1,A-2,LT,C4,DG,IU,Jtrue},"-1,-3":{B-1,A-3,LE,C0,DG,I"home",Jtrue},"-1,-4":{B-1,A-4,LF,C6,DG,I"",Jtrue},"0,-4":{B0,A-4,LE,C2,DG,I"",Jtrue},"1,-4":{B1,A-4,LF,C0,DG,I"",Jtrue},"1,-3":{B1,A-3,LE,C4,DG,I"",Jtrue},"1,-2":{B1,A-2,LF,C2,DG,I"",Jtrue},"0,-2":{B0,A-2,LE,C6,DG,I"",Jtrue},"0,-3":{B0,A-3,LY,C0,DG,I"",Jtrue},"-1,-1":{B-1,A-1,LS,C0,DH,IX,Jtrue},"-2,-1":{B-2,A-1,LY,C0,DG,I"","cargo":{"value":3,L0},Jtrue},"0,-1":{B0,A-1,L"trackwater",C0,DG,I"",Jtrue},"3,1":{B3,A1,LE,C4,DG,I"supply",Jtrue},"2,1":{B2,A1,LY,C0,DG,I"","cargo":{"value":0,L7},Jtrue},"-3,-3":{B-3,A-3,LE,C2,DG,I"increment",Jtrue}},[{B1,A3,LM,C6,D"",Q20,R0.5,JK,O[],P[]}],[{B2,A3,LN,C6,D"",Q20,R0.5,JK,O[],P[]},{B3,A3,LN,C6,D"",Q20,R0.5,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[4]+'-3'] = 50000;

	// number blocks with decrements
	trxLevels[trainerLevelNames[4]][4]='TRXv1.1:0~0~1.5~[{"3,3":{B3,A3,LE,C6,DG,I"",JK},"2,3":{B2,A3,LE,C6,DG,I"",JK},"1,3":{B1,A3,LE,C6,DG,I"",JK},"-2,2":{B-2,A2,LE,C0,DG,I"supply",Jtrue},"-1,2":{B-1,A2,LY,C0,DG,I"","cargo":{"value":3,L0},Jtrue},"1,0":{B1,A0,LE,C2,DG,I"decrement",Jtrue},"-4,0":{B-4,A0,LE,C0,DG,I"increment",Jtrue},"-1,-2":{B-1,A-2,LT,C4,DG,IU,Jtrue},"-1,-3":{B-1,A-3,LE,C0,DG,I"home",Jtrue},"-1,-4":{B-1,A-4,LF,C6,DG,I"",Jtrue},"0,-4":{B0,A-4,LE,C2,DG,I"",Jtrue},"1,-4":{B1,A-4,LF,C0,DG,I"",Jtrue},"1,-3":{B1,A-3,LE,C4,DG,I"",Jtrue},"1,-2":{B1,A-2,LF,C2,DG,I"",Jtrue},"0,-2":{B0,A-2,LE,C6,DG,I"",Jtrue},"0,-3":{B0,A-3,LY,C0,DG,I"",Jtrue},"-1,-1":{B-1,A-1,LS,C0,DH,I"compareless",Jtrue},"-2,-1":{B-2,A-1,LY,C0,DG,I"","cargo":{"value":1,L0},Jtrue},"0,-1":{B0,A-1,L"trackwater",C0,DG,I"",Jtrue},"3,1":{B3,A1,LE,C4,DG,I"supply",Jtrue},"2,1":{B2,A1,LY,C0,DG,I"","cargo":{"value":0,L7},Jtrue},"-3,-3":{B-3,A-3,LE,C2,DG,I"decrement",Jtrue}},[{B1,A3,LM,C6,D"",Q20,R0.5,JK,O[],P[]}],[{B2,A3,LN,C6,D"",Q20,R0.5,JK,O[],P[]},{B3,A3,LN,C6,D"",Q20,R0.5,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[4]+'-4'] = 68000;

	// decrement loop
	trxLevels[trainerLevelNames[4]][5]='TRXv1.1:0~0~1.5~[{"-3,-2":{B-3,A-2,LT,C4,DG,IU,Jtrue},"-3,-3":{B-3,A-3,LE,C0,DG,I"home",Jtrue},"-3,-4":{B-3,A-4,LF,C6,DG,I"",Jtrue},"-2,-4":{B-2,A-4,LE,C2,DG,I"",Jtrue},"-1,-4":{B-1,A-4,LF,C0,DG,I"",Jtrue},"-1,-3":{B-1,A-3,LE,C4,DG,I"",Jtrue},"-1,-2":{B-1,A-2,LF,C2,DG,I"",Jtrue},"-2,-2":{B-2,A-2,LE,C6,DG,I"",Jtrue},"-3,-1":{B-3,A-1,LT,C0,DG,IX,Jtrue},"-2,-1":{B-2,A-1,LY,C0,DG,I"","cargo":{"value":1,L0},Jtrue},"-4,-1":{B-4,A-1,L"trackwater",C0,DG,I"",JK},"-2,-3":{B-2,A-3,LY,C0,DG,I"",Jtrue},"2,-2":{B2,A-2,LT,C0,DG,I"compareless",Jtrue},"2,0":{B2,A0,LT,C0,DG,I"compareless",Jtrue},"2,3":{B2,A3,LE,C6,DG,I"",Jtrue},"3,-2":{B3,A-2,LY,C0,DG,I"","cargo":{"value":0,L0},Jtrue},"3,0":{B3,A0,LY,C0,DG,I"","cargo":{"value":6,L0},Jtrue},"3,3":{B3,A3,LE,C6,DG,I"",Jtrue},"4,-2":{B4,A-2,LE,C4,DG,I"decrement",Jtrue},"4,0":{B4,A0,LE,C4,DG,I"decrement",Jtrue},"4,3":{B4,A3,LE,C6,DG,I"",Jtrue}},[{B2,A3,LM,C6,D"",Q20,R0.5,JK,O[],P[]}],[{B3,A3,LN,C6,D"",Q20,R0.5,JK,O[],P[],"cargo":{"value":3,L0}},{B4,A3,LN,C6,D"",Q20,R0.5,JK,O[],P[],"cargo":{"value":0,L7}}]]';
	bestTrackTime[trainerLevelNames[4]+'-5'] = 75000;

	// decrement loop type specific
	trxLevels[trainerLevelNames[4]][6]='TRXv1.1:0~0~1.5~[{"-3,-2":{B-3,A-2,LT,C4,DG,IU,Jtrue},"-3,-3":{B-3,A-3,LE,C0,DG,I"home",Jtrue},"-3,-4":{B-3,A-4,LF,C6,DG,I"",Jtrue},"-2,-4":{B-2,A-4,LE,C2,DG,I"",Jtrue},"-1,-4":{B-1,A-4,LF,C0,DG,I"",Jtrue},"-1,-3":{B-1,A-3,LE,C4,DG,I"",Jtrue},"-1,-2":{B-1,A-2,LF,C2,DG,I"",JK},"-2,-2":{B-2,A-2,LE,C6,DG,I"",Jtrue},"-3,-1":{B-3,A-1,LT,C0,DG,IX,Jtrue},"-2,-1":{B-2,A-1,LY,C0,DG,I"","cargo":{"value":1,L4},Jtrue},"-4,-1":{B-4,A-1,L"trackwater",C0,DG,I"",Jtrue},"-2,-3":{B-2,A-3,LY,C0,DG,I"",Jtrue},"2,-2":{B2,A-2,LT,C0,DG,I"compareless",Jtrue},"2,0":{B2,A0,LT,C0,DG,I"compareless",Jtrue},"2,3":{B2,A3,LE,C6,DG,I"",Jtrue},"3,-2":{B3,A-2,LY,C0,DG,I"","cargo":{"value":1,L0},Jtrue},"3,0":{B3,A0,LY,C0,DG,I"","cargo":{"value":0,L4},Jtrue},"3,3":{B3,A3,LE,C6,DG,I"",Jtrue},"4,-2":{B4,A-2,LE,C4,DG,I"decrement",Jtrue},"4,0":{B4,A0,LE,C4,DG,I"decrement",Jtrue},"4,3":{B4,A3,LE,C6,DG,I"",JK},"1,3":{B1,A3,LE,C6,DG,I"",Jtrue}},[{B1,A3,LM,C6,D"",Q20,R0.5,JK,O[],P[]}],[{B3,A3,LN,C6,D"",Q20,R0.5,JK,O[],P[],"cargo":{"value":3,L0}},{B4,A3,LN,C6,D"",Q20,R0.5,JK,O[],P[],"cargo":{"value":0,L7}},{B2,A3,LN,C6,D"",Q20,R0.5,"cargo":{"value":2,L4},JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[4]+'-6'] = 44000;

	// 
	trxLevels[trainerLevelNames[4]][7]='TRXv1.1:0~0~1.5~[{"-3,-2":{B-3,A-2,LT,C4,DG,IU,Jtrue},"-3,-3":{B-3,A-3,LE,C0,DG,I"home",Jtrue},"-3,-4":{B-3,A-4,LF,C6,DG,I"",Jtrue},"-2,-4":{B-2,A-4,LE,C2,DG,I"",Jtrue},"-1,-4":{B-1,A-4,LF,C0,DG,I"",Jtrue},"-1,-3":{B-1,A-3,LE,C4,DG,I"",Jtrue},"-1,-2":{B-1,A-2,LF,C2,DG,I"",Jtrue},"-2,-2":{B-2,A-2,LE,C6,DG,I"",Jtrue},"-3,-1":{B-3,A-1,LT,C0,DG,I"compareless",Jtrue},"-2,-1":{B-2,A-1,LY,C0,DG,I"","cargo":{"value":2,L4},Jtrue},"-4,-1":{B-4,A-1,L"trackwater",C0,DG,I"",Jtrue},"-2,-3":{B-2,A-3,LY,C0,DG,I"",Jtrue},"2,-2":{B2,A-2,LT,C0,DG,IX,Jtrue},"2,3":{B2,A3,LE,C6,DG,I"",Jtrue},"3,-2":{B3,A-2,LY,C0,DG,I"","cargo":{"value":4,L0},Jtrue},"3,3":{B3,A3,LE,C6,DG,I"",Jtrue},"4,-2":{B4,A-2,LE,C4,DG,I"increment",Jtrue},"4,3":{B4,A3,LE,C6,DG,I"",Jtrue},"1,3":{B1,A3,LE,C6,DG,I"",Jtrue},"-3,0":{B-3,A0,LT,C0,DG,I"compareless",Jtrue},"-2,0":{B-2,A0,LY,C0,DG,I"","cargo":{"value":3,L0},Jtrue},"-4,0":{B-4,A0,L"trackwater",C0,DG,I"",Jtrue},"-4,1":{B-4,A1,L"trackwater",C0,DG,I"",Jtrue},"-5,0":{B-5,A0,L"trackwater",C0,DG,I"",Jtrue},"2,1":{B2,A1,LT,C0,DG,IX,Jtrue},"3,1":{B3,A1,LY,C0,DG,I"","cargo":{"value":3,L4},Jtrue},"4,1":{B4,A1,LE,C4,DG,I"increment",Jtrue}},[{B1,A3,LM,C6,D"",Q20,R0.5,JK,O[],P[]}],[{B3,A3,LN,C6,D"",Q20,R0.5,JK,O[],P[],"cargo":{"value":0,L0}},{B4,A3,LN,C6,D"",Q20,R0.5,JK,O[],P[],"cargo":{"value":0,L7}},{B2,A3,LN,C6,D"",Q20,R0.5,"cargo":{"value":0,L4},JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[4]+'-7'] = 135000;

	// 
	trxLevels[trainerLevelNames[4]][8]='TRXv1.1:0~0~1.5~[{"-3,-2":{B-3,A-2,LT,C4,DG,IU,Jtrue},"-3,-3":{B-3,A-3,LE,C0,DG,I"home",Jtrue},"-3,-4":{B-3,A-4,LF,C6,DG,I"",Jtrue},"-2,-4":{B-2,A-4,LE,C2,DG,I"",Jtrue},"-1,-4":{B-1,A-4,LF,C0,DG,I"",Jtrue},"-1,-3":{B-1,A-3,LE,C4,DG,I"",Jtrue},"-1,-2":{B-1,A-2,LF,C2,DG,I"",Jtrue},"-2,-2":{B-2,A-2,LE,C6,DG,I"",Jtrue},"-3,-1":{B-3,A-1,LT,C0,DG,I"compareless",Jtrue},"-2,-1":{B-2,A-1,LY,C0,DG,I"","cargo":{"value":2,L4},Jtrue},"-4,-1":{B-4,A-1,L"trackwater",C0,DG,I"",Jtrue},"-2,-3":{B-2,A-3,LY,C0,DG,I"",Jtrue},"2,-2":{B2,A-2,LT,C0,DG,IX,Jtrue},"2,3":{B2,A3,LE,C6,DG,I"",Jtrue},"3,-2":{B3,A-2,LY,C0,DG,I"","cargo":{"value":4,L0},Jtrue},"3,3":{B3,A3,LE,C6,DG,I"",Jtrue},"4,-2":{B4,A-2,LE,C4,DG,I"increment",Jtrue},"4,3":{B4,A3,LE,C6,DG,I"",Jtrue},"1,3":{B1,A3,LE,C6,DG,I"",Jtrue},"-3,0":{B-3,A0,LT,C0,DG,I"compareless",Jtrue},"-2,0":{B-2,A0,LY,C0,DG,I"","cargo":{"value":3,L0},Jtrue},"-4,0":{B-4,A0,L"trackwater",C0,DG,I"",Jtrue},"-4,1":{B-4,A1,L"trackwater",C0,DG,I"",Jtrue},"-5,0":{B-5,A0,L"trackwater",C0,DG,I"",Jtrue},"3,1":{B3,A1,LY,C0,DG,I"","cargo":{"value":3,L4},Jtrue},"4,1":{B4,A1,LE,C4,DG,I"increment",Jtrue}},[{B1,A3,LM,C6,D"",Q20,R0.5,JK,O[],P[]}],[{B3,A3,LN,C6,D"",Q20,R0.5,JK,O[],P[],"cargo":{"value":0,L0}},{B4,A3,LN,C6,D"",Q20,R0.5,JK,O[],P[],"cargo":{"value":0,L7}},{B2,A3,LN,C6,D"",Q20,R0.5,"cargo":{"value":0,L4},JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[4]+'-8'] = 135000;

	// 
	trxLevels[trainerLevelNames[4]][9]='TRXv1.1:0~0~1.5~[{"-3,-3":{B-3,A-3,LE,C0,DG,I"home",Jtrue},"-2,-3":{B-2,A-3,LY,C0,DG,I"",Jtrue},"2,-1":{B2,A-1,LE,C0,DG,I"",Jtrue},"2,-2":{B2,A-2,LS,C0,DH,I"compareless",Jtrue},"3,-2":{B3,A-2,LE,C6,DG,I"increment",Jtrue},"4,-1":{B4,A-1,LE,C4,DG,I"supply",Jtrue},"4,-2":{B4,A-2,LF,C0,DG,I"",Jtrue},"3,-1":{B3,A-1,LY,C0,DG,I"","cargo":{"value":0,L7},Jtrue},"1,-2":{B1,A-2,LY,C0,DG,I"",Jtrue,"cargo":{"value":1,L5}},"2,0":{B2,A0,LT,C4,DH,IU,Jtrue},"3,0":{B3,A0,LE,C6,DG,I"",Jtrue},"4,0":{B4,A0,LF,C2,DG,I"",Jtrue},"-1,1":{B-1,A1,LE,C0,DG,I"",Jtrue},"-2,1":{B-2,A1,LE,C0,DG,I"",Jtrue},"-3,1":{B-3,A1,LE,C0,DG,I"",Jtrue},"3,3":{B3,A3,LE,C6,DG,I"",Jtrue},"2,3":{B2,A3,LE,C6,DG,I"",Jtrue}},[{B3,A3,LM,C6,D"",Q20,R0.5,JK,O[],P[]}],[{B-1,A1,LN,C0,D"",Q0,R0.5,"cargo":{"value":1,L5},JK,O[],P[]},{B-2,A1,LN,C0,D"",Q0,R0.5,"cargo":{"value":0,L5},JK,O[],P[]},{B-3,A1,LN,C0,D"",Q0,R0.5,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[4]+'-9'] = 55000;

	/// 6. F- blocks add, subtract, slingshot 
	trxLevels[trainerLevelNames[5]] = [];

	// +2 station
	trxLevels[trainerLevelNames[5]][0]='TRXv1.1:0~0~1.5~[{"1,-3":{B1,A-3,LS,C2,DH,IX,Jtrue},"2,-3":{B2,A-3,LE,C6,DG,I"home",Jtrue},"3,-3":{B3,A-3,LF,C0,DG,I"",Jtrue},"3,-2":{B3,A-2,LT,C0,DG,IU,Jtrue},"3,-1":{B3,A-1,LF,C2,DG,I"",Jtrue},"2,-1":{B2,A-1,LF,C4,DG,I"",Jtrue},"2,-2":{B2,A-2,LF,C6,DG,I"",Jtrue},"2,-4":{B2,A-4,LY,C0,DG,I"",Jtrue},"1,-4":{B1,A-4,LY,C0,DG,I"","cargo":{"value":4,L4},Jtrue},"1,-2":{B1,A-2,L"trackwater",C0,DG,I"",Jtrue},"1,-1":{B1,A-1,L"trackwater",C0,DG,I"",Jtrue},"0,-1":{B0,A-1,L"trackwater",C0,DG,I"",Jtrue},"0,-2":{B0,A-2,L"trackwater",C0,DG,I"",Jtrue},"2,3":{B2,A3,LE,C6,DG,I"",JK},"1,3":{B1,A3,LE,C6,DG,I"",JK},"3,3":{B3,A3,LE,C6,DG,I"",JK},"0,-3":{B0,A-3,LE,C6,DG,I"",Jtrue},"-1,-3":{B-1,A-3,LE,C6,DG,I"supply",Jtrue},"-1,-4":{B-1,A-4,LY,C0,DG,I"","cargo":{"value":0,L7},Jtrue},"-2,1":{B-2,A1,LE,C4,DG,I"increment",Jtrue},"-1,1":{B-1,A1,LE,C0,DG,I"add",Jtrue},"0,1":{B0,A1,LY,C0,DG,I"","cargo":{"value":3,L4},Jtrue}},[{B1,A3,LM,C6,D"",Q20,R0.5,JK,O[],P[]}],[{B3,A3,LN,C6,D"",Q20,R0.5,"cargo":null,JK,O[],P[]},{B2,A3,LN,C6,D"",Q20,R0.5,"cargo":{"value":1,L4},JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[5]+'-0'] = 22000;

	// add numbers
	trxLevels[trainerLevelNames[5]][1]='TRXv1.1:0~0~1.5~[{"1,-3":{B1,A-3,LS,C2,DH,IX,Jtrue},"2,-3":{B2,A-3,LE,C6,DG,I"home",Jtrue},"3,-3":{B3,A-3,LF,C0,DG,I"",Jtrue},"3,-2":{B3,A-2,LT,C0,DG,IU,Jtrue},"3,-1":{B3,A-1,LF,C2,DG,I"",Jtrue},"2,-1":{B2,A-1,LF,C4,DG,I"",Jtrue},"2,-2":{B2,A-2,LF,C6,DG,I"",Jtrue},"2,-4":{B2,A-4,LY,C0,DG,I"",Jtrue},"1,-4":{B1,A-4,LY,C0,DG,I"","cargo":{"value":5,L0},Jtrue},"1,-2":{B1,A-2,L"trackwater",C0,DG,I"",Jtrue},"1,-1":{B1,A-1,L"trackwater",C0,DG,I"",Jtrue},"0,-1":{B0,A-1,L"trackwater",C0,DG,I"",Jtrue},"0,-2":{B0,A-2,L"trackwater",C0,DG,I"",Jtrue},"2,3":{B2,A3,LE,C6,DG,I"",Jtrue},"1,3":{B1,A3,LE,C6,DG,I"",Jtrue},"3,3":{B3,A3,LE,C6,DG,I"",Jtrue},"0,-3":{B0,A-3,LE,C6,DG,I"",Jtrue},"-1,-3":{B-1,A-3,LE,C6,DG,I"supply",Jtrue},"-1,-4":{B-1,A-4,LY,C0,DG,I"","cargo":{"value":0,L7},Jtrue},"-2,1":{B-2,A1,LE,C4,DG,I"increment",Jtrue},"-1,1":{B-1,A1,LE,C0,DG,I"add",Jtrue},"0,1":{B0,A1,LY,C0,DG,I"","cargo":{"value":3,L4},Jtrue},"-3,1":{B-3,A1,LE,C4,DG,I"add",Jtrue},"-4,1":{B-4,A1,LY,C0,DG,I"","cargo":{"value":2,L0},Jtrue}},[{B1,A3,LM,C6,D"",Q20,R0.5,JK,O[],P[]}],[{B3,A3,LN,C6,D"",Q20,R0.5,"cargo":null,JK,O[],P[]},{B2,A3,LN,C6,D"",Q20,R0.5,"cargo":{"value":3,L0},JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[5]+'-1'] = 28000;

	// choose 2 and 3 to be added
	trxLevels[trainerLevelNames[5]][2]='TRXv1.1:0~0~1.5~[{"3,-1":{B3,A-1,LS,C4,DG,I"compareless",Jtrue},"-4,3":{B-4,A3,LE,C0,DG,I"",Jtrue},"-4,2":{B-4,A2,LE,C0,DG,I"",Jtrue},"-4,1":{B-4,A1,LE,C0,DG,I"",Jtrue},"-4,0":{B-4,A0,LE,C0,DG,I"",Jtrue},"1,1":{B1,A1,LF,C6,DG,I"",Jtrue},"1,2":{B1,A2,LE,C0,DG,I"",Jtrue},"1,3":{B1,A3,LF,C4,DG,I"",Jtrue},"2,1":{B2,A1,LE,C2,DG,I"",Jtrue},"2,3":{B2,A3,LE,C6,DG,I"",Jtrue},"3,1":{B3,A1,LT,C0,DG,IU,Jtrue},"3,2":{B3,A2,LE,C4,DG,I"home",Jtrue},"3,3":{B3,A3,LF,C2,DG,I"",Jtrue},"2,2":{B2,A2,LY,C0,DG,I"",Jtrue},"3,0":{B3,A0,LS,C4,DH,IX,Jtrue},"4,-1":{B4,A-1,LY,C0,DG,I"","cargo":{"value":5,L0},Jtrue},"4,0":{B4,A0,LY,C0,DG,I"","cargo":{"value":5,L0},Jtrue},"2,0":{B2,A0,L"trackwater",C0,DG,I"",Jtrue},"2,-1":{B2,A-1,L"trackwater",C0,DG,I"",Jtrue},"1,-1":{B1,A-1,L"trackwater",C0,DG,I"",Jtrue},"1,0":{B1,A0,L"trackwater",C0,DG,I"",Jtrue},"3,-3":{B3,A-3,LE,C4,DG,I"add",Jtrue},"3,-2":{B3,A-2,LE,C4,DG,I"",Jtrue},"2,-3":{B2,A-3,LY,C0,DG,I"",Jtrue},"-1,2":{B-1,A2,LE,C0,DG,I"supply",Jtrue},"0,2":{B0,A2,LY,C0,DG,I"","cargo":{"value":3,L0},Jtrue},"-1,0":{B-1,A0,LE,C0,DG,I"supply",Jtrue},"0,0":{B0,A0,LY,C0,DG,I"","cargo":{"value":2,L0},Jtrue},"-1,-2":{B-1,A-2,LE,C0,DG,I"supply",Jtrue},"0,-2":{B0,A-2,LY,C0,DG,I"","cargo":{"value":1,L0},Jtrue}},[{B-4,A0,LM,C0,D"",Q20,R0.5,JK,O[],P[]}],[{B-4,A1,LN,C0,D"",Q20,R0.5,JK,O[],P[],"cargo":null},{B-4,A2,LN,C0,D"",Q20,R0.5,JK,O[],P[]},{B-4,A3,LN,C0,D"",Q20,R0.5,JK,O[],P[],"cargo":{"value":0,L7}}]]';
	bestTrackTime[trainerLevelNames[5]+'-2'] = 50000;

	// add blocks and numbers ***Uses add station twice on same train
	trxLevels[trainerLevelNames[5]][3]='TRXv1.1:0~0~1.5~[{"3,-1":{B3,A-1,LS,C4,DG,I"compareless",Jtrue},"-4,2":{B-4,A2,LE,C0,DG,I"",Jtrue},"-4,1":{B-4,A1,LE,C0,DG,I"",Jtrue},"-4,0":{B-4,A0,LE,C0,DG,I"",Jtrue},"1,1":{B1,A1,LF,C6,DG,I"",Jtrue},"1,2":{B1,A2,LE,C0,DG,I"",Jtrue},"1,3":{B1,A3,LF,C4,DG,I"",Jtrue},"2,1":{B2,A1,LE,C2,DG,I"",Jtrue},"2,3":{B2,A3,LE,C6,DG,I"",Jtrue},"3,1":{B3,A1,LT,C0,DG,IU,Jtrue},"3,2":{B3,A2,LE,C4,DG,I"home",Jtrue},"3,3":{B3,A3,LF,C2,DG,I"",Jtrue},"2,2":{B2,A2,LY,C0,DG,I"",Jtrue},"3,0":{B3,A0,LS,C4,DH,IX,Jtrue},"4,-1":{B4,A-1,LY,C0,DG,I"","cargo":{"value":3,L4},Jtrue},"4,0":{B4,A0,LY,C0,DG,I"","cargo":{"value":5,L0},Jtrue},"2,0":{B2,A0,L"trackwater",C0,DG,I"",Jtrue},"2,-1":{B2,A-1,L"trackwater",C0,DG,I"",Jtrue},"1,-1":{B1,A-1,L"trackwater",C0,DG,I"",Jtrue},"1,0":{B1,A0,L"trackwater",C0,DG,I"",Jtrue},"3,-3":{B3,A-3,LE,C4,DG,I"none",Jtrue},"3,-2":{B3,A-2,LE,C4,DG,I"supply",Jtrue},"2,-3":{B2,A-3,LY,C0,DG,I"",Jtrue},"-1,2":{B-1,A2,LE,C0,DG,I"supply",Jtrue},"0,2":{B0,A2,LY,C0,DG,I"","cargo":{"value":3,L0},Jtrue},"-1,-2":{B-1,A-2,LE,C0,DG,I"supply",Jtrue},"0,-2":{B0,A-2,LY,C0,DG,I"","cargo":{"value":1,L0},Jtrue},"-3,3":{B-3,A3,LF,C2,DG,I"",Jtrue},"-4,3":{B-4,A3,LF,C4,DG,I"",Jtrue},"-3,-3":{B-3,A-3,LE,C6,DG,I"supply",Jtrue},"-3,-4":{B-3,A-4,LY,C0,DG,I"","cargo":{"value":2,L4},Jtrue},"-4,-2":{B-4,A-2,LE,C0,DG,I"supply",Jtrue},"-3,-2":{B-3,A-2,LY,C0,DG,I"","cargo":{"value":0,L4},Jtrue},"-1,0":{B-1,A0,LE,C4,DG,I"supply",Jtrue},"-2,0":{B-2,A0,LY,C0,DG,I"","cargo":{"value":2,L0},Jtrue},"3,-4":{B3,A-4,LF,C0,DG,I"",Jtrue},"2,-4":{B2,A-4,LE,C2,DG,I"add",Jtrue},"2,-2":{B2,A-2,LY,C0,DG,I"","cargo":{"value":0,L7},Jtrue}},[{B-4,A0,LM,C0,D"",Q20,R0.5,JK,O[],P[]}],[{B-4,A1,LN,C0,D"",Q20,R0.5,JK,O[],P[]},{B-4,A2,LN,C0,D"",Q20,R0.5,JK,O[],P[]},{B-4,A3,LN,C6,D"",Q20,R0.5,JK,O[],P[]},{B-3,A3,LN,C4,D"",Q20,R0.5,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[5]+'-3'] = 65000;

	// subtract
	trxLevels[trainerLevelNames[5]][4]='TRXv1.1:0~0~1.5~[{"-4,-1":{B-4,A-1,LY,C0,DG,I"","cargo":{"value":2,L0},Jtrue},"-3,-4":{B-3,A-4,LF,C6,DG,I"",Jtrue},"-3,-3":{B-3,A-3,LE,C0,DG,I"",Jtrue},"-3,-2":{B-3,A-2,LT,C4,DG,IU,Jtrue},"-3,-1":{B-3,A-1,LS,C0,DH,I"compareless",Jtrue},"-2,-4":{B-2,A-4,LE,C2,DG,I"",Jtrue},"-2,-3":{B-2,A-3,LY,C0,DG,I"",Jtrue},"-2,-2":{B-2,A-2,LE,C6,DG,I"home",Jtrue},"-1,-4":{B-1,A-4,LF,C0,DG,I"",Jtrue},"-1,-3":{B-1,A-3,LE,C4,DG,I"",Jtrue},"-1,-2":{B-1,A-2,LF,C2,DG,I"",Jtrue},"-3,0":{B-3,A0,LS,C0,DH,IX,Jtrue},"-4,0":{B-4,A0,LY,C0,DG,I"","cargo":{"value":2,L0},Jtrue},"-2,0":{B-2,A0,L"trackwater",C0,DG,I"",Jtrue},"-2,-1":{B-2,A-1,L"trackwater",C0,DG,I"",Jtrue},"-1,-1":{B-1,A-1,L"trackwater",C0,DG,I"",Jtrue},"-1,0":{B-1,A0,L"trackwater",C0,DG,I"",Jtrue},"3,-3":{B3,A-3,LE,C4,DG,I"supply",Jtrue},"3,-1":{B3,A-1,LE,C4,DG,I"supply",Jtrue},"2,-3":{B2,A-3,LY,C0,DG,I"","cargo":{"value":5,L0},Jtrue},"2,-1":{B2,A-1,LY,C0,DG,I"","cargo":{"value":3,L0},Jtrue},"-3,1":{B-3,A1,LT,C4,DH,IU,Jtrue},"-2,1":{B-2,A1,LE,C2,DG,I"add",Jtrue},"-1,1":{B-1,A1,LE,C2,DG,I"",Jtrue},"-1,3":{B-1,A3,LE,C6,DG,I"",Jtrue},"-2,3":{B-2,A3,LE,C6,DG,I"subtract",Jtrue},"-3,3":{B-3,A3,LF,C4,DG,I"",Jtrue},"-3,2":{B-3,A2,LE,C4,DG,I"supply",Jtrue},"-2,2":{B-2,A2,LY,C0,DG,I"",Jtrue},"-4,2":{B-4,A2,LY,C0,DG,I"",Jtrue,"cargo":{"value":0,L7}},"2,2":{B2,A2,LE,C6,DG,I"",JK},"3,2":{B3,A2,LE,C6,DG,I"",JK},"4,2":{B4,A2,LE,C6,DG,I"",JK}},[{B2,A2,LM,C6,D"",Q20,R0.5,JK,O[],P[]}],[{B3,A2,LN,C6,D"",Q20,R0.5,JK,O[],P[]},{B4,A2,LN,C6,D"",Q20,R0.5,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[5]+'-4'] = 62000;

	//  choose subtract order and entry into spiral
	trxLevels[trainerLevelNames[5]][5]='TRXv1.1:-0.4~0~1.3209945083883603~[{"1,1":{B1,A1,LE,C2,DG,I"",Jtrue},"2,1":{B2,A1,LS,C4,DG,IU,Jtrue},"2,0":{B2,A0,LE,C0,DG,I"",Jtrue},"2,-1":{B2,A-1,LS,C2,DG,IU,Jtrue},"1,-1":{B1,A-1,LE,C6,DG,I"",Jtrue},"0,-1":{B0,A-1,LS,C0,DG,IU,Jtrue},"0,0":{B0,A0,LE,C0,DG,I"home",Jtrue},"0,1":{B0,A1,LS,C6,DG,IU,Jtrue},"1,0":{B1,A0,LY,C0,DG,I"",Jtrue},"0,2":{B0,A2,LE,C6,DG,I"",Jtrue},"1,2":{B1,A2,LE,C6,DG,I"",Jtrue},"3,0":{B3,A0,LE,C0,DG,I"",Jtrue},"3,-1":{B3,A-1,LT,C0,DG,I"compareequal",Jtrue},"3,-2":{B3,A-2,LS,C2,DG,IU,Jtrue},"2,-2":{B2,A-2,LE,C6,DG,I"",Jtrue},"1,-2":{B1,A-2,LE,C6,DG,I"",Jtrue},"0,-2":{B0,A-2,LT,C6,DG,I"compareequal",Jtrue},"-1,-2":{B-1,A-2,LS,C0,DG,IU,Jtrue},"-1,-1":{B-1,A-1,LE,C4,DG,I"",Jtrue},"-1,0":{B-1,A0,LE,C4,DG,I"",Jtrue},"-1,1":{B-1,A1,LT,C4,DG,I"compareequal",Jtrue},"-1,2":{B-1,A2,LS,C6,DG,IU,Jtrue},"2,2":{B2,A2,LT,C2,DG,I"compareequal",Jtrue},"3,2":{B3,A2,LS,C4,DG,IU,Jtrue},"3,1":{B3,A1,LE,C0,DG,I"",Jtrue},"0,-3":{B0,A-3,LY,C0,DG,I"","cargo":{"value":0,L4},Jtrue},"-2,1":{B-2,A1,LY,C0,DG,I"","cargo":{"value":1,L4},Jtrue},"2,3":{B2,A3,LY,C0,DG,I"","cargo":{"value":2,L4},Jtrue},"4,-1":{B4,A-1,LY,C0,DG,I"","cargo":{"value":3,L4},Jtrue},"-4,-2":{B-4,A-2,LE,C4,DG,I"subtract",Jtrue},"-5,-2":{B-5,A-2,LY,C0,DG,I"",Jtrue},"-1,4":{B-1,A4,LE,C6,DG,I"",Jtrue},"-2,4":{B-2,A4,LE,C6,DG,I"",Jtrue},"0,4":{B0,A4,LE,C6,DG,I"",Jtrue},"-4,-4":{B-4,A-4,LE,C4,DG,I"supply",Jtrue},"-5,-4":{B-5,A-4,LY,C0,DG,I"","cargo":{"value":0,L7},Jtrue},"-5,1":{B-5,A1,LY,C0,DG,I"","cargo":{"value":4,L4},Jtrue},"-5,3":{B-5,A3,LY,C0,DG,I"","cargo":{"value":5,L4},Jtrue},"-4,1":{B-4,A1,LE,C4,DG,I"supply",Jtrue},"-4,3":{B-4,A3,LE,C4,DG,I"supply",Jtrue}},[{B-2,A4,LM,C6,D"",Q20,R0.5,JK,O[],P[]}],[{B-1,A4,LN,C6,D"",Q20,R0.5,JK,O[],P[]},{B0,A4,LN,C6,D"",Q20,R0.5,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[5]+'-5'] = 85000;

	// choose order to add then subtract of 3,2,1 to get 0
	trxLevels[trainerLevelNames[5]][6]='TRXv1.1:0~0~1.5~[{"-2,-3":{B-2,A-3,LE,C2,DG,I"",Jtrue},"-2,-2":{B-2,A-2,LE,C2,DG,I"",Jtrue},"-2,-1":{B-2,A-1,LE,C2,DG,I"",Jtrue},"1,-4":{B1,A-4,LE,C2,DG,I"add",Jtrue},"2,-4":{B2,A-4,LE,C2,DG,I"subtract",Jtrue},"-4,1":{B-4,A1,LE,C0,DG,I"",Jtrue},"1,1":{B1,A1,LF,C6,DG,I"",Jtrue},"1,2":{B1,A2,LE,C0,DG,I"home",Jtrue},"1,3":{B1,A3,LF,C4,DG,I"",Jtrue},"2,1":{B2,A1,LE,C2,DG,I"",Jtrue},"2,2":{B2,A2,LY,C0,DG,I"",Jtrue},"2,3":{B2,A3,LE,C6,DG,I"",Jtrue},"3,1":{B3,A1,LT,C0,DG,IU,Jtrue},"3,2":{B3,A2,LE,C4,DG,I"",Jtrue},"3,3":{B3,A3,LF,C2,DG,I"",Jtrue},"-2,0":{B-2,A0,LE,C2,DG,I"",Jtrue},"3,-4":{B3,A-4,LF,C0,DG,I"",Jtrue},"3,-3":{B3,A-3,LE,C4,DG,I"",Jtrue},"2,-3":{B2,A-3,LY,C0,DG,I"",Jtrue},"1,-3":{B1,A-3,LY,C0,DG,I"",Jtrue},"2,-2":{B2,A-2,LY,C0,DG,I"","cargo":{"value":0,L7},Jtrue},"3,-2":{B3,A-2,LE,C4,DG,I"supply",Jtrue},"2,0":{B2,A0,L"trackwater",C0,DG,I"",Jtrue},"3,0":{B3,A0,LS,C4,DG,I"compareequal",Jtrue},"3,-1":{B3,A-1,LE,C4,DG,I"",Jtrue},"4,0":{B4,A0,LY,C0,DG,I"","cargo":{"value":0,L0},Jtrue}},[{B-4,A1,LM,C0,D"",Q20,R0.5,JK,O[],P[]}],[{B-2,A-3,LN,C2,D"",Q0,R0.5,"cargo":{"value":1,L0},JK,O[],P[]},{B-2,A-2,LN,C2,D"",Q0,R0.5,"cargo":{"value":2,L0},JK,O[],P[]},{B-2,A-1,LN,C2,D"",Q0,R0.5,"cargo":{"value":3,L0},JK,O[],P[]},{B-2,A0,LN,C2,D"",Q0,R0.5,"cargo":{"value":3,L3},JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[5]+'-6'] = 48000;

	// slingshot to push bear onto pickupdropoff station
	trxLevels[trainerLevelNames[5]][7]='TRXv1.1:0~0~1.5~[{"4,1":{B4,A1,LE,C0,DG,I"",Jtrue},"4,0":{B4,A0,LE,C0,DG,I"",Jtrue},"4,-1":{B4,A-1,LE,C0,DG,I"",Jtrue},"4,-2":{B4,A-2,LF,C0,DG,I"",Jtrue},"3,-2":{B3,A-2,LE,C6,DG,I"",Jtrue},"2,-2":{B2,A-2,LF,C6,DG,I"",Jtrue},"2,-1":{B2,A-1,LE,C4,DG,I"pickdrop",Jtrue},"2,0":{B2,A0,LE,C4,DG,I"",Jtrue},"2,1":{B2,A1,LE,C0,DG,I"home",Jtrue},"2,2":{B2,A2,LF,C4,DG,I"",Jtrue},"3,2":{B3,A2,LE,C2,DG,I"",Jtrue},"4,2":{B4,A2,LF,C2,DG,I"",Jtrue},"1,-1":{B1,A-1,LY,C0,DG,I"",Jtrue},"-2,-1":{B-2,A-1,LE,C4,DG,I"slingshot",Jtrue},"3,1":{B3,A1,LY,C0,DG,I"",Jtrue},"-2,0":{B-2,A0,LE,C4,DG,I"",Jtrue},"-2,1":{B-2,A1,LE,C4,DG,I"",Jtrue},"-2,2":{B-2,A2,LS,C0,DH,IU,Jtrue},"-2,3":{B-2,A3,LF,C4,DG,I"",Jtrue},"-4,2":{B-4,A2,LE,C0,DG,I"",JK},"-4,0":{B-4,A0,LE,C0,DG,I"",JK},"-4,-2":{B-4,A-2,LE,C0,DG,I"",JK},"-1,2":{B-1,A2,LE,C2,DG,I"",Jtrue},"0,2":{B0,A2,LE,C2,DG,I"",Jtrue},"1,2":{B1,A2,LF,C0,DG,I"",Jtrue},"1,3":{B1,A3,LF,C2,DG,I"",Jtrue},"0,3":{B0,A3,LE,C6,DG,I"",Jtrue},"-1,3":{B-1,A3,LE,C6,DG,I"",Jtrue}},[{B-2,A0,LM,C0,D"",Q20,R0.5,JK,O[],P[]},{B4,A-1,LM,C0,D"",Q20,R0.5,JK,O[],P[]}],[{B-2,A1,LN,C0,D"",Q20,R0.5,"cargo":{"value":0,L7},JK,O[],P[]},{B-4,A-2,LN,C0,D"",Q0,R0.5,"cargo":{"value":3,L0},JK,O[],P[]},{B-4,A0,LN,C0,D"",Q0,R0.5,"cargo":{"value":6,L1},JK,O[],P[]},{B-4,A2,LN,C0,D"",Q0,R0.5,"cargo":{"value":17,L2},JK,O[],P[]},{B4,A0,LN,C0,D"",Q20,R0.5,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[5]+'-7'] = 30000;

	// slingshot to push bear on track and spell "Train"
	trxLevels[trainerLevelNames[5]][8]='TRXv1.1:-0.4166666666666667~0.49736842105263157~1.5~[{"-2,-3":{B-2,A-3,LE,C6,DG,I"pickdrop",Jtrue},"0,-3":{B0,A-3,LE,C6,DG,I"pickdrop",Jtrue},"2,-3":{B2,A-3,LE,C6,DG,I"pickdrop",Jtrue},"2,-4":{B2,A-4,LY,C0,DG,I"","cargo":{"value":8,L2},Jtrue},"-2,-4":{B-2,A-4,LY,C0,DG,I"","cargo":{"value":0,L7},Jtrue},"0,-4":{B0,A-4,LY,C0,DG,I"","cargo":{"value":13,L2},Jtrue},"-4,-4":{B-4,A-4,LE,C2,DG,I"",JK},"-5,-4":{B-5,A-4,LE,C2,DG,I"",Jtrue},"2,1":{B2,A1,LF,C6,DG,I"",Jtrue},"2,2":{B2,A2,LE,C0,DG,I"none",Jtrue},"2,3":{B2,A3,LF,C4,DG,I"",Jtrue},"2,4":{B2,A4,L"trackwater",C0,DG,I"",Jtrue},"3,1":{B3,A1,LE,C2,DG,I"",Jtrue},"3,2":{B3,A2,LY,C0,DG,I"",Jtrue},"3,3":{B3,A3,LE,C6,DG,I"home",Jtrue},"3,4":{B3,A4,L"trackwater",C0,DG,I"",Jtrue},"4,1":{B4,A1,LF,C0,DG,I"",Jtrue},"4,2":{B4,A2,LE,C4,DG,I"",Jtrue},"4,3":{B4,A3,LF,C2,DG,I"",Jtrue},"4,4":{B4,A4,L"trackwater",C0,DG,I"",Jtrue},"-3,-1":{B-3,A-1,LY,C0,DG,I"","cargo":{"value":19,L1},Jtrue},"-3,0":{B-3,A0,LE,C6,DG,I"pickdrop",Jtrue},"-1,-1":{B-1,A-1,LY,C0,DG,I"","cargo":{"value":17,L2},Jtrue},"-1,0":{B-1,A0,LE,C6,DG,I"pickdrop",Jtrue},"1,-1":{B1,A-1,LY,C0,DG,I"","cargo":{"value":0,L2},JK},"1,0":{B1,A0,LE,C6,DG,I"pickdrop",Jtrue},"-5,2":{B-5,A2,LY,C0,DG,I"",Jtrue},"-4,2":{B-4,A2,LE,C4,DG,I"slingshot",Jtrue}},[{B-4,A-4,LM,C2,D"",Q60,R0.5,JK,O[],P[]},{B3,A1,LM,C6,D"",Q20,R0.5,JK,O[],P[]}],[{B-5,A-4,LN,C2,D"",Q60,R0.5,JK,O[],P[]},{B4,A1,LN,C0,D"",Q20,R0.5,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[5]+'-8'] = 115000;

	// choose value for do while slingshot to push bear
	trxLevels[trainerLevelNames[5]][9]='TRXv1.1:0.65~0.2578947368421053~1.360174939565543~[{"-5,2":{B-5,A2,LY,C0,DG,I"","cargo":{"value":4,L3},Jtrue},"-4,0":{B-4,A0,LF,C6,DG,I"",Jtrue},"-4,1":{B-4,A1,LE,C4,DG,I"none",Jtrue},"-4,2":{B-4,A2,LE,C4,DG,I"supply",Jtrue},"-4,3":{B-4,A3,LT,C4,DH,IU,Jtrue},"-3,0":{B-3,A0,LE,C2,DG,I"",Jtrue},"-3,1":{B-3,A1,LY,C0,DG,I"","cargo":{"value":4,L3},Jtrue},"-3,3":{B-3,A3,LE,C6,DG,I"",Jtrue},"-2,-1":{B-2,A-1,LY,C0,DG,I"",Jtrue},"-2,0":{B-2,A0,LS,C2,DG,IX,Jtrue},"-2,1":{B-2,A1,LE,C4,DG,I"slingshot",Jtrue},"-2,2":{B-2,A2,LE,C4,DG,I"increment",Jtrue},"-2,3":{B-2,A3,LF,C2,DG,I"",Jtrue},"-1,0":{B-1,A0,LS,C6,DH,IU,Jtrue},"-1,1":{B-1,A1,L"trackblank",C0,DG,I"","cargo":{"value":0,L7},Jtrue},"2,0":{B2,A0,LF,C6,DG,I"",Jtrue},"2,1":{B2,A1,LE,C4,DG,I"",Jtrue},"2,2":{B2,A2,LE,C0,DG,I"home",Jtrue},"2,3":{B2,A3,LF,C4,DG,I"",Jtrue},"3,0":{B3,A0,LE,C6,DG,I"",Jtrue},"3,2":{B3,A2,LY,C0,DG,I"",Jtrue},"3,3":{B3,A3,LE,C2,DG,I"",Jtrue},"4,0":{B4,A0,LF,C0,DG,I"",Jtrue},"4,1":{B4,A1,LE,C0,DG,I"",Jtrue},"4,2":{B4,A2,LE,C0,DG,I"",Jtrue},"4,3":{B4,A3,LF,C2,DG,I"",Jtrue},"0,0":{B0,A0,LF,C2,DG,I"",Jtrue},"0,-1":{B0,A-1,LF,C0,DG,I"",Jtrue},"-1,-1":{B-1,A-1,LF,C6,DG,I"",Jtrue},"1,-4":{B1,A-4,LE,C2,DG,I"supply",Jtrue},"-1,-4":{B-1,A-4,LE,C2,DG,I"supply",Jtrue},"-3,-4":{B-3,A-4,LE,C2,DG,I"decrement",Jtrue},"-4,-2":{B-4,A-2,LE,C4,DG,I"increment",Jtrue},"-1,-3":{B-1,A-3,LY,C0,DG,I"","cargo":{"value":2,L0},Jtrue},"1,-3":{B1,A-3,LY,C0,DG,I"","cargo":{"value":1,L0},Jtrue},"-3,2":{B-3,A2,LY,C0,DG,I"","cargo":{"value":0,L0},Jtrue},"-2,-2":{B-2,A-2,LE,C2,DG,I"pickdrop",Jtrue},"0,4":{B0,A4,LE,C6,DG,I"",Jtrue},"-1,4":{B-1,A4,LE,C6,DG,I"",Jtrue},"-2,4":{B-2,A4,LE,C6,DG,I"",Jtrue},"-3,4":{B-3,A4,LE,C6,DG,I"",Jtrue},"-4,4":{B-4,A4,LF,C4,DG,I"",Jtrue},"1,4":{B1,A4,LE,C6,DG,I"",Jtrue},"2,4":{B2,A4,LE,C6,DG,I"",Jtrue},"3,4":{B3,A4,LE,C6,DG,I"",Jtrue},"4,4":{B4,A4,LE,C6,DG,I"",Jtrue},"1,-1":{B1,A-1,LF,C4,DG,I"",Jtrue},"2,-1":{B2,A-1,LE,C2,DG,I"",Jtrue},"5,0":{B5,A0,LE,C4,DG,I"",Jtrue},"5,1":{B5,A1,LE,C4,DG,I"",Jtrue},"5,2":{B5,A2,LE,C4,DG,I"",Jtrue},"5,3":{B5,A3,LE,C4,DG,I"",Jtrue},"5,4":{B5,A4,LF,C2,DG,I"",Jtrue}},[{B2,A1,LM,C0,D"",Q80,R0.5,JK,O[],P[]},{B5,A2,LM,C4,D"",Q80,R0.5,JK,O[],P[]},{B1,A-1,LM,C6,D"",Q80,R0.5,JK,O[],P[]}],[{B2,A2,LN,C0,D"",Q80,R0.5,JK,O[],P[]},{B5,A0,LN,C4,D"",Q80,R0.5,JK,O[],P[]},{B5,A1,LN,C4,D"",Q80,R0.5,"cargo":{"value":0,L0},JK,O[],P[]},{B2,A-1,LN,C6,D"",Q80,R0.5,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[5]+'-9'] = 36000;

	/// 7. G- multiply, divide, catapult, binary
	trxLevels[trainerLevelNames[6]] = [];

	// choose two numbers to multiply
	trxLevels[trainerLevelNames[6]][0]='TRXv1.1:0~0~1.5~[{"3,-1":{B3,A-1,LS,C4,DG,IX,Jtrue},"-4,2":{B-4,A2,LE,C0,DG,I"",Jtrue},"-4,1":{B-4,A1,LE,C0,DG,I"",Jtrue},"-4,0":{B-4,A0,LE,C0,DG,I"",Jtrue},"1,1":{B1,A1,LF,C6,DG,I"",Jtrue},"1,2":{B1,A2,LE,C0,DG,I"",Jtrue},"1,3":{B1,A3,LF,C4,DG,I"",Jtrue},"2,1":{B2,A1,LE,C2,DG,I"",Jtrue},"2,3":{B2,A3,LE,C6,DG,I"",Jtrue},"3,1":{B3,A1,LT,C0,DG,IU,Jtrue},"3,2":{B3,A2,LE,C4,DG,I"home",Jtrue},"3,3":{B3,A3,LF,C2,DG,I"",Jtrue},"2,2":{B2,A2,LY,C0,DG,I"",Jtrue},"3,0":{B3,A0,LS,C4,DH,I"compareless",Jtrue},"4,-1":{B4,A-1,LY,C0,DG,I"","cargo":{"value":3,L4},Jtrue},"4,0":{B4,A0,LY,C0,DG,I"","cargo":{"value":3,L0},Jtrue},"2,0":{B2,A0,L"trackwater",C0,DG,I"",Jtrue},"2,-1":{B2,A-1,L"trackwater",C0,DG,I"",Jtrue},"1,-1":{B1,A-1,L"trackwater",C0,DG,I"",Jtrue},"1,0":{B1,A0,L"trackwater",C0,DG,I"",Jtrue},"3,-3":{B3,A-3,LE,C4,DG,I"none",Jtrue},"3,-2":{B3,A-2,LE,C4,DG,I"supply",Jtrue},"2,-3":{B2,A-3,LY,C0,DG,I"",Jtrue},"-1,2":{B-1,A2,LE,C0,DG,I"supply",Jtrue},"0,2":{B0,A2,LY,C0,DG,I"","cargo":{"value":3,L0},Jtrue},"-1,-2":{B-1,A-2,LE,C0,DG,I"supply",Jtrue},"0,-2":{B0,A-2,LY,C0,DG,I"","cargo":{"value":1,L0},Jtrue},"-3,3":{B-3,A3,LF,C2,DG,I"",Jtrue},"-4,3":{B-4,A3,LF,C4,DG,I"",Jtrue},"-3,-3":{B-3,A-3,LE,C6,DG,I"supply",Jtrue},"-3,-4":{B-3,A-4,LY,C0,DG,I"","cargo":{"value":2,L4},Jtrue},"-4,-2":{B-4,A-2,LE,C0,DG,I"supply",Jtrue},"-3,-2":{B-3,A-2,LY,C0,DG,I"","cargo":{"value":0,L4},Jtrue},"-1,0":{B-1,A0,LE,C4,DG,I"supply",Jtrue},"-2,0":{B-2,A0,LY,C0,DG,I"","cargo":{"value":2,L0},Jtrue},"2,-4":{B2,A-4,LE,C2,DG,I"multiply",Jtrue},"3,-4":{B3,A-4,LF,C0,DG,I"",Jtrue},"2,-2":{B2,A-2,LY,C0,DG,I"","cargo":{"value":0,L7},Jtrue}},[{B-4,A0,LM,C0,D"",Q40,R0.5,JK,O[],P[]}],[{B-4,A1,LN,C0,D"",Q40,R0.5,JK,O[],P[],"cargo":{"value":1,L4}},{B-4,A2,LN,C0,D"",Q40,R0.5,JK,O[],P[]},{B-4,A3,LN,C6,D"",Q40,R0.5,JK,O[],P[]},{B-3,A3,LN,C4,D"",Q40,R0.5,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[6]+'-0'] = 35000;

	// multiply blocks and numbers
	trxLevels[trainerLevelNames[6]][1]='TRXv1.1:0~0~1.5~[{"3,-1":{B3,A-1,LS,C4,DG,I"compareless",Jtrue},"-4,2":{B-4,A2,LE,C0,DG,I"",Jtrue},"-4,1":{B-4,A1,LE,C0,DG,I"",Jtrue},"-4,0":{B-4,A0,LE,C0,DG,I"",Jtrue},"1,1":{B1,A1,LF,C6,DG,I"",Jtrue},"1,2":{B1,A2,LE,C0,DG,I"",Jtrue},"1,3":{B1,A3,LF,C4,DG,I"",Jtrue},"2,1":{B2,A1,LE,C2,DG,I"",Jtrue},"2,3":{B2,A3,LE,C6,DG,I"",Jtrue},"3,1":{B3,A1,LT,C0,DG,IU,Jtrue},"3,2":{B3,A2,LE,C4,DG,I"home",Jtrue},"3,3":{B3,A3,LF,C2,DG,I"",Jtrue},"2,2":{B2,A2,LY,C0,DG,I"",Jtrue},"3,0":{B3,A0,LS,C4,DH,IX,Jtrue},"4,-1":{B4,A-1,LY,C0,DG,I"","cargo":{"value":3,L4},Jtrue},"4,0":{B4,A0,LY,C0,DG,I"","cargo":{"value":3,L0},Jtrue},"2,0":{B2,A0,L"trackwater",C0,DG,I"",Jtrue},"2,-1":{B2,A-1,L"trackwater",C0,DG,I"",Jtrue},"1,-1":{B1,A-1,L"trackwater",C0,DG,I"",Jtrue},"1,0":{B1,A0,L"trackwater",C0,DG,I"",Jtrue},"3,-3":{B3,A-3,LE,C4,DG,I"none",Jtrue},"3,-2":{B3,A-2,LE,C4,DG,I"supply",Jtrue},"2,-3":{B2,A-3,LY,C0,DG,I"",Jtrue},"-1,2":{B-1,A2,LE,C0,DG,I"supply",Jtrue},"0,2":{B0,A2,LY,C0,DG,I"","cargo":{"value":3,L0},Jtrue},"-1,-2":{B-1,A-2,LE,C0,DG,I"supply",Jtrue},"0,-2":{B0,A-2,LY,C0,DG,I"","cargo":{"value":1,L0},Jtrue},"-3,3":{B-3,A3,LF,C2,DG,I"",Jtrue},"-4,3":{B-4,A3,LF,C4,DG,I"",Jtrue},"-3,-3":{B-3,A-3,LE,C6,DG,I"supply",Jtrue},"-3,-4":{B-3,A-4,LY,C0,DG,I"","cargo":{"value":2,L4},Jtrue},"-4,-2":{B-4,A-2,LE,C0,DG,I"supply",Jtrue},"-3,-2":{B-3,A-2,LY,C0,DG,I"","cargo":{"value":0,L4},Jtrue},"-1,0":{B-1,A0,LE,C4,DG,I"supply",Jtrue},"-2,0":{B-2,A0,LY,C0,DG,I"","cargo":{"value":2,L0},Jtrue},"2,-4":{B2,A-4,LE,C2,DG,I"multiply",Jtrue},"3,-4":{B3,A-4,LF,C0,DG,I"",Jtrue},"2,-2":{B2,A-2,LY,C0,DG,I"","cargo":{"value":0,L7},Jtrue}},[{B-4,A0,LM,C0,D"",Q40,R0.5,JK,O[],P[]}],[{B-4,A1,LN,C0,D"",Q40,R0.5,JK,O[],P[],"cargo":{"value":1,L4}},{B-4,A2,LN,C0,D"",Q40,R0.5,JK,O[],P[]},{B-4,A3,LN,C6,D"",Q40,R0.5,JK,O[],P[]},{B-3,A3,LN,C4,D"",Q40,R0.5,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[6]+'-1'] = 42000;

	// choose multiply or divide
	trxLevels[trainerLevelNames[6]][2]='TRXv1.1:0~0~1.5~[{"-4,-1":{B-4,A-1,LY,C0,DG,I"","cargo":{"value":2,L0},Jtrue},"-3,-4":{B-3,A-4,LF,C6,DG,I"",Jtrue},"-3,-3":{B-3,A-3,LE,C0,DG,I"",Jtrue},"-3,-2":{B-3,A-2,LT,C4,DG,IU,Jtrue},"-3,-1":{B-3,A-1,LS,C0,DH,I"compareless",Jtrue},"-2,-4":{B-2,A-4,LE,C2,DG,I"",Jtrue},"-2,-3":{B-2,A-3,LY,C0,DG,I"",Jtrue},"-2,-2":{B-2,A-2,LE,C6,DG,I"home",Jtrue},"-1,-4":{B-1,A-4,LF,C0,DG,I"",Jtrue},"-1,-3":{B-1,A-3,LE,C4,DG,I"",Jtrue},"-1,-2":{B-1,A-2,LF,C2,DG,I"",Jtrue},"-3,0":{B-3,A0,LS,C0,DH,IX,Jtrue},"-4,0":{B-4,A0,LY,C0,DG,I"","cargo":{"value":2,L0},Jtrue},"-2,0":{B-2,A0,L"trackwater",C0,DG,I"",Jtrue},"-2,-1":{B-2,A-1,L"trackwater",C0,DG,I"",Jtrue},"-1,-1":{B-1,A-1,L"trackwater",C0,DG,I"",Jtrue},"-1,0":{B-1,A0,L"trackwater",C0,DG,I"",Jtrue},"3,-3":{B3,A-3,LE,C4,DG,I"supply",Jtrue},"3,-1":{B3,A-1,LE,C4,DG,I"supply",Jtrue},"2,-3":{B2,A-3,LY,C0,DG,I"","cargo":{"value":4,L0},Jtrue},"2,-1":{B2,A-1,LY,C0,DG,I"","cargo":{"value":2,L0},Jtrue},"-3,1":{B-3,A1,LT,C4,DH,IU,Jtrue},"-2,1":{B-2,A1,LE,C2,DG,I"multiply",Jtrue},"-1,1":{B-1,A1,LE,C2,DG,I"",Jtrue},"-1,3":{B-1,A3,LE,C6,DG,I"",Jtrue},"-2,3":{B-2,A3,LE,C6,DG,I"divide",Jtrue},"-3,3":{B-3,A3,LF,C4,DG,I"",Jtrue},"-3,2":{B-3,A2,LE,C4,DG,I"supply",Jtrue},"-2,2":{B-2,A2,LY,C0,DG,I"",Jtrue},"-4,2":{B-4,A2,LY,C0,DG,I"",Jtrue,"cargo":{"value":0,L7}},"2,2":{B2,A2,LE,C6,DG,I"",Jtrue},"3,2":{B3,A2,LE,C6,DG,I"",Jtrue},"4,2":{B4,A2,LE,C6,DG,I"",Jtrue}},[{B2,A2,LM,C6,D"",Q40,R0.5,JK,O[],P[]}],[{B3,A2,LN,C6,D"",Q40,R0.5,JK,O[],P[]},{B4,A2,LN,C6,D"",Q40,R0.5,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[6]+'-2'] = 38000;

	// loop with *2
	trxLevels[trainerLevelNames[6]][3]='TRXv1.1:0.7~-0.8473684210526315~1.3159679271991125~[{"3,3":{B3,A3,LE,C6,DG,I"",JK},"2,3":{B2,A3,LE,C6,DG,I"",JK},"1,3":{B1,A3,LE,C6,DG,I"",JK},"0,3":{B0,A3,LE,C6,DG,I"",JK},"-1,3":{B-1,A3,LE,C6,DG,I"",JK},"-2,3":{B-2,A3,LE,C6,DG,I"",Jtrue},"-3,3":{B-3,A3,LE,C6,DG,I"",Jtrue},"-4,3":{B-4,A3,LF,C4,DG,I"",Jtrue},"-4,0":{B-4,A0,LE,C4,DG,I"supply",Jtrue},"-4,-2":{B-4,A-2,LE,C4,DG,I"supply",Jtrue},"-4,-4":{B-4,A-4,LE,C4,DG,I"supply",Jtrue},"-5,0":{B-5,A0,LY,C0,DG,I"","cargo":{"value":1,L0},Jtrue},"-5,-2":{B-5,A-2,LY,C0,DG,I"","cargo":{"value":2,L0},Jtrue},"-5,-4":{B-5,A-4,LY,C0,DG,I"","cargo":{"value":3,L0},Jtrue},"-1,-5":{B-1,A-5,LT,C6,DH,IU,Jtrue},"-1,-4":{B-1,A-4,LE,C4,DG,I"",Jtrue},"-1,-3":{B-1,A-3,LS,C6,DH,IX,Jtrue},"-1,-2":{B-1,A-2,LY,C0,DG,I"","cargo":{"value":8,L0},Jtrue},"0,-5":{B0,A-5,LE,C2,DG,I"",Jtrue},"0,-3":{B0,A-3,LE,C2,DG,I"supply",Jtrue},"0,-2":{B0,A-2,LY,C0,DG,I"","cargo":{"value":6,L3},Jtrue},"1,-5":{B1,A-5,LF,C0,DG,I"",Jtrue},"1,-4":{B1,A-4,LE,C0,DG,I"multiply",Jtrue},"1,-3":{B1,A-3,LF,C2,DG,I"",Jtrue},"2,-4":{B2,A-4,LY,C0,DG,I"",Jtrue,"cargo":{"value":2,L0}},"3,-5":{B3,A-5,LF,C6,DG,I"",Jtrue},"3,-4":{B3,A-4,LE,C4,DG,I"pickdrop",Jtrue},"3,-3":{B3,A-3,LF,C4,DG,I"",Jtrue},"4,-5":{B4,A-5,LF,C0,DG,I"",Jtrue},"4,-4":{B4,A-4,LE,C0,DG,I"supply",Jtrue},"4,-3":{B4,A-3,LF,C2,DG,I"",Jtrue},"5,-4":{B5,A-4,LY,C0,DG,I"","cargo":{"value":2,L0},Jtrue},"-1,1":{B-1,A1,LE,C4,DG,I"slingshot",Jtrue},"0,1":{B0,A1,L"trackblank",C0,DG,I"","cargo":{"value":0,L7},Jtrue},"-1,0":{B-1,A0,LE,C0,DG,I"dump",Jtrue},"0,0":{B0,A0,LY,C0,DG,I"","cargo":{"value":8,L0},Jtrue},"5,-1":{B5,A-1,LF,C0,DG,I"",Jtrue},"5,0":{B5,A0,LE,C4,DG,I"home",Jtrue},"5,1":{B5,A1,LE,C4,DG,I"",Jtrue},"5,2":{B5,A2,LF,C2,DG,I"",Jtrue},"4,-1":{B4,A-1,LE,C6,DG,I"",Jtrue},"3,-1":{B3,A-1,LF,C6,DG,I"",Jtrue},"3,0":{B3,A0,LE,C4,DG,I"",Jtrue},"3,1":{B3,A1,LE,C4,DG,I"",Jtrue},"3,2":{B3,A2,LF,C4,DG,I"",Jtrue},"4,0":{B4,A0,LY,C0,DG,I"",Jtrue},"4,2":{B4,A2,LE,C6,DG,I"",Jtrue}},[{B-4,A3,LM,C6,D"",Q40,R0.5,JK,O[],P[]},{B4,A-4,LM,C0,D"",Q160,R0.5,JK,O[],P[]},{B4,A2,LM,C6,D"",Q40,R0.5,JK,O[],P[]}],[{B3,A3,LN,C6,D"",Q40,R0.5,JK,O[],P[]},{B2,A3,LN,C6,D"",Q40,R0.5,JK,O[],P[]},{B1,A3,LN,C6,D"",Q40,R0.5,JK,O[],P[]},{B0,A3,LN,C6,D"",Q40,R0.5,JK,O[],P[]},{B-1,A3,LN,C6,D"",Q40,R0.5,JK,O[],P[]},{B-2,A3,LN,C6,D"",Q40,R0.5,JK,O[],P[]},{B-3,A3,LN,C6,D"",Q40,R0.5,JK,O[],P[]},{B3,A-3,LN,C4,D"",Q160,R0.5,JK,O[],P[],"cargo":{"value":2,L0}},{B4,A-3,LN,C2,D"",Q160,R0.5,JK,O[],P[],"cargo":{"value":2,L0}},{B3,A-4,LN,C4,D"",Q160,R0.5,"cargo":{"value":2,L0},JK,O[],P[]},{B3,A-5,LN,C6,D"",Q160,R0.5,"cargo":{"value":2,L0},JK,O[],P[]},{B5,A2,LN,C4,D"",Q40,R0.5,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[6]+'-3'] = 78000;

	// simple catapult
	trxLevels[trainerLevelNames[6]][4]='TRXv1.1:-0.1166666666666667~-0.6815789473684211~1.5~[{"-2,0":{B-2,A0,LE,C4,DG,I"catapult",Jtrue},"-4,0":{B-4,A0,LE,C0,DG,I"pickdrop",Jtrue},"-3,0":{B-3,A0,LY,C0,DG,I"",Jtrue},"-4,-4":{B-4,A-4,LY,C0,DG,I"","cargo":{"value":2,L0},Jtrue},"-4,-3":{B-4,A-3,LE,C6,DG,I"supply",Jtrue},"-2,-4":{B-2,A-4,LY,C0,DG,I"","cargo":{"value":3,L0},Jtrue},"-2,-3":{B-2,A-3,LE,C6,DG,I"supply",Jtrue},"0,-4":{B0,A-4,LY,C0,DG,I"","cargo":{"value":4,L0},Jtrue},"0,-3":{B0,A-3,LE,C6,DG,I"supply",Jtrue},"3,-3":{B3,A-3,LE,C6,DG,I"",Jtrue},"2,-3":{B2,A-3,LE,C6,DG,I"",Jtrue},"-4,1":{B-4,A1,LF,C4,DG,I"",Jtrue},"-3,1":{B-3,A1,LE,C2,DG,I"",Jtrue},"-2,1":{B-2,A1,LF,C2,DG,I"",Jtrue},"-2,-1":{B-2,A-1,LF,C0,DG,I"",Jtrue},"-3,-1":{B-3,A-1,LE,C6,DG,I"",Jtrue},"-4,-1":{B-4,A-1,LS,C0,DG,IU,Jtrue},"4,-3":{B4,A-3,LE,C2,DG,I"",Jtrue},"2,1":{B2,A1,LF,C4,DG,I"",Jtrue},"3,1":{B3,A1,LE,C6,DG,I"",Jtrue},"4,1":{B4,A1,LF,C2,DG,I"",Jtrue},"2,-1":{B2,A-1,LF,C6,DG,I"",Jtrue},"2,0":{B2,A0,LE,C0,DG,I"",Jtrue},"3,-1":{B3,A-1,LE,C2,DG,I"",Jtrue},"3,0":{B3,A0,LY,C0,DG,I"",Jtrue},"4,-1":{B4,A-1,LF,C0,DG,I"",Jtrue},"4,0":{B4,A0,LE,C4,DG,I"home",Jtrue}},[{B2,A-3,LM,C6,D"",Q40,R0.5,JK,O[],P[]},{B2,A1,LM,C6,D"",Q40,R0.5,JK,O[],P[]}],[{B3,A-3,LN,C6,D"",Q40,R0.5,JK,O[],P[]},{B4,A-3,LN,C6,D"",Q40,R0.5,"cargo":{"value":0,L7},JK,O[],P[]},{B3,A1,LN,C6,D"",Q40,R0.5,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[6]+'-4'] = 20000;

	// catapult to catapult
	trxLevels[trainerLevelNames[6]][5]='TRXv1.1:0.31666666666666665~-0.9763157894736842~1.5~[{"-4,1":{B-4,A1,LS,C0,DG,IU,Jtrue},"-4,2":{B-4,A2,LE,C0,DG,I"none",Jtrue},"-4,3":{B-4,A3,LF,C4,DG,I"",Jtrue},"-3,1":{B-3,A1,LE,C6,DG,I"",Jtrue},"-3,2":{B-3,A2,LY,C0,DG,I"",Jtrue},"-3,3":{B-3,A3,LE,C2,DG,I"",Jtrue},"-2,1":{B-2,A1,LF,C0,DG,I"",Jtrue},"-2,2":{B-2,A2,LE,C4,DG,I"catapult",Jtrue},"-2,3":{B-2,A3,LF,C2,DG,I"",Jtrue},"2,1":{B2,A1,LF,C6,DG,I"",Jtrue},"2,2":{B2,A2,LE,C0,DG,I"",Jtrue},"2,3":{B2,A3,LF,C4,DG,I"",Jtrue},"3,1":{B3,A1,LE,C2,DG,I"",Jtrue},"3,2":{B3,A2,LY,C0,DG,I"",Jtrue},"3,3":{B3,A3,LE,C6,DG,I"",Jtrue},"4,1":{B4,A1,LF,C0,DG,I"",Jtrue},"4,2":{B4,A2,LE,C4,DG,I"home",Jtrue},"4,3":{B4,A3,LF,C2,DG,I"",Jtrue},"-3,-4":{B-3,A-4,LE,C6,DG,I"catapult",Jtrue},"-3,-5":{B-3,A-5,LY,C0,DG,I"",Jtrue},"0,-5":{B0,A-5,LE,C6,DG,I"",Jtrue},"3,-5":{B3,A-5,LE,C2,DG,I"",Jtrue},"4,-5":{B4,A-5,LE,C2,DG,I"",Jtrue},"4,-3":{B4,A-3,LE,C6,DG,I"",Jtrue},"0,-3":{B0,A-3,LE,C6,DG,I"",Jtrue},"0,-1":{B0,A-1,LE,C6,DG,I"",Jtrue},"0,1":{B0,A1,LE,C6,DG,I"",Jtrue}},[{B2,A3,LM,C6,D"",Q40,R0.5,JK,O[],P[]},{B3,A-5,LM,C6,D"",Q40,R0.5,JK,O[],P[]},{B4,A-3,LM,C6,D"",Q40,R0.5,JK,O[],P[]}],[{B3,A3,LN,C6,D"",Q40,R0.5,JK,O[],P[]},{B0,A-5,LN,C2,D"",Q0,R0.5,"cargo":{"value":2,L0},JK,O[],P[]},{B4,A-5,LN,C6,D"",Q40,R0.5,JK,O[],P[],"cargo":{"value":0,L7}},{B0,A-3,LN,C2,D"",Q0,R0.5,"cargo":{"value":4,L0},JK,O[],P[]},{B0,A-1,LN,C2,D"",Q0,R0.5,"cargo":{"value":6,L0},JK,O[],P[]},{B0,A1,LN,C2,D"",Q0,R0.5,"cargo":{"value":8,L0},JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[6]+'-5'] = 38000;

	// catapuly dino to clear catapuly value then catapult bear
	trxLevels[trainerLevelNames[6]][6]='TRXv1.1:0.31666666666666665~-0.9763157894736842~1.5~[{"2,-2":{B2,A-2,LE,C0,DG,I"",Jtrue},"2,-3":{B2,A-3,LF,C6,DG,I"",Jtrue},"3,-3":{B3,A-3,LE,C2,DG,I"",Jtrue},"4,-3":{B4,A-3,LF,C0,DG,I"",Jtrue},"4,-2":{B4,A-2,LE,C4,DG,I"home",Jtrue},"4,-1":{B4,A-1,LF,C2,DG,I"",Jtrue},"3,-1":{B3,A-1,LE,C6,DG,I"",Jtrue},"2,-1":{B2,A-1,LF,C4,DG,I"",Jtrue},"3,-2":{B3,A-2,LY,C0,DG,I"",Jtrue},"-3,-2":{B-3,A-2,LE,C4,DG,I"catapult",Jtrue},"-1,1":{B-1,A1,LE,C0,DG,I"",Jtrue},"1,1":{B1,A1,LE,C0,DG,I"",Jtrue},"3,1":{B3,A1,LE,C0,DG,I"",Jtrue},"-4,2":{B-4,A2,LE,C2,DG,I"",Jtrue},"-1,3":{B-1,A3,LE,C2,DG,I"",Jtrue},"-4,-2":{B-4,A-2,LY,C0,DG,I"","cargo":{"value":2,L4},Jtrue}},[{B-4,A2,LM,C2,D"",Q40,R0.5,JK,O[],P[]},{B3,A-3,LM,C2,D"",Q40,R0.5,JK,O[],P[]},{B-1,A3,LM,C2,D"",Q40,R0.5,JK,O[],P[]}],[{B-1,A1,LN,C0,D"",Q0,R0.5,"cargo":{"value":0,L7},JK,O[],P[]},{B1,A1,LN,C0,D"",Q0,R0.5,"cargo":{"value":5,L0},JK,O[],P[]},{B3,A1,LN,C0,D"",Q0,R0.5,"cargo":{"value":3,L6},JK,O[],P[]},{B2,A-3,LN,C0,D"",Q40,R0.5,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[6]+'-6'] = 30000;

	// 4 slingshots to pass bear around but use only two
	trxLevels[trainerLevelNames[6]][7]='TRXv1.1:0.31666666666666665~-0.9763157894736842~1.5~[{"1,2":{B1,A2,LS,C6,DG,IU,Jtrue},"2,2":{B2,A2,LE,C2,DG,I"",Jtrue},"3,2":{B3,A2,LF,C2,DG,I"",Jtrue},"3,0":{B3,A0,LF,C0,DG,I"",Jtrue},"2,0":{B2,A0,LE,C6,DG,I"",Jtrue},"1,0":{B1,A0,LF,C6,DG,I"",Jtrue},"3,1":{B3,A1,LE,C4,DG,I"supply",Jtrue},"2,1":{B2,A1,LY,C0,DG,I"",Jtrue},"1,1":{B1,A1,LE,C0,DG,I"catapult",Jtrue},"-4,-5":{B-4,A-5,LF,C6,DG,I"",Jtrue},"-4,-4":{B-4,A-4,LE,C4,DG,I"",Jtrue},"-4,-3":{B-4,A-3,LF,C4,DG,I"",Jtrue},"-3,-5":{B-3,A-5,LE,C6,DG,I"",Jtrue},"-3,-3":{B-3,A-3,LE,C2,DG,I"",Jtrue},"-2,-5":{B-2,A-5,LF,C0,DG,I"",Jtrue},"-2,-4":{B-2,A-4,LE,C4,DG,I"slingshot",Jtrue},"-2,-3":{B-2,A-3,LF,C2,DG,I"",Jtrue},"1,-5":{B1,A-5,LF,C6,DG,I"",Jtrue},"2,-5":{B2,A-5,LE,C2,DG,I"",Jtrue},"3,-5":{B3,A-5,LF,C0,DG,I"",Jtrue},"1,-4":{B1,A-4,LE,C0,DG,I"",Jtrue},"1,-3":{B1,A-3,LF,C4,DG,I"",Jtrue},"2,-1":{B2,A-1,LE,C6,DG,I"supply",Jtrue},"3,-4":{B3,A-4,LE,C4,DG,I"",Jtrue},"3,-3":{B3,A-3,LF,C2,DG,I"",Jtrue},"-4,0":{B-4,A0,LF,C6,DG,I"",Jtrue},"-4,1":{B-4,A1,LE,C0,DG,I"",Jtrue},"-4,2":{B-4,A2,LF,C4,DG,I"",Jtrue},"-3,0":{B-3,A0,LE,C2,DG,I"",Jtrue},"-3,2":{B-3,A2,LE,C6,DG,I"",Jtrue},"-2,0":{B-2,A0,LF,C0,DG,I"",Jtrue},"-2,1":{B-2,A1,LE,C4,DG,I"home",Jtrue},"-2,2":{B-2,A2,LF,C2,DG,I"",Jtrue},"2,-3":{B2,A-3,LE,C2,DG,I"supply",Jtrue},"2,-2":{B2,A-2,LY,C0,DG,I"",Jtrue},"0,-4":{B0,A-4,LE,C4,DG,I"slingshot",Jtrue},"-3,1":{B-3,A1,LY,C0,DG,I"",Jtrue},"-3,3":{B-3,A3,LE,C2,DG,I"slingshot",Jtrue},"-3,4":{B-3,A4,LY,C0,DG,I"",JK},"1,-6":{B1,A-6,L"trackwater",C0,DG,I"",Jtrue},"0,-6":{B0,A-6,L"trackwater",C0,DG,I"",Jtrue},"-1,-6":{B-1,A-6,L"trackwater",C0,DG,I"",Jtrue},"-2,-6":{B-2,A-6,L"trackwater",C0,DG,I"",Jtrue}},[{B-3,A-5,LM,C6,D"",Q20,R0.5,JK,O[],P[]},{B3,A-4,LM,C0,D"",Q20,R0.5,JK,O[],P[]},{B-3,A0,LM,C6,D"",Q20,R0.5,JK,O[],P[]},{B3,A1,LM,C4,D"",Q20,R0.5,JK,O[],P[]}],[{B-2,A-5,LN,C0,D"",Q20,R0.5,"cargo":{"value":0,L7},JK,O[],P[]},{B3,A-3,LN,C2,D"",Q20,R0.5,JK,O[],P[]},{B-2,A0,LN,C0,D"",Q20,R0.5,JK,O[],P[]},{B3,A0,LN,C2,D"",Q20,R0.5,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[6]+'-7'] = 75000;

	// choose which catapult to use
	trxLevels[trainerLevelNames[6]][8]='TRXv1.1:0.31666666666666665~-0.9763157894736842~1.0415862797026716~[{"-3,-3":{B-3,A-3,LE,C4,DG,I"catapult",Jtrue},"-4,-3":{B-4,A-3,LY,C0,DG,I"",Jtrue,"cargo":{"value":6,L0}},"-2,2":{B-2,A2,LE,C2,DG,I"catapult",Jtrue},"-2,3":{B-2,A3,LY,C0,DG,I"",Jtrue,"cargo":{"value":3,L0}},"3,1":{B3,A1,LE,C0,DG,I"catapult",Jtrue},"4,1":{B4,A1,LY,C0,DG,I"",Jtrue,"cargo":{"value":5,L0}},"2,-4":{B2,A-4,LE,C6,DG,I"catapult",Jtrue},"2,-5":{B2,A-5,LY,C0,DG,I"",Jtrue,"cargo":{"value":7,L0}},"1,-2":{B1,A-2,LE,C2,DG,I"",Jtrue},"0,-2":{B0,A-2,LE,C6,DG,I"",Jtrue},"-1,-2":{B-1,A-2,LE,C4,DG,I"",Jtrue},"-1,-1":{B-1,A-1,LE,C4,DG,I"",Jtrue},"-1,0":{B-1,A0,LE,C2,DG,I"",Jtrue},"0,0":{B0,A0,LE,C2,DG,I"",Jtrue},"1,-1":{B1,A-1,LE,C4,DG,I"",Jtrue},"1,0":{B1,A0,LE,C4,DG,I"",Jtrue},"4,-3":{B4,A-3,LE,C0,DG,I"",Jtrue},"4,-4":{B4,A-4,LF,C6,DG,I"",Jtrue},"5,-4":{B5,A-4,LE,C2,DG,I"",Jtrue},"6,-4":{B6,A-4,LF,C0,DG,I"",Jtrue},"6,-3":{B6,A-3,LE,C4,DG,I"home",Jtrue},"6,-2":{B6,A-2,LF,C2,DG,I"",Jtrue},"5,-2":{B5,A-2,LE,C6,DG,I"",Jtrue},"4,-2":{B4,A-2,LF,C4,DG,I"",Jtrue},"5,-3":{B5,A-3,LY,C0,DG,I"",Jtrue},"1,3":{B1,A3,LF,C6,DG,I"",Jtrue},"1,4":{B1,A4,LE,C0,DG,I"",Jtrue},"1,5":{B1,A5,LF,C4,DG,I"",Jtrue},"2,3":{B2,A3,LE,C2,DG,I"",Jtrue},"2,4":{B2,A4,LY,C0,DG,I"",Jtrue},"2,5":{B2,A5,LE,C6,DG,I"",Jtrue},"3,3":{B3,A3,LF,C0,DG,I"",Jtrue},"3,4":{B3,A4,LE,C4,DG,I"home",Jtrue},"3,5":{B3,A5,LF,C2,DG,I"",Jtrue},"-3,-7":{B-3,A-7,LF,C6,DG,I"",Jtrue},"-3,-6":{B-3,A-6,LE,C0,DG,I"",Jtrue},"-3,-5":{B-3,A-5,LF,C4,DG,I"",Jtrue},"-2,-7":{B-2,A-7,LE,C2,DG,I"",Jtrue},"-2,-6":{B-2,A-6,LY,C0,DG,I"",Jtrue},"-2,-5":{B-2,A-5,LE,C6,DG,I"",Jtrue},"-1,-7":{B-1,A-7,LF,C0,DG,I"",Jtrue},"-1,-6":{B-1,A-6,LE,C4,DG,I"home",Jtrue},"-1,-5":{B-1,A-5,LF,C2,DG,I"",Jtrue},"-6,0":{B-6,A0,LF,C6,DG,I"",Jtrue},"-6,1":{B-6,A1,LE,C0,DG,I"",Jtrue},"-6,2":{B-6,A2,LF,C4,DG,I"",Jtrue},"-5,0":{B-5,A0,LE,C2,DG,I"",Jtrue},"-5,1":{B-5,A1,LY,C0,DG,I"",Jtrue},"-5,2":{B-5,A2,LE,C6,DG,I"",Jtrue},"-4,0":{B-4,A0,LF,C0,DG,I"",Jtrue},"-4,1":{B-4,A1,LE,C4,DG,I"home",Jtrue},"-4,2":{B-4,A2,LF,C2,DG,I"",Jtrue}},[{B1,A0,LM,C4,D"",Q40,R0.5,JK,O[],P[]},{B-1,A0,LM,C6,D"",Q40,R0.5,JK,O[],P[]},{B-1,A-2,LM,C0,D"",Q40,R0.5,JK,O[],P[]},{B1,A-2,LM,C2,D"",Q40,R0.5,JK,O[],P[]},{B6,A-3,LM,C4,D"",Q40,R0.5,JK,O[],P[]},{B3,A4,LM,C4,D"",Q40,R0.5,JK,O[],P[]},{B-1,A-6,LM,C4,D"",Q40,R0.5,JK,O[],P[]},{B-4,A1,LM,C4,D"",Q40,R0.5,JK,O[],P[]}],[{B1,A-1,LN,C4,D"",Q40,R0.5,"cargo":{"value":0,L6},JK,O[],P[]},{B0,A-2,LN,C2,D"",Q40,R0.5,"cargo":{"value":3,L6},JK,O[],P[]},{B-1,A-1,LN,C0,D"",Q40,R0.5,"cargo":{"value":2,L6},JK,O[],P[]},{B0,A0,LN,C6,D"",Q40,R0.5,"cargo":{"value":0,L7},JK,O[],P[]},{B6,A-4,LN,C2,D"",Q40,R0.5,JK,O[],P[]},{B3,A3,LN,C2,D"",Q40,R0.5,JK,O[],P[]},{B-1,A-7,LN,C2,D"",Q40,R0.5,JK,O[],P[]},{B-4,A0,LN,C2,D"",Q40,R0.5,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[6]+'-8'] = 20000;

	// spell train with catapult
	trxLevels[trainerLevelNames[6]][9]='TRXv1.1:0~0~1.0013508573247256~[{"-3,-5":{B-3,A-5,LT,C6,DH,IU,Jtrue},"-2,-5":{B-2,A-5,LT,C2,DH,IU,Jtrue},"-1,-5":{B-1,A-5,LE,C2,DG,I"",Jtrue},"0,-5":{B0,A-5,LE,C6,DG,I"home",Jtrue},"1,-5":{B1,A-5,LE,C2,DG,I"",Jtrue},"2,-5":{B2,A-5,LS,C6,DG,IU,Jtrue},"3,-5":{B3,A-5,LS,C2,DH,IU,Jtrue},"0,-6":{B0,A-6,LY,C0,DG,I"",Jtrue},"-1,-6":{B-1,A-6,L"trackwater",C0,DG,I"",Jtrue},"-1,-7":{B-1,A-7,L"trackwater",C0,DG,I"",Jtrue},"0,-7":{B0,A-7,L"trackwater",C0,DG,I"",Jtrue},"1,-7":{B1,A-7,L"trackwater",C0,DG,I"",Jtrue},"1,-6":{B1,A-6,L"trackwater",C0,DG,I"",Jtrue},"-7,3":{B-7,A3,LE,C6,DG,I"",JK},"-6,3":{B-6,A3,LE,C6,DG,I"",JK},"-5,3":{B-5,A3,LE,C6,DG,I"",JK},"-4,3":{B-4,A3,LE,C6,DG,I"",JK},"-3,3":{B-3,A3,LE,C6,DG,I"",JK},"-2,3":{B-2,A3,LE,C6,DG,I"",Jtrue},"0,4":{B0,A4,LE,C6,DG,I"",Jtrue},"1,4":{B1,A4,LE,C6,DG,I"",JK},"2,4":{B2,A4,LE,C6,DG,I"",JK},"3,4":{B3,A4,LE,C6,DG,I"",JK},"4,4":{B4,A4,LE,C6,DG,I"",JK},"5,4":{B5,A4,LE,C6,DG,I"",JK},"6,4":{B6,A4,LE,C2,DG,I"",JK},"-4,-1":{B-4,A-1,LY,C0,DG,I"",Jtrue},"-3,-1":{B-3,A-1,LE,C4,DG,I"catapult",Jtrue},"-3,0":{B-3,A0,LS,C4,DH,IU,Jtrue},"3,-1":{B3,A-1,LE,C0,DG,I"catapult",Jtrue},"3,0":{B3,A0,LT,C4,DG,IU,Jtrue},"4,-1":{B4,A-1,LY,C0,DG,I"",Jtrue},"3,-2":{B3,A-2,LE,C0,DG,I"",Jtrue},"3,-3":{B3,A-3,LE,C0,DG,I"",Jtrue},"3,-4":{B3,A-4,LS,C0,DG,IX,Jtrue},"4,-4":{B4,A-4,LE,C2,DG,I"",Jtrue},"5,-4":{B5,A-4,LF,C0,DG,I"",Jtrue},"5,-3":{B5,A-3,LE,C4,DG,I"",Jtrue},"5,-2":{B5,A-2,LE,C4,DG,I"",Jtrue},"5,-1":{B5,A-1,LE,C4,DG,I"",Jtrue},"5,0":{B5,A0,LF,C2,DG,I"",Jtrue},"4,0":{B4,A0,LE,C6,DG,I"",Jtrue},"2,-4":{B2,A-4,LY,C0,DG,I"","cargo":{"value":25,L2},Jtrue},"-3,-2":{B-3,A-2,LE,C0,DG,I"",Jtrue},"-3,-3":{B-3,A-3,LE,C0,DG,I"",Jtrue},"-3,-4":{B-3,A-4,LT,C0,DG,I"compareless",Jtrue},"-4,-4":{B-4,A-4,LE,C6,DG,I"",Jtrue},"-5,-4":{B-5,A-4,LF,C6,DG,I"",Jtrue},"-5,-3":{B-5,A-3,LE,C4,DG,I"",Jtrue},"-5,-2":{B-5,A-2,LE,C4,DG,I"",Jtrue},"-5,-1":{B-5,A-1,LE,C4,DG,I"",Jtrue},"-5,0":{B-5,A0,LF,C4,DG,I"",Jtrue},"-4,0":{B-4,A0,LE,C2,DG,I"",Jtrue},"-2,-4":{B-2,A-4,LY,C0,DG,I"","cargo":{"value":25,L2},Jtrue},"-4,-5":{B-4,A-5,LE,C2,DG,I"",Jtrue},"-5,-5":{B-5,A-5,LE,C6,DG,I"",Jtrue},"-6,-5":{B-6,A-5,LF,C4,DG,I"",Jtrue},"-6,-6":{B-6,A-6,LF,C6,DG,I"",Jtrue},"-5,-6":{B-5,A-6,LE,C2,DG,I"",Jtrue},"-4,-6":{B-4,A-6,LE,C2,DG,I"",Jtrue},"4,-5":{B4,A-5,LE,C2,DG,I"",Jtrue},"5,-5":{B5,A-5,LE,C2,DG,I"",Jtrue},"6,-5":{B6,A-5,LF,C2,DG,I"",Jtrue},"6,-6":{B6,A-6,LF,C0,DG,I"",Jtrue},"5,-6":{B5,A-6,LE,C6,DG,I"",Jtrue},"4,-6":{B4,A-6,LE,C6,DG,I"",Jtrue},"3,-6":{B3,A-6,LE,C6,DG,I"",Jtrue},"2,-6":{B2,A-6,LF,C6,DG,I"",Jtrue},"-3,-6":{B-3,A-6,LE,C2,DG,I"",Jtrue},"-2,-6":{B-2,A-6,LF,C0,DG,I"",Jtrue}},[{B-2,A3,LM,C2,D"",Q60,R0.5,JK,O[],P[]},{B0,A4,LM,C6,D"",Q60,R0.5,JK,O[],P[]}],[{B-7,A3,LN,C2,D"",Q60,R0.5,"cargo":{"value":0,L7},JK,O[],P[]},{B-6,A3,LN,C2,D"",Q60,R0.5,"cargo":{"value":8,L2},JK,O[],P[]},{B-5,A3,LN,C2,D"",Q60,R0.5,"cargo":{"value":2,L0},JK,O[],P[]},{B-4,A3,LN,C2,D"",Q60,R0.5,"cargo":{"value":0,L2},JK,O[],P[]},{B-3,A3,LN,C2,D"",Q60,R0.5,"cargo":{"value":3,L0},JK,O[],P[]},{B1,A4,LN,C6,D"",Q60,R0.5,"cargo":{"value":5,L0},JK,O[],P[]},{B2,A4,LN,C6,D"",Q60,R0.5,"cargo":{"value":13,L2},JK,O[],P[]},{B3,A4,LN,C6,D"",Q60,R0.5,"cargo":{"value":1,L0},JK,O[],P[]},{B4,A4,LN,C6,D"",Q60,R0.5,"cargo":{"value":19,L1},JK,O[],P[]},{B5,A4,LN,C6,D"",Q60,R0.5,"cargo":{"value":2,L0},JK,O[],P[]},{B6,A4,LN,C6,D"",Q60,R0.5,"cargo":{"value":17,L2},JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[6]+'-9'] = 33000;

	/// 8. H- letters, Tunnels
	trxLevels[trainerLevelNames[7]] = [];

	// choose right colored tunnel
	trxLevels[trainerLevelNames[7]][0]='TRXv1.1:0~0~1.5~[{"1,-3":{B1,A-3,LE,C0,DG,I"greentunnel",Jtrue},"1,-4":{B1,A-4,LF,C6,DG,I"",Jtrue},"2,-4":{B2,A-4,LE,C2,DG,I"",Jtrue},"3,-4":{B3,A-4,LF,C0,DG,I"",Jtrue},"3,-3":{B3,A-3,LE,C4,DG,I"home",Jtrue},"3,-2":{B3,A-2,LF,C2,DG,I"",Jtrue},"2,-2":{B2,A-2,LE,C6,DG,I"",Jtrue},"1,-2":{B1,A-2,LF,C4,DG,I"",Jtrue},"2,-3":{B2,A-3,LY,C0,DG,I"",Jtrue},"3,-1":{B3,A-1,L"trackwater",C0,DG,I"",JK},"2,-1":{B2,A-1,L"trackwater",C0,DG,I"",JK},"1,-1":{B1,A-1,L"trackwater",C0,DG,I"",JK},"0,-1":{B0,A-1,L"trackwater",C0,DG,I"",JK},"0,-2":{B0,A-2,L"trackwater",C0,DG,I"",JK},"0,-3":{B0,A-3,L"trackwater",C0,DG,I"",JK},"0,-4":{B0,A-4,L"trackwater",C0,DG,I"",JK},"0,-5":{B0,A-5,L"trackwater",C0,DG,I"",JK},"1,-5":{B1,A-5,L"trackwater",C0,DG,I"",JK},"2,-5":{B2,A-5,L"trackwater",C0,DG,I"",JK},"3,-5":{B3,A-5,L"trackwater",C0,DG,I"",JK},"4,-5":{B4,A-5,L"trackwater",C0,DG,I"",JK},"4,-4":{B4,A-4,L"trackwater",C0,DG,I"",JK},"4,-3":{B4,A-3,L"trackwater",C0,DG,I"",JK},"4,-2":{B4,A-2,L"trackwater",C0,DG,I"",JK},"4,-1":{B4,A-1,L"trackwater",C0,DG,I"",JK},"3,3":{B3,A3,LE,C6,DG,I"",Jtrue},"2,3":{B2,A3,LE,C6,DG,I"",Jtrue},"-3,-3":{B-3,A-3,LE,C2,DG,I"greentunnel",Jtrue},"-4,0":{B-4,A0,LE,C4,DG,I"bluetunnel",Jtrue},"1,1":{B1,A1,LE,C2,DG,I"redtunnel",Jtrue}},[{B2,A3,LM,C6,D"",Q40,R0.5,JK,O[],P[]}],[{B3,A3,LN,C6,D"",Q40,R0.5,"cargo":{"value":0,L7},JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[7]+'-0'] = 18000;

	// three loops with tunnels for car, bear, and home
	trxLevels[trainerLevelNames[7]][1]='TRXv1.1:0~0~1.5~[{"-3,-3":{B-3,A-3,LE,C4,DG,I"",Jtrue},"-3,-2":{B-3,A-2,LF,C4,DG,I"",Jtrue},"-2,-2":{B-2,A-2,LE,C2,DG,I"redtunnel",Jtrue},"-1,-2":{B-1,A-2,LF,C2,DG,I"",Jtrue},"-1,-3":{B-1,A-3,LE,C0,DG,I"",Jtrue},"-1,-4":{B-1,A-4,LF,C0,DG,I"",Jtrue},"-2,-4":{B-2,A-4,LE,C2,DG,I"supply",Jtrue},"-3,-4":{B-3,A-4,LF,C6,DG,I"",Jtrue},"2,-2":{B2,A-2,LE,C4,DG,I"greentunnel",Jtrue},"2,-1":{B2,A-1,LF,C4,DG,I"",Jtrue},"3,-1":{B3,A-1,LE,C2,DG,I"",Jtrue},"4,-1":{B4,A-1,LF,C2,DG,I"",Jtrue},"4,-2":{B4,A-2,LE,C4,DG,I"home",Jtrue},"4,-3":{B4,A-3,LF,C0,DG,I"",Jtrue},"3,-3":{B3,A-3,LE,C6,DG,I"",Jtrue},"2,-3":{B2,A-3,LF,C6,DG,I"",Jtrue},"-2,-3":{B-2,A-3,LY,C0,DG,I"","cargo":{"value":0,L7},Jtrue},"3,-2":{B3,A-2,LY,C0,DG,I"",Jtrue},"-3,1":{B-3,A1,LE,C2,DG,I"",Jtrue},"-2,1":{B-2,A1,LF,C0,DG,I"",Jtrue},"-2,2":{B-2,A2,LE,C4,DG,I"",Jtrue},"-2,3":{B-2,A3,LF,C2,DG,I"",Jtrue},"-3,3":{B-3,A3,LE,C6,DG,I"",Jtrue},"-4,3":{B-4,A3,LF,C4,DG,I"",Jtrue},"-4,2":{B-4,A2,LE,C0,DG,I"bluetunnel",Jtrue},"-4,1":{B-4,A1,LF,C6,DG,I"",Jtrue},"0,-1":{B0,A-1,LE,C6,DG,I"redtunnel",Jtrue},"0,1":{B0,A1,LE,C6,DG,I"bluetunnel",Jtrue},"0,3":{B0,A3,LE,C6,DG,I"greentunnel",Jtrue},"4,3":{B4,A3,LE,C0,DG,I"",Jtrue}},[{B4,A3,LM,C0,D"",Q40,R0.5,JK,O[],P[]}],[{B-2,A1,LN,C2,D"",Q0,R0.5,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[7]+'-1'] = 35000;

	// loop through increment function twice
	trxLevels[trainerLevelNames[7]][2]='TRXv1.1:0~0~1.5~[{"2,-2":{B2,A-2,LE,C4,DG,I"greentunnel",Jtrue},"2,-1":{B2,A-1,LF,C4,DG,I"",Jtrue},"3,-1":{B3,A-1,LE,C2,DG,I"",Jtrue},"4,-1":{B4,A-1,LF,C2,DG,I"",Jtrue},"4,-2":{B4,A-2,LE,C4,DG,I"home",Jtrue},"4,-3":{B4,A-3,LF,C0,DG,I"",Jtrue},"3,-3":{B3,A-3,LE,C6,DG,I"",Jtrue},"2,-3":{B2,A-3,LF,C6,DG,I"",Jtrue},"3,-2":{B3,A-2,LY,C0,DG,I"",Jtrue},"-3,-3":{B-3,A-3,LE,C2,DG,I"",Jtrue},"-2,-3":{B-2,A-3,LS,C2,DH,I"compareless",Jtrue},"-1,-3":{B-1,A-3,L"trackwater",C0,DG,I"",JK},"-2,-2":{B-2,A-2,LE,C4,DG,I"greentunnel",Jtrue},"-2,-1":{B-2,A-1,LF,C4,DG,I"",Jtrue},"-1,-1":{B-1,A-1,LS,C6,DH,IU,Jtrue},"-1,-2":{B-1,A-2,LF,C6,DG,I"",Jtrue},"-2,-4":{B-2,A-4,LY,C0,DG,I"","cargo":{"value":1,L4},Jtrue},"0,-1":{B0,A-1,LF,C2,DG,I"",Jtrue},"0,-2":{B0,A-2,LF,C0,DG,I"",Jtrue},"-3,3":{B-3,A3,LE,C6,DG,I"",Jtrue},"-4,3":{B-4,A3,LF,C4,DG,I"",Jtrue},"-4,2":{B-4,A2,LE,C0,DG,I"redtunnel",Jtrue},"-4,1":{B-4,A1,LF,C6,DG,I"",Jtrue},"-3,1":{B-3,A1,LE,C2,DG,I"",Jtrue},"-2,1":{B-2,A1,LF,C0,DG,I"",Jtrue},"-2,2":{B-2,A2,LE,C4,DG,I"increment",Jtrue},"-2,3":{B-2,A3,LF,C2,DG,I"",Jtrue},"-3,2":{B-3,A2,LY,C0,DG,I"","cargo":{"value":0,L4},Jtrue},"0,1":{B0,A1,LE,C0,DG,I"redtunnel",Jtrue},"1,1":{B1,A1,LS,C0,DH,I"alternate",Jtrue},"3,0":{B3,A0,LE,C4,DG,I"",Jtrue},"3,1":{B3,A1,LE,C4,DG,I"",Jtrue},"3,2":{B3,A2,LE,C4,DG,I"",Jtrue}},[{B3,A2,LM,C4,D"",Q40,R0.5,JK,O[],P[]}],[{B3,A1,LN,C4,D"",Q40,R0.5,"cargo":{"value":0,L4},JK,O[],P[]},{B3,A0,LN,C4,D"",Q40,R0.5,"cargo":{"value":0,L7},JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[7]+'-2'] = 85000;

	// function to reverse cargo order use twice
	trxLevels[trainerLevelNames[7]][3]='TRXv1.1:1.15~-1.2157894736842105~1.346416884548187~[{"-4,1":{B-4,A1,LE,C0,DG,I"pickdrop",Jtrue},"-4,0":{B-4,A0,LE,C0,DG,I"pickdrop",Jtrue},"-4,-1":{B-4,A-1,LE,C0,DG,I"pickdrop",Jtrue},"-4,-2":{B-4,A-2,LE,C0,DG,I"pickdrop",Jtrue},"-2,-2":{B-2,A-2,LE,C4,DG,I"pickdrop",Jtrue},"-2,-1":{B-2,A-1,LE,C4,DG,I"pickdrop",Jtrue},"-2,0":{B-2,A0,LE,C4,DG,I"pickdrop",Jtrue},"-2,1":{B-2,A1,LE,C4,DG,I"pickdrop",Jtrue},"-2,2":{B-2,A2,LF,C2,DG,I"",Jtrue},"-3,2":{B-3,A2,LE,C6,DG,I"greentunnel",Jtrue},"-4,2":{B-4,A2,LF,C4,DG,I"",Jtrue},"-3,1":{B-3,A1,LY,C0,DG,I"",Jtrue},"-3,0":{B-3,A0,LY,C0,DG,I"",Jtrue},"-3,-1":{B-3,A-1,LY,C0,DG,I"",Jtrue},"-3,-2":{B-3,A-2,LY,C0,DG,I"",Jtrue},"2,-4":{B2,A-4,LT,C2,DG,I"compareless",JK},"2,-5":{B2,A-5,LF,C6,DG,I"",Jtrue},"3,-5":{B3,A-5,LE,C2,DG,I"",Jtrue},"2,-3":{B2,A-3,LY,C0,DG,I"","cargo":{"value":2,L4},Jtrue},"3,-4":{B3,A-4,LE,C2,DG,I"",Jtrue},"4,-4":{B4,A-4,LS,C6,DH,IU,Jtrue},"5,-4":{B5,A-4,LE,C2,DG,I"",Jtrue},"6,-4":{B6,A-4,LF,C2,DG,I"",Jtrue},"6,-5":{B6,A-5,LE,C0,DG,I"",Jtrue},"6,-6":{B6,A-6,LF,C0,DG,I"",Jtrue},"5,-6":{B5,A-6,LE,C6,DG,I"",Jtrue},"4,-6":{B4,A-6,LF,C6,DG,I"",Jtrue},"4,-5":{B4,A-5,LE,C0,DG,I"home",Jtrue},"5,-5":{B5,A-5,LY,C0,DG,I"",Jtrue},"5,-1":{B5,A-1,LE,C6,DG,I"",Jtrue},"4,-1":{B4,A-1,LE,C6,DG,I"",Jtrue},"3,-1":{B3,A-1,LE,C6,DG,I"",Jtrue},"2,-1":{B2,A-1,LE,C6,DG,I"",Jtrue},"1,-1":{B1,A-1,LE,C6,DG,I"",Jtrue},"-4,-3":{B-4,A-3,LE,C0,DG,I"pickdrop",Jtrue},"-2,-3":{B-2,A-3,LE,C4,DG,I"pickdrop",Jtrue},"-1,0":{B-1,A0,LE,C4,DG,I"greentunnel",Jtrue},"3,1":{B3,A1,LY,C0,DG,I"","cargo":{"value":3,L0},Jtrue},"3,2":{B3,A2,LS,C2,DH,IX,Jtrue},"3,3":{B3,A3,LF,C4,DG,I"",Jtrue},"4,2":{B4,A2,LE,C2,DG,I"",Jtrue},"4,3":{B4,A3,L"trackwater",C0,DG,I"",Jtrue},"5,2":{B5,A2,LT,C6,DG,IU,Jtrue},"5,3":{B5,A3,LF,C2,DG,I"",Jtrue},"-3,-3":{B-3,A-3,LY,C0,DG,I"",Jtrue},"-4,-5":{B-4,A-5,LF,C6,DG,I"",Jtrue},"-3,-5":{B-3,A-5,LE,C2,DG,I"",Jtrue},"-2,-5":{B-2,A-5,LF,C0,DG,I"",Jtrue},"-2,-4":{B-2,A-4,LE,C0,DG,I"",Jtrue},"-4,-4":{B-4,A-4,LE,C0,DG,I"",Jtrue}},[{B1,A-1,LM,C6,D"",Q40,R0.5,JK,O[],P[]}],[{B2,A-1,LN,C6,D"",Q40,R0.5,"cargo":{"value":3,L4},JK,O[],P[]},{B3,A-1,LN,C6,D"",Q40,R0.5,"cargo":{"value":0,L4},JK,O[],P[]},{B4,A-1,LN,C6,D"",Q40,R0.5,"cargo":{"value":1,L0},JK,O[],P[]},{B5,A-1,LN,C6,D"",Q40,R0.5,"cargo":{"value":4,L0},JK,O[],P[]},{B4,A2,LN,C2,D"",Q0,R0.5,JK,O[],P[],"cargo":{"value":0,L7}}]]';
	bestTrackTime[trainerLevelNames[7]+'-3'] = 100000;

	// function +=2 used twice
	trxLevels[trainerLevelNames[7]][4]='TRXv1.1:0.5833333333333333~-0.7552631578947369~1.5~[{"-4,0":{B-4,A0,LE,C0,DG,I"supply",Jtrue},"-4,-1":{B-4,A-1,LE,C0,DG,I"add",Jtrue},"-4,-2":{B-4,A-2,LF,C6,DG,I"",Jtrue},"-3,0":{B-3,A0,LY,C0,DG,I"","cargo":{"value":2,L0},Jtrue},"-3,-1":{B-3,A-1,LY,C0,DG,I"",Jtrue},"-3,-2":{B-3,A-2,LE,C2,DG,I"",Jtrue},"-2,-2":{B-2,A-2,LF,C0,DG,I"",Jtrue},"-2,-1":{B-2,A-1,LE,C4,DG,I"",Jtrue},"-2,0":{B-2,A0,LE,C4,DG,I"",Jtrue},"-2,1":{B-2,A1,LF,C2,DG,I"",Jtrue},"-3,1":{B-3,A1,LE,C6,DG,I"greentunnel",Jtrue},"-4,1":{B-4,A1,LF,C4,DG,I"",Jtrue},"1,-4":{B1,A-4,LS,C2,DH,I"compareequal",Jtrue},"2,-4":{B2,A-4,LE,C2,DG,I"",Jtrue},"1,-5":{B1,A-5,LY,C0,DG,I"","cargo":{"value":7,L0},Jtrue},"3,-4":{B3,A-4,LE,C2,DG,I"",Jtrue},"4,-4":{B4,A-4,LF,C0,DG,I"",Jtrue},"4,-3":{B4,A-3,LT,C0,DG,IU,Jtrue},"4,-2":{B4,A-2,LE,C4,DG,I"home",Jtrue},"4,-1":{B4,A-1,LF,C2,DG,I"",Jtrue},"3,-1":{B3,A-1,LE,C6,DG,I"",Jtrue},"2,-1":{B2,A-1,LF,C4,DG,I"",Jtrue},"2,-2":{B2,A-2,LE,C0,DG,I"",Jtrue},"2,-3":{B2,A-3,LF,C6,DG,I"",Jtrue},"3,-3":{B3,A-3,LE,C2,DG,I"",Jtrue},"3,-2":{B3,A-2,LY,C0,DG,I"",Jtrue},"3,3":{B3,A3,LE,C6,DG,I"",JK},"2,3":{B2,A3,LE,C6,DG,I"",JK},"0,2":{B0,A2,LE,C6,DG,I"add",Jtrue},"0,1":{B0,A1,LY,C0,DG,I"",Jtrue},"-3,3":{B-3,A3,LE,C6,DG,I"greentunnel",Jtrue},"4,3":{B4,A3,LE,C2,DG,I"",JK},"2,0":{B2,A0,LE,C2,DG,I"",JK},"3,0":{B3,A0,LE,C2,DG,I"",JK},"4,0":{B4,A0,LE,C2,DG,I"",JK}},[{B2,A3,LM,C6,D"",Q40,R0.5,JK,O[],P[]},{B2,A0,LM,C6,D"",Q40,R0.5,JK,O[],P[]}],[{B2,A-4,LN,C2,D"",Q0,R0.5,"cargo":{"value":0,L7},JK,O[],P[]},{B3,A3,LN,C6,D"",Q40,R0.5,"cargo":{"value":1,L0},JK,O[],P[]},{B4,A3,LN,C6,D"",Q40,R0.5,JK,O[],P[]},{B3,A0,LN,C6,D"",Q40,R0.5,"cargo":{"value":2,L0},JK,O[],P[]},{B4,A0,LN,C6,D"",Q40,R0.5,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[7]+'-4'] = 35000;

	// 	use sequential number generator once then second time with bear
	trxLevels[trainerLevelNames[7]][5]='TRXv1.1:2.25~0.31315789473684214~0.9849440066876232~[{"6,-4":{B6,A-4,LE,C0,DG,I"",Jtrue},"6,-3":{B6,A-3,LF,C4,DG,I"",Jtrue},"7,-3":{B7,A-3,LE,C6,DG,I"",Jtrue},"8,-3":{B8,A-3,LF,C2,DG,I"",Jtrue},"8,-4":{B8,A-4,LE,C4,DG,I"home",Jtrue},"7,-5":{B7,A-5,LE,C2,DG,I"",Jtrue},"8,-5":{B8,A-5,LF,C0,DG,I"",Jtrue},"6,-5":{B6,A-5,LF,C6,DG,I"",Jtrue},"7,-4":{B7,A-4,LY,C0,DG,I"",Jtrue},"2,-4":{B2,A-4,LE,C4,DG,I"catapult",Jtrue},"1,-4":{B1,A-4,LY,C0,DG,I"",Jtrue},"-2,-5":{B-2,A-5,LE,C0,DG,I"bluetunnel",JK},"-2,-6":{B-2,A-6,LF,C0,DG,I"",JK},"-3,-6":{B-3,A-6,LF,C6,DG,I"",JK},"-3,-5":{B-3,A-5,LE,C4,DG,I"pickdrop",JK},"-3,-4":{B-3,A-4,LF,C4,DG,I"",JK},"-2,-4":{B-2,A-4,LF,C2,DG,I"",JK},"-4,-5":{B-4,A-5,LY,C0,DG,I"","cargo":{"value":0,L7},JK},"-4,-6":{B-4,A-6,L"trackwater",C0,DG,I"",Jtrue},"-5,-6":{B-5,A-6,L"trackwater",C0,DG,I"",Jtrue},"-5,-5":{B-5,A-5,L"trackwater",C0,DG,I"",Jtrue},"-5,-4":{B-5,A-4,L"trackwater",C0,DG,I"",Jtrue},"-4,-4":{B-4,A-4,L"trackwater",C0,DG,I"",Jtrue},"-4,-3":{B-4,A-3,L"trackwater",C0,DG,I"",Jtrue},"-3,-3":{B-3,A-3,L"trackwater",C0,DG,I"",Jtrue},"-2,-3":{B-2,A-3,L"trackwater",C0,DG,I"",Jtrue},"-1,-3":{B-1,A-3,L"trackwater",C0,DG,I"",Jtrue},"-1,-4":{B-1,A-4,L"trackwater",C0,DG,I"",Jtrue},"-1,-5":{B-1,A-5,L"trackwater",C0,DG,I"",Jtrue},"-1,-6":{B-1,A-6,L"trackwater",C0,DG,I"",Jtrue},"-1,-7":{B-1,A-7,L"trackwater",C0,DG,I"",Jtrue},"-2,-7":{B-2,A-7,L"trackwater",C0,DG,I"",Jtrue},"-3,-7":{B-3,A-7,L"trackwater",C0,DG,I"",Jtrue},"-4,-7":{B-4,A-7,L"trackwater",C0,DG,I"",Jtrue},"8,-2":{B8,A-2,L"trackwater",C0,DG,I"",Jtrue},"7,-2":{B7,A-2,L"trackwater",C0,DG,I"",Jtrue},"6,-2":{B6,A-2,L"trackwater",C0,DG,I"",Jtrue},"5,-2":{B5,A-2,L"trackwater",C0,DG,I"",Jtrue},"5,-3":{B5,A-3,L"trackwater",C0,DG,I"",Jtrue},"5,-4":{B5,A-4,L"trackwater",C0,DG,I"",JK},"5,-5":{B5,A-5,L"trackwater",C0,DG,I"",Jtrue},"5,-6":{B5,A-6,L"trackwater",C0,DG,I"",Jtrue},"6,-6":{B6,A-6,L"trackwater",C0,DG,I"",Jtrue},"7,-6":{B7,A-6,L"trackwater",C0,DG,I"",Jtrue},"8,-6":{B8,A-6,L"trackwater",C0,DG,I"",Jtrue},"9,-6":{B9,A-6,L"trackwater",C0,DG,I"",Jtrue},"9,-5":{B9,A-5,L"trackwater",C0,DG,I"",Jtrue},"9,-4":{B9,A-4,L"trackwater",C0,DG,I"",Jtrue},"9,-3":{B9,A-3,L"trackwater",C0,DG,I"",Jtrue},"9,-2":{B9,A-2,L"trackwater",C0,DG,I"",Jtrue},"1,0":{B1,A0,LE,C0,DG,I"greentunnel",Jtrue},"1,3":{B1,A3,LE,C0,DG,I"",Jtrue},"1,4":{B1,A4,LE,C0,DG,I"",Jtrue},"1,5":{B1,A5,LE,C0,DG,I"",Jtrue},"2,0":{B2,A0,LE,C0,DG,I"bluetunnel",Jtrue},"3,0":{B3,A0,LE,C0,DG,I"greentunnel",Jtrue},"3,3":{B3,A3,LE,C0,DG,I"",Jtrue},"3,4":{B3,A4,LE,C0,DG,I"",Jtrue},"3,5":{B3,A5,LE,C0,DG,I"",Jtrue},"-5,-2":{B-5,A-2,LF,C6,DG,I"",Jtrue},"-5,-1":{B-5,A-1,LE,C4,DG,I"",Jtrue},"-5,0":{B-5,A0,LF,C4,DG,I"",Jtrue},"-4,-2":{B-4,A-2,LF,C0,DG,I"",Jtrue},"-4,-1":{B-4,A-1,LE,C0,DG,I"increment",Jtrue},"-4,0":{B-4,A0,LS,C6,DG,IU,Jtrue},"-3,-1":{B-3,A-1,LY,C0,DG,I"","cargo":{"value":2,L0},Jtrue},"-3,0":{B-3,A0,LE,C6,DG,I"pickdrop",Jtrue},"-2,-2":{B-2,A-2,LF,C6,DG,I"",Jtrue},"-2,-1":{B-2,A-1,LE,C4,DG,I"supply",Jtrue},"-2,0":{B-2,A0,LT,C2,DG,IU,Jtrue},"-1,-2":{B-1,A-2,LF,C0,DG,I"",Jtrue},"-1,-1":{B-1,A-1,LE,C4,DG,I"greentunnel",Jtrue},"-1,0":{B-1,A0,LF,C2,DG,I"",Jtrue}},[{B6,A-4,LM,C0,D"",Q40,R0.5,JK,O[],P[]},{B1,A3,LM,C0,D"",Q40,R0.5,JK,O[],P[]},{B3,A3,LM,C0,D"",Q40,R0.5,JK,O[],P[]}],[{B6,A-3,LN,C6,D"",Q40,R0.5,JK,O[],P[]},{B1,A4,LN,C0,D"",Q40,R0.5,JK,O[],P[]},{B1,A5,LN,C0,D"",Q40,R0.5,JK,O[],P[]},{B3,A4,LN,C0,D"",Q40,R0.5,JK,O[],P[]},{B3,A5,LN,C0,D"",Q40,R0.5,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[7]+'-5'] = 90000;

	// use delete all function three times to make room on cars to load numbers to unlock path to home
	trxLevels[trainerLevelNames[7]][6]='TRXv1.1:0~0~0.8908636666614169~[{"3,0":{B3,A0,LS,C4,DH,I"lazy",Jtrue},"3,1":{B3,A1,LS,C4,DG,IU,Jtrue},"2,1":{B2,A1,LS,C2,DH,I"compareequal",Jtrue},"2,0":{B2,A0,LY,C0,DG,I"","cargo":{"value":1,L4},Jtrue},"2,3":{B2,A3,LY,C0,DG,I"","cargo":{"value":3,L4},Jtrue},"2,4":{B2,A4,LS,C2,DH,I"compareequal",Jtrue},"3,3":{B3,A3,LS,C4,DH,I"lazy",Jtrue},"3,4":{B3,A4,LS,C4,DG,IU,Jtrue},"3,2":{B3,A2,LS,C0,DH,IU,Jtrue},"4,2":{B4,A2,LT,C6,DG,IU,Jtrue},"5,2":{B5,A2,LF,C0,DG,I"",Jtrue},"5,3":{B5,A3,LF,C2,DG,I"",Jtrue},"4,3":{B4,A3,LF,C4,DG,I"",Jtrue},"2,2":{B2,A2,L"trackwater",C0,DG,I"",Jtrue},"2,5":{B2,A5,L"trackwater",C0,DG,I"",Jtrue},"3,-1":{B3,A-1,LS,C0,DH,IU,Jtrue},"4,-1":{B4,A-1,LT,C6,DG,IU,Jtrue},"5,-1":{B5,A-1,LF,C0,DG,I"",Jtrue},"5,0":{B5,A0,LF,C2,DG,I"",Jtrue},"4,0":{B4,A0,LF,C4,DG,I"",Jtrue},"3,5":{B3,A5,LS,C0,DH,IU,Jtrue},"3,6":{B3,A6,LE,C0,DG,I"home",Jtrue},"3,7":{B3,A7,LF,C4,DG,I"",Jtrue},"4,7":{B4,A7,LE,C2,DG,I"",Jtrue},"5,7":{B5,A7,LF,C2,DG,I"",Jtrue},"5,6":{B5,A6,LE,C0,DG,I"",Jtrue},"5,5":{B5,A5,LF,C0,DG,I"",Jtrue},"4,5":{B4,A5,LE,C6,DG,I"",Jtrue},"4,6":{B4,A6,LY,C0,DG,I"",Jtrue},"-7,-7":{B-7,A-7,LE,C2,DG,I"",Jtrue},"-6,-7":{B-6,A-7,LE,C2,DG,I"",Jtrue},"-6,-6":{B-6,A-6,LE,C6,DG,I"",Jtrue},"-7,-6":{B-7,A-6,LE,C6,DG,I"",Jtrue},"-6,-5":{B-6,A-5,LE,C6,DG,I"",Jtrue},"-7,-5":{B-7,A-5,LE,C6,DG,I"",Jtrue},"-5,-5":{B-5,A-5,LE,C2,DG,I"",Jtrue,"uniqueid":164},"-2,-5":{B-2,A-5,LE,C2,DG,I"greentunnel",Jtrue},"0,-1":{B0,A-1,LE,C0,DG,I"supply",Jtrue},"-5,-6":{B-5,A-6,LE,C2,DG,I"",Jtrue,"uniqueid":162},"-5,-7":{B-5,A-7,LE,C2,DG,I"",Jtrue,"uniqueid":160},"-1,-1":{B-1,A-1,LE,C4,DG,I"greentunnel",Jtrue},"-1,0":{B-1,A0,LE,C4,DG,I"supply",Jtrue},"-1,-4":{B-1,A-4,LE,C4,DG,I"supply",Jtrue},"-2,-4":{B-2,A-4,LY,C0,DG,I"","cargo":{"value":0,L7},Jtrue},"2,-6":{B2,A-6,LE,C0,DG,I"greentunnel",Jtrue},"1,-1":{B1,A-1,LY,C0,DG,I"","cargo":{"value":3,L4},Jtrue},"-2,0":{B-2,A0,LY,C0,DG,I"","cargo":{"value":1,L4},Jtrue},"-7,2":{B-7,A2,LY,C0,DG,I"","cargo":{"value":0,L0},Jtrue},"-7,3":{B-7,A3,LY,C0,DG,I"","cargo":{"value":0,L1},Jtrue},"-7,4":{B-7,A4,LY,C0,DG,I"","cargo":{"value":0,L2},Jtrue},"-6,0":{B-6,A0,LF,C6,DG,I"",Jtrue},"-6,1":{B-6,A1,LE,C0,DG,I"dump",Jtrue},"-6,2":{B-6,A2,LT,C4,DH,IX,Jtrue},"-6,3":{B-6,A3,LT,C4,DH,IX,Jtrue},"-6,4":{B-6,A4,LT,C4,DH,IX,Jtrue},"-6,5":{B-6,A5,LE,C4,DG,I"",Jtrue},"-6,6":{B-6,A6,LF,C4,DG,I"",Jtrue},"-5,1":{B-5,A1,LE,C4,DG,I"",Jtrue},"-5,2":{B-5,A2,LS,C4,DH,IU,Jtrue},"-5,3":{B-5,A3,LS,C4,DH,IU,Jtrue},"-5,4":{B-5,A4,LS,C4,DH,IU,Jtrue},"-5,5":{B-5,A5,LE,C0,DG,I"greentunnel",Jtrue},"-5,6":{B-5,A6,LF,C2,DG,I"",Jtrue},"-5,0":{B-5,A0,LF,C0,DG,I"",Jtrue}},[{B-5,A-7,LM,C2,D"",Q80,R0.5000000000000006,JK,O[],P[],"uniqueid":159},{B-5,A-6,LM,C2,D"",Q80,R0.5000000000000006,JK,O[],P[],"uniqueid":161},{B-5,A-5,LM,C2,D"",Q80,R0.5000000000000006,JK,O[],P[],"uniqueid":163}],[{B-6,A-7,LN,C2,D"",Q80,R0.5000000000000006,"cargo":{"value":14,L2},JK,O[],P[]},{B-6,A-6,LN,C2,D"",Q80,R0.5000000000000006,"cargo":{"value":17,L1},JK,O[],P[]},{B-6,A-5,LN,C2,D"",Q80,R0.5000000000000006,"cargo":{"value":1,L0},JK,O[],P[]},{B-7,A-5,LN,C2,D"",Q80,R0.5000000000000006,"cargo":{"value":1,L1},JK,O[],P[]},{B-7,A-6,LN,C2,D"",Q80,R0.5000000000000006,"cargo":{"value":2,L0},JK,O[],P[]},{B-7,A-7,LN,C2,D"",Q80,R0.5000000000000006,"cargo":{"value":5,L1},JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[7]+'-6'] = 70000;

	// push bear around square with slingshot
	trxLevels[trainerLevelNames[7]][7]='TRXv1.1:0~0~0.8908636666614169~[{"-5,3":{B-5,A3,LE,C4,DG,I"slingshot",Jtrue},"-5,2":{B-5,A2,LF,C0,DG,I"",Jtrue},"-6,2":{B-6,A2,LE,C2,DG,I"",Jtrue},"-7,2":{B-7,A2,LF,C6,DG,I"",Jtrue,"uniqueid":106},"-7,3":{B-7,A3,LE,C0,DG,I"supply",Jtrue,"uniqueid":113},"-7,4":{B-7,A4,LT,C4,DH,IU,Jtrue},"-6,4":{B-6,A4,LE,C6,DG,I"",Jtrue},"-5,4":{B-5,A4,LF,C2,DG,I"",Jtrue},"-6,3":{B-6,A3,LY,C0,DG,I"","cargo":{"value":6,L3},Jtrue},"5,2":{B5,A2,LE,C2,DG,I"slingshot",Jtrue},"4,-5":{B4,A-5,LE,C0,DG,I"slingshot",Jtrue},"-5,-5":{B-5,A-5,LE,C4,DG,I"none",Jtrue},"-5,-6":{B-5,A-6,LF,C0,DG,I"",Jtrue},"-6,-6":{B-6,A-6,LE,C2,DG,I"home",Jtrue},"-5,-4":{B-5,A-4,LF,C2,DG,I"",Jtrue},"-7,-4":{B-7,A-4,LF,C4,DG,I"",Jtrue},"-7,-5":{B-7,A-5,LE,C0,DG,I"none",Jtrue,"uniqueid":115},"-7,-6":{B-7,A-6,LS,C0,DG,IU,Jtrue},"-6,-5":{B-6,A-5,LY,C0,DG,I"",Jtrue},"-4,3":{B-4,A3,L"trackblank",C0,DG,I"","cargo":{"value":0,L7},Jtrue},"-6,-4":{B-6,A-4,LE,C2,DG,I"dump",Jtrue},"-2,6":{B-2,A6,LE,C2,DG,I"",Jtrue},"-1,6":{B-1,A6,LE,C2,DG,I"",Jtrue},"-1,-7":{B-1,A-7,LE,C2,DG,I"",Jtrue},"0,-7":{B0,A-7,LE,C2,DG,I"",Jtrue},"1,-7":{B1,A-7,LE,C2,DG,I"",Jtrue},"2,-7":{B2,A-7,LE,C2,DG,I"",Jtrue},"-2,-7":{B-2,A-7,LE,C6,DG,I"",Jtrue},"0,6":{B0,A6,LE,C2,DG,I"",Jtrue},"1,6":{B1,A6,LE,C2,DG,I"",Jtrue},"2,6":{B2,A6,LE,C2,DG,I"",Jtrue}},[{B-2,A-7,LM,C6,D"",Q100,R0.5,JK,O[],P[]},{B2,A-7,LM,C2,D"",Q100,R0.5,JK,O[],P[]},{B-2,A6,LM,C6,D"",Q100,R0.5,JK,O[],P[]},{B2,A6,LM,C2,D"",Q100,R0.5,JK,O[],P[]}],[{B1,A-7,LN,C2,D"",Q100,R0.5,JK,O[],P[]},{B-1,A-7,LN,C6,D"",Q100,R0.5,JK,O[],P[]},{B1,A6,LN,C2,D"",Q100,R0.5,JK,O[],P[]},{B-1,A6,LN,C6,D"",Q100,R0.5,JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[7]+'-7'] = 74000;

	// grid maze
	trxLevels[trainerLevelNames[7]][8]='TRXv1.1:1.6833333333333331~0.8289473684210527~0.7895515897567313~[{"-4,-2":{B-4,A-2,LW,C4,DG,I"",Jtrue},"-4,-1":{B-4,A-1,LW,C4,DG,I"",Jtrue},"-3,-2":{B-3,A-2,LW,C4,DG,I"",Jtrue},"-3,-1":{B-3,A-1,LW,C4,DG,I"",Jtrue},"-2,-1":{B-2,A-1,LW,C0,DG,I"",Jtrue},"0,-2":{B0,A-2,LW,C0,DG,I"",Jtrue},"0,-1":{B0,A-1,LW,C0,DG,I"",Jtrue},"1,-2":{B1,A-2,LW,C4,DG,I"",Jtrue},"2,-1":{B2,A-1,LW,C0,DG,I"",Jtrue},"3,-2":{B3,A-2,LW,C4,DG,I"",Jtrue},"3,-1":{B3,A-1,LW,C4,DG,I"",Jtrue},"4,-2":{B4,A-2,LW,C0,DG,I"",Jtrue},"4,-1":{B4,A-1,LW,C0,DG,I"",Jtrue},"-4,0":{B-4,A0,LW,C4,DG,I"",Jtrue},"-4,1":{B-4,A1,LW,C4,DG,I"",Jtrue},"-4,2":{B-4,A2,LW,C4,DG,I"",Jtrue},"-3,0":{B-3,A0,LW,C0,DG,I"",Jtrue},"-3,1":{B-3,A1,LW,C4,DG,I"",Jtrue},"-3,2":{B-3,A2,LW,C4,DG,I"",Jtrue},"-2,0":{B-2,A0,LW,C0,DG,I"",Jtrue},"-2,1":{B-2,A1,LW,C0,DG,I"",Jtrue},"-1,2":{B-1,A2,LW,C4,DG,I"",Jtrue},"0,1":{B0,A1,LW,C0,DG,I"",Jtrue},"0,2":{B0,A2,LW,C0,DG,I"",Jtrue},"1,0":{B1,A0,LW,C4,DG,I"",Jtrue},"1,2":{B1,A2,LW,C6,DG,I"",Jtrue},"2,0":{B2,A0,LW,C0,DG,I"",Jtrue},"2,1":{B2,A1,LW,C0,DG,I"",Jtrue},"3,0":{B3,A0,LW,C4,DG,I"",Jtrue},"3,1":{B3,A1,LW,C4,DG,I"",Jtrue},"3,2":{B3,A2,LW,C4,DG,I"",Jtrue},"4,0":{B4,A0,LW,C0,DG,I"",Jtrue},"4,1":{B4,A1,LW,C0,DG,I"",Jtrue},"4,2":{B4,A2,LW,C0,DG,I"",Jtrue},"-4,3":{B-4,A3,LW,C4,DG,I"",Jtrue},"-4,4":{B-4,A4,LW,C4,DG,I"",Jtrue},"-3,4":{B-3,A4,LW,C4,DG,I"",Jtrue},"-2,3":{B-2,A3,LW,C0,DG,I"",Jtrue},"-2,4":{B-2,A4,LW,C0,DG,I"",Jtrue},"-1,3":{B-1,A3,LW,C4,DG,I"",Jtrue},"-1,4":{B-1,A4,LW,C4,DG,I"",Jtrue},"0,3":{B0,A3,LW,C0,DG,I"",Jtrue},"0,4":{B0,A4,LW,C0,DG,I"",Jtrue},"1,3":{B1,A3,LW,C4,DG,I"",Jtrue},"1,4":{B1,A4,LW,C4,DG,I"",Jtrue},"2,3":{B2,A3,LW,C0,DG,I"",Jtrue},"2,4":{B2,A4,LW,C0,DG,I"",Jtrue},"3,4":{B3,A4,LW,C4,DG,I"",Jtrue},"4,3":{B4,A3,LW,C0,DG,I"",Jtrue},"4,4":{B4,A4,LW,C0,DG,I"",Jtrue},"-4,-4":{B-4,A-4,LW,C4,DG,I"",Jtrue},"-4,-3":{B-4,A-3,LW,C4,DG,I"",Jtrue},"-3,-4":{B-3,A-4,LW,C4,DG,I"",Jtrue},"-2,-4":{B-2,A-4,LW,C0,DG,I"",Jtrue},"-2,-3":{B-2,A-3,LW,C0,DG,I"",Jtrue},"-1,-4":{B-1,A-4,LW,C4,DG,I"",Jtrue},"-1,-3":{B-1,A-3,LW,C4,DG,I"",Jtrue},"0,-4":{B0,A-4,LW,C0,DG,I"",Jtrue},"0,-3":{B0,A-3,LW,C0,DG,I"",Jtrue},"1,-4":{B1,A-4,LW,C4,DG,I"",Jtrue},"1,-3":{B1,A-3,LW,C4,DG,I"",Jtrue},"2,-4":{B2,A-4,LW,C0,DG,I"",Jtrue},"2,-3":{B2,A-3,LW,C2,DG,I"",Jtrue},"3,-4":{B3,A-4,LW,C4,DG,I"",Jtrue},"4,-4":{B4,A-4,LW,C0,DG,I"",Jtrue},"4,-3":{B4,A-3,LW,C0,DG,I"",Jtrue},"-4,-5":{B-4,A-5,LF,C6,DG,I"",Jtrue},"-3,-5":{B-3,A-5,LV,C0,DG,IU,Jtrue},"-2,-5":{B-2,A-5,LV,C0,DG,IU,Jtrue},"-1,-5":{B-1,A-5,LV,C0,DG,IU,Jtrue},"0,-5":{B0,A-5,LV,C0,DG,IU,Jtrue},"1,-5":{B1,A-5,LV,C0,DG,IU,Jtrue},"2,-5":{B2,A-5,LV,C0,DG,IU,Jtrue},"3,-5":{B3,A-5,LV,C0,DG,IU,Jtrue},"4,-5":{B4,A-5,LF,C0,DG,I"",Jtrue},"-4,5":{B-4,A5,LF,C4,DG,I"",Jtrue},"-3,5":{B-3,A5,LV,C4,DH,IU,Jtrue},"-2,5":{B-2,A5,LV,C4,DH,IU,Jtrue},"-1,5":{B-1,A5,LV,C4,DH,IU,Jtrue},"0,5":{B0,A5,LV,C4,DH,IU,Jtrue},"1,5":{B1,A5,LV,C4,DH,IU,Jtrue},"2,5":{B2,A5,LV,C4,DH,IU,Jtrue},"3,5":{B3,A5,LV,C4,DH,IU,Jtrue},"4,5":{B4,A5,LF,C2,DG,I"",Jtrue},"6,-4":{B6,A-4,LE,C4,DG,I"",Jtrue},"5,-4":{B5,A-4,LS,C4,DG,IU,Jtrue},"5,-5":{B5,A-5,LF,C6,DG,I"",Jtrue},"6,-5":{B6,A-5,LF,C0,DG,I"",Jtrue},"5,-3":{B5,A-3,LS,C4,DH,IU,Jtrue},"5,-2":{B5,A-2,LS,C4,DG,IU,Jtrue},"5,-1":{B5,A-1,LS,C4,DG,IU,Jtrue},"5,0":{B5,A0,LS,C4,DG,IU,Jtrue},"5,1":{B5,A1,LS,C4,DH,IU,Jtrue},"5,2":{B5,A2,LS,C4,DH,IU,Jtrue},"5,3":{B5,A3,LS,C4,DG,IU,Jtrue},"5,4":{B5,A4,LF,C2,DG,I"",Jtrue},"-5,-3":{B-5,A-3,LE,C6,DG,I"",Jtrue},"-1,-2":{B-1,A-2,LW,C4,DG,I"",Jtrue},"-1,0":{B-1,A0,LW,C4,DG,I"",Jtrue},"6,-3":{B6,A-3,LS,C0,DG,IU,Jtrue},"6,-2":{B6,A-2,LE,C4,DG,I"",Jtrue},"6,-1":{B6,A-1,LE,C4,DG,I"",Jtrue},"6,0":{B6,A0,LE,C4,DG,I"",Jtrue},"6,1":{B6,A1,LE,C4,DG,I"",Jtrue},"6,2":{B6,A2,LE,C4,DG,I"",Jtrue},"6,3":{B6,A3,LE,C4,DG,I"",Jtrue},"6,4":{B6,A4,LF,C4,DG,I"",Jtrue},"7,-3":{B7,A-3,LE,C6,DG,I"none",Jtrue},"7,-1":{B7,A-1,LY,C0,DG,I"",Jtrue},"7,0":{B7,A0,LY,C0,DG,I"","cargo":{"value":4,L0},Jtrue},"7,1":{B7,A1,LY,C0,DG,I"","cargo":{"value":16,L1},Jtrue},"7,2":{B7,A2,LY,C0,DG,I"","cargo":{"value":13,L2},Jtrue},"7,3":{B7,A3,LY,C0,DG,I"","cargo":{"value":9,L3},Jtrue},"7,4":{B7,A4,LE,C2,DG,I"",Jtrue},"8,-3":{B8,A-3,LF,C0,DG,I"",Jtrue},"8,-2":{B8,A-2,LT,C4,DG,IU,Jtrue},"8,-1":{B8,A-1,LE,C4,DG,I"home",Jtrue},"8,0":{B8,A0,LS,C0,DH,I"compareequal",Jtrue},"8,1":{B8,A1,LS,C0,DH,I"compareequal",Jtrue},"8,2":{B8,A2,LS,C0,DH,I"compareequal",Jtrue},"8,3":{B8,A3,LS,C0,DH,I"compareequal",Jtrue},"8,4":{B8,A4,LF,C2,DG,I"",Jtrue},"9,-2":{B9,A-2,LF,C0,DG,I"",Jtrue},"9,-1":{B9,A-1,LE,C0,DG,I"",Jtrue},"9,0":{B9,A0,LS,C4,DG,IU,Jtrue},"9,1":{B9,A1,LS,C4,DG,IU,Jtrue},"9,2":{B9,A2,LS,C4,DG,IU,Jtrue},"9,3":{B9,A3,LF,C2,DG,I"",Jtrue},"-5,-2":{B-5,A-2,LF,C6,DG,I"",Jtrue},"-5,-1":{B-5,A-1,LV,C6,DG,IU,Jtrue},"-5,4":{B-5,A4,LF,C4,DG,I"",Jtrue},"-5,3":{B-5,A3,LV,C6,DG,IU,Jtrue},"-5,2":{B-5,A2,LV,C6,DG,IU,Jtrue},"-5,1":{B-5,A1,LV,C6,DG,IU,Jtrue},"-5,0":{B-5,A0,LV,C6,DG,IU,Jtrue},"-6,-3":{B-6,A-3,LE,C6,DG,I"",Jtrue}},[{B-5,A-3,LM,C2,D"",Q80,R0.5,JK,O[],P[]}],[{B1,A-2,LN,C6,D"",Q0,R0.5,"cargo":{"value":16,L1},JK,O[],P[]},{B-2,A0,LN,C4,D"",Q0,R0.5,"cargo":{"value":4,L0},JK,O[],P[]},{B0,A3,LN,C2,D"",Q0,R0.5,"cargo":{"value":13,L2},JK,O[],P[]},{B-6,A-3,LN,C2,D"",Q80,R0.5,"cargo":{"value":0,L7},JK,O[],P[]},{B2,A1,LN,C4,D"",Q0,R0.5,"cargo":{"value":9,L3},JK,O[],P[]},{B0,A-3,LN,C2,D"",Q0,R0.5,"cargo":{"value":0,L2},JK,O[],P[]},{B-1,A-3,LN,C4,D"",Q0,R0.5,JK,O[],P[]},{B-3,A0,LN,C4,D"",Q0,R0.5,"cargo":{"value":4,L3},JK,O[],P[]},{B-1,A4,LN,C2,D"",Q0,R0.5,"cargo":{"value":6,L3},JK,O[],P[]},{B4,A3,LN,C0,D"",Q0,R0.5,"cargo":{"value":10,L2},JK,O[],P[]},{B4,A-1,LN,C6,D"",Q0,R0.5,"cargo":{"value":5,L1},JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[7]+'-8'] = 45000;

	// graph y=2x+1. Just for inspiration, trainer only has to connect one track
	trxLevels[trainerLevelNames[7]][9]='TRXv1.1:2.216666666666665~5.06578947368421~0.7343820811892913~[{"-4,-2":{B-4,A-2,LF,C6,DG,I"",Jtrue},"-3,-2":{B-3,A-2,LE,C2,DG,I"",Jtrue},"-2,-2":{B-2,A-2,LF,C0,DG,I"",Jtrue},"-4,-1":{B-4,A-1,LE,C0,DG,I"",Jtrue},"-4,0":{B-4,A0,LE,C0,DG,I"",Jtrue},"-4,1":{B-4,A1,LE,C0,DG,I"",Jtrue},"-4,2":{B-4,A2,LE,C0,DG,I"",Jtrue},"-3,-1":{B-3,A-1,LY,C0,DG,I"",Jtrue},"-3,0":{B-3,A0,LY,C0,DG,I"","cargo":{"value":1,L0},Jtrue},"-3,1":{B-3,A1,LY,C0,DG,I"",Jtrue},"-3,2":{B-3,A2,LY,C0,DG,I"","cargo":{"value":2,L0},Jtrue},"-2,-1":{B-2,A-1,LE,C4,DG,I"add",Jtrue},"-2,0":{B-2,A0,LE,C4,DG,I"supply",Jtrue},"-2,1":{B-2,A1,LE,C4,DG,I"multiply",Jtrue},"-2,2":{B-2,A2,LE,C4,DG,I"supply",Jtrue},"-2,3":{B-2,A3,LS,C0,DH,I"alternate",Jtrue},"-4,3":{B-4,A3,LE,C4,DG,I"",Jtrue},"-4,4":{B-4,A4,LE,C0,DG,I"pickdrop",Jtrue},"-4,5":{B-4,A5,LF,C4,DG,I"",Jtrue},"-3,4":{B-3,A4,LY,C0,DG,I"",Jtrue},"-3,5":{B-3,A5,LE,C2,DG,I"redtunnel",Jtrue},"-2,4":{B-2,A4,LE,C4,DG,I"supply",Jtrue},"-2,5":{B-2,A5,LV,C4,DH,IU,Jtrue},"-1,3":{B-1,A3,LF,C0,DG,I"",Jtrue},"-5,5":{B-5,A5,LE,C0,DG,I"",Jtrue},"-5,4":{B-5,A4,LE,C0,DG,I"",Jtrue},"-5,3":{B-5,A3,LE,C0,DG,I"",Jtrue},"-5,2":{B-5,A2,LE,C0,DG,I"",Jtrue},"-5,1":{B-5,A1,LE,C0,DG,I"",Jtrue},"-5,0":{B-5,A0,LE,C0,DG,I"bluetunnel",Jtrue},"-5,-1":{B-5,A-1,LE,C0,DG,I"",Jtrue},"-5,-2":{B-5,A-2,LF,C0,DG,I"",Jtrue},"-6,-2":{B-6,A-2,LF,C6,DG,I"",Jtrue},"-6,-1":{B-6,A-1,LE,C4,DG,I"",Jtrue},"-6,0":{B-6,A0,LE,C4,DG,I"redtunnel",Jtrue},"-6,1":{B-6,A1,LE,C4,DG,I"",Jtrue},"-6,2":{B-6,A2,LE,C4,DG,I"",Jtrue},"-6,3":{B-6,A3,LE,C4,DG,I"",Jtrue},"-6,4":{B-6,A4,LE,C4,DG,I"none",Jtrue},"-6,5":{B-6,A5,LE,C4,DG,I"greentunnel",Jtrue},"-1,4":{B-1,A4,LE,C4,DG,I"",Jtrue},"-1,5":{B-1,A5,LF,C2,DG,I"",Jtrue},"-6,8":{B-6,A8,LF,C6,DG,I"",Jtrue},"-6,9":{B-6,A9,LE,C0,DG,I"",Jtrue},"-6,10":{B-6,A10,LE,C0,DG,I"",Jtrue},"-6,11":{B-6,A11,LE,C0,DG,I"",Jtrue},"-6,12":{B-6,A12,LF,C4,DG,I"",Jtrue},"-5,8":{B-5,A8,LE,C6,DG,I"",Jtrue},"-5,9":{B-5,A9,LF,C6,DG,I"",Jtrue},"-5,10":{B-5,A10,LE,C4,DG,I"",Jtrue},"-5,11":{B-5,A11,LF,C4,DG,I"",Jtrue},"-5,12":{B-5,A12,LE,C6,DG,I"",Jtrue},"-4,6":{B-4,A6,LF,C6,DG,I"",Jtrue},"-4,7":{B-4,A7,LE,C4,DG,I"",Jtrue},"-4,8":{B-4,A8,LF,C2,DG,I"",Jtrue},"-4,9":{B-4,A9,LF,C0,DG,I"",Jtrue},"-4,10":{B-4,A10,LE,C0,DG,I"increment",Jtrue},"-4,11":{B-4,A11,LS,C6,DG,IU,Jtrue},"-4,12":{B-4,A12,LE,C6,DG,I"",Jtrue},"-3,6":{B-3,A6,LE,C6,DG,I"",Jtrue},"-3,7":{B-3,A7,LY,C0,DG,I"","cargo":{"value":1,L5},Jtrue},"-3,8":{B-3,A8,LY,C0,DG,I"","cargo":{"value":4,L3},Jtrue},"-3,9":{B-3,A9,LY,C0,DG,I"","cargo":{"value":1,L5},Jtrue},"-3,10":{B-3,A10,LY,C0,DG,I"","cargo":{"value":9,L0},Jtrue},"-3,11":{B-3,A11,LE,C6,DG,I"pickdrop",Jtrue},"-3,12":{B-3,A12,LE,C2,DG,I"bluetunnel",Jtrue},"-2,6":{B-2,A6,LF,C0,DG,I"",Jtrue},"-2,7":{B-2,A7,LE,C4,DG,I"dump",Jtrue},"-2,8":{B-2,A8,LE,C4,DG,I"supply",Jtrue},"-2,9":{B-2,A9,LE,C4,DG,I"supply",Jtrue},"-2,10":{B-2,A10,LE,C4,DG,I"supply",Jtrue},"-2,11":{B-2,A11,LV,C2,DG,IU,Jtrue},"-2,12":{B-2,A12,LF,C2,DG,I"",Jtrue},"-6,6":{B-6,A6,LF,C4,DG,I"",Jtrue},"-5,6":{B-5,A6,LF,C2,DG,I"",Jtrue},"-1,10":{B-1,A10,LF,C6,DG,I"",Jtrue},"-1,11":{B-1,A11,LE,C0,DG,I"",Jtrue},"-1,12":{B-1,A12,LE,C0,DG,I"dump",Jtrue},"-1,13":{B-1,A13,LT,C2,DH,I"compareequal",Jtrue},"-1,14":{B-1,A14,LY,C0,DG,I"","cargo":{"value":0,L0},Jtrue},"-1,15":{B-1,A15,LE,C2,DG,I"",Jtrue},"0,10":{B0,A10,LE,C2,DG,I"catapult",Jtrue},"0,11":{B0,A11,LY,C0,DG,I"",Jtrue},"0,12":{B0,A12,LY,C0,DG,I"","cargo":{"value":0,L0},Jtrue},"0,13":{B0,A13,LE,C2,DG,I"",Jtrue},"0,15":{B0,A15,LE,C2,DG,I"",Jtrue},"1,10":{B1,A10,LT,C6,DG,IU,Jtrue},"1,11":{B1,A11,LE,C4,DG,I"",Jtrue},"1,12":{B1,A12,LE,C0,DG,I"dump",Jtrue},"1,13":{B1,A13,LT,C2,DH,I"compareequal",Jtrue},"1,14":{B1,A14,LY,C0,DG,I"","cargo":{"value":1,L0},Jtrue},"1,15":{B1,A15,LE,C6,DG,I"",Jtrue},"2,10":{B2,A10,LE,C2,DG,I"catapult",Jtrue},"2,11":{B2,A11,LY,C0,DG,I"",Jtrue},"2,12":{B2,A12,LY,C0,DG,I"","cargo":{"value":0,L0},Jtrue},"2,13":{B2,A13,LE,C2,DG,I"",Jtrue},"2,15":{B2,A15,LE,C6,DG,I"",Jtrue},"3,10":{B3,A10,LT,C6,DG,IU,Jtrue},"3,11":{B3,A11,LE,C0,DG,I"",Jtrue},"3,12":{B3,A12,LE,C0,DG,I"dump",Jtrue},"3,13":{B3,A13,LT,C2,DG,I"compareequal",Jtrue},"3,14":{B3,A14,LY,C0,DG,I"","cargo":{"value":2,L0},Jtrue},"3,15":{B3,A15,LE,C6,DG,I"greentunnel",Jtrue},"4,10":{B4,A10,LE,C2,DG,I"catapult",Jtrue},"4,11":{B4,A11,LY,C0,DG,I"",Jtrue},"4,12":{B4,A12,LY,C0,DG,I"","cargo":{"value":0,L0},Jtrue},"4,13":{B4,A13,LE,C2,DG,I"",Jtrue},"4,15":{B4,A15,LE,C6,DG,I"",Jtrue},"5,10":{B5,A10,LT,C6,DG,IU,Jtrue},"5,11":{B5,A11,LE,C0,DG,I"",Jtrue},"5,12":{B5,A12,LE,C0,DG,I"dump",Jtrue},"5,13":{B5,A13,LT,C2,DG,I"compareequal",Jtrue},"5,14":{B5,A14,LY,C0,DG,I"","cargo":{"value":3,L0},Jtrue},"5,15":{B5,A15,LE,C6,DG,I"",Jtrue},"6,10":{B6,A10,LE,C2,DG,I"catapult",Jtrue},"6,11":{B6,A11,LY,C0,DG,I"",Jtrue},"6,12":{B6,A12,LY,C0,DG,I"","cargo":{"value":0,L0},Jtrue},"6,13":{B6,A13,LE,C2,DG,I"",Jtrue},"6,15":{B6,A15,LE,C6,DG,I"",Jtrue},"7,15":{B7,A15,LE,C6,DG,I"",Jtrue},"-2,13":{B-2,A13,LF,C6,DG,I"",Jtrue},"-2,14":{B-2,A14,LE,C4,DG,I"",Jtrue},"-2,15":{B-2,A15,LF,C4,DG,I"",Jtrue},"7,10":{B7,A10,LT,C6,DG,IU,Jtrue},"7,11":{B7,A11,LE,C0,DG,I"",Jtrue},"7,12":{B7,A12,LE,C0,DG,I"dump",Jtrue},"7,13":{B7,A13,LT,C2,DG,I"compareequal",Jtrue},"7,14":{B7,A14,LY,C0,DG,I"","cargo":{"value":4,L0},Jtrue},"8,10":{B8,A10,LE,C2,DG,I"catapult",Jtrue},"8,11":{B8,A11,LY,C0,DG,I"",Jtrue},"8,12":{B8,A12,LY,C0,DG,I"","cargo":{"value":1,L0},Jtrue},"9,10":{B9,A10,LF,C0,DG,I"",Jtrue},"9,11":{B9,A11,LE,C4,DG,I"",Jtrue},"9,12":{B9,A12,LE,C4,DG,I"",Jtrue},"9,14":{B9,A14,LE,C4,DG,I"",Jtrue},"9,13":{B9,A13,LW,C2,DG,I"",Jtrue},"9,15":{B9,A15,LF,C2,DG,I"",Jtrue},"8,15":{B8,A15,LE,C6,DG,I"",Jtrue},"8,13":{B8,A13,LE,C2,DG,I"",Jtrue},"10,13":{B10,A13,LS,C4,DG,IU,Jtrue},"10,12":{B10,A12,LE,C0,DG,I"",Jtrue},"10,10":{B10,A10,LF,C6,DG,I"",Jtrue},"11,10":{B11,A10,LE,C2,DG,I"",Jtrue},"12,10":{B12,A10,LF,C0,DG,I"",Jtrue},"12,11":{B12,A11,LE,C4,DG,I"",Jtrue},"12,12":{B12,A12,LE,C4,DG,I"",Jtrue},"12,13":{B12,A13,LE,C4,DG,I"",Jtrue},"12,14":{B12,A14,LE,C4,DG,I"home",Jtrue},"12,15":{B12,A15,LF,C2,DG,I"",Jtrue},"11,15":{B11,A15,LE,C6,DG,I"",Jtrue},"10,15":{B10,A15,LF,C4,DG,I"",Jtrue},"10,14":{B10,A14,LE,C0,DG,I"",Jtrue},"11,14":{B11,A14,LY,C0,DG,I"",Jtrue}},[{B-5,A2,LM,C0,D"",Q120,R0.5,JK,O[],P[]}],[{B-5,A5,LN,C0,D"",Q120,R0.5,JK,O[],P[]},{B-5,A4,LN,C0,D"",Q120,R0.5,JK,O[],P[]},{B-5,A3,LN,C0,D"",Q120,R0.5,JK,O[],P[]},{B12,A11,LN,C4,D"",Q0,R0.5,"cargo":{"value":0,L7},JK,O[],P[]}]]';
	bestTrackTime[trainerLevelNames[7]+'-9'] = 225000;

	// make Toolbar for Levels
	toolButtonsLevels.push(new ToolButton(buttonPadding, 1*buttonPadding+0*(buttonMultiplier*buttonWidth), buttonWidth, buttonWidth, "Play")); 
	toolButtonsLevels.push(new ToolButton(buttonPadding, 2*buttonPadding+1*(buttonMultiplier*buttonWidth), buttonWidth, buttonWidth, "Repeat"));
	toolButtonsLevels.push(new ToolButton(buttonPadding, 2*buttonPadding+2*(buttonMultiplier*buttonWidth), buttonWidth, buttonWidth, "Back"));
	toolButtonsLevels.push(new ToolButton(buttonPadding, 5*buttonPadding+7*(buttonMultiplier*buttonWidth), buttonWidth, buttonWidth, "Home"));
	
	// make Toolbar for Freeplay
	toolButtonsFreeplay.push(new ToolButton(buttonPadding, 1*buttonPadding+0*(buttonMultiplier*buttonWidth), buttonWidth, buttonWidth, "Play"));
	toolButtonsFreeplay.push(new ToolButton(buttonPadding, 2*buttonPadding+1*(buttonMultiplier*buttonWidth), buttonWidth, buttonWidth, "Track", 1, true));
	toolButtonsFreeplay.push(new ToolButton(buttonPadding, 2*buttonPadding+2*(buttonMultiplier*buttonWidth), buttonWidth, buttonWidth, "Engine", 1));
	toolButtonsFreeplay.push(new ToolButton(buttonPadding, 2*buttonPadding+3*(buttonMultiplier*buttonWidth), buttonWidth, buttonWidth, "Car", 1));
	toolButtonsFreeplay.push(new ToolButton(buttonPadding, 2*buttonPadding+4*(buttonMultiplier*buttonWidth), buttonWidth, buttonWidth, "Cargo", 1));
	toolButtonsFreeplay.push(new ToolButton(buttonPadding, 3*buttonPadding+5*(buttonMultiplier*buttonWidth), buttonWidth, buttonWidth, "Eraser", 1));
	toolButtonsFreeplay.push(new ToolButton(buttonPadding, 3*buttonPadding+6*(buttonMultiplier*buttonWidth), buttonWidth, buttonWidth, "Select", 1));
	toolButtonsFreeplay.push(new ToolButton(buttonPadding, 4*buttonPadding+7*(buttonMultiplier*buttonWidth), buttonWidth, buttonWidth, "Home"));
	toolButtonsFreeplay.push(new ToolButton(buttonPadding, 4*buttonPadding+8*(buttonMultiplier*buttonWidth), buttonWidth, buttonWidth, "Clear"));

	toolButtonsFreeplay.push(new ToolButton(buttonWidth+2*buttonPadding, 1*buttonPadding+0*(buttonMultiplier*buttonWidth), buttonWidth, buttonWidth, "Octagon"));
	toolButtonsFreeplay.push(new ToolButton(buttonWidth+2*buttonPadding, 2*buttonPadding+1*(buttonMultiplier*buttonWidth), buttonWidth, buttonWidth, "Save"));
	toolButtonsFreeplay.push(new ToolButton(buttonWidth+2*buttonPadding, 2*buttonPadding+2*(buttonMultiplier*buttonWidth), buttonWidth, buttonWidth, "Open"));
	toolButtonsFreeplay.push(new ToolButton(buttonWidth+2*buttonPadding, 2*buttonPadding+3*(buttonMultiplier*buttonWidth), buttonWidth, buttonWidth, "Write"));
	toolButtonsFreeplay.push(new ToolButton(buttonWidth+2*buttonPadding, 2*buttonPadding+4*(buttonMultiplier*buttonWidth), buttonWidth, buttonWidth, "Read"));
	toolButtonsFreeplay.push(new ToolButton(buttonWidth+2*buttonPadding, 3*buttonPadding+5*(buttonMultiplier*buttonWidth), buttonWidth, buttonWidth, "Undo"));
	toolButtonsFreeplay.push(new ToolButton(buttonWidth+2*buttonPadding, 3*buttonPadding+6*(buttonMultiplier*buttonWidth), buttonWidth, buttonWidth, "Redo"));
	toolButtonsFreeplay.push(new ToolButton(buttonWidth+2*buttonPadding, 4*buttonPadding+7*(buttonMultiplier*buttonWidth), buttonWidth, buttonWidth, "Water", 1));
	toolButtonsFreeplay.push(new ToolButton(buttonWidth+2*buttonPadding, 4*buttonPadding+8*(buttonMultiplier*buttonWidth), buttonWidth, buttonWidth, "Lock", 1));
	
	//download trx for a trackID passed through URL
	if (passedTrackID) downloadTrackID(passedTrackID);
	
	var trainerLevelLocked = []; //show lock icon on levels page for each trainer level
	var trainerLevelCompleted = []; 
	var unlockedTrx = []; // e.g. unlockedTrx['Trainee-1'] = true if unlocked, if not unlocked then undefined or false
	for (i=trainerLevelNames.length-1; i>=0; i--) {
		trainerLevelLocked[trainerLevelNames[i]] = false;
		trainerLevelCompleted[trainerLevelNames[i]] = true;	
		text= trainerLevelNames[i] + "-0"; //unlocked first trx of each level so place to start
		unlockedTrx[text] = true;
		for (j=0; j<10; j++) { //check if high score > 0 . If so unlock
			var highScore = 0, unlocked;
			text = "highscore-" + trainerLevelNames[i] + "-" + j;
			if (localStorage.getObject(text)) highScore = localStorage.getObject(text);
			text = "unlocked-" + trainerLevelNames[i] + "-" + j;
			if (localStorage.getObject(text)) unlocked = localStorage.getObject(text);
			text = trainerLevelNames[i] + "-" + j;
			if (highScore > 0 || unlocked) {
				unlockedTrx[text] = true;
			} else {
				if (!allLevelsUnlocked) trainerLevelLocked[trainerLevelNames[i+1]] = true;	//lock the next level unless all tracks on this level are unlocked
				trainerLevelCompleted[trainerLevelNames[i]] = false;	//lock the next level unless all tracks on this level are unlocked
			}
			var next = j+1;
			text = trainerLevelNames[i] + "-" + next;
			if (highScore > 0 || unlocked) {
				unlockedTrx[text] = true;
			}
			if (allLevelsUnlocked) unlockedTrx[text] = true;
		}
	}
	trainerLevelLocked[trainerLevelNames[0]] = false; //unlock first level so somewhere to start

	console.log("Ready!!");

	////// extend builtin methods
    ctx.dashedLine = function(x, y, x2, y2, da) {
        if (!da) da = [10,5];
        this.save();
        var dx = (x2-x), dy = (y2-y);
        var len = Math.sqrt(dx*dx + dy*dy);
        var rot = Math.atan2(dy, dx);
        this.translate(x, y);
        this.moveTo(0, 0);
        this.rotate(rot);       
        var dc = da.length;
        var di = 0, draw = true;
        x = 0;
        while (len > x) {
            x += da[di++ % dc];
            if (x > len) x = len;
            draw ? this.lineTo(x, 0): this.moveTo(x, 0);
            draw = !draw;
        }       
        this.restore();
    }

                 
	//tracks ///////////////////////////////////////////
	function Track(gridx, gridy, type, orientation, state, subtype) { //this object is stored by JSON.stringify so no functions allowed in object
		tracks[mi(gridx,gridy)] = this;
		this.gridx = gridx || 0;
		this.gridy = gridy || 0;
		this.type = type || "trackstraight";
		this.orientation = orientation || 0;
		this.state = state || "left"; //left or right
		this.subtype = subtype || ""; //for TrackWye, TrackWyeLeft, TrackWyeRight subtype can be sprung, lazy, prompt, alternate, compareequal, compareless, comparegreater, random
		//for TrackStraight- subtype can be increment, decrement, add, subtract, divide, multiply, sligshot, catapult
		this.cargo = undefined;// a reference to a Cargo object carried by this track
		this.immutable = false; //can this track be deleted or changed
	}	

	function updateUndoHistory() {
	 	var trx = [tracks, engines, cars];
		undoCurrentIndex += 1;
		undoHistory[undoCurrentIndex] =	compress(JSON.stringify(JSON.decycle(trx)));
	}

	function undoTrx() {
		if (undoCurrentIndex>1) {
			undoCurrentIndex -= 1;
			openTrxJSON(decompress(undoHistory[undoCurrentIndex]));
			buildTrains();
			draw();
		}
	}
	
	function redoTrx() {
		if (undoCurrentIndex < undoHistory.length-1) {
			undoCurrentIndex += 1;
			openTrxJSON(decompress(undoHistory[undoCurrentIndex]));
			buildTrains();
			draw();
		}
	}
	
	function mi(x,y) { //make index
		return (x+','+y);
	}
	
	function compress(decompressedTrx) {
		if (!decompressedTrx) return;
		var compressedTrx = decompressedTrx;
		for (var key in swap) {
		    compressedTrx = compressedTrx.replace(new RegExp(key, 'g'), swap[key]);
		}
		return "TRXv1.1:"+centerTileX+ '~' + centerTileY+ '~' + zoomScale + '~' + compressedTrx; 
	}
	
	function decompress (compressedTrx) {
		if (!compressedTrx) return;
		var version = compressedTrx.match(/TRXv[0-9].[0-9]:/);
		var decompressedTrx = compressedTrx.replace(version, "");
		var temp = decompressedTrx.split('~');
		var trx;
		if (version == "TRXv1.0:") {
			trx = temp[0];
		} else if (version == "TRXv1.1:") {
			console.log("v1.1------");
			centerTileX = temp[0];
			centerTileY = temp[1];
			zoomScale = temp[2];
			trx = temp[3];
		}
		for (var key in swap) {
		    trx = trx.replace(new RegExp(swap[key], 'g'), key);
		}

		console.log("cx="+centerTileX+" cy="+centerTileY);
		return trx;
	}
	
	function drawTitleScreen() { 
		ctx.drawImage(imgTitleScreen, 0, 0, canvasWidth, canvasHeight);
		
		drawImageButton(               0.25*canvasWidth, 0.75*canvasHeight, 0.32*canvasWidth, 0.19*canvasHeight, "Levels", false, false, buttonColor, buttonBorderColor);
		buttonDims['Levels'] = new box(0.25*canvasWidth, 0.75*canvasHeight, 0.32*canvasWidth, 0.19*canvasHeight);
		
		drawImageButton(				 0.75*canvasWidth, 0.75*canvasHeight, 0.32*canvasWidth, 0.19*canvasHeight, "Freeplay", false, false, buttonColor, buttonBorderColor);
		buttonDims['Freeplay'] = new box(0.75*canvasWidth, 0.75*canvasHeight, 0.32*canvasWidth, 0.19*canvasHeight);

		drawImageButton(              0.5*canvasWidth, 0.9*canvasHeight, 0.08*canvasWidth, 0.08*canvasHeight, "About", false, false, "lightGray", "gray");
		buttonDims['About'] = new box(0.5*canvasWidth, 0.9*canvasHeight, 0.08*canvasWidth, 0.08*canvasHeight);

	}
	
	function drawButtonScreen() { // draws the screen for different sets of buttons such levels, trainee, conductor
		ctx.drawImage(imgTitleScreen, 0, 0, canvasWidth, canvasHeight);

		ctx.fillStyle = aboutColor;
		ctx.fillRect (0,0,canvasWidth, canvasHeight);
		ctx.font = "40px Arial";
		ctx.fillStyle = fontColor;
		ctx.textAlign = 'center';

		//draw button array
		var maxY=5;
		if (interactionState == 'Levels') maxY=4;
		var textindex;
		for (x=0; x<2; x++) {
			for (y=maxY-1; y>=0; y--) {
				var text, unlocked, badge;
				var index = x*maxY + y;
				if (interactionState == 'Levels') {
					text = trainerLevelNames[index];
					unlocked = !trainerLevelLocked[text];
					badge = trainerLevelCompleted[text];
					textindex = text;
				} else {
					text = currentTrackSet + "-" + index;
					unlocked = unlockedTrx[text];
					textindex = "track "+index;
					var highScore = 0;
					var key = "highscore-" + currentTrackSet + "-" + index;
					if (localStorage.getObject(key)) highScore = localStorage.getObject(key);
					badge = (highScore > 0);
				}
				drawImageButton							   ((x*2-1)*0.2*canvasWidth+0.5*canvasWidth, 0.24*canvasHeight+y*0.15*canvasHeight, 0.2*canvasWidth, 0.12*canvasHeight, text, !unlocked, unlocked, buttonColor, buttonBorderColor);
				if (badge) ctx.drawImage(imgBadgeIconSmall, (x*2-1)*0.2*canvasWidth+0.5*canvasWidth+0.06*canvasWidth, 0.16*canvasHeight+ y*0.15*canvasHeight, 0.09*canvasWidth, 0.17*canvasHeight);
				buttonDimLevels[textindex] = new box(            (x*2-1)*0.2*canvasWidth+0.5*canvasWidth, 0.24*canvasHeight+y*0.15*canvasHeight, 0.2*canvasWidth, 0.12*canvasHeight);
			}
		}

		//draw title icon
		var img, yOffset=0;
		if (interactionState == 'Levels') {
			img = imgLevelsIcon;
		} else if (interactionState == 'Choose track') {
			img = getImgIcon(currentTrackSet);
			yOffset=15;
		}

		if (img) {
			var imgHeight = 0.15 * canvasHeight;
			if (yOffset>0) imgHeight = imgHeight*1.5;
			var imgWidth = imgHeight/img.height*img.width;
			ctx.drawImage(img, 0.5*canvasWidth-0.5*imgWidth,0.1*canvasHeight-0.5*imgHeight+yOffset, imgWidth, imgHeight);
		} else {
			ctx.fillText (interactionState, 0.5*canvasWidth,0.1*canvasHeight);
		}
		
		//draw back button
		drawImageButton                (0.5*canvasWidth, 0.9*canvasHeight, 0.1*canvasWidth, 0.08*canvasHeight, "Back", false, false, "lightGray", "gray");
		text= interactionState + "-back";
		buttonDimLevels[text] = new box(0.5*canvasWidth, 0.9*canvasHeight, 0.1*canvasWidth, 0.08*canvasHeight);
	}
		
	function drawTextButton(x, y, width, height, text, isLocked, isUnlocked, fillColor, strokeColor) { //draw button centered at x,y
		ctx.fillStyle = fillColor;
		ctx.strokeStyle = strokeColor;
		roundRect (x-0.5*width, y-0.5*height, width, height, 5, true, true, !isLocked);
		ctx.font = "normal bold 20px Arial";
		ctx.fillStyle = fontColor;
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'center';
		ctx.fillText(text, x, y);	
		if (isLocked) ctx.drawImage(imgLockedIcon, x-0.5*width, y-0.5*imgLockedIcon.height);
		if (isUnlocked) ctx.drawImage(imgUnlockedIcon, x-0.5*width, y-0.5*imgUnlockedIcon.height);
	}	

	function drawImageButton(x, y, width, height, text, isLocked, isUnlocked, fillColor, strokeColor) { //draw button centered at x,y
		ctx.fillStyle = fillColor;
		ctx.strokeStyle = strokeColor;
		var lineWidth = 2;
		if (text == "About") lineWidth = 1;
		roundRect (x-0.5*width, y-0.5*height, width, height, 5, true, true, lineWidth, !isLocked);
		var yOffset = 0;
		if (text.startsWith("level")) {
			yOffset = 21;
		}
		
		if (text.startsWith("level") && text.charAt(6)=="-") text = text.charAt(7); 
		var img = getImgIcon(text);

		var imgHeight = 0.85 * height;
		if (yOffset>0) imgHeight = 2*imgHeight;
		var imgWidth = imgHeight/img.height*img.width;
		ctx.drawImage(img, x-0.5*imgWidth, y-0.5*imgHeight+yOffset, imgWidth, imgHeight);

		if (isLocked) {
			ctx.fillStyle = "rgba(88, 88, 88, 0.6)";
			roundRect (x-0.5*width, y-0.5*height, width, height, 5, true, true, false);
		}

	}	

	function getImgIcon(text) {
		var img;
		switch (text) {
			case "UnlockLevels":
				img = imgUnlockLevels;
				break;
			case "Advanced":
				img = imgAdvancedToolbar;
				break;
			case "Basic":
				img = imgBasicToolbar;
				break;
			case "HelloWorld":
				img = imgHelloWorld;
				break;
			case "Rate":
				img = imgRate;
				break;
			case "Next track":
				img = imgForward;
				break;
			case "Try again":
				img = imgRepeat;
				break;
			case "Back":
				img = imgBack;
				break;
			case "About":
				img = imgGear;
				break;
			case "Levels":
				img = imgLevelsIcon;
				break;
			case "Freeplay":
				img = imgFreeplayIcon;
				break;
			case "levelA":
				img = imgCargoUppercase[0][14];
				break;
			case "levelB":
				img = imgCargoUppercase[1][18];
				break;
			case "levelC":
				img = imgCargoUppercase[2][14];
				break;
			case "levelD":
				img = imgCargoUppercase[3][18];
				break;
			case "levelE":
				img = imgCargoUppercase[4][18];
				break;
			case "levelF":
				img = imgCargoUppercase[5][14];
				break;
			case "levelG":
				img = imgCargoUppercase[6][18];
				break;
			case "levelH":
				img = imgCargoUppercase[7][14];
				break;
			case "0":
				img = imgCargoNumbers[0][14];
				break;
			case "1":
				img = imgCargoNumbers[1][18];
				break;
			case "2":
				img = imgCargoNumbers[2][14];
				break;
			case "3":
				img = imgCargoNumbers[3][18];
				break;
			case "4":
				img = imgCargoNumbers[4][14];
				break;
			case "5":
				img = imgCargoNumbers[5][18];
				break;
			case "6":
				img = imgCargoNumbers[6][14];
				break;
			case "7":
				img = imgCargoNumbers[7][18];
				break;
			case "8":
				img = imgCargoNumbers[8][14];
				break;
			case "9":
				img = imgCargoNumbers[9][18];
				break;
			case "Back":
				img = imgBack;
				break;
			default:
				console.log("ERROR-didn't find image for image button-"+text);
		}
		return img;		
	}

	function roundRect(x, y, width, height, radius, fill, stroke,linewidth, shadow) {
		if (typeof shadow == 'undefined') {
			stroke = false;
		}
		if (typeof stroke == 'undefined') {
			stroke = true;
		}
		if (typeof radius === 'undefined') {
	    	radius = 5;
		}
		if (typeof linewidth === 'undefined') {
			linewidth = 2;
		}
		if (typeof radius === 'number') {
			radius = {tl: radius, tr: radius, br: radius, bl: radius};
		} else {
			var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
			for (var side in defaultRadius) {
			radius[side] = radius[side] || defaultRadius[side];
			}
		}
		if (shadow) ctx.shadowBlur=width/9;
		ctx.shadowColor="black";
		
		ctx.lineWidth = linewidth;
		ctx.beginPath();
		ctx.moveTo(x + radius.tl, y);
		ctx.lineTo(x + width - radius.tr, y);
		ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
		ctx.lineTo(x + width, y + height - radius.br);
		ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
		ctx.lineTo(x + radius.bl, y + height);
		ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
		ctx.lineTo(x, y + radius.tl);
		ctx.quadraticCurveTo(x, y, x + radius.tl, y);
		ctx.closePath();
		if (fill) {
			ctx.fill();
		}
		if (stroke) {
			ctx.stroke();
		}
		ctx.shadowBlur = 0;
	
	}		

	function box(centerX, centerY, width, height) {
		var x1, x2, y1, y2;
		x1 = centerX-0.5*width;
		x2 = centerX+0.5*width;
		y1 = centerY-0.5*height;
		y2 = centerY+0.5*height;
		
		this.inside = function (x,y) {
			if (x>x1 && x<x2 && y>y1 && y<y2) return true;
			else return false;
		}
	}
	
	function drawTrack(track) {  //draws this track
		if (!track) return;
		
		ctx.save();
		ctx.translate((0.5+track.gridx)*tileWidth, (0.5+track.gridy)*tileWidth*tileRatio); //center origin on tile
			
		//rotate tile
		ctx.rotate(track.orientation * Math.PI/4);
						
		//draw tile interior specific to type of track
		switch (track.type) {
			case "track90":
			case "track45":
			case "trackcargo":
			case "trackblank":
			case "trackcross":
				drawSprite(track.type, track.orientation);
				break; 
			case "trackstraight":
				if (track.subtype == "none" || track.subtype == "" || track.subtype == "greentunnel" || track.subtype == "redtunnel" || track.subtype == "bluetunnel") drawSprite("trackstraight", track.orientation);
				else drawSprite(track.subtype, track.orientation);
				break;
			case "trackwater":
				var ori= (track.gridx+track.gridy)%4;
				var img=imgWaterTile0;
				var neighbors = 0;
				var neighborN = (tracks[mi(track.gridx,track.gridy+1)] && tracks[mi(track.gridx,track.gridy+1)].type == "trackwater");
				var neighborS = (tracks[mi(track.gridx,track.gridy-1)] && tracks[mi(track.gridx,track.gridy-1)].type == "trackwater");
				var neighborE = (tracks[mi(track.gridx-1,track.gridy)] && tracks[mi(track.gridx-1,track.gridy)].type == "trackwater");
				var neighborW = (tracks[mi(track.gridx+1,track.gridy)] && tracks[mi(track.gridx+1,track.gridy)].type == "trackwater");
				
				if (neighborN) neighbors++;
				if (neighborS) neighbors++;
				if (neighborE) neighbors++;
				if (neighborW) neighbors++;
				if (neighbors ==1) {
					img=imgWaterTile1;
					if (neighborW) ori=1;
					if (neighborE) ori=3;
					if (neighborN) ori=4;
					if (neighborS) ori=2;
					}
				if (neighbors ==2) {
					img=imgWaterTile2adj;
					if (neighborE && neighborW) {
						img=imgWaterTile2opp;
						ori = 2;
					} else if (neighborN && neighborS) { //opposite
						img=imgWaterTile2opp;
						ori = 1;
					} else if (neighborN && neighborW) { //adjacent
						img=imgWaterTile2adj;
						ori = 2;
					} else if (neighborN && neighborE) { //adjacent
						img=imgWaterTile2adj;
						ori = 1;
					}  else if (neighborS && neighborW) { //adjacent
						img=imgWaterTile2adj;
						ori = 3;
					} else { //adjacent
						img=imgWaterTile2adj;
						ori = 0;
					}
				}
				if (neighbors ==3) {
					img=imgWaterTile3;
					if      (!neighborE) ori=3;
					else if (!neighborW) ori=1;
					else if (!neighborN) ori=0;
					else ori=2;
				}
				if (neighbors ==4) img=imgWaterTile4;
				ctx.rotate(-Math.PI/2*ori);
				ctx.drawImage(img, -0.5*tileWidth, -0.5*tileWidth, tileWidth, tileWidth);
				//if (ori%2 == 0) ctx.drawImage(img, -0.5*tileWidth*tileRatio, -0.5*tileWidth, tileWidth*tileRatio, tileWidth);
				//else ctx.drawImage(img, -0.5*tileWidth*tileRatio, -0.5*tileWidth, tileWidth, tileWidth*tileRatio);
				break;
			case "trackwyeleft":
			case "trackwyeright":
			case "trackwye":
				var name = track.type + "-";
				switch (track.subtype) {
					case "prompt":
						name += "prompt";
						break;
					case "alternate":
						name += "alternate";
						break;
					case "comparegreater":
						name += "greater";
						break;
					case "compareequal":
						name += "equal";
						break;
					case "compareless":
						name += "less";
						break;
					case "sprung":
						name += "sprung";
						break;
					case "lazy":
						name += "lazy";
						break;
					case "random":
						name += "random";
						break;
					default:
						name += "lazy";
						console.log("ERROR-uncaught case track.subtype="+track.subtype+" type="+track.type);
						break;
				}
				if (track.state == "left") name += "-l";
				else name += "-r";
				
				drawSprite(name, track.orientation);
				break; 
		}
				
		var cargoOri = Math.PI/4*track.orientation;
		if (track.type == "trackblank") cargoOri = 16;
		drawCargo(track, cargoOri);
					
		if (showToolBar && track.immutable) {
			ctx.rotate(track.orientation * -Math.PI/4);
			ctx.fillStyle = trackImmutableColorFill;
			ctx.fillRect(-0.5*tileWidth, -0.5*tileWidth*tileRatio, tileWidth, tileWidth*tileRatio);
			ctx.lineWidth = 2;
			ctx.strokeStyle = trackImmutableColorBorder;
			ctx.rect(-0.5*tileWidth, -0.5*tileWidth, tileWidth, tileWidth);
		}
		ctx.restore();
	
	}		
	
	function drawTrackInset() {
		ctx.lineWidth = 1;
		ctx.fillStyle = insetFillColor;
		ctx.strokeStyle = insetStrokeColor;

		roundRect (0,0, insetWidth, insetWidth, insetWidth/8, true, true, false);	
		
	}		    

	function drawSprite(name, ori, value) { //draws an image either from scratch or via a loaded image at the current position. ori used for choosing image from array of renders from different orientations. Value for choosing from array of values for cargo type
		ctx.rotate(-ori * Math.PI/4);
		//console.log("drawSprite="+name); //kkk
        var cargoOffsetX = -37;
        var cargoOffsetY = -26;
        var stationOffsetX = -53;
        var stationOffsetY = -31;
        var wyeOffsetX = -69;
        var wyeOffsetY = -43;
		switch (name) {
			case "Captionblocks":
                ctx.drawImage(imgCargoBlocks[2][12], cargoOffsetX, cargoOffsetY,imgTrackWidth*0.8,imgTrackWidth*0.8);
				break;
			case "Caption1":
                ctx.drawImage(imgCargoBlocks[value][12], cargoOffsetX, cargoOffsetY,imgTrackWidth*0.8,imgTrackWidth*0.8);
				break;
			case "Captionuppercase":
                ctx.drawImage(imgCargoUppercase[0][16], cargoOffsetX, cargoOffsetY,imgTrackWidth*0.8,imgTrackWidth*0.8);
				break;
			case "CaptionA":
                ctx.drawImage(imgCargoUppercase[value][16], cargoOffsetX, cargoOffsetY,imgTrackWidth*0.8,imgTrackWidth*0.8);
				break;
			case "Captionlowercase":
				ctx.drawImage(imgCargoLowercase[0][16], cargoOffsetX, cargoOffsetY,imgTrackWidth*0.8,imgTrackWidth*0.8);
				break;
			case "Captiona":
				ctx.drawImage(imgCargoLowercase[value][16], cargoOffsetX, cargoOffsetY,imgTrackWidth*0.8,imgTrackWidth*0.8);
				break;
			case "Captioncolors":
				ctx.drawImage(imgCargoColors[0][16], cargoOffsetX, cargoOffsetY,imgTrackWidth*0.8,imgTrackWidth*0.8);
				break;
			case "Captionwhite":
				ctx.drawImage(imgCargoColors[value][16], cargoOffsetX, cargoOffsetY,imgTrackWidth*0.8,imgTrackWidth*0.8);
				break;
			case "Captiondinosaurs":
				ctx.drawImage(imgCargoDinosaurs[0][5], cargoOffsetX, cargoOffsetY,imgTrackWidth*0.8,imgTrackWidth*0.8);
				break;
			case "Captionraptor":
				ctx.drawImage(imgCargoDinosaurs[value][5], cargoOffsetX, cargoOffsetY,imgTrackWidth*0.8,imgTrackWidth*0.8);
				break;
			case "Captionstuffedanimals":
				ctx.drawImage(imgCargoStuffedAnimals[0][34], cargoOffsetX, cargoOffsetY,imgTrackWidth*0.8,imgTrackWidth*0.8);
				break;
			case "Captionbear":
				ctx.drawImage(imgCargoStuffedAnimals[value][34], cargoOffsetX, cargoOffsetY,imgTrackWidth*0.8,imgTrackWidth*0.8);
				break;
			case "Captionnumbers":
				ctx.drawImage(imgCargoNumbers[0][16], cargoOffsetX, cargoOffsetY,imgTrackWidth*0.8,imgTrackWidth*0.8);
				break;
			case "Caption0":
				ctx.drawImage(imgCargoNumbers[value][16], cargoOffsetX, cargoOffsetY,imgTrackWidth*0.8,imgTrackWidth*0.8);
				break;
			case "Captionbinary":
				ctx.drawImage(imgCargoBinary[0][5], cargoOffsetX, cargoOffsetY,imgTrackWidth*0.8,imgTrackWidth*0.8);
				break;
			case "Captionyes":
				ctx.drawImage(imgCargoBinary[value][5], cargoOffsetX, cargoOffsetY,imgTrackWidth*0.8,imgTrackWidth*0.8);
				break;
			case "Captionnone":
				ctx.drawImage(imgCaptionNone, stationOffsetX+37, stationOffsetY+9,imgTrackWidth*0.45,imgTrackWidth*0.45);
				break;
			case "Captionalternate":
				ctx.drawImage(imgCaptionAlternate, wyeOffsetX, wyeOffsetY,imgTrackWidth,imgTrackWidth);
				break;
			case "Captionrandom":
				ctx.drawImage(imgCaptionRandom, wyeOffsetX, wyeOffsetY,imgTrackWidth,imgTrackWidth);
				break;
			case "Captioncomparegreater":
				ctx.drawImage(imgCaptionGreater, wyeOffsetX, wyeOffsetY,imgTrackWidth,imgTrackWidth);
				break;
			case "Captioncompareequal":
				ctx.drawImage(imgCaptionEqual, wyeOffsetX, wyeOffsetY,imgTrackWidth,imgTrackWidth);
				break;
			case "Captionlazy":
				ctx.drawImage(imgCaptionLazy, wyeOffsetX, wyeOffsetY,imgTrackWidth,imgTrackWidth);
				break;
			case "Captioncompareless":
				ctx.drawImage(imgCaptionLesser, wyeOffsetX, wyeOffsetY,imgTrackWidth,imgTrackWidth);
				break;
			case "Captionprompt":
				ctx.drawImage(imgCaptionPrompt, wyeOffsetX, wyeOffsetY,imgTrackWidth,imgTrackWidth);
				break;
			case "Captionsprung":
				ctx.drawImage(imgCaptionSprung, wyeOffsetX, wyeOffsetY,imgTrackWidth,imgTrackWidth);
				break;
			case "Captionadd":
				ctx.drawImage(imgCaptionAdd, stationOffsetX, stationOffsetY,imgTrackWidth*0.8,imgTrackWidth*0.8);
				break;
			case "Captioncatapult":
				ctx.drawImage(imgCaptionCatapult, stationOffsetX, stationOffsetY,imgTrackWidth*0.8,imgTrackWidth*0.8);
				break;
			case "Captiondecrement":
				ctx.drawImage(imgCaptionDecrement, stationOffsetX, stationOffsetY,imgTrackWidth*0.8,imgTrackWidth*0.8);
				break;
			case "Captiondivide":
				ctx.drawImage(imgCaptionDivide, stationOffsetX, stationOffsetY,imgTrackWidth*0.8,imgTrackWidth*0.8);
				break;
			case "Captiondump":
				ctx.drawImage(imgCaptionDump, stationOffsetX, stationOffsetY,imgTrackWidth*0.8,imgTrackWidth*0.8);
				break;
			case "Captionincrement":
				ctx.drawImage(imgCaptionIncrement, stationOffsetX, stationOffsetY,imgTrackWidth*0.8,imgTrackWidth*0.8);
				break;
			case "Captionmultiply":
				ctx.drawImage(imgCaptionMultiply, stationOffsetX, stationOffsetY,imgTrackWidth*0.8,imgTrackWidth*0.8);
				break;
			case "Captionhome":
				ctx.drawImage(imgCaptionHome, stationOffsetX, stationOffsetY,imgTrackWidth*0.8,imgTrackWidth*0.8);
				break;
			case "Captionredtunnel":
				ctx.drawImage(imgCaptionRedTunnel, stationOffsetX+31, stationOffsetY+18,imgTrackWidth*0.45,imgTrackWidth*0.45);
				break;
			case "Captiongreentunnel":
				ctx.drawImage(imgCaptionGreenTunnel, stationOffsetX+31, stationOffsetY+18,imgTrackWidth*0.45,imgTrackWidth*0.45);
				break;
			case "Captionbluetunnel":
				ctx.drawImage(imgCaptionBlueTunnel, stationOffsetX+31, stationOffsetY+18,imgTrackWidth*0.45,imgTrackWidth*0.45);
				break;
			case "Captionpickdrop":
				ctx.drawImage(imgCaptionPickDrop, stationOffsetX, stationOffsetY,imgTrackWidth*0.8,imgTrackWidth*0.8);
				break;
			case "Captionslingshot":
				ctx.drawImage(imgCaptionSlingshot, stationOffsetX, stationOffsetY,imgTrackWidth*0.8,imgTrackWidth*0.8);
				break;
			case "Captionsubtract":
				ctx.drawImage(imgCaptionSubtract, stationOffsetX, stationOffsetY,imgTrackWidth*0.8,imgTrackWidth*0.8);
				break;
			case "Captionsupply":
				ctx.drawImage(imgCaptionSupply, stationOffsetX, stationOffsetY,imgTrackWidth*0.8,imgTrackWidth*0.8);
				break;
			case "track90":
				ctx.drawImage(imgTrack90[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "track45":
				ctx.drawImage(imgTrack45[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "tracksquareSE": //draw the little squares between diagonal tracks 
				ctx.drawImage(imgTrackDiagonalSquare[7], 0, 0,imgTrackWidth,imgTrackWidth);
				break;
			case "tracksquareSW": //draw the little squares between diagonal tracks 
				ctx.drawImage(imgTrackDiagonalSquare[1], 0, 0,imgTrackWidth,imgTrackWidth);
				break;
			case "trackstraight":
				var oriRot = (ori+4)%8; // this is to correct an error in the rendering angle
				ctx.drawImage(imgTrackStraight[oriRot], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwyeright-alternate-l":
				ctx.drawImage(imgTrackWyeRightAlternateL[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwyeright-alternate-r":
				ctx.drawImage(imgTrackWyeRightAlternateR[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwyeright-lazy-l":
				ctx.drawImage(imgTrackWyeRightLazyL[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwyeright-lazy-r":
				ctx.drawImage(imgTrackWyeRightLazyR[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwyeright-less-l":
				ctx.drawImage(imgTrackWyeRightLesserL[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwyeright-less-r":
				ctx.drawImage(imgTrackWyeRightLesserR[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwyeright-greater-l":
				ctx.drawImage(imgTrackWyeRightGreaterL[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwyeright-greater-r":
				ctx.drawImage(imgTrackWyeRightGreaterR[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwyeright-equal-l":
				ctx.drawImage(imgTrackWyeRightEqualL[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwyeright-equal-r":
				ctx.drawImage(imgTrackWyeRightEqualR[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwyeright-sprung-l":
				ctx.drawImage(imgTrackWyeRightSprungL[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwyeright-sprung-r":
				ctx.drawImage(imgTrackWyeRightSprungR[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwyeright-prompt-l":
				ctx.drawImage(imgTrackWyeRightPromptL[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwyeright-prompt-r":
				ctx.drawImage(imgTrackWyeRightPromptR[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwyeright-random-r":
				ctx.drawImage(imgTrackWyeRightRandomR[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwyeright-random-l":
				ctx.drawImage(imgTrackWyeRightRandomL[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwyeleft-alternate-l":
				ctx.drawImage(imgTrackWyeLeftAlternateL[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwyeleft-alternate-r":
				ctx.drawImage(imgTrackWyeLeftAlternateR[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwyeleft-lazy-l":
				ctx.drawImage(imgTrackWyeLeftLazyL[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwyeleft-lazy-r":
				ctx.drawImage(imgTrackWyeLeftLazyR[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwyeleft-less-l":
				ctx.drawImage(imgTrackWyeLeftLesserL[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwyeleft-less-r":
				ctx.drawImage(imgTrackWyeLeftLesserR[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwyeleft-greater-l":
				ctx.drawImage(imgTrackWyeLeftGreaterL[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwyeleft-greater-r":
				ctx.drawImage(imgTrackWyeLeftGreaterR[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwyeleft-equal-l":
				ctx.drawImage(imgTrackWyeLeftEqualL[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwyeleft-equal-r":
				ctx.drawImage(imgTrackWyeLeftEqualR[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwyeleft-prompt-l":
				ctx.drawImage(imgTrackWyeLeftPromptL[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwyeleft-prompt-r":
				ctx.drawImage(imgTrackWyeLeftPromptR[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwyeleft-random-l":
				ctx.drawImage(imgTrackWyeLeftRandomL[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwyeleft-random-r":
				ctx.drawImage(imgTrackWyeLeftRandomR[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwyeleft-sprung-l":
				ctx.drawImage(imgTrackWyeLeftSprungL[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwyeleft-sprung-r":
				ctx.drawImage(imgTrackWyeLeftSprungR[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwye-alternate-l":
				ctx.drawImage(imgTrackWyeAlternateL[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwye-alternate-r":
				ctx.drawImage(imgTrackWyeAlternateR[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwye-less-l":
				ctx.drawImage(imgTrackWyeLesserL[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwye-less-r":
				ctx.drawImage(imgTrackWyeLesserR[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwye-lazy-l":
				ctx.drawImage(imgTrackWyeLazyL[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwye-lazy-r":
				ctx.drawImage(imgTrackWyeLazyR[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwye-greater-l":
				ctx.drawImage(imgTrackWyeGreaterL[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwye-greater-r":
				ctx.drawImage(imgTrackWyeGreaterR[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwye-equal-l":
				ctx.drawImage(imgTrackWyeEqualL[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwye-equal-r":
				ctx.drawImage(imgTrackWyeEqualR[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwye-sprung-l":
				ctx.drawImage(imgTrackWyeSprungL[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwye-sprung-r":
				ctx.drawImage(imgTrackWyeSprungR[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwye-prompt-l":
				ctx.drawImage(imgTrackWyePromptL[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwye-prompt-r":
				ctx.drawImage(imgTrackWyePromptR[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwye-random-l":
				ctx.drawImage(imgTrackWyeRandomL[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackwye-random-r":
				ctx.drawImage(imgTrackWyeRandomR[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackcross":
				var oriRot = (ori+4)%8; // this is to correct an error in the rendering angle
				ctx.drawImage(imgTrackCross[oriRot], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "trackblank":
				break;
			case "trackcargo":
				var oriRot = ori%2;
				ctx.drawImage(imgTrackCargo[oriRot], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "increment":
				ctx.drawImage(imgStationIncrement[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "decrement":
				ctx.drawImage(imgStationDecrement[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "add":
				ctx.drawImage(imgStationAdd[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "subtract":
				ctx.drawImage(imgStationSubtract[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "multiply":
				ctx.drawImage(imgStationMultiply[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "divide":
				ctx.drawImage(imgStationDivide[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "catapult":
				ctx.drawImage(imgStationCatapult[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "slingshot":
				ctx.drawImage(imgStationSlingshot[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "supply":
				ctx.drawImage(imgStationSupply[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "pickdrop":
				ctx.drawImage(imgStationPickDrop[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "dump":
				ctx.drawImage(imgStationDump[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "home":
				ctx.drawImage(imgStationHome[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "redtunnel":
				ctx.drawImage(imgRedTunnel[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "greentunnel":
				ctx.drawImage(imgGreenTunnel[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "bluetunnel":
				ctx.drawImage(imgBlueTunnel[ori], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
				break;
			case "speedController":
			 	//draw engine speed controller
			 	ctx.save();
			 	ctx.translate((captionX+1)*tileWidth, (captionY+1.6)*tileWidth*tileRatio); //move origin to center of dial
			 	ctx.beginPath();
			 	ctx.lineWidth = 15;
			 	ctx.strokeStyle = "red";
			 	ctx.arc (0,0, 0.7*tileWidth, 0, Math.PI, true);
				var linearGradient = ctx.createLinearGradient(-tileWidth, 0, tileWidth, 0);
				linearGradient.addColorStop(0, "red");
				linearGradient.addColorStop(0.5, "black");
				linearGradient.addColorStop(1, "green");
				ctx.strokeStyle = linearGradient;
			 	ctx.stroke(); //speed indicator strip
			 	ctx.lineWidth = 1;
			 	ctx.fillStyle = "gray";
			 	ctx.beginPath();
			 	ctx.arc (0,0, 0.12*tileWidth, 0, 2*Math.PI, true);
			 	ctx.fill(); //small circle at base of dial
			 	
			 	//make tick marks
			 	var r=0.7; //short radius
			 	for (var theta=0; theta<= Math.PI; theta+=Math.PI/nNumSpeeds) {
			 		ctx.beginPath();
			 		ctx.moveTo(Math.cos(theta)*r*tileWidth, -Math.sin(theta)*r*tileWidth);
			 		ctx.lineTo(Math.cos(theta)*0.9*tileWidth, -Math.sin(theta)*0.9*tileWidth);
			 		ctx.stroke();
			 		if (r==0.7) r=0.85;
			 		else r=0.7;
			 	}
			 	ctx.beginPath();
			 	ctx.lineWidth= 7;
			 	ctx.strokeStyle = "gray";
			 	ctx.moveTo(0,0);
			 	var angle = (1-currentCaptionedObject.speed/maxEngineSpeed)/2*Math.PI;
			 	ctx.lineTo (0.7*tileWidth*Math.cos(angle), -0.7*tileWidth*Math.sin(angle));
			 	ctx.stroke();
			 	ctx.beginPath();
			 	ctx.lineWidth =1
			 	ctx.moveTo (0.85*tileWidth*Math.cos(angle), -0.85*tileWidth*Math.sin(angle));
			 	ctx.lineTo (0.65*tileWidth*Math.cos(angle+0.25), -0.65*tileWidth*Math.sin(angle+0.25));
			 	ctx.lineTo (0.65*tileWidth*Math.cos(angle-0.25), -0.65*tileWidth*Math.sin(angle-0.25));
			 	ctx.fill();
			 	
			 	ctx.restore();
			 	break;
			default:
				ctx.beginPath();
			    ctx.fillStyle    = tieColor;
			    ctx.font         = 'Bold ' + 0.25*tileWidth + 'px Sans-Serif';
			    ctx.textBaseline = 'Top';
			    ctx.textAlign    = 'Center';
				ctx.fillText  (name, 0.04*tileWidth, 0.225*tileWidth);
				break;
				console.log("ERROR-unhandled case for drawSprite name="+name);
		}
		ctx.rotate(ori * Math.PI/4);
	}
	
	function trackConnects(track, orientation) { //returns true if track connects in orientation, else false
		if (!track) return;
		if (!track.type) return;
		var dif = (track.orientation - orientation + 8)%8;
		switch (track.type) {
			case "trackstraight":
				if (dif == 0 || dif == 4) return true;
				else return false;
			case "track90":
				if (dif == 2 || dif == 4) return true;
				else return false;
			case "track45":
				if (dif == 1 || dif == 4) return true;
				else return false;
			case "trackcross":
			case "trackbridge":
				if (dif == 0 || dif == 2 || dif == 4 || dif == 6) return true;
				else return false;
			case "trackwyeleft":
				if (dif == 2 || dif == 4 || dif == 0) return true;
				else return false;
			case "trackwyeright":
				if (dif == 6 || dif == 4 || dif == 0) return true;
				else return false;
			case "trackwye":
				if (dif == 6 || dif == 2 || dif == 4) return true;
				else return false;
			case "trackblank":
			case "trackcargo":
			case "trackwater":
				return false;
			default:
				console.log("ERROR: trackConnect didn't detect track type. Type="+track.type);
				return false;
		}
	}
	
	function EC(gridx, gridy, type, orientation, state, speed, position) { //object representing an Engine or Car
		//this object is stored by JSON.stringify so no functions allowed in object
		this.gridx = gridx || 0; //integer. location of engine or car in grid coordinates
		this.gridy = gridy || 0; //integer. location of engine or car in grid coordinates
		this.type = type || "enginebasic";
		this.orientation = orientation || 0; //orientation when entering a track 0=N, 1=NE, 2=E, 3=SE, 4=S, 5=SW, 6=W, 7=NW
		this.state = state || "";
		this.speed = speed || 0; //can be + or -. In millitiles/iteration
		this.position = position || 0.50; //position across tile in range of [0,1) with respect to orientation of engine. 0=begining, 1=end
		this.cargo = undefined;// a reference to a Cargo object carried by this EC
		this.immutable = false; //can this EC be deleted or changed type?
		this.tunnelfrom = []; //used to return EC to a tunnel. This is the (grid,gridy) of the tunnel that sent the EC 
		this.tunnelto = []; //used to return EC to a tunnel. This is the (grid,gridy) of the tunnel that the EC got sent to 

		if (type == "enginebasic") engines.push(this);
		else cars.push(this);
		
		return this;
	}

	function getUniqueID(obj) {
		if (!obj.uniqueid) {
			obj.uniqueid = lastUniqueID;
			lastUniqueID++;
		}
		return obj.uniqueid;
	}

	function drawEC(ec) {  
		if (!ec) return;
		if (!tracks[mi(ec.gridx,ec.gridy)]) {
			console.log ("ERROR Draw ec- Undefined track. gridx=" + ec.gridx + ", gridy=" + ec.gridy + " ec ori=" + ec.orientation);
			return;
		}
		var track=tracks[mi(ec.gridx,ec.gridy)];

		ctx.save();
		ctx.translate((0.5+ec.gridx)*tileWidth, (0.5+ec.gridy)*tileWidth*tileRatio); //center origin on tile
			
		//rotate tile
		ctx.rotate(ec.orientation * Math.PI/4);

		//calculate offset
		var offset = getOffset(ec);
		if (ec.orientation %4 == 0) {
			ctx.translate(offset.X*tileWidth, offset.Y*tileWidth*tileRatio);
		} else {
			ctx.translate(offset.X*tileWidth, offset.Y*tileWidth);
		}
			//console.log("offsetx="+offset.X+" y="+offset.Y);
		
		var type = getTypeForWye(ec, track);

		//rotate ec
		var rotation = 0;
		switch (type) {
			case "track90":
				if (ec.speed>=0) {
					if (ec.orientation != track.orientation) rotation = (Math.PI/2*ec.position); 
					else rotation = (-Math.PI/2*ec.position); 
				} else {
					if ((ec.orientation - track.orientation+8)%8 == 4) rotation = (-Math.PI/2*(1-ec.position)); 
					else rotation = (Math.PI/2*(1-ec.position));
				}
				break;
			case "track90right":
				if (ec.speed>=0) {
					if (ec.orientation != track.orientation) rotation = (-Math.PI/2*ec.position); 
					else rotation = (Math.PI/2*ec.position); 
				} else {
					if ((ec.orientation - track.orientation+8)%8 == 4) rotation = (Math.PI/2*(1-ec.position)); 
					else rotation = (-Math.PI/2*(1-ec.position));
				}
				break;
			case "track45":
				if (ec.speed>=0) {
					if (ec.orientation != track.orientation) rotation = (Math.PI/4*ec.position); 
					else rotation = (-Math.PI/4*ec.position); 
				} else {
					//console.log("oriDif track45="+(ec.orientation - track.orientation+8)%8);
					if ((ec.orientation - track.orientation+8)%8 == 4) rotation = (-Math.PI/4*(1-ec.position)); 
					else rotation = (Math.PI/4*(1-ec.position));
				}
				break;
		}

		if (ec.type == "enginebasic") {
			ctx.rotate(-ec.orientation * Math.PI/4); //rotate back to normal
			var frame = (ec.orientation/8*imgEngine.length  + Math.round(rotation/(2*Math.PI/imgEngine.length)) +imgEngine.length)%imgEngine.length;
			ctx.drawImage(imgEngine[frame], -imgEngineWidth/2, -imgEngineWidth/2,imgTrackWidth,imgTrackWidth);
			//console.log("Draw engine frame="+frame);
					
		} else	if (ec.type == "carbasic") {
			ctx.rotate(-ec.orientation * Math.PI/4); //rotate back to normal
			var frame = (ec.orientation/8*imgCar.length*2  + Math.round(rotation/(2*Math.PI/imgCar.length/2)) +imgCar.length)%imgCar.length;
			ctx.drawImage(imgCar[frame], -imgCarWidth/2, -imgCarWidth/2,imgTrackWidth,imgTrackWidth);
		} else {
			console.log ("ERROR- EC is not an instance of anything");
		}
		
		//draw cargo
		drawCargo(ec, rotation);

		ctx.restore();

	}

	function Cargo(value,type) { //object representing a Cargo. Cargo belongs to either EC or Track so no coords 
		//this object is stored by JSON.stringify so no functions allowed in object
		this.value = value || 0; //integer. numeric value of cargo for enums
		this.type = type || 0; //integer. Text name of type is cargoValues[type][0]. Index of cargoValues to type. One of predefined cargo types like cargoNumbers, cargoColors, cargoLowercase, cargoUppercase, cargoAfricanAnimals
	}
	
	function drawCargo(obj, rotation) { //draws cargo for obj= car or track. Animated is drawn on one pass because not relative to ctx translate/rotate
		if (obj == undefined || obj.cargo == undefined || obj.cargo.isanimating) return;
		
		//draws relative to current tile so after ctx has been translated and rotated to draw ec or tile
		var imgCargo = imgCargoNumbers;

		switch (cargoValues[obj.cargo.type][0]) {
				case "numbers":
				imgCargo = imgCargoNumbers;
				break;
			case "uppercase":
				imgCargo = imgCargoUppercase;
				break;
			case "lowercase":
				imgCargo = imgCargoLowercase;
				break;
			case "colors":
				imgCargo = imgCargoColors;
				break;
			case "safariAnimals":
				imgCargo = imgCargoSafariAnimals;
				break;
			case "dinosaurs":
				imgCargo = imgCargoDinosaurs;
				break;
			case "stuffedanimals":
				imgCargo = imgCargoStuffedAnimals;
				break;
			case "binary":
				imgCargo = imgCargoBinary;
				break;
			case "blocks":
				imgCargo = imgCargoBlocks;
				break;
			default:
				console.log ("ERROR-cargotype not found");
		}
		
		var value = obj.cargo.value;
		var frame = (obj.orientation/8*imgCargo[0].length  + Math.round(rotation/(2*Math.PI/imgCargo[0].length)) +imgCargo[0].length)%imgCargo[0].length;
		if (cargoValues[obj.cargo.type] == "dinosaurs") frame = (frame+32)%64; //flip dinos because rendered wrong
		if (obj.type == "trackcargo" || obj.type == "trackblank") frame = 16;
		
		ctx.drawImage(imgCargo[value][frame], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
	}

	function drawCargoAnimated(obj, rot) { //draws cargo for obj= car or track. Animated is drawn on one pass because not relative to ctx translate/rotate
		if (obj == undefined || obj.cargo == undefined || obj.cargo.isanimating != true) return;
		
		var rotation = 0;
		if (rot) rotation = rot; 
		
		var imgCargo = imgCargoNumbers;
		switch (cargoValues[obj.cargo.type][0]) {
			case "numbers":
				imgCargo = imgCargoNumbers;
				break;
			case "uppercase":
				imgCargo = imgCargoUppercase;
				break;
			case "lowercase":
				imgCargo = imgCargoLowercase;
				break;
			case "colors":
				imgCargo = imgCargoColors;
				break;
			case "safariAnimals":
				imgCargo = imgCargoSafariAnimals;
				break;
			case "dinosaurs":
				imgCargo = imgCargoDinosaurs;
				break;
			case "stuffedanimals":
				imgCargo = imgCargoStuffedAnimals;
				break;
			case "binary":
				imgCargo = imgCargoBinary;
				break;
			case "blocks":
				imgCargo = imgCargoBlocks;
				break;
			default:
				console.log ("ERROR-cargotype not found");
		}
		
		//animate cargo
		var xOffset = 0, yOffset = 0;
		var fraction = obj.cargo.animatedframes/obj.cargo.animatetotalframes;
		if (fraction>1) fraction = 1;
		var opacity = 1;
		if (obj.cargo && obj.cargo.animatetype == "supply") fraction = 1-fraction;
		if (obj.cargo.animateendobj) {
			xOffset = tileWidth*(obj.cargo.animateendobj.gridx - obj.cargo.animatestartobj.gridx) * fraction;
			yOffset = tileWidth*tileRatio*(obj.cargo.animateendobj.gridy - obj.cargo.animatestartobj.gridy) * fraction;
		}
		obj.cargo.animatedframes++;
		
		if (obj.cargo.animatedframes > obj.cargo.animatetotalframes) {
			if (obj.cargo.animatetype == "dump" || obj.cargo.animatetype == "dump-poof") {
				if (obj.cargo.animatedframes > obj.cargo.animatetotalframes*2) {
					obj.cargo.isanimating = false;
					obj.cargo = undefined;
					return;
				} else {
					opacity = 1-(obj.cargo.animatedframes-obj.cargo.animatetotalframes)/obj.cargo.animatetotalframes; //fade once on station
				}
			} else { // for "move" and "supply"	
				obj.cargo.isanimating = false;
				if (obj.cargo.animatetype == "move" || obj.cargo.animatetype == "move-spin") { //???
					obj.cargo.animateendobj.cargo = obj.cargo;
					obj.cargo = undefined;
				} 
				return;
			}
		}
		
		var value = obj.cargo.value;
		var endFrame = 0;
		if (obj.cargo.animateendobj) {
			endFrame = obj.cargo.animateendobj.orientation*8;
		}
		if (cargoValues[obj.cargo.type] == "dinosaurs") endFrame = (endFrame+32)%64; //flip dinos because rendered wrong
		if (obj.cargo && (obj.cargo.animatetype == "dump" || obj.cargo.animatetype == "dump-poof")) endFrame = obj.cargo.animatestartobj.orientation*8;
		if (obj.cargo.animateendobj) if (obj.cargo.animateendobj.type == "trackcargo" || obj.cargo.animateendobj.type == "trackblank") endFrame = 16;
		
		var startFrame = obj.cargo.animatestartobj.orientation*8;
		if (obj.cargo.animateendobj) if (obj.cargo.animatestartobj.type == "trackcargo" || obj.cargo.animatestartobj.type == "trackblank") startFrame = 16;
		
		var frame = startFrame + Math.round(fraction*(endFrame-startFrame));
		if (obj.cargo && (obj.cargo.animatetype == "spin" || obj.cargo.animatetype == "move-spin")) frame = startFrame + Math.round(fraction*64);
		frame %=64;
		
		if (obj.cargo.animatetype != "ontrackcargo") {
			ctx.save();
			var translateX=(0.5+obj.cargo.animatestartobj.gridx)*tileWidth+xOffset;
			var translateY=(0.5+obj.cargo.animatestartobj.gridy)*tileWidth*tileRatio+yOffset
			ctx.translate(translateX, translateY); //center origin on tile
	    	ctx.globalAlpha = opacity;
			if (obj.cargo.animatedframes > obj.cargo.animatetotalframes && obj.cargo.animatetype == "dump-poof") ctx.drawImage(imgPoof, -imgTrackWidth/2+15, -imgTrackWidth/2+10);
			else ctx.drawImage(imgCargo[value][frame], -imgTrackWidth/2, -imgTrackWidth/2,imgTrackWidth,imgTrackWidth);
	    	ctx.restore();
		}
	}
	
	function drawAllPoofs() {
		for (var i=0; i<poofs.length; i++) {
			var poof = poofs[i];
			ctx.save();
			var translateX=(0.5+poof.gridx)*tileWidth;
			var translateY=(0.5+poof.gridy)*tileWidth*tileRatio
			ctx.translate(translateX, translateY); 
	    	ctx.globalAlpha = 1 - poof.animatedframes / poof.animatetotalframes;
			ctx.drawImage(imgPoof, -imgTrackWidth/2+15, -imgTrackWidth/2+10);
	    	ctx.restore();
	    	poof.animatedframes++;
	    	if (poof.animatedframes > poof.animatetotalframes) {
	    		poofs.splice(i,1);
	    		poof = undefined;
	    	}
		}	
	}


///////////////////////////////////////	
	function getButton(name) { //returns button in toolbar with text name
		var toolButtons = getCurrentToolButtons();
	    
	    for (var i=0; i<toolButtons.length; i++) {
	  	    if (toolButtons[i].name == name) {
	  		    return toolButtons[i];
	  	    } 
	    }
	 	
	    return undefined;
	}
	
	function onClickDown (mouseX, mouseY, e) { //for handling both mouse and touch events
		console.log("Click down. mouseX="+ mouseX+" mouseY="+mouseY);
		mouseX /= globalScale;
		mouseY /= globalScale;
    	var worldMouse = screenToWorld(mouseX, mouseY);
    	var screenMouse = worldToScreen(worldMouse.xtile, worldMouse.ytile);
		if (interactionState == 'TitleScreen') {
			if (buttonDims['Levels'].inside(mouseX, mouseY)) {
				interactionState = 'Levels';
				draw();
			}	
			else if (buttonDims['Freeplay'].inside(mouseX, mouseY)) {
				interactionState = 'Freeplay';
				calculateLayout();
				draw();
			}	
			else if (buttonDims['HelloWorld'] && buttonDims['HelloWorld'].inside(mouseX, mouseY)) {
				console.log("Hello World"); 
				interactionState = 'Freeplay';
				calculateLayout();
				openTrxJSON(decompress(trxHelloWorld));
				updateUndoHistory();
				buildTrains();
				if (!getButton("Play").down) pushPlayButton(true);
				zoomScale = 1.0;
				draw();
			}
			else if (buttonDims['UnlockLevels'] && buttonDims['UnlockLevels'].inside(mouseX, mouseY)) {
				console.log("Prompt to pay to unlock all levels");
			}
			else if (buttonDims['ToggleToolbar'] && buttonDims['ToggleToolbar'].inside(mouseX, mouseY)) {
				console.log("Toggle toolbar");
				useAdvancedToolbar = !useAdvancedToolbar;
				if (useAdvancedToolbar) localStorage.setObject('useAdvancedToolbar', "TRUE");
				else localStorage.setObject('useAdvancedToolbar', "FALSE");
				calculateLayout();
				drawAboutScreen();
			}
/*			else if (buttonDims['Rate'] && buttonDims['Rate'].inside(mouseX, mouseY)) {
				console.log("Rate this app");
				AppRate.preferences.storeAppURL = {
					ios: '<my_app_id>',
					android: 'market://details?id=<package_name>',
					windows: 'ms-windows-store://pdp/?ProductId=<the apps Store ID>',
					blackberry: 'appworld://content/[App Id]/',
					windows8: 'ms-windows-store:Review?name=<the Package Family Name of the application>'
				};
				AppRate.promptForRating();			
			}
*/			else if (buttonDims['About'].inside(mouseX, mouseY)) {
				drawAboutScreen();
			} else {
				draw();
			}	
		} else if (interactionState == 'Levels') {
			// loop through button positions to see if clicked in button
			for (i=0; i<trainerLevelNames.length; i++) {
				index = trainerLevelNames[i];
				if (buttonDimLevels[index].inside(mouseX, mouseY)) {
					if (!trainerLevelLocked[index] || debugMode) {
						currentTrackSet = index;
						interactionState = 'Choose track';
						draw();
					}
				}
			}
			if(buttonDimLevels['Levels-back'].inside(mouseX, mouseY)) {
				interactionState = 'TitleScreen';
				draw();
			}
		} else if (interactionState == 'Choose track') {
			// loop through button positions to see if clicked in button
			for (i=0; i<10; i++) {
				index = "track "+ i;
				if (buttonDimLevels[index].inside(mouseX, mouseY)) {
					text = currentTrackSet + "-" + i; 
					if (unlockedTrx[text] || debugMode) {
						currentTrackNumber = i;
						interactionState = 'Try level';
						calculateLayout();
						console.log("Open set="+currentTrackSet+" numbree="+currentTrackNumber);
						openTrxJSON(decompress(trxLevels[currentTrackSet][currentTrackNumber]));
						updateUndoHistory();
						buildTrains();
						if (getButton("Play").down) pushPlayButton(false);
						draw();
					}
				}
			}
			if(buttonDimLevels['Levels-back'].inside(mouseX, mouseY)) {
				interactionState = 'Levels';
				draw();
			}
		} else if (interactionState == 'StarScreen') {
			console.log("Click star screen");
			performToolButton(mouseX, mouseY);
			if (buttonDims['Try again'] && buttonDims['Try again'].inside(mouseX, mouseY)) {
				console.log ("Try again");
				interactionState = "Try level";
				openTrxJSON(decompress(trxLevels[currentTrackSet][currentTrackNumber]));
				buildTrains();
				if (getButton("Play").down) pushPlayButton(false);
				draw();
			} else if (buttonDims['Next track'] && buttonDims['Next track'].inside(mouseX, mouseY)) {
				//console.log("Next track");
				interactionState = "Try level";
				currentTrackNumber++;
				if (trxLevels[currentTrackSet][currentTrackNumber]) {
					openTrxJSON(decompress(trxLevels[currentTrackSet][currentTrackNumber]));
					buildTrains();
					updateUndoHistory();
					if (getButton("Play").down) pushPlayButton(false);
					draw();
				} else {
					interactionState = 'Levels';
					draw();
				}
			} else if (buttonDims['Back'] && buttonDims['Back'].inside(mouseX, mouseY)) {
				interactionState = 'Levels';
				draw();
			}
		} else if (modalTrack) { //detect clicks for choosing wye prompt direction 
			console.log("Click down for promt");	
			worldMouse.xtile -= 0.5;
			worldMouse.ytile -= 0.5;
			var angle = (10+8/(2*Math.PI)*Math.atan2 (modalTrack.gridy-worldMouse.ytile, modalTrack.gridx-worldMouse.xtile)-modalTrack.orientation)%8;	
			if (angle > 4)  modalTrack.state = "right";
			else modalTrack.state = "left";
			modalTrack = undefined;
			interval = setInterval(interpretAndDraw, 20);			
        } else if (showToolBar) { //freeplay
			var mouseYWorld = mouseY*tileRatio; //world coordinates
			//see if clicked in button caption (button caption is a caption balloon that pops up from button in button bar)
			if (currentCaptionedButton != undefined) {	
				if (mouseX > buttonCaptionX && mouseX < (buttonCaptionX+3*tileWidth) && mouseYWorld > buttonCaptionY && mouseYWorld < (buttonCaptionY+3*tileWidth)) {
					//inside caption
					var nBin = 3*Math.floor((mouseYWorld-buttonCaptionY)/tileWidth) + Math.floor((mouseX-buttonCaptionX)/tileWidth);
					console.log ("Clicked in button caption. bin=" + nBin);
					if (getButton("Save").down) {
						console.log("Save");
						//getButton("Save").down = false;
						saveTrx(nBin);
					} else {
						console.log("Open");
						//getButton("Open").down = false;
						openTrx(nBin);
					}
					return;
				} else { //outside button caption
					currentCaptionedButton = undefined;
					getButton("Open").down = false;
					getButton("Save").down = false;
					draw();
				}
			} else if (mouseX < tracksWidth && mouseY < tracksHeight) { //in track space
				if (shiftIsPressed) {
					isPanning = true;
					panStartX = mouseX;
					panStartY = mouseY;
					startCenterTileX = centerTileX;
					startCenterTileY = centerTileY;
				} else if (optionIsPressed) {
					isZooming = true;
					zoomStartX = mouseX;
					zoomStartY = mouseY;
					startZoomScale = zoomScale;
						e.target.style.cursor = 'zoom-in';
				} else { //pass click to track space
					var worldMouse = screenToWorld(mouseX, mouseY);
					var screenMouse = worldToScreen(worldMouse.xtile, worldMouse.ytile);
					startXPoint = mouseX;
					startYPoint = mouseY;
					var gridx = Math.floor(worldMouse.xtile); 
					var gridy = Math.floor(worldMouse.ytile); 
			
					var isInSecondaryCaption = false;
					var isInPrimaryCaption = false;
					if ((secondaryCaption) && captionSecondaryX !=undefined && worldMouse.xtile >= captionSecondaryX && worldMouse.xtile< captionSecondaryX+captionSecondaryWidth && worldMouse.ytile >= captionSecondaryY && worldMouse.ytile< captionSecondaryY+captionSecondaryHeight) {
						isInSecondaryCaption = true;
						console.log("In secondary----nnn");
					}
					//console.log ("zzzzzzzz"+gridx+"   "+captionX+"    "+captionWidth);
					if (captionX !=undefined && gridx >= captionX && gridx< captionX+captionWidth && gridy >= captionY && gridy< captionY+captionHeight) {
						isInPrimaryCaption = true;
						console.log("In primary");
					}
					if (!isInPrimaryCaption && !isInSecondaryCaption) {
						//console.log("Deselect caption");
						secondaryCaption = undefined;
						captionX = undefined;
						currentCaptionedObject = undefined;	
						draw();
					}
					
					//check if track button down
					if (!getButton("Track") || getButton("Track").down) {
						isDrawingTrack = true;
						addPointTrack(worldMouse.xtile, worldMouse.ytile);
					}
					
					//check if engine button down
					if (getButton("Engine")) if (getButton("Engine").down) {
						isDrawingEngine = true;
						addPointEC(worldMouse.xtile, worldMouse.ytile);
					}
					
					//check if select button down
					if (getButton("Select")) if (getButton("Select").down) {
						console.log("Select button down----");
						if (worldMouse.xtile>Math.min(startSelectXTile, endSelectXTile) && worldMouse.ytile>Math.min(startSelectYTile, endSelectYTile)
						&& worldMouse.xtile<Math.max(startSelectXTile, endSelectXTile) && worldMouse.ytile<Math.max(startSelectYTile, endSelectYTile)) {
							//move current selection
							console.log("In selection. Move");
							isMoving = true;
							startMoveXTile = worldMouse.xtile;
							startMoveYTile = worldMouse.ytile;
							
						} else { 
							//start new selection
							isSelecting = true;
							startSelectXTile = Math.round(worldMouse.xtile);
							startSelectYTile = Math.round(worldMouse.ytile);
							console.log("startSelectXTile="+startSelectXTile+","+startSelectYTile);
//				    		startSelectXTile = tempPointScreen.x;
	//			    		startSelectYTile = tempPointScreen.y;
						}
					} 
					
					//check if car button down
					if (getButton("Car")) if (getButton("Car").down) {
						isDrawingCar = true;
						addPointEC(worldMouse.xtile, worldMouse.ytile);
					}
					
					//check if cargo button down
					if (getButton("Cargo")) if (getButton("Cargo").down && currentCaptionedObject == undefined) {
						var worldPoint = screenToWorld(mouseX, mouseY); 
						var gridx = Math.floor(worldPoint.xtile); 
						var gridy = Math.floor(worldPoint.ytile);
						console.log("gridx="+gridx+" gridy"+gridy);
						if (tracks[mi(gridx,gridy)] == undefined || tracks[mi(gridx,gridy)] == null) {
							//if no track at that location then add TrackBlank with "A"
							console.log("Empty grid, add blank Track");
							new Track(gridx, gridy, "trackblank");
							tracks[mi(gridx,gridy)].cargo = new Cargo(0,1);
							updateUndoHistory();
							draw();
						}
						
						
					}

					if (getButton("Water") && getButton("Water").down) {
						console.log("Water draw");
						var worldPoint = screenToWorld(mouseX, mouseY); 
						var gridx = Math.floor(worldPoint.xtile); 
						var gridy = Math.floor(worldPoint.ytile);
						var track = tracks[mi(gridx,gridy)];
						if (track && track.immutable) {
							console.log("immutable so no new water");
						} else {
							new Track(gridx, gridy, "trackwater");
							updateUndoHistory();
							draw();
						}
					}

					//check if erase button down
					if (getButton("Eraser") && getButton("Eraser").down) {
						//if (!commandIsPressed) {
						isErasing = true;
						var worldPoint = screenToWorld(mouseX, mouseY); 
						var gridx = Math.floor(worldPoint.xtile); 
						var gridy = Math.floor(worldPoint.ytile);
						//console.log("gridx="+gridx+" gridy="+gridy);
						var train;
						
						//delete clicked engine
						for (var i=0; i<engines.length; i++) {
							if (engines[i].gridx == gridx && engines[i].gridy == gridy && !engines[i].immutable) {
								//console.log("Delete engine i=" + i);
								train = trains[i];
								var oldEngine = engines.splice(i,1); //delete engine
								if (currentCaptionedObject == oldEngine) currentCaptionObject = undefined;
								delete oldEngine;
								i = engines.length;
								draw();
							}
						}
		
						//delete clicked car
						for (var i=0; i<cars.length; i++) {
							if (cars[i].gridx == gridx && cars[i].gridy == gridy && !cars[i].immutable) {
								if (cars[i].cargo == null) {
									console.log("Delete car i=" + i);
									train = getTrain(cars[i]);
									//console.log("Deleted car is in train of length="+train.length);
									var oldCar = cars.splice(i,1); //delete car
									if (currentCaptionedObject == oldCar) currentCaptionObject = undefined; //remove caption bubble if its car is deleted
									delete oldCar;
									i = cars.length;
								} else {
									console.log ("Car has cargo. Delete cargo");
									cars[i].cargo = null;
									draw();
								}
								
							}
						}
						
						//if deleted engine or car then rebuild train
						if (train) {
							console.log ("Rebuild train after delete");
							//set cars in this train to speed 0 and rebuild train to account for disconnecting a car from an engine or deleting an engine
							for (var t=0; t<train.length; t++) {
								if (train[t].type != "enginebasic") {
									if (train[t].speed < 0) reverseSpeed(train[t]);
									train[t].speed = 0;
								}
							}
							
							buildTrains(); 
							draw();
						}
					/*	} else { //command is click so toggle track immutable
							var worldPoint = screenToWorld(mouseX, mouseY); 
							var gridx = Math.floor(worldPoint.xtile); 
							var gridy = Math.floor(worldPoint.ytile);
							if (tracks[mi(gridx,gridy)]) {
								console.log("Make immutable");
								tracks[mi(gridx,gridy)].immutable = !tracks[mi(gridx,gridy)].immutable;
							}
							draw();
						}*/
					} else if (getButton("Lock") && getButton("Lock").down) {
						var worldPoint = screenToWorld(mouseX, mouseY); 
						var gridx = Math.floor(worldPoint.xtile); 
						var gridy = Math.floor(worldPoint.ytile);
						if (tracks[mi(gridx,gridy)]) {
							console.log("Make immutable");
							tracks[mi(gridx,gridy)].immutable = !tracks[mi(gridx,gridy)].immutable;
						}
						draw();
					}
				}
			} else { // in toolBar
				//deselect track area captions
				currentCaptionedObject = undefined;
				secondaryCaption = undefined;
				endSelectXTile = startSelectXTile;
				endSelectYTile = startSelectYTile;
				performToolButton(mouseX, mouseY);
			}
		} else { //if toolbar hidden then toggle play trains for any click
        	console.log("Push play button");
        	pushPlayButton(true);
        }
	}

	function performToolButton(mouseX, mouseY){
		//check if buttons clicked
		var pushedButton;
		var toolButtons = getCurrentToolButtons();

		for (var i=0; i<toolButtons.length && pushedButton == undefined; i++) {
			if (mouseX > toolButtons[i].x+tracksWidth && mouseY > toolButtons[i].y && mouseX < toolButtons[i].x+toolButtons[i].width+tracksWidth && mouseY < toolButtons[i].y + toolButtons[i].height) {
				pushedButton = i;
			} 
		}
											
		if (pushedButton == undefined) return;
			
		if (!toolButtons[pushedButton].disabled) {
			switch (toolButtons[pushedButton].name) {
				case "Play":
					//console.debugger("Testttttt");
					pushPlayButton(true);
					draw();

					//RequestReview
					if (getButton("Play").up && Math.random()<0.1) {
						var requestReview = function(){
							try{
							var success = function() {
								console.log("success");
							}
							var failure = function() {
								console.log("Error calling plugin");
							}
							inappreview.requestReview(success, failure);
							}catch(e){
							console.log("catch: "+e);
							}
						};	
						requestReview();
					}				
					break;
				case "Track":
					break;
				case "Engine":
					break;
				case "Eraser":
					break;
				case "Lock":
					//console.log("Lock button clicked");
					if (optionIsPressed) { //lock all
						//console.log("Lock all");
						for (var key in tracks) {
							tracks[key].immutable = true;
						}
					}
					if (shiftIsPressed) { //unlock all
						//console.log("Unlock all");
						for (var key in tracks) {
							tracks[key].immutable = false;
						}
					}
					break;
				case "Select":
					break;
				case "Save":
					currentCaptionedButton = getButton("Save");
					getButton("Save").down = true;
					getButton("Open").down = false;
					break;
				case "Open":
					currentCaptionedButton = getButton("Open");
					getButton("Open").down = true;
					getButton("Save").down = false;
					break;
				case "Upload":
					if (currentUserID == 1) {
						uploadTrackDialog()
						signinUserDialog();
					} else {
						uploadTrackDialog();
					}
					break;
				case "Download":
//							var iframeBrowse = parent.document.getElementById('browseframeid');
					if (iframeBrowse) {
						iframeBrowse.height = 750;
						var iframeTrain = parent.document.getElementById('trainframeid');
						if (iframeTrain) iframeTrain.height = 0;
					} else {
						downloadTrackDialog();
					}
					break;
				case "Clear":
					clearAll();
					break;
				case "Home":
					getButton("Play").down = false;
					clearInterval(interval);
					interactionState = 'TitleScreen';
					draw();
					break;
				case "Undo":
					undoTrx();
					break;
				case "Redo":
					redoTrx();
					break;
				case "Write":
					writeTrx();
					break;
				case "Read":
					readTrx();
					break;
				case "Octagon":
					getButton("Octagon").down = !getButton("Octagon").down;
					useOctagons = getButton("Octagon").down;
					break;
				case "Signin":
					signinUserDialog();
					break;
				case "Repeat":
					interactionState = "Try level";
					openTrxJSON(decompress(trxLevels[currentTrackSet][currentTrackNumber]));
					buildTrains();
					if (getButton("Play").down) pushPlayButton(false);
					draw();
					break;
				case "Back":
					interactionState = "Choose track";
					if (getButton("Play").down) pushPlayButton(false);
					draw();
				case "Water":
					break
				default:
					console.log("button not found");
			}
		}

		//toggle up/down if button is in a group
		if (toolButtons[pushedButton].group && !toolButtons[pushedButton].down) {
			toolButtons[pushedButton].down = true;
			for (var i=0; i<toolButtons.length; i++) {  //set other buttons in same group to up
				//console.log("i-"+i);
				if (i != pushedButton && toolButtons[i].group == toolButtons[pushedButton].group ) toolButtons[i].down = false;
			}
		}

		draw();
	}

	function drawAboutScreen() {
		draw();
		ctx.save();
		ctx.fillStyle = aboutColor;
		ctx.fillRect (0,0,canvasWidth,0.7*canvasHeight);
		ctx.font = "20px Arial";
		ctx.textAlign = 'center'; 
		ctx.fillStyle = fontColor;
		text = '"Train" is a completely visual programming language to teach 2 to 102 year olds how to code.\n\nPrograms in Train look just like a wooden toy train set. Executing a program means starting the engines\nand watching the trains move about the tracks. Each engine represents a separate thread so a multithreaded\nprogram is just train tracks with multiple trains. Cars attached to an engine are variables/memory. Cargo\nthat rest on cars is the value of the variable. There are several sets of cargo that represent different\ndata types in Train including numbers, colors, letters, binary, and dinosaurs. Program control is\nprovided by forks ("wyes") and physcal loops in the track which implement if/then and while/loop logic.\nStations in Train allow wooden blocks to be operated on including adding a value to memory (adding a block\nto a car), freeing memory (removing a block from a car), incrementing, decrementing, addition, subtraction,\nmultiplication, and division. Wyes include greater than, less than, equal, lazy, sprung, prompt, and\nrandom. Slingshot and catapult station remove blocks from cars and place them on the ground as a form of\noutput. "Magic" tunnels act as goto statements allowing for the creation of functions. Programs are\ncreated in Train by simply drawing them on the screen.\n\nCreated by Sean G. Megason\nPlease send comments to: coments@train-hub.org . Join the community at http://train-hub.org\nTrain is Open Source at https://github.com/smegason/train.';
		var lineHeight = ctx.measureText("M").width * 1.35;
		var lines = text.split("\n");
		var x=canvasWidth/2, y=canvasHeight*0.05;
		for (var i = 0; i < lines.length; ++i) {
			ctx.fillText(lines[i], x, y);
			y += lineHeight;
		}

		var nButtons = 3;

		drawImageButton(                    canvasWidth*1/nButtons, canvasHeight*0.63,canvasWidth*0.15,canvasHeight*0.08, "HelloWorld", false, true, buttonColor, buttonBorderColor);
		buttonDims['HelloWorld'] = new box(canvasWidth*1/nButtons, canvasHeight*0.63,canvasWidth*0.15,canvasHeight*0.12);
		
//		drawImageButton(                    canvasWidth*2/nButtons, canvasHeight*0.63,canvasWidth*0.12,canvasHeight*0.08, "Rate", false, true, buttonColor, buttonBorderColor);
//		buttonDims['Rate'] = new box(canvasWidth*2/nButtons, canvasHeight*0.63,canvasWidth*0.15,canvasHeight*0.08);
		
		if (useAdvancedToolbar) {
			drawImageButton(             canvasWidth*2/nButtons, canvasHeight*0.63,canvasWidth*0.15,canvasHeight*0.08, "Advanced", false, true, buttonColor, buttonBorderColor);
		} else {
			drawImageButton(             canvasWidth*2/nButtons, canvasHeight*0.63,canvasWidth*0.15,canvasHeight*0.08, "Basic", false, true, buttonColor, buttonBorderColor);
		}
		buttonDims['ToggleToolbar'] = new box(canvasWidth*2/nButtons, canvasHeight*0.63,canvasWidth*0.15,canvasHeight*0.12);

		//uncomment if ever add functionality for in-app purchase to unlock levels
//		if (!allLevelsUnlocked) {
//			drawImageButton(              canvasWidth*4/nButtons, canvasHeight*0.63,canvasWidth*0.12,canvasHeight*0.08, "UnlockLevels", false, false, buttonColor, buttonBorderColor);
//			buttonDims['UnlockLevels'] = new box(canvasWidth*4/nButtons, canvasHeight*0.63,canvasWidth*0.15,canvasHeight*0.08);
//		}

		ctx.restore();
	}

	function clearAll() {
		tracks = {};//createArray(trackArrayWidth, trackArrayHeight);
		engines.length = 0;
		cars.length = 0;
		trains.length = 0;
		captionX = undefined;
		secondaryCaption = undefined;
		draw();		
	}
	
	function pushPlayButton(doPlaySound) {
		if (getButton("Play").down) {
			if(doPlaySound) playSound("stop");
			clearInterval(interval);
		} else {
			updateUndoHistory();
			clearInterval(interval);
			if (doPlaySound) playSound("choochoo");
			skip = 10;
			var d = new Date();
			if (startTimePlay == undefined) startTimePlay = d.getTime();
			interval = setInterval(interpretAndDraw, 20);
		}
		getButton("Play").down = !getButton("Play").down; // toggle state
	}	
	
	function getCurrentToolButtons() {
		var retValue;
	    if (interactionState == 'Freeplay') retValue = toolButtonsFreeplay;
	    else retValue = toolButtonsLevels;
	    
	    return retValue;
	}	
	
    function onClickMove(mouseX,mouseY, e) { //for mouse move or touch move events
        if (!showToolBar) return; //if toolbar hidden then ignore events
		mouseX /= globalScale;
		mouseY /= globalScale;
		var worldMouse = screenToWorld(mouseX,mouseY);
        
	    //change mouse cursor
		if (e) if (mouseX<tracksWidth)  { // in track area
			if (getButton("Engine")) {
				if (getButton("Engine").down || getButton("Track").down) {
					e.target.style.cursor = 'crosshair';
				} else if (getButton("Eraser").down) {
					e.target.style.cursor = 'no-drop';
				} else if (getButton("Lock").down) {
					e.target.style.cursor = 'pointer';
				} else if (!isSelecting) {
					if (worldMouse.xtile>Math.min(startSelectXTile, endSelectXTile) && worldMouse.ytile>Math.min(startSelectYTile, endSelectYTile)
						&& worldMouse.xtile<Math.max(startSelectXTile, endSelectXTile) && worldMouse.ytile<Math.max(startSelectYTile, endSelectYTile)) {
						e.target.style.cursor = 'move';
						allTilesDirty = true;
					} else {
						e.target.style.cursor = 'default';
					}	
				} else if (isMoving) {
					e.target.style.cursor = 'move';
					allTilesDirty = true;
				} else {
					e.target.style.cursor = 'default';
				}
			} else { // no engine button because in track mode
				e.target.style.cursor = 'crosshair';
			}
	    } else {
   			e.target.style.cursor = 'default';
	    }

		if (isZooming || optionIsPressed) {
			e.target.style.cursor = 'zoom-in';
   			allTilesDirty = true;
		}
		if (isPanning || shiftIsPressed) {
			 e.target.style.cursor = 'move';
   			allTilesDirty = true;
			}
		
	    if (mouseX < tracksWidth && mouseY < tracksHeight) {
	    	if (isDrawingTrack) {
	    		addPointTrack(worldMouse.xtile, worldMouse.ytile);
	    	}
	    	
	    	if (isDrawingEngine || isDrawingCar) {
	    		addPointEC(worldMouse.xtile, worldMouse.ytile);
	    	}
	    	
       		if (isPanning) {
       			centerTileX = startCenterTileX - (mouseX-panStartX)/tileWidth;
       			centerTileY = startCenterTileY - (mouseY-panStartY)/(tileWidth*tileRatio);
       			draw();
       			return;
       		}
 	    	if (isZooming) {
	    		zoomScale = startZoomScale * Math.pow(zoomMultiplier, 10*(zoomStartY - mouseY)/canvasHeight);
	    		if (zoomScale<0.2) zoomScale = 0.2;
	    		if (zoomScale>5) zoomScale = 5;
	    		draw();
	    		return;	
	    	}
	    	
	    	if (isSelecting) {
	    		endSelectXTile = worldMouse.xtile;
	    		endSelectYTile = worldMouse.ytile;
	    		draw();
	    	}
	    	
	    	if (isMoving) {
	    		endMoveXTile = worldMouse.xtile;
	    		endMoveYTile = worldMouse.ytile;
	    		draw();
	    	}
	    	
	    	if (isErasing) {
				var worldPoint = screenToWorld(mouseX, mouseY); 
				var gridx = Math.floor(worldPoint.xtile); 
				var gridy = Math.floor(worldPoint.ytile);
	    		var ecDel = getEC(gridx, gridy);
	    		var redraw = false;
	    		if (ecDel) {
	    			deleteEC(ecDel); 
	    			redraw = true;
	    		}
	    		if (tracks[mi(gridx,gridy)]) if (!tracks[mi(gridx,gridy)].immutable) {
	    			delete tracks[mi(gridx,gridy)]; 
	    			redraw = true;
	    		}
	    		if (redraw) draw();
	    	}
	    }
	}
	   
    function onClickUp(mouseX, mouseY, e) {
 		mouseX /= globalScale;
		mouseY /= globalScale;
		allTilesDirty = true;
        if (!showToolBar) return; //if toolbar hidden then ignore events
		isPanning = false;
		isZooming = false;
		
		var mouseWorld = screenToWorld(mouseX, mouseY);
		var gridx = Math.floor(mouseWorld.xtile); 
		var gridy = Math.floor(mouseWorld.ytile); 
		lastClickUp = mouseWorld;

	    if (mouseX < tracksWidth && mouseY < tracksHeight) { //in track space
			var distanceSq = Math.pow((startXPoint-mouseX),2) + Math.pow((startYPoint-mouseY),2);
	    	if (distanceSq<10) { //select object for caption if mouse up near mouse down
	    		if ((secondaryCaption) && captionSecondaryX !=undefined && mouseWorld.xtile >= captionSecondaryX && mouseWorld.xtile< captionSecondaryX+captionSecondaryWidth && mouseWorld.ytile >= captionSecondaryY && mouseWorld.ytile< captionSecondaryY+captionSecondaryHeight) {
    				//clicked in secondary caption ***********************
					var fracX = (mouseWorld.xtile- captionSecondaryX)/captionSecondaryWidth; //account for for border then divide
					var fracY = (mouseWorld.ytile- captionSecondaryY/tileRatio)/(captionSecondaryHeight/tileRatio);
					fracX= Math.max(0.01, fracX);
					fracX= Math.min(0.99, fracX);
					fracY= Math.max(0.01, fracY);
					fracY= Math.min(0.99, fracY);

					//get cargo subarray
					var iCargo;
					for (var i=0; i<cargoValues.length; i++) {
						if (cargoValues[i][0] == secondaryCaption.type) iCargo = i;
					}
					if (iCargo == undefined) {
						console.log("ERROR- cargo not found");
						return;
					}
					
					var array = [];
					var nCols = Math.floor(Math.sqrt(cargoValues[iCargo].length-1));
					var nRows = Math.ceil((cargoValues[iCargo].length-1) / nCols);
					
					var row= Math.floor(nRows*fracY);
					var col= Math.floor(nCols*fracX);
					var i = row*nCols + col; //which item was selected
					i = Math.min(i, cargoValues[iCargo].length-2);
					currentCaptionedObject.cargo = new Cargo(i,iCargo); 
					updateUndoHistory();
					secondaryCaption = undefined;
					captionX = undefined;
					currentCaptionedObject = undefined;
    			} else {
    				secondaryCaption = undefined;
					captionSecondaryX = undefined;
    			
					if (captionX !=undefined && mouseWorld.xtile >= captionX && mouseWorld.xtile< captionX+captionWidth && mouseWorld.ytile >= captionY && mouseWorld.ytile< captionY+captionHeight) {
						//clicked in caption (primary) *******************
						var fracX = (mouseWorld.xtile- captionX)/captionWidth;
						var fracY = (mouseWorld.ytile- captionY)/captionHeight;
						fracX= Math.max(0.01, fracX);
						fracX= Math.min(0.99, fracX);
						fracY= Math.max(0.01, fracY);
						fracY= Math.min(0.99, fracY);

						//which caption was cliked in
						if (currentCaptionedObject) switch (currentCaptionedObject.type) { 
							case "enginebasic":
								//adjust speed
								fracX = (worldPoint.xtile-captionX)/captionWidth;
								fracY = (worldPoint.ytile-captionY)/captionHeight;
								var angle = Math.atan2(fracY-0.8,fracX-0.5);
								if (angle>1) angle = -Math.PI;
								var speed = (2*angle/Math.PI+1)*maxEngineSpeed;
								speed = Math.min(speed, maxEngineSpeed);
								speed = Math.max(speed, -maxEngineSpeed);
								speed = (maxEngineSpeed/(nNumSpeeds/2))*Math.round(speed/(maxEngineSpeed/(nNumSpeeds/2)));
								//find train
								var nEngine;
								for (var k=0; k<engines.length && !nEngine; k++) {
									if (engines[k] == currentCaptionedObject) nEngine = k;
								}
								if (nEngine == undefined) console.log ("ERROR- did not find nEngine");
								var train = trains[nEngine];
		
								// change orientation for ECs on corner tracks if speed reversed
								if (train) {
									if ((currentCaptionedObject.speed>=0 && speed<0) || (currentCaptionedObject.speed<0 && speed>=0)) {
										for (var k=0; k<train.length; k++) {
											reverseSpeed(train[k]);
										}
									}
								} else {
									reverseSpeed(currentCaptionedObject);
								}
								
								//change speed of whole train
								if (train) for (var k=0; k<train.length; k++) {
									train[k].speed = speed;
								}
								currentCaptionedObject.speed = speed;
								break;
							case "carbasic":
							case "trackblank":
							case "trackcargo":
								var row = Math.floor(fracY*buttonsCargoTypes.length);
								var col = Math.floor(fracX*buttonsCargoTypes[row].length);
								secondaryCaption = {
									'type': buttonsCargoTypes[row][col],
									'X': mouseX,
									'Y': mouseY/tileRatio
								};
								break;
							case "trackstraight":
								var row = Math.floor(fracY*buttonsStation.length);
								var col = Math.floor(fracX*buttonsStation[row].length);
								if (col<0) col =0;
								if (col>4) col =4;
								currentCaptionedObject.subtype = buttonsStation[row][col];
								if (interactionState != "Freeplay") {
									col = Math.floor(fracX*buttonsStationTrack[row].length);
									if (col<0) col =0;
									currentCaptionedObject.subtype = buttonsStationTrack[row][col];
								}
								if (!(currentCaptionedObject.subtype == "none" ||
								    currentCaptionedObject.subtype == "redtunnel" ||
									currentCaptionedObject.subtype == "bluetunnel" ||
									currentCaptionedObject.subtype == "greentunnel")) 
										addTrackCargo(currentCaptionedObject);
								break;
							case "trackwye":
							case "trackwyeleft":
							case "trackwyeright":
								var row = Math.floor(fracY*buttonsWye.length);
								var col = Math.floor(fracX*buttonsWye[row].length);
								currentCaptionedObject.subtype = buttonsWye[row][col];
								if (currentCaptionedObject.subtype  == "compareequal"
								|| currentCaptionedObject.subtype  == "compareless"
								|| currentCaptionedObject.subtype  == "comparegreater" ) {
									addTrackCargo(currentCaptionedObject);
								}
								break;
						}
						updateUndoHistory();
							
					} else if (secondaryCaption == undefined) { //select object for new caption *****************
						currentCaptionedObject = undefined;

						var track = tracks[mi(gridx,gridy)];
						if ((track && track.immutable) || interactionState != 'Freeplay') {
						} else {
							//see if clicked engine or car
							var foundEC = false;
							if (getButton("Eraser") && !getButton("Eraser").down) {
									captionX = undefined;
								currentCaptionedObject = getEC(gridx, gridy); 
								if (currentCaptionedObject != undefined) foundEC = true;
							}
							
							//see if clicked track
							if (((getButton("Eraser") && !getButton("Eraser").down) || interactionState != "Freeplay") && !foundEC ) {
								if (tracks[mi(gridx,gridy)] != undefined) {
									if (tracks[mi(gridx,gridy)].type == "trackwye" || tracks[mi(gridx,gridy)].type == "trackwyeleft" 
									|| tracks[mi(gridx,gridy)].type == "trackwyeright" || tracks[mi(gridx,gridy)].type == "trackstraight"
									|| tracks[mi(gridx,gridy)].type == "trackcargo"|| tracks[mi(gridx,gridy)].type == "trackblank") {
										currentCaptionedObject = tracks[mi(gridx,gridy)];
										captionX = undefined;
									}
								} 
							}
						}
					}
				}
	    		
	    		draw();
	    	}
	    }
 	    	
    	if (isDrawingTrack) {
			var distSq = Math.pow((startXPoint-mouseX),2) + Math.pow((startYPoint-mouseY),2);
			if (distSq>50 && distSq<5000) {
				//toggle direction of wye
				var track = tracks[mi(gridx,gridy)];
				if (track && track.type && !track.immutable && (track.type == "trackwye" || track.type == "trackwyeright" || track.type == "trackwyeleft")) {
					if (track.state == "left") track.state = "right";
					else track.state = "left";
				}
			}
			endDrawingTrack();
	    	draw();
	    }
    	if (isDrawingEngine || isDrawingCar) {
    		//make engine at startpoint in direction from down to up

    		if (startXPoint != undefined) {
    			var startXTile = Math.floor(mouseWorld.xtile); 
    			var startYTile = Math.floor(mouseWorld.ytile);
    			var distSq = Math.pow((startXPoint-mouseX),2) + Math.pow((startYPoint-mouseY),2);
				if (tracks[mi(startXTile,startYTile)] && distSq>10 ) {
	    			var fraction = Math.atan2(mouseY-startYPoint, mouseX-startXPoint)/(2*Math.PI) + 0.25;
	    			var orientation = Math.round(8*fraction+8)%8;
	    			if (trackConnects(tracks[mi(startXTile,startYTile)], (orientation+4)%8)) {
	    				if (getEC(startXTile, startYTile) == undefined) { //dont put ec on top of current ec
							if (isDrawingEngine) new EC(startXTile, startYTile, "enginebasic", orientation, "", 20, 0.5);
							if (isDrawingCar) new EC(startXTile, startYTile, "carbasic", orientation, "", 0, 0.5);
							updateUndoHistory();
							buildTrains();
						}
					}
				}
				
				endDrawingEC();
		    	draw();
    		}

	    }

    	if (isSelecting) {
    		endSelectXTile = Math.round(mouseWorld.xtile);
    		endSelectYTile = Math.round(mouseWorld.ytile);
    		draw();
   			if (e) {
   				if (mouseWorld.xtile>Math.min(startSelectXTile, endSelectXTile) 
	   			 && mouseWorld.ytile>Math.min(startSelectYTile, endSelectYTile)
	   			 && mouseWorld.xtile<Math.max(startSelectXTile, endSelectXTile)
	   			 && mouseWorld.ytile<Math.max(startSelectYTile, endSelectYTile))
 	  			  e.target.style.cursor = 'move';
 	  		}
    	}
    	
    	if (isMoving) {
    		endMoveXTile = mouseWorld.xtile;
    		endMoveYTile = mouseWorld.ytile;
    		moveX = undefined
			isMoving = false;
			
			//copy tracks and ecs
			var upperLeftSelectXTile = Math.round(Math.min(startSelectXTile, endSelectXTile)); 
			var upperLeftSelectYTile = Math.round(Math.min(startSelectYTile, endSelectYTile));
			var lowerRightSelectXTile = Math.round(Math.max(startSelectXTile, endSelectXTile)); 
			var lowerRightSelectYTile = Math.round(Math.max(startSelectYTile, endSelectYTile));
    		console.log("IsMoving copy: start gridx="+upperLeftSelectXTile+" y="+upperLeftSelectYTile+" end select grix="+lowerRightSelectXTile+","+lowerRightSelectYTile);
			
			//copy to buffer
			console.log("copy");
			var bufferTracks = [];
			var bufferECs = [];
			var bufferCargo = [];
			var trackCargo = [];
			for (gridx= upperLeftSelectXTile; gridx<lowerRightSelectXTile; gridx++) {
		    	for (gridy= upperLeftSelectYTile; gridy<lowerRightSelectYTile; gridy++) {
		    		//copy track 
		    		var track = tracks[mi(gridx,gridy)];
		    		if (track) {
						//copy track
						var temp = []; // gridx, gridy, type, orientation, state, speed, position
						temp.push(gridx, gridy, track.type, track.orientation, track.state, track.subtype);
						bufferTracks.push(temp);
		    			if (track) {
							trackCargo.push (track.cargo);
							console.log("cargo type=");
							console.log(track.cargo);
						 } else {
							trackCargo.push(undefined);
						}

						//copy ec
						var temp2 = [];
						var ec =getEC(gridx, gridy);
						if (ec) {
							temp2.push(ec.gridx, ec.gridy, ec.type, ec.orientation, ec.state, ec.speed, ec.position);
							bufferCargo.push (ec.cargo);
							console.log("cargo type EC=");
							console.log(ec.cargo);
						}
						else {
							temp2 = undefined;
							bufferCargo.push (undefined);
						}
						bufferECs.push(temp2);
		    		}
		    	}
			}
			
			//clear paste destination
			console.log("clear");
			for (gridx= upperLeftSelectXTile; gridx<lowerRightSelectXTile; gridx++) {
		    	for (gridy= upperLeftSelectYTile; gridy<lowerRightSelectYTile; gridy++) {
		    		var ecOld =getEC(gridx+Math.round(endMoveXTile-startMoveXTile), gridy+Math.round(endMoveYTile-startMoveYTile));
					if (ecOld) deleteEC(ecOld); // delete any ECs for which new track is placed on top of
					delete tracks[mi(gridx+Math.round(endMoveXTile-startMoveXTile),gridy+Math.round(endMoveYTile-startMoveYTile))];
		    	}
			}

			//paste
			console.log("paste");
			while (bufferTracks.length>0) {
				var temp = bufferTracks.shift();
				new Track(temp[0]+Math.round(endMoveXTile-startMoveXTile), temp[1]+Math.round(endMoveYTile-startMoveYTile), temp[2], temp[3], temp[4], temp[5]);
				var track = tracks[mi(temp[0]+Math.round(endMoveXTile-startMoveXTile), temp[1]+Math.round(endMoveYTile-startMoveYTile))];
				if (track) track.cargo = trackCargo.shift();
				temp = bufferECs.shift();
				if (temp) {
					console.log("ADD ec");
					var newEC = new EC (temp[0]+Math.round(endMoveXTile-startMoveXTile), temp[1]+Math.round(endMoveYTile-startMoveYTile), temp[2], temp[3], temp[4], temp[5], temp[6]);
					newEC.cargo = bufferCargo.shift(); //copy cargo
				}
			}

			buildTrains();
			updateUndoHistory();			
    		draw();
    	}
    	
		isMoving = false;
		isErasing = false;
		isSelecting = false;
    	isDrawingEngine = false;
    	isDrawingCar = false;
	    
	}
	
	function endDrawingTrack() {
		//console.log("EndDrawingTrack");
		isDrawingTrack = false;
		drawingPointsTrackX.length = 0;
		drawingPointsTrackY.length = 0;
		currentXTile = undefined;
	}

	function endDrawingEC() {
		drawingPointsECX.length = 0;
		drawingPointsECY.length = 0;
		currentXTile = undefined;
		startXPoint = undefined;
	}

	function addTrackCargo(track) { //adds a new TrackCargo for the given track. The new TrackCargo will be behind the inset so one tile away
		step = getTrackCargoStep(track);
		cargoTrack = tracks[mi(track.gridx+step.stepX,track.gridy+step.stepY)];
		if (cargoTrack &&	cargoTrack.type == "trackcargo") return;
		
		if (cargoTrack && track.type == "trackstraight") {
			 if (!tracks[mi(track.gridx-step.stepX,track.gridy-step.stepY)]) { //blocked in one way but not other so rotate and new trackcargo
				track.orientation = (track.orientation +4)%8;// rotate track
				new Track(track.gridx-step.stepX, track.gridy-step.stepY, "trackcargo");
				console.log("Rotate track then new cargo");
			} else if (tracks[mi(track.gridx-step.stepX,track.gridy-step.stepY)].type == "trackcargo") { //blocked in one way and trackcargo in other way so rotate and reuse trackcargo
				track.orientation = (track.orientation +4)%8;// rotate track
				console.log("Rotate track then reuse cargo");
			} else {  //blocked both ways so make new trackcargo to replace something else
				new Track(track.gridx+step.stepX, track.gridy+step.stepY, "trackcargo");
				console.log("new track cargo");
			}
		} else { //make new TrackCargo over empty spot
			new Track(track.gridx+step.stepX, track.gridy+step.stepY, "trackcargo");
			console.log("new track cargo");
		} 		
	}
	
	function getTrackCargoStep(track) { //used for getting cargo from TrackCargo tiles to be used for adjacent wyes and stations. Returns the displacement of the cargo tile compared to the wye or station
		if (!track) console.log("ERROR- track is null for cargo. Track at "+track.gridx+" ,"+track.gridy);
		var dif = 6; //rotate differently depending on track type
		switch (track.type) {
			case "trackwyeright":
				dif = 2;
				break;
			case "trackwye":
				dif = 4;
				break;
		}
		var angle = ((tracks[mi(track.gridx,track.gridy)].orientation + 2 + dif) %8)*Math.PI/4;
		var stepX = Math.round(Math.cos(angle));
		var stepY = Math.round(Math.sin(angle));
		return {
			'stepX': stepX,
			'stepY': stepY
		};
	}
	
	function getEC(gridx, gridy) { //returns the engine or car at the given coordinates
		for (var w=0; w<engines.length; w++) {
			if (engines[w].gridx == gridx && engines[w].gridy == gridy) return engines[w];
		}

		if (cars == undefined) return;
		for (var w=0; w<cars.length; w++) {
			if (cars[w].gridx == gridx && cars[w].gridy == gridy) return cars[w];
		}
	}
	
	function getTrain(ec) { //returns the train that this ec belongs to
		for (var w=0; w<trains.length; w++) {
			train = trains[w];
			for (var x=0; x<train.length; x++) {
				if (train[x] == ec) return train;
			}
		}
	}

	function getEngine(ec) { //gets the engine for the train that this ec is in
		var train = getTrain(ec);
		for (var x=0; x<train.length; x++) {
			if (train[x].type == "enginebasic") return train[x];
		}
		return null;
}

	function isLastCarInTrain(ec) {
		var train = getTrain(ec);
		var position;
		for (var i=0; i<train.length && !position; i++) { // get ec's position in train
			if (ec == train[i]) position = i;
		}

		if (ec.speed>=0) {
			if (train.length == position+1) return true; //this is the last ec of train going forward
		} else {
			if (position == 0) return true; //this is the first ec of a train going backward
		}
		
		return false;
	}
	
	function isFirstCarInTrain(ec) {
		var train = getTrain(ec);
		var position;
		for (var i=0; i<train.length && !position; i++) { // get ec's position in train
			if (ec == train[i]) position = i;
		}
		
		if (ec.speed>=0) {
			if (position == 0) return true; //this is the first ec of train going forward
		} else {
			if (train.length == position+1) return true; //this is the last ec for a train going backwards
		}
		
		return false;
	}
	
	function buildTrains() { // connects engines with adjacent cars to make trains. A train has exactly one engine and no gaps, but engine does not have to be first
		trains.length = 0;
		for (var i=0; i<engines.length; i++) {
			var train = [];
			train.push(engines[i]);
			trains[i]=train;

			//step forward from engine and add adjacent cars to train	
			var ec = engines[i];
			var recip, next, prev;
			do {
				if (ec.speed>=0) next = getNextTrack(ec);
				else next = getPreviousTrack(ec);
				ec = getEC(next.gridx, next.gridy);
				
				if (ec) if (ec.type != "enginebasic") {
					if (ec.speed>=0) recip = getPreviousTrack(ec);
					else recip = getNextTrack(ec);
					//only link if there is a reciprocal match
					if (recip.gridx == train[0].gridx && recip.gridy == train[0].gridy) {
						train.unshift(ec);
						if (engines[i].speed <0) reverseSpeed(ec);
						ec.speed = engines[i].speed;
						ec.position = engines[i].position;
						
					} else { //try flipping car's orientation//						console.log("Before reverse ori="+ec.orientation);
						reverseOrientation(ec);
						if (ec.speed>=0) recip = getPreviousTrack(ec);
						else recip = getNextTrack(ec);
						//only link if there is a reciprocal match
						if (recip.gridx == train[0].gridx && recip.gridy == train[0].gridy) {
							train.unshift(ec);
							if (engines[i].speed <0) reverseSpeed(ec);
							ec.speed = engines[i].speed;
							ec.position = engines[i].position;
						} else {
							reverseOrientation(ec);
							ec = undefined;
						}
					}
				} // else console.log("AA no car");
			} while (ec && train.length < 200 && ec.type != "enginebasic")  //max train length of 200 to prevent circular trains causing infinite loop

			//step backwards from engine and add adjacent cars to train	
			var ec = engines[i];
			do {
				//get ec at previous position
				if (ec.speed>=0) prev = getPreviousTrack(ec);
				else prev = getNextTrack(ec);
				ec = getEC(prev.gridx, prev.gridy);
				
				if (ec) if (ec.type != "enginebasic")  {
					if (ec.speed>=0) recip = getNextTrack(ec);
					else recip = getPreviousTrack(ec);
					//only link if there is a reciprocal match
					if (recip.gridx == train[train.length-1].gridx && recip.gridy == train[train.length-1].gridy) {
						train.push(ec);
						if (engines[i].speed <0) reverseSpeed(ec);
						ec.speed = engines[i].speed;
						ec.position = engines[i].position;
					} else { //try flipping car's orientation
						reverseOrientation(ec);
						if (ec.speed>=0) recip = getNextTrack(ec);
						else recip = getPreviousTrack(ec);
						//only link if there is a reciprocal match
						if (recip.gridx == train[train.length-1].gridx && recip.gridy == train[train.length-1].gridy) {
							train.push(ec);
							if (engines[i].speed <0) reverseSpeed(ec);
							ec.speed = engines[i].speed;
							ec.position = engines[i].position;
						} else {
							reverseOrientation(ec); //flip car orientation back
							ec = undefined;
						}
					}
				} //else console.log("no car");
			} while (ec && train.length < 200 && ec.type != "enginebasic")  //max train length of 200 to prevent circular trains causing infinite loop

		}
	}
	
    function doOnOrientationChange() {
		switch(window.orientation) {  
			case -90:
			case 90:
			  orientationIsLandscape = true;
			  break; 
			default:
			  orientationIsLandscape = false;
			  break; 
		}
		console.log("OrientationIsLandscape="+orientationIsLandscape);
		calculateLayout();
		draw();
    }

	function doMouseWheel(e)  {
		console.log ("MOuse Wheel");
	}
	
    function doTouchStart(e) {
		var numTouches = e.touches.length;
		
		console.log("Number of touches start="+numTouches);
        var touchobj = e.touches[0] // reference first touch point (ie: first finger)
        var x = parseInt(touchobj.clientX) // get x position of touch point relative to left edge of browser
        var y = parseInt(touchobj.clientY) // get y position of touch point relative to top edge of browser
		if (numTouches == 1) {
			onClickDown(x, y, e);
		}
		if (numTouches == 2) { //pinch-zoom and drag
			//clear all single touch processes
			isMoving = false;
			isErasing = false;
			isSelecting = false;
			isDrawingEngine = false;
			isDrawingCar = false;
			endDrawingTrack();
			endDrawingEC();

			//save start positions for pinch-zoom drag
			startZoomScale = zoomScale;
			startCenterTileX = centerTileX;
			startCenterTileY = centerTileY;
	
			var touchobj2 = e.touches[1] // reference first touch point (ie: first finger)
			var x2 = parseInt(touchobj2.clientX) // get x position of touch point relative to left edge of browser
			var y2 = parseInt(touchobj2.clientY) // get y position of touch point relative to top edge of browser
			pinchStartX1= x;
			pinchStartX2= x2;
			pinchStartY1= y;
			pinchStartY2= y2;
		}
        e.preventDefault();
    }
        
    function doTouchMove(e) {
		var touchobj = e.touches[0] // reference first touch point (ie: first finger)
        var x = parseInt(touchobj.clientX) // get x position of touch point relative to left edge of browser
        var y = parseInt(touchobj.clientY) // get y position of touch point relative to top edge of browser
        e.preventDefault();
		if (e.touches.length == 1) {
			onClickMove(x, y);
		}
		if (e.touches.length == 2) { //pinch-zoom and drag
			var touchobj2 = e.touches[1] // reference first touch point (ie: first finger)
			var x2 = parseInt(touchobj2.clientX) // get x position of touch point relative to left edge of browser
			var y2 = parseInt(touchobj2.clientY) // get y position of touch point relative to top edge of browser
			//console.log("TOUCH move!!!! x2="+x2+" y2="+y2);
			var distStart = Math.sqrt(Math.pow((pinchStartX1-pinchStartX2),2) + Math.pow((pinchStartY1-pinchStartY2),2));
			var distEnd = Math.sqrt(Math.pow((x-x2),2) + Math.pow((y-y2),2));
			var distRatio = distEnd/distStart;
			var dispX = (x+x2)/2 - (pinchStartX1+pinchStartX2)/2;
			var dispY = (y+y2)/2 - (pinchStartY1+pinchStartY2)/2;
			console.log ("TOUCH move 2finger!!!! x="+x+" y="+y+"x2="+x2+" y2="+y2+"distStart="+distStart+", distEnd="+distEnd+", distRatio="+distRatio+", dispX="+dispX+", dispY="+dispY);
			
			//zoom
			zoomScale = startZoomScale * distRatio;
			if (zoomScale<0.2) zoomScale = 0.2;
			if (zoomScale>5) zoomScale = 5;
			//pan
			centerTileX = startCenterTileX - dispX/tileWidth;
			centerTileY = startCenterTileY - dispY/(tileWidth*tileRatio);	 
			draw();
	}
   }
        
    function doTouchEnd(e) {
		var touchobj = e.changedTouches[0] // reference first touch point (ie: first finger)
		if (touchobj) {
			var x = parseInt(touchobj.clientX) // get x position of touch point relative to left edge of browser
			var y = parseInt(touchobj.clientY) // get y position of touch point relative to top edge of browser
		}
        e.preventDefault();
		if (e.changedTouches.length == 1) {
			onClickUp(x, y);
		}
    }
        
    function calculateLayout() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;

		if (adjustGlobalScale) {
			var minScreen = Math.min (window.innerWidth, window.innerHeight);
			globalScale = minScreen/750;
			canvas.width /= globalScale;
			canvas.height /= globalScale;
		}

		canvasWidth = canvas.width;
		canvasHeight = canvas.height;
		toolBarHeight = canvasHeight; //height of toolbar in pixels
        if (!showToolBar) {
        	toolBarHeight = 0;
        }
        tracksWidth = canvasWidth-getToolBarWidth(); //width of the tracks area in pixels
		tracksHeight = canvasHeight; //height of the tracks area in pixels
    }
    
    function getToolBarWidth() {
    	if (!showToolBar) return 0;

		if (useAdvancedToolbar) toolBarWidthFreeplay= 2*buttonWidth + 3*buttonPadding;
		else toolBarWidthFreeplay = buttonWidth + 2*buttonPadding;

		if (interactionState == "Levels") {
			return toolBarWidthLevels;
		} else {
			return toolBarWidthFreeplay;
		}
    }
    
	function draw() {
		ctx.save();
		if (modalTrack) {
			ctx.restore();
			return;
		}
		
		if (interactionState == 'TitleScreen') {
			drawTitleScreen();
			ctx.restore();
			return;
		}        
	
		if (interactionState == 'Levels') {
			drawButtonScreen();
			ctx.restore();
			return;
		}        
	
		if (interactionState == 'Choose track') {
			drawButtonScreen();
			ctx.restore();
			return;
		}        
	
        ctx.save();
        //goal is to put centerTileX,centerTileY at tracksWidth/2, canvasHeight/2
        var screenCenter = worldToScreen(centerTileX, centerTileY);
		ctx.translate(screenCenter.x-centerTileX*tileWidth*zoomScale, screenCenter.y-centerTileY*tileWidth*tileRatio*zoomScale);
		ctx.scale(zoomScale, zoomScale);

		// draw all currently visible tiles (must redraw all because have to redraw from top to bottom because of overlap)
		var upperLeftWorld = screenToWorld(0, 0);
		var lowerRightWorld = screenToWorld(tracksWidth, canvasHeight);
		for (var i=upperLeftWorld.xtile; i<=lowerRightWorld.xtile+1; i++) {
			for (var j=upperLeftWorld.ytile; j<=lowerRightWorld.ytile+1; j++) {
				drawTrack(tracks[mi(Math.floor(i),Math.floor(j))]);
			}
		}	

		drawGrid();
		
		drawSquares();
		drawAllTracks();
		drawAllEnginesAndCars();
		drawAllTunnels();
		drawAllCargoAnimated();
		drawAllPoofs();
		
		if (showToolBar) {
			drawCaption();
			drawSecondaryCaption();
		}
		
        ctx.restore();

		//draw rectangle to cover up extra tiles below bottom
		ctx.fillStyle = "white";
		ctx.fillRect(0, canvasHeight, canvasWidth+tileWidth, 2*tileWidth);

		if (showToolBar) { //toolbar doesn't zoom
			drawSelection();
			drawPathEC();
			drawPathTrack();
			drawToolBar();
			drawButtonCaption();
		}
		
		if (interactionState == 'StarScreen') {
			drawStarScreen();
		}

		ctx.restore();
	}
	
	function interpretAndDraw() {
		interpretAll();
		detectCrashes();
		detectStations();
		draw();
	}

	function drawStarScreen() {  //draw popup screen showing score, number of stars, success/failure, try again/next
		x = canvasWidth/2; //center of popup
		y = canvasHeight/2;
		width = canvasWidth*0.7;
		height = canvasHeight*0.4;

		//draw badge
		if (currentTrackNumber == 10 && currentTrackScore > 0) {
			//console.log ("Draw badge");
			y = canvasHeight * 0.35;
			ctx.fillStyle = starColor;
			ctx.fillRect(x-width/2,y+height*0.7,width,height*0.3);
			ctx.font = "bold 28px Arial";
			ctx.fillStyle = fontColor;
			ctx.textAlign = 'center';
			ctx.fillText("Congratulations! You are now a "+currentTrackSet, x, y+0.85*height);
			ctx.drawImage (imgBadgeIcon, x- imgBadgeIcon.width/2-width*0.55, y+height*.5);
		}

		var highScore = 0;
		text = "highscore-" + currentTrackSet + "-" + (currentTrackNumber);
		if (localStorage.getObject(text)) highScore = localStorage.getObject(text);
		if (currentTrackScore > highScore) {
			console.log("New high score");
			newHighScore = true;
			highScore = currentTrackScore;
			localStorage.setObject(text, currentTrackScore);
		} 
		ctx.fillStyle = starColor;
		ctx.fillRect(x-width/2,y-height/2,width,height);
		
		ctx.font = "32px Arial";
		ctx.fillStyle = fontColor;
		ctx.textAlign = 'center';
		ctx.fillText("Score = "+currentTrackScore, x, y-0.17*height);
		ctx.font = "26px Arial";
		message = ".";
		if (newHighScore) {
			message = ". New high score!";
		}
		ctx.fillText("High score = "+highScore+message, x, y-0.05*height);
		if (currentTrackNumber<9) {
			drawImageButton(                  x-0.25*width, y+0.15*height, 0.4*width, 0.22*height, "Try again", false, false, buttonColor, buttonBorderColor);
			buttonDims['Try again'] = new box(x-0.25*width, y+0.15*height, 0.4*width, 0.22*height);
		}
		drawImageButton             (x, y+0.38*height, 0.14*width, 0.14*height, "Back", false, false, "lightGray", "gray");
		buttonDims['Back'] = new box(x, y+0.38*height, 0.14*width, 0.14*height);
		ctx.font = "40px Arial";
		if (currentTrackScore == 0) {
			ctx.fillText("Crash!!!", x, y-0.3*height);
			if (currentTrackNumber<10) {
				drawImageButton(x+0.25*width, y+0.15*height, 0.4*width, 0.22*height, "Next track", true, false, buttonColor, buttonBorderColor);
				buttonDims['Next track'] = new box(x+0.25*width, y+0.15*height, 0,0); //box is zero so can't click
				drawImageButton(                  x-0.25*width, y+0.15*height, 0.4*width, 0.22*height, "Try again", false, false, buttonColor, buttonBorderColor);
				buttonDims['Try again'] = new box(x-0.25*width, y+0.15*height, 0.4*width, 0.22*height);
				}
		} else {
			ctx.fillText("Success!!!", x, y-0.3*height);
			if (currentTrackNumber<9) {
				drawImageButton(x+0.25*width, y+0.15*height, 0.4*width, 0.22*height, "Next track", false, true, buttonColor, buttonBorderColor);
				buttonDims['Next track'] = new box(x+0.25*width, y+0.15*height, 0.4*width, 0.22*height);
			} 			
			//draw star
			drawStar(x-0.35*width-imgStar.width/2, y-0.35*height-imgStar.height/2, 0);
			if (animationFrame == 100) playSound ("tada1");
			if (currentTrackScore >500) { //draw second star
				drawStar (x-imgStar.width/2-0.015*width, y-0.6*height-imgStar.height/2, 100);
				if (animationFrame == 200) playSound ("tada2");
			} 
			if (currentTrackScore >999) { //draw third star
				drawStar (x+0.35*width-imgStar.width/2, y-0.38*height-imgStar.height/2, 200);
				if (animationFrame == 300) playSound ("tada3");
			}

			if (currentTrackNumber==9 && animationFrame > 399) {
				ctx.fillText("LEVEL COMPLETE!!!", x, y+0.2*height);
				ctx.drawImage(imgBadgeIcon, x+0.3*width, y-0.3*height, 0.275*width, 0.9*height);
				if (animationFrame == 400) playSound("complete");
			}
			
		}
		if (animationFrame<404) animationFrame+=2.5;
	}

	function drawStar(x,y, delay) {
		if (animationFrame<delay) return;
		ctx.save();
		ctx.translate(x,y);
		var scale = 1;
		if (animationFrame-delay<100) scale = 1/(Math.sqrt(100-(animationFrame-delay)));
		ctx.scale(scale, scale);
		ctx.drawImage(imgStar, 0, 0);
		ctx.restore();
	}	
			
	function drawAllTracks() {
		var upperLeftWorld = screenToWorld(0, 0);
		var lowerRightWorld = screenToWorld(tracksWidth, canvasHeight);
		for (var i=upperLeftWorld.xtile; i<=lowerRightWorld.xtile+1; i++) {
			for (var j=upperLeftWorld.ytile; j<=lowerRightWorld.ytile+1; j++) {
				drawTrack(tracks[mi(Math.floor(i),Math.floor(j))]);
			}
		}	
	}	

	function drawAllCargoAnimated() { //draws only cargo that is being animated
		//draw all track cargo
		var upperLeftWorld = screenToWorld(0, 0);
		var lowerRightWorld = screenToWorld(tracksWidth, canvasHeight);
		for (var i=upperLeftWorld.xtile; i<=lowerRightWorld.xtile+1; i++) {
			for (var j=upperLeftWorld.ytile; j<=lowerRightWorld.ytile+1; j++) {
				drawCargoAnimated(tracks[mi(Math.floor(i),Math.floor(j))]);
			}
		}	
		
		//draw all EC cargo
		var ECs = engines.concat(cars);
		for (var i=0; i<ECs.length; i++) {
			drawCargoAnimated(ECs[i]);
		}
	}
	
	function drawAllTunnels() {
		for (var key in tracks) {
		    if (tracks[key].subtype == "redtunnel" || tracks[key].subtype == "greentunnel" || tracks[key].subtype == "bluetunnel") {;
				ctx.save();
				ctx.translate((0.5+tracks[key].gridx)*tileWidth, (0.5+tracks[key].gridy)*tileWidth*tileRatio); //center origin on tile
				ctx.rotate(tracks[key].orientation * Math.PI/4);
		    	drawSprite(tracks[key].subtype, tracks[key].orientation);
		    	ctx.restore();
		    }
		}
	}	
	
	function drawSquares() { 
		// draw tracks in the squares in the diagonals of tracks where needed
		var upperLeftWorld = screenToWorld(0, 0);
		var lowerRightWorld = screenToWorld(tracksWidth, tracksHeight);
		for (var i=Math.floor(upperLeftWorld.xtile); i<=lowerRightWorld.xtile+1; i++) {
			for (var j=Math.floor(upperLeftWorld.ytile); j<=lowerRightWorld.ytile+1; j++) {
                var track;
		    	track = tracks[mi(i,j)];
		        if (track) {
		        	if (tracks[mi(i+1,j+1)]) {
		        		//only draw diagonal if both tracks line up with square
		        		if (trackConnects(tracks[mi(i,j)],3)) if (trackConnects(tracks[mi(i+1,j+1)],7)) {
							ctx.save();
							ctx.translate((track.gridx+0.25)*tileWidth, (track.gridy+0.18)*tileWidth*tileRatio); //center origin on tile
			        		//draw diagnol is SE
							drawSprite("tracksquareSE",0,0);
			        		ctx.restore();
			        	}
		        	}
		        	if (tracks[mi(i-1,j+1)]) {
		        		//only draw diagonal if both tracks line up with square
		        		if (trackConnects(tracks[mi(i,j)],5)) if (trackConnects(tracks[mi(i-1,j+1)],1)) {
							ctx.save();
							ctx.translate((track.gridx-0.76)*tileWidth, (track.gridy+0.14)*tileWidth*tileRatio); //center origin on tile
			        		//draw diagnol is SE
							drawSprite("tracksquareSW",0,0);
			        		ctx.restore();
			        	}
		        	}
		        }
			}
		}	
		
	}
	
	function drawAllEnginesAndCars() {
		//combine engine and cars array
		var ECs = engines.concat(cars);
		
		//sort ECs by gridy
		ECs.sort(function(a, b){
		 return a.gridy-b.gridy
		})	
			
		for (var i=0; i<ECs.length; i++) {
			drawEC(ECs[i]);
		}
	}	
	
	function drawSelection() {

		if (startSelectXTile == endSelectXTile) return;
		if (startSelectYTile == endSelectYTile) return;
		
		ctx.lineWidth = 2;
	    ctx.strokeStyle = "red";
	    ctx.beginPath();
	    
	    var screenPoint = worldToScreen(startSelectXTile, startSelectYTile);
	    var startX = screenPoint.x;
	    var startY = screenPoint.y;
	    screenPoint = worldToScreen(endSelectXTile, endSelectYTile);
	    var endX = screenPoint.x;
	    var endY = screenPoint.y;
	    if (isMoving) {
	    	var startScreen= worldToScreen(startMoveXTile, startMoveYTile);
	    	var endScreen= worldToScreen(endMoveXTile, endMoveYTile);
    		startX = startX + (endScreen.x - startScreen.x);
    		startY = startY + (endScreen.y - startScreen.y);
    		endX = endX +  (endScreen.x - startScreen.x);
    		endY = endY + (endScreen.y - startScreen.y);
	    }
		ctx.dashedLine( startX, startY, endX, startY, [4,3]);
		ctx.dashedLine( endX, startY, endX, endY, [4,3]);
		ctx.dashedLine( endX, endY, startX, endY, [4,3]);
		ctx.dashedLine( startX, endY, startX, startY, [4,3]);
		ctx.stroke();

		//show tracks and ecs being moved
	    if (isMoving) { 
			var upperLeftSelectXTile = Math.round(Math.min(startSelectXTile, endSelectXTile)); 
			var upperLeftSelectYTile = Math.round(Math.min(startSelectYTile, endSelectYTile));
			var lowerRightSelectXTile = Math.round(Math.max(startSelectXTile, endSelectXTile)); 
			var lowerRightSelectYTile = Math.round(Math.max(startSelectYTile, endSelectYTile));

			ctx.save();
			var screenCenter = worldToScreen(centerTileX, centerTileY);
			ctx.translate(screenCenter.x-centerTileX*tileWidth*zoomScale, screenCenter.y-centerTileY*tileWidth*tileRatio*zoomScale);
			ctx.translate(tileWidth*zoomScale*(endMoveXTile - startMoveXTile), tileWidth*tileRatio*zoomScale*(endMoveYTile - startMoveYTile)); 
			ctx.scale(zoomScale, zoomScale);
	    	for (gridx= upperLeftSelectXTile; gridx<lowerRightSelectXTile; gridx++) {
		    	for (gridy= upperLeftSelectYTile; gridy<lowerRightSelectYTile; gridy++) {
		    		//draw track 
		    		drawTrack(tracks[mi(gridx,gridy)]);
		    		//draw EC
		    		var ec=getEC(gridx,gridy);
		    		drawEC(ec);
		    	}
	    	}
    		ctx.restore();

	    }
	}
	
	function getOffset(ec) { //returns the center of an engine or car in tiles with origin at center of current tile so (-0.5,0.5]
		//also adjust offset to smooth over the squares that go across diagonals
		var enterSquareDist = 0;
		var exitSquareDist = 0;
		var offsetx = 0;
		var offsety = 0; //fraction of a tile offset
		
		var track = tracks[mi(ec.gridx,ec.gridy)];
		
		var enterOri = ec.orientation;
		if (ec.speed <0) enterOri = (enterOri+4)%8;
		if (enterOri == 1 || enterOri == 3 || enterOri == 5 || enterOri == 7) enterSquareDist = (Math.SQRT2-1)/2;
		var exitOri = getExitOrientation(ec);
		if (exitOri == 1 || exitOri == 3 || exitOri == 5 || exitOri == 7) exitSquareDist = (Math.SQRT2-1)/2;
		var totalDist = enterSquareDist + 1 + exitSquareDist;
		if (ec.speed<0) {
			var temp = enterSquareDist;
			enterSquareDist = exitSquareDist;
			exitSquareDist = temp;
		}
		
		var type = getTypeForWye(ec, track);
		switch (type) {
			case "trackwyeleft":
				if (track.state == "left") type = "track90";
				else type = "trackstraight";
				break;
			case "trackwyeright":
				if (track.state == "left") type = "trackstraight";
				else {
					type = "track90right";
				}
				break;
			case "trackwye":
				if (track.state == "left") type = "track90";
				else {
					type = "track90right";
				}
				break;
		}

		if (ec.position < enterSquareDist/totalDist) { 
		//the ec is in the entering square
			var frac = (enterSquareDist/totalDist - ec.position)/(enterSquareDist/totalDist); //fraction across enter square
			var oriDif = (ec.orientation - exitOri +8)%8;
			switch (type) {
				case "trackstraight":
				case "trackcross":
				case "trackbridge":
					offsety = frac*(Math.SQRT2/2 - 0.5) + 0.5;
					break;
				case "track90":
				case "track90right":
					if (ec.speed>=0) {
						offsety = frac*(Math.SQRT2/2 - 0.5) + 0.5;
					} else {
						if (oriDif ==6) offsetx = (frac*(Math.SQRT2/2 - 0.5) + 0.5);
						else offsetx = -(frac*(Math.SQRT2/2 - 0.5) + 0.5);
					}
					break;
				case "track45":
					if (ec.speed>=0) {
						offsety = frac*(Math.SQRT2/2 - 0.5) + 0.5;
					} else {
						if (oriDif == 5) {
							offsetx = Math.SQRT2/4+(frac)*((Math.SQRT2-1)/2);
							offsety = (Math.SQRT2/4+(frac)*((Math.SQRT2-1)/2));
						} else {
							console.log("GGGG");
							offsetx = -(Math.SQRT2/4+(frac)*((Math.SQRT2-1)/2));
							offsety = (Math.SQRT2/4+(frac)*((Math.SQRT2-1)/2));
						}
					}
					break;
			}
	
			if (type == "track90right") offsetx = -offsetx;
		} else if (ec.position <= (1 + enterSquareDist)/totalDist) { 
		//the ec is in tile proper
			frac = (ec.position - enterSquareDist/totalDist) / ((1 + enterSquareDist)/totalDist - enterSquareDist/totalDist);
			switch (type) {
				case "trackstraight":
				case "trackcross":
				case "trackbridge":
					offsety = 0.5 - frac;
					break;
				case "track90":
				case "track90right":
					if (ec.speed>=0) {
						if (ec.orientation != track.orientation) {
							offsetx = -Math.cos(Math.PI/2*frac)/2 + 0.5;
							offsety = -Math.sin(Math.PI/2*frac)/2 + 0.5;
						} else {
							offsetx = Math.cos(Math.PI/2*frac)/2 - 0.5;
							offsety = -Math.sin(Math.PI/2*frac)/2 + 0.5;
						}
					} else {
						if ((ec.orientation - track.orientation+8)%8 == 4) {
							offsetx = -Math.sin(Math.PI/2*frac)/2 + 0.5;
							offsety = Math.cos(Math.PI/2*frac)/2 - 0.5;
						} else {
							offsetx = Math.sin(Math.PI/2*frac)/2 - 0.5;
							offsety = Math.cos(Math.PI/2*frac)/2 - 0.5;
						}
				}
					break;
				case "track45":
					if (ec.speed>=0) {
						if (ec.orientation != track.orientation) {
							offsetx = -Math.cos(Math.PI/2*frac/2)*1.25 + 1.25;
							offsety = -Math.sin(Math.PI/2*frac/2)*1.25 + 0.5;
						} else {
							offsetx = Math.cos(Math.PI/2*frac/2)*1.25 - 1.25;
							offsety = -Math.sin(Math.PI/2*frac/2)*1.25 + 0.5;
						}
					} else {
						if ((ec.orientation - track.orientation+8)%8 == 4) {
							offsetx = -Math.cos(Math.PI/2*(1-frac)/2)*1.25 + 1.25;
							offsety = Math.sin(Math.PI/2*(1-frac)/2)*1.25 - 0.5;
						} else { 
							offsetx = Math.cos(Math.PI/2*(1-frac)/2)*1.25 - 1.25;
							offsety = Math.sin(Math.PI/2*(1-frac)/2)*1.25 - 0.5;
						}
					}
					break;
			}
	
			if (type == "track90right") offsetx = -offsetx;
		} else { 
		// ec is in exiting square
			// should range from -sqrt2 to -0.5
			var frac = (ec.position - (1+exitSquareDist)/totalDist)/(exitSquareDist/totalDist);
			var oriDif = (ec.orientation - exitOri +8)%8;
			switch (type) {
				case "trackstraight":
				case "trackcross":
				case "trackbridge":
					offsety = -frac*(Math.SQRT2/2 - 0.5) - 0.5; // [-0.5, -0.207]
					break;
				case "track90":
				case "track90right":
					if (ec.speed>=0) {
						if (oriDif == 6) offsetx = (frac*(Math.SQRT2/2 - 0.5) + 0.5);
						else offsetx = -(frac*(Math.SQRT2/2 - 0.5) + 0.5);
					} else {
						if (oriDif == 6) offsety = -(frac*(Math.SQRT2/2 - 0.5) + 0.5);
						else offsety = -(frac*(Math.SQRT2/2 - 0.5) + 0.5);
					}
					break;
				case "track45":
					if (ec.speed >=0) {
						if (oriDif ==7) {
							offsetx = Math.SQRT2/4+(1+frac)*((Math.SQRT2-1)/2);
							offsety = -(Math.SQRT2/4+(1+frac)*((Math.SQRT2-1)/2));
						} else {
							offsetx = -(Math.SQRT2/4+(1+frac)*((Math.SQRT2-1)/2));
							offsety = -(Math.SQRT2/4+(1+frac)*((Math.SQRT2-1)/2));
						}
					} else {
						console.log("jjj oriDif="+oriDif+" enterOri="+enterOri+" exitOri="+exitOri);
						if (oriDif ==5) {
							offsety = -((1+frac)*(Math.SQRT2/2 - 0.5) + 0.5); // [-0.5, -0.707]
						} else {
							offsety = -((1+frac)*(Math.SQRT2/2 - 0.5) + 0.5); // [-0.5, -0.707]
						}
					}
					break;
			}
	
			if (type == "track90right") offsetx = -offsetx;
		}	
			
	    return {
	        'X': offsetx,
	        'Y': offsety
	    };  
		
	}
	
	function getExitOrientation(ec) { //returns the exit orientation for the ec
		var next = getNextTrack(ec);
		var angle = Math.atan2(next.gridy-ec.gridy, next.gridx-ec.gridx);
		var ori = (angle/(2*Math.PI)*8 + 10)%8;
		return ori;
	}
	
	function getCenter(obj) { //returns center of EC or tile in pixels
		var x,y;
		if (obj.type == "enginebasic" || obj.type == "carbasic") {
			var offset = getOffset(obj);
			var angle = Math.PI/4*(obj.orientation);
			x = (obj.gridx+0.5+Math.cos(angle)*offset.X-Math.sin(angle)*offset.Y)*tileWidth;
			y = (obj.gridy+0.5+Math.sin(angle)*offset.X+Math.cos(angle)*offset.Y)*tileWidth;
		} else {
			x= (obj.gridx+0.5)*tileWidth;
			y= (obj.gridy+0.5)*tileWidth;
		}
		
	    return {
	        'X': x,
	        'Y': y
	    };  
	}
	
	function drawCaption() { //draw caption bubble attached to currentCaptionedObject
		if (currentCaptionedObject == undefined) return;
		
		captionWidth =2;
		captionHeight =2;
		if (currentCaptionedObject.type == 'TrackStraight') { //make bigger to show station types
			captionHeight =3;
		}
		if (currentCaptionedObject.type == 'CarBasic' || currentCaptionedObject.type == 'TrackCargo' || currentCaptionedObject.type == 'TrackBlank') { //make bigger to show cargo types
			captionWidth =3;
		}

		if (captionX == undefined) { //choose coordinates for caption bubble
			var retVal = spiral (currentCaptionedObject.gridx, currentCaptionedObject.gridy, captionWidth, captionHeight);
			captionX = retVal.gridx;
			captionY = retVal.gridy;
		}

		var obj = getCenter(currentCaptionedObject);

		drawCaptionBubble(captionX, captionY*tileRatio, captionWidth, captionHeight*tileRatio, obj.X, obj.Y*tileRatio);
		
		switch (currentCaptionedObject.type) {
			case "enginebasic":
				drawSprite("speedController");
				break;
			case "carbasic":
			case "trackcargo":
			case "trackblank":
		 		drawButtonsArray(buttonsCargoTypes);
				break;
			case "trackstraight":
				 if (interactionState == 'Freeplay') drawButtonsArray(buttonsStation);
				 else drawButtonsArray(buttonsStationTrack);
				break;
			case "trackwye":
			case "trackwyeleft":
			case "trackwyeright":
		 		drawButtonsArray(buttonsWye);
				break;
		}
		 
	}
	
	function drawSecondaryCaption() { //draw caption bubble attached to primary caption bubble (used for submenus)
		if (secondaryCaption == undefined) return;
		
		captionSecondaryWidth =3;
		captionSecondaryHeight =3.8;
		if (captionSecondaryX == undefined) { //choose coordinates for secondary caption bubble
			var retVal = spiral (captionX, captionY, captionSecondaryWidth, captionSecondaryHeight);
			captionSecondaryX = retVal.gridx;
			captionSecondaryY = retVal.gridy;
		}

		drawCaptionBubble(captionSecondaryX, captionSecondaryY, captionSecondaryWidth, captionSecondaryHeight, lastClickUp.xtile*tileWidth, lastClickUp.ytile*tileWidth*tileRatio, true);
		
		//get cargo subarray
		var iCargo;
		for (var i=0; i<cargoValues.length; i++) {
			if (cargoValues[i][0] == secondaryCaption.type) iCargo = i;
		}
		if (iCargo == undefined) {
			console.log("ERROR- cargo not found");
			return;
		}
		
		i=1;
		var array = [];
		var nCols = Math.floor(Math.sqrt(cargoValues[iCargo].length-1));
		var nRows = Math.ceil((cargoValues[iCargo].length-1) / nCols);
		for (var row=0; row<nRows; row++) {
			var rowArray = [];
			for (var col=0; col<nCols; col++) {
				if (i<cargoValues[iCargo].length) { 
					rowArray.push (cargoValues[iCargo][i]);
				}
				i++;
			}
			array.push(rowArray);
		}
		
 		drawButtonsArray(array, true);
		
	}
	
	function drawButtonsArray(array, isSecondary) {
		var width;
		var height;
		if (isSecondary) {
			width = captionSecondaryWidth;
			height = captionSecondaryHeight;
		} else {
			width = captionWidth;
			height = captionHeight;
		}
		
 		for (var row=0; row<array.length; row++) {
 			for (var col=0; col<array[row].length; col++) {
				var xSpacing = (width*tileWidth-array[row].length*captionIconWidth)/(array[row].length+1);
				var ySpacing = (height*tileWidth*tileRatio-array.length*captionIconWidth)/(array.length+1);
			 	ctx.save();
			 	if (isSecondary) {
			 		ctx.translate(xSpacing*(col+1)+((col+0.5)*captionIconWidth)+(captionSecondaryX)*tileWidth, (ySpacing*(row+1)+((row+0.5)*captionIconWidth)+(captionSecondaryY)*tileWidth*tileRatio));
			 	} else {
			 		ctx.translate(xSpacing*(col+1)+((col+0.5)*captionIconWidth)+(captionX)*tileWidth, (ySpacing*(row+1)+((row+0.5)*captionIconWidth)+(captionY)*tileWidth)*tileRatio*tileRatio);
			 	}
			 	if (isSecondary) {
                    if (array[row][col] != undefined) {
                        var index = 1;
                        index = row*(array.length-1)+col;
                        drawSprite("Caption"+array[0][0],0, index); //kkk
                    }
                } else {
					drawSprite("Caption"+array[row][col],0, 0); //kkk
                }
			 	ctx.restore();
 			}
 		}
	}
	
	function drawCaptionBubble (capX, capY, captionWidth, captionHeight, objX, objY, isSecondary) { //capX, capY is upperleft corner of caption, objX, objY is location of where pointer goes
		//draw caption bubble
		var angle = Math.atan2(objY-(capY+0.5*captionHeight)*tileWidth, objX-(capX+0.5*captionWidth)*tileWidth);
		ctx.beginPath();
		ctx.moveTo ((capX+0.5*captionWidth)*tileWidth+Math.cos(angle+Math.PI/2)*0.2*tileWidth+Math.cos(angle)*captionWidth*0.45*tileWidth, (capY+0.5*captionHeight)*tileWidth+Math.sin(angle+Math.PI/2)*0.2*tileWidth+Math.sin(angle)*captionHeight*0.45*tileWidth);
		ctx.lineTo (objX, objY);
		ctx.lineTo ((capX+0.5*captionWidth)*tileWidth+Math.cos(angle-Math.PI/2)*0.2*tileWidth+Math.cos(angle)*captionWidth*0.45*tileWidth, (capY+0.5*captionHeight)*tileWidth+Math.sin(angle-Math.PI/2)*0.2*tileWidth+Math.sin(angle)*captionHeight*0.45*tileWidth);
		
		if (isSecondary) ctx.fillStyle = secondaryCaptionColor;
		else ctx.fillStyle = captionColor;
		ctx.fill();
		roundRect((capX-0.06)*tileWidth, (capY-0.06)*tileWidth*tileRatio, (captionWidth+0.12)*tileWidth, (captionHeight+0.12)*tileWidth*tileRatio, 0.2*tileWidth, true, false, true);
		
	}
			 	
	function spiral (gridx, gridy, width, height) { //gridx and gridy are the center tile to spiral out from. Width and height are how much space is needed
		//this function spirals outward from x,y = 0,0 to max of X,Y
		// then exits when an empty space is found

		//don't spiral, just put adjacent
		var retx, rety;
		var tracksWorld = screenToWorld(tracksWidth/2, tracksHeight/2);
		if (gridx<tracksWorld.xtile) retx=gridx;
		else retx=gridx-width-1;
		if (gridy<tracksWorld.ytile) rety=gridy;
		else rety=gridy-height+1;
	    return {
	        'gridx': retx + 1,
	        'gridy': rety
	    };  

		//spiral
/*		var maxX=5;
		var maxY=5;
	    var x,y,dx,dy;
	    x = y = dx =0;
	    dy = -1;
	    var t = Math.max(maxX,maxY);
	    var maxI = t*t;
	    for (var i =0; i < maxI; i++) {
	    	if ((-maxX/2 < x && x <= maxX/2) && (-maxY/2 < y && y <= maxY/2)) {
	    		console.log ("x=" + (gridx+x) + " y=" + (gridy+y));
	    		if (isSpace(gridx+x, gridy+y, width, height)) {
	    			console.log ("Found empty space at x=" + (gridx+x) + " y=" + (gridy+y));
	    			//successfully found empty space
				    return {
				        'gridx': gridx + x,
				        'gridy': gridy + y
				    };  
	    		}
	    	}
	    	if( (x == y) || ((x < 0) && (x == -y)) || ((x > 0) && (x == 1-y))) {
	    		t = dx;
	    		dx = -dy;
	    		dy = t;
	    	}
	    	x += dx;
	    	y += dy;
	    }
	    
	    //failed to find empty space so return adjacent
    	console.log("failed to find empty space");
	    return {
	        'gridx': currentCaptionedObject.gridx + 1,
	        'gridy': currentCaptionedObject.gridy
	    };  
	*/   }
    
    function isSpace (capx,capy,width, height) {
    	//returns true if the space has all empty tiles, else false
    	for (var a=capx; a<capx+width; a++) {
	    	for (var b=capy; b<capy+height; b++) {
                if (tracks[mi(a,b)] != undefined) {
                    //console.log("No space at capx=" + capx + " capy=" + capy);
                    return false;
                }
    		}
    	}
    	
    	//check if in tracks area
    	var screenPoint = worldToScreen(capx+width, capy+height);
    	if (screenPoint.x > tracksWidth) return false;
    	if (screenPoint.y > tracksHeight) return false;
    	
    	//check if intersects current caption
    	if (!secondaryCaption) return true; 
    	if (capx+width<=captionX) return true;
    	if (capy+height<=captionY) return true;
    	if (capx>=captionX+width) return true;
    	if (capy>=captionY+height) return true;

    	return false;
    }

	function drawGrid () {
		var upperLeftWorld = screenToWorld(0, 0);
		var lowerRightWorld = screenToWorld(tracksWidth, canvasHeight);
		for (var i=upperLeftWorld.xtile; i<=lowerRightWorld.xtile+1; i++) {
			for (var j=upperLeftWorld.ytile; j<=lowerRightWorld.ytile+1; j++) {
				drawTileBorder(Math.floor(i),Math.floor(j));
			}
		}	
	}

	function drawTileBorder(tilex, tiley) {
		//draw tile border
		ctx.save();
		ctx.translate((0.5+tilex)*tileWidth, (0.5+tiley)*tileWidth*tileRatio); //center origin on tile
		ctx.strokeStyle = gridColor;
		drawOctagonOrSquare(tilex, tiley);
		ctx.restore();
	}
	
	function drawOctagonOrSquare(tilex, tiley) {
		var rx = Math.sin(tilex+tiley*77) * 10000;
		var index = Math.floor((rx - Math.floor(rx))*imgParquet.length);
		var img = imgParquet;
		if (useOctagons) img=imgParquetOct;
		if ((tilex+tiley)%2 == 0) {
			ctx.rotate(-Math.PI/2);
			ctx.drawImage(img[index], -0.5*tileWidth*tileRatio-1, -0.5*tileWidth-1, tileWidth*tileRatio+2, tileWidth+2);
		} else {
			ctx.drawImage(img[index], -0.5*tileWidth-1, -0.5*tileWidth*tileRatio-1, tileWidth+2, tileWidth*tileRatio+2);
		}
	}
		
	function drawToolBar () {
		ctx.fillStyle = toolBarBackColor;
		ctx.fillRect(tracksWidth, 0, getToolBarWidth(), toolBarHeight);
		
		var toolButtons = getCurrentToolButtons();
		
		for (var i=0; i<toolButtons.length; i++) {
			toolButtons[i].draw();
		}

//		if (useAdvancedToolbar && interactionState == 'Freeplay') { // draw logo at bottom of toolbar
//			var imgWidth = getToolBarWidth()*0.94;
//			var imgHeight = imgLogo.height * imgWidth/imgLogo.width;
//			ctx.drawImage(imgLogo, tracksWidth+getToolBarWidth()*0.1, canvasHeight*0.9);
//			ctx.drawImage(imgLogo, tracksWidth+getToolBarWidth()*0.03, canvasHeight-imgHeight*1.2, imgWidth, imgHeight);
//		}
		
//		if (interactionState == 'Freeplay') { //show username at bottom of toolbar
//			ctx.font = "normal bold 30px Arial";
//			ctx.fillStyle = fontColor;
//			ctx.textBaseline = 'middle';
//			ctx.textAlign = 'center';
//			var width = toolBarWidthFreeplay;
//			ctx.fillText(currentUsername, tracksWidth+width/2, toolBarHeight-20);
//		}
	}
	
	function drawButtonCaption() {
		if (currentCaptionedButton == undefined) return;
		var xC=Math.floor(tracksWidth/tileWidth)-3;
		var yC=currentCaptionedButton.y/tileWidth-1.5;
		var wC=3;
		var hC=3;
		buttonCaptionX = xC*tileWidth;
		buttonCaptionY = yC*tileWidth;

		drawCaptionBubble (xC, yC/tileRatio, wC, hC/tileRatio, tracksWidth+currentCaptionedButton.x, currentCaptionedButton.y+currentCaptionedButton.height/2);
		for (var i=0; i<wC; i++) {
			for (var j=0; j<hC; j++) {
				var nBin = j*wC+i;
				if (localStorage.getObject('trx-'+nBin) == undefined) {
					ctx.strokeStyle = saveButtonColors[nBin];
					ctx.lineWidth=3;
					ctx.strokeRect(10+(i+xC)*tileWidth,10+(j+yC)*tileWidth, tileWidth-20, tileWidth-20);
				} else {
					ctx.fillStyle = saveButtonColors[nBin];
					ctx.fillRect(10+(i+xC)*tileWidth,10+(j+yC)*tileWidth, tileWidth-20, tileWidth-20);
				}
			}
		}
	}
	
	function saveTrx(nBin) { //saves trx in bin nButton
		//save the tracks, engines, cars, cargo... everything to a file	using JSON stringify

		var trx = [tracks, engines, cars];
		var strTrx= JSON.stringify(JSON.decycle(trx));
		var compressed= compress(strTrx);
		localStorage.setObject('trx-'+nBin, compressed);
		playSound("save");
		draw();
	}
	
	function openTrx(nBin) { //opens trx stored in bin nButton
		if (localStorage.getObject('trx-'+nBin) == undefined) {
			console.log("No trx in bin"+nBin);
			return;
		}

		var trxOpen = localStorage.getObject('trx-'+nBin);
		playSound("open");
		openTrxJSON(decompress(trxOpen));
		buildTrains();
		updateUndoHistory();
		draw();
	}

	function openTrxJSON(string) { //opens trx stored in JSON string 
		startTimePlay = undefined; //used so startTimePlay is only set to now the first time play is pushed on levels
		var trxOpen = JSON.retrocycle(JSON.parse(string));
		tracks = trxOpen[0];
		engines = trxOpen[1];
		cars = trxOpen[2];
		
		//turn on octagons if not on and trx contain octagons
		if (!useOctagons) {
			for (var key in tracks) {
				if (tracks[key].orientation %2 == 1) useOctagons = true;
			}
		}
	}

 //// BEGIN code for dialog box for new user
    var dialogNewUser, dialogSigninUser, dialogForgotPassword,dialogUploadTrack, dialogDownloadTrack, form;
 
    // From http://www.whatwg.org/specs/web-apps/current-work/multipage/states-of-the-type-attribute.html#e-mail-state-%28type=email%29
    var emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    var username = $("#username");
    var usernameSignin = $("#usernameSignin");
    var email = $("#email");
    var password = $("#password");
    var passwordSignin = $("#passwordSignin");
    var trackname = $("#trackname");
    var trackdescription = $("#trackdescription");
    var allFields = $( [] ).add(username).add(email).add(password).add(trackname).add(trackdescription);
    var tips = $(".validateTips");
  
    function newUser() {
    	console.log("Add user");
    	//var emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    	//tips = $( ".validateTips" );
      	var valid = true;
      	valid = valid && checkLength( username, "username", 3, 16 );
     	valid = valid && checkLength( email, "email", 6, 80 );
      	valid = valid && checkLength( password, "password", 5, 16 );
 
      	valid = valid && checkRegexp( username, /^[a-z]([0-9a-z_\s])+$/i, "Username may consist of a-z, 0-9, underscores, spaces and must begin with a letter." );
      	valid = valid && checkRegexp( email, emailRegex, "eg. engineer@train-hub.org" );
      	valid = valid && checkRegexp( password, /^([0-9a-zA-Z])+$/, "Password field only allow : a-z 0-9" );
 
      	if ( valid ) {
        	//$( "#users tbody" ).append( "<tr>" + "<td>" + name.val() + "</td>" + "<td>" + email.val() + "</td>" + "<td>" + password.val() + "</td>" + "</tr>" );
        	console.log("ADD username="+username.val()+", email="+email.val()+", password="+password.val());
	        xmlhttp = new XMLHttpRequest();
	        xmlhttp.onreadystatechange = function() {
	            if (this.readyState == 4 && this.status == 200) {
	                console.log("Response="+this.responseText);
	            }
	        };
	        var url = "php/newUser.php?username="+encodeURI(username.val())+"&email="+encodeURI(email.val())+"&password="+encodeURI(password.val());
	        console.log("url="+url);
	        xmlhttp.open("GET",url,true);
	        xmlhttp.send();
        	dialogNewUser.dialog( "close" );
      	}
      	return valid;
    }
    
    function signinUser() {
    	console.log("Function signinUser");
     	var valid = true;
      	valid = valid && checkLength( usernameSignin, "username", 3, 16 );
      	valid = valid && checkLength( passwordSignin, "password", 5, 16 );
 
      	valid = valid && checkRegexp( usernameSignin, /^[a-z]([0-9a-z_\s])+$/i, "Username may consist of a-z, 0-9, underscores, spaces and must begin with a letter." );
      	valid = valid && checkRegexp( passwordSignin, /^([0-9a-zA-Z])+$/, "Password field only allow : a-z 0-9" );
 
      	if ( valid ) {
        	//$( "#users tbody" ).append( "<tr>" + "<td>" + name.val() + "</td>" + "<td>" + email.val() + "</td>" + "<td>" + password.val() + "</td>" + "</tr>" );
        	//console.log("signin username="+usernameSignin.val()+", password="+passwordSignin.val());
	        xmlhttp = new XMLHttpRequest();
	        xmlhttp.onreadystatechange = function() {
	            if (this.readyState == 4 && this.status == 200) {
	                //console.log("Response="+this.responseText);
	                if (this.responseText == "fail-login") {
	                	alert ("Wrong username or password");
	                } else if (this.responseText == "fail-connect") {
	                	alert ("Failed to connect");
	                } else {
		                var retArray = this.responseText.split("&&&");
		                currentUserID = retArray[1];
		                currentUsername = retArray[2];
		                console.log("Successfully logged in username="+currentUsername+", and userID="+currentUserID);
		                
		                //store locally
		                localStorage.setObject('currentUserID', currentUserID);
		                localStorage.setObject('username', currentUsername);

		            }
	            }
	        };
	        var url = "php/signinUser.php?username="+encodeURI(usernameSignin.val())+"&password="+encodeURI(passwordSignin.val());
	        //console.log("url="+url);
	        xmlhttp.open("GET",url,true);
	        xmlhttp.send();
        	dialogSigninUser.dialog( "close" );
      	}
      	return valid;
    }
    
    function forgotPassword() {
    	console.log ("function forgot password");
    }
    
    function browseTracks() {
    	console.log("Function browse tracks");
    }

	function uploadTrackGet() { // uses GET
		console.log ("Function Upload track");
 		var trx = [tracks, engines, cars];
		var strTrx = compress(JSON.stringify(JSON.decycle(trx)));
      	var valid = true;
      	valid = valid && checkLength( trackname, "trackname", 3, 25 );
     	valid = valid && checkLength( trackdescription, "trackdescription", 6, 300 );

      	if ( valid ) {
        	console.log("trackname="+trackname.val()+", trackdescription="+trackdescription.val());
	        xmlhttp = new XMLHttpRequest();
	        xmlhttp.onreadystatechange = function() {
	            if (this.readyState == 4 && this.status == 200) {
	                console.log("Response="+this.responseText);
	                if (this.responseText.length>3) {
	                	alert("Track upload successful!");
 	                } else {
	                	alert("Track upload failed.")
	                }
	            }
	        };
	        var url = "php/uploadTrack.php?userID="+currentUserID+"&trx="+strTrx+"&trackName="+encodeURI(trackname.val())+"&trackDescription="+encodeURI(trackdescription.val());
	        console.log("url="+url);
	        xmlhttp.open("GET",url,true);
	        xmlhttp.send();
 			dialogUploadTrack.dialog( "close" );
     	}
      	return valid;
	}
	
	function uploadTrackPost() { //uses POST to upload longer tracks
		console.log ("Function Upload track POST");
 		var trx = [tracks, engines, cars];
		var strTrx = compress(JSON.stringify(JSON.decycle(trx)));

      	var valid = true;
      	valid = valid && checkLength( trackname, "trackname", 3, 25 );
     	valid = valid && checkLength( trackdescription, "trackdescription", 6, 300 );

      	if ( valid ) {
			var http = new XMLHttpRequest();
			var url = "php/uploadTrackPost.php";
			
			//shrink image of canvas
//			var destCtx = canvas2.getContext('2d');
			//destCtx.drawImage(canvas, 0, 0, 50,50);
			destCtx.drawImage(imgPoof,5,5);
//			var img    = canvas2.toDataURL("image/png");
			var img2 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAM0AAADNCAMAAAAsYgRbAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF3NSmzMewPxIG//ncJEJsldTou1jHgAAAARBJREFUeNrs2EEKgCAQBVDLuv+V20dENbMY831wKz4Y/VHb/5RGQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0PzMWtyaGhoaGhoaGhoaGhoaGhoxtb0QGhoaGhoaGhoaGhoaGhoaMbRLEvv50VTQ9OTQ5OpyZ01GpM2g0bfmDQaL7S+ofFC6xv3ZpxJiywakzbvd9r3RWPS9I2+MWk0+kbf0Hih9Y17U0nTHibrDDQ0NDQ0NDQ0NDQ0NDQ0NTXbRSL/AK72o6GhoaGhoRlL8951vwsNDQ0NDQ1NDc0WyHtDTEhDQ0NDQ0NTS5MdGhoaGhoaGhoaGhoaGhoaGhoaGhoaGposzSHAAErMwwQ2HwRQAAAAAElFTkSuQmCC";
			//document.write('<img src="'+img+'"/>');
//			var params = "userID="+currentUserID+"&trx="+strTrx+"&trackName="+encodeURI(trackname.val())+"&trackDescription="+encodeURI(trackdescription.val())+"&imgPreview="+encodeURI(img2);
			var params = "userID="+currentUserID+"&trx="+strTrx+"&trackName="+encodeURI(trackname.val())+"&trackDescription="+encodeURI(trackdescription.val())+"&imgPreview="+img2;
			console.log("params="+params);
			http.open("POST", url, true);
			
			//Send the proper header information along with the request
			http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			
			http.onreadystatechange = function() {//Call a function when the state changes.
			    if(http.readyState == 4 && http.status == 200) {
			    	console.log("response="+http.responseText);
	                if (this.responseText.length>3) {
	                	alert("Track upload successful!");
 	                } else {
	                	alert("Track upload failed.")
	                }
			    }
			}
			http.send(params);		
  			dialogUploadTrack.dialog( "close" );
    	}
      	return valid;
	}
	
	
    function updateTips(t) {
      tips
        .text( t )
        .addClass( "ui-state-highlight" );
      setTimeout(function() {
        tips.removeClass( "ui-state-highlight", 1500 );
      }, 500 );
    }
 
     function checkLength( o, n, min, max ) {
      if ( o.val().length > max || o.val().length < min ) {
        o.addClass( "ui-state-error" );
        updateTips( "Length of " + n + " must be between " +
          min + " and " + max + "." );
        return false;
      } else {
        return true;
      }
    }
 
    function checkRegexp( o, regexp, n ) {
      if ( !( regexp.test( o.val() ) ) ) {
        o.addClass( "ui-state-error" );
        updateTips( n );
        return false;
      } else {
        return true;
      }
    }
  
 	function newUserDialog() {
	    dialogNewUser = $( "#dialog-newUser" ).dialog({
	      autoOpen: false,
	      height: 400,
	      width: 350,
	      modal: true,
	      buttons: {
	        "Create an account": newUser,
	      },
	      close: function() {
	        form[ 0 ].reset();
	        allFields.removeClass( "ui-state-error" );
	      }
	    });
	 
	    form = dialogNewUser.find( "form" ).on( "submit", function( event ) {
	      event.preventDefault();
	      newUser();
	    });
	 
	    dialogNewUser.dialog( "open" );
	}
	
 	function signinUserDialog() {
	    dialogSigninUser = $( "#dialog-signinUser" ).dialog({
	      autoOpen: false,
	      height: 400,
	      width: 350,
	      modal: true,
	      buttons: {
	        "Sign-in user": signinUser,
	      },
	      close: function() {
	        form[ 0 ].reset();
	        allFields.removeClass( "ui-state-error" );
	      }
	    });
	 
	    form = dialogSigninUser.find( "form" ).on( "submit", function( event ) {
	      event.preventDefault();
	      signinUser();
	    });
	 
	    dialogSigninUser.dialog( "open" );
	}
	
 	function forgotPasswordDialog() {
	    dialogForgotPassword = $( "#dialog-forgotPassword" ).dialog({
	      autoOpen: false,
	      height: 400,
	      width: 350,
	      modal: true,
	      buttons: {
	        "Forgot Password": forgotPassword,
	      },
	      close: function() {
	        form[ 0 ].reset();
	        allFields.removeClass( "ui-state-error" );
	      }
	    });
	 
	    form = dialogForgotPassword.find( "form" ).on( "submit", function( event ) {
	      event.preventDefault();
	      forgotPassword();
	    });
	 
	    dialogForgotPassword.dialog( "open" );
	}
	
 	function downloadTrackDialog() {
		console.log("Browse Tracks dialog");
		//downloadTrack();
/*	
	    dialogDownloadTracks = $( "#dialog-downloadTracks" ).dialog({
	      autoOpen: false,
	      height: 400,
	      width: 350,
	      modal: true,
	      buttons: {
	        "Browse Tracks": browseTracks,
	        Cancel: function() {
	          dialog.dialog( "close" );
	        }
	      },
	      close: function() {
	        form[ 0 ].reset();
	        allFields.removeClass( "ui-state-error" );
	      }
	    });
	 
	    form = dialogDownloadTracks.find( "form" ).on( "submit", function( event ) {
	      event.preventDefault();
	      browseTracks();
	    });
	 
	    dialogDownloadTracks.dialog( "open" );
*/	}
	
 	function uploadTrackDialog() {
		console.log("Upload Track dialog");

	    dialogUploadTrack = $( "#dialog-uploadTrack" ).dialog({
	      autoOpen: false,
	      height: 400,
	      width: 350,
	      modal: true,
	      buttons: {
	        "Upload Track": uploadTrackPost,
	      },
	      close: function() {
	        form[ 0 ].reset();
	        allFields.removeClass( "ui-state-error" );
	      }
	    });
	 
	    form = dialogUploadTrack.find( "form" ).on( "submit", function( event ) {
	      event.preventDefault();
	      uploadTrackPost();
	    });
	 
	    dialogUploadTrack.dialog( "open" );
	}
	
//// END code for dialog boxes
 	
	function writeTrx() { //write out trx to console so can be manually cut and paste to save
		var trx = [tracks, engines, cars];
		var strTrx= JSON.stringify(JSON.decycle(trx)); 
		var compressed= compress(strTrx);
		console.log("comptrx[]=\'"+compressed+"\'\;");
		prompt("Select the text and copy to Export TrainTrack", compressed);
	}

	function readTrx() { //read trx from dialog box so can be manually cut and paste to enter new trx
		var input = window.prompt("Paste in text to Import TrainTrack");
		openTrxJSON(decompress(input));
		buildTrains();
		updateUndoHistory();
		draw();
	}
	
	function downloadTrack() {
		var trackID = prompt("Please enter the trackID to load", "1");
		downloadTrackID(trackID);
	}
	
	function downloadTrackID(trackID) {
		var url = "php/downloadTrack.php?trackID="+trackID;
        xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                var retArray = this.responseText.split("&&&");
                var strTrx = retArray[1];
                var trackName = retArray[2];
                var trackDescription = retArray[3];
                var strTrxD = strTrx.replace(/&quot;/g,'"')
				openTrxJSON(decompress(strTrxD));
				updateUndoHistory();
				buildTrains();
				draw();
            }
        };
        xmlhttp.open("GET",url,true);
        xmlhttp.send();
 
 	}
	
	function interpretAll() {
		//iterate through all trains  and ECs to interpet
		for (var t=0; t<trains.length; t++) { 
			var train = trains[t];
			for (c=train.length-1; c>=0; c--) { // go through train backwards so wye doesn't switch under a car
				if (!modalTrack) {
					interpret (train[c]);
				}
			}
		}
		
		// see if ec crashed into another ec -- todo probably slower than could be
		for (var t=0; t<trains.length; t++) { //iterate through trains
			var train = trains[t];
			for (var c=train.length-1; c>=0; c--) {
				for (var t2=t; t2<trains.length; t2++) { //iterate through trains. Crashing is symmetric so start t2=t
					var train2 = trains[t2];
					for (var c2=train2.length-1; c2>=0; c2--) {
						if (train[c] != train2[c2] && train[c].gridx == train2[c2].gridx && train[c].gridy == train2[c2].gridy) {
							console.log ("CRASH ecs");
							crash(train[c]);
							crash(train2[c2]);
						}
					}
				}
			}
		}
		
	}
	
	function interpret(ec) { //interprets an engine or car one iteration (moves engine or car down track)
		ec.position += ec.speed/1000;

		if (ec.position>=1 || ec.position<0) { //stepped past current tile so figure out which one to jump to
			var x = Math.floor(ec.gridx);
			var y = Math.floor(ec.gridy);
			var startTrack = tracks[mi(x,y)];
			var startOri = ec.orientation; // this was missing for a while so I added back, not sure if right

			//figure out next tile
			next = getNextTrack(ec);

			//check for crashes
			if (tracks[mi(next.gridx,next.gridy)] == undefined) {
				console.log("Undef crash");
				crash(ec);
			} else if (tracks[mi(next.gridx,next.gridy)].type == "tracknull" ||
					   tracks[mi(next.gridx,next.gridy)].type == "trackwater") {
			    console.log("water or null crash");
 			    crash(ec);
			} else if (!doesConnect(ec, next)) {//check if entering tile from an allowed direction 
				crash(ec);
			} else {
				//clamp position to [0,1)]
	 			if (ec.position>=1) ec.position -= 1;		
	 			if (ec.position<0) ec.position += 1;		
	
				//advance ec		
				ec.gridx = next.gridx;
				ec.gridy = next.gridy;
				ec.orientation = next.orientation;

				//check for crashes with other ecs
/*				for (var t=0; t<trains.length; t++) { //iterate through trains
					var train = trains[t];
					for (var c=train.length-1; c>=0; c--) {
						if (train[c] != ec && train[c].gridx == ec.gridx && train[c].gridy == ec.gridy) {
							console.log ("CRASH ecs");
							crash(ec);
							crash(train[c]);
						}
					}
				}*/
				
				//check for lazy wyes
				var oriDif = (ec.orientation - tracks[mi(ec.gridx,ec.gridy)].orientation +8)%8;
				if (tracks[mi(ec.gridx,ec.gridy)].subtype == "lazy") {
					console.log("Lazy wye. Ori dif="+oriDif);
					var state = tracks[mi(ec.gridx,ec.gridy)].state;
					switch 	(tracks[mi(ec.gridx,ec.gridy)].type) {
						case "trackwyeleft":
							if (oriDif == 2) state = "left";
							if (oriDif == 4) state = "right";
							break;
						case "trackwyeright":
							if (oriDif == 4) state = "left";
							if (oriDif == 6) state = "right";
							break;
						case "trackwye":
							if (oriDif == 2) state = "left";
							if (oriDif == 6) state = "right";
							break;
					}
					
					if (tracks[mi(ec.gridx,ec.gridy)].state != state) { //switch
						tracks[mi(ec.gridx,ec.gridy)].state = state;
						playSound("switch");
					}
				}
				
				//check for prompt on entering tile
				if (tracks[mi(ec.gridx,ec.gridy)].subtype == "prompt" && oriDif == 0 && isFirstCarInTrain(ec)) {
					console.log("Interpret prompt");
					clearInterval(interval);
					ctx.save();
					ctx.fillStyle = "rgba(128,128,128,0.4)";
					ctx.fillRect(0,0, canvasWidth, canvasHeight); //grey out background
					
			        var screenCenter = worldToScreen(centerTileX, centerTileY);
					ctx.translate(screenCenter.x-centerTileX*tileWidth*zoomScale, screenCenter.y-centerTileY*tileWidth*tileRatio*zoomScale);
					ctx.scale(zoomScale, zoomScale);
					ctx.translate((0.5+ec.gridx)*tileWidth, (0.5+ ec.gridy)*tileWidth*tileRatio); //center origin on tile
					ctx.rotate(ec.orientation*2*Math.PI/8);
					ctx.drawImage(imgArrowIcon,-tileWidth,-0.5*tileWidth*tileRatio);
					ctx.rotate(Math.PI);
					ctx.drawImage(imgArrowIcon,-tileWidth,-0.5*tileWidth*tileRatio*tileRatio);
					modalTrack = tracks[mi(ec.gridx,ec.gridy)];
					ctx.restore();
				}
	
				//check for alternate on exiting tile
				if (startTrack.subtype == "alternate" && (startOri - startTrack.orientation +8)%8 == 0 && isLastCarInTrain(ec)) {
					if (startTrack.state == "left") startTrack.state = "right";
					else startTrack.state = "left";
					playSound("switch");
				}
				
				//check for random wye on exiting tile
				if (tracks[mi(ec.gridx,ec.gridy)].subtype == "random" && oriDif == 0 && isLastCarInTrain(ec)) {
					console.log("Random wye");
					if (Math.random() < 0.5) {
						console.log("switch");
						if (tracks[mi(ec.gridx,ec.gridy)].state == "left") tracks[mi(ec.gridx,ec.gridy)].state = "right";
						else tracks[mi(ec.gridx,ec.gridy)].state = "left";
						playSound("switch");
					}
				}
				
				//check for compareless or comparegreater or compareequal on engine entering tile
				var step = getTrackCargoStep(tracks[mi(ec.gridx,ec.gridy)]);
				if ((tracks[mi(ec.gridx,ec.gridy)].subtype == "compareless" || tracks[mi(ec.gridx,ec.gridy)].subtype == "comparegreater" || tracks[mi(ec.gridx,ec.gridy)].subtype == "compareequal") && oriDif == 0 && tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)].cargo != undefined && isFirstCarInTrain(ec)) {
					console.log("Check for wyes------");
					//iterate through train to find first car with same type as switch cargo type. Use it for comparison
					tracks[mi(ec.gridx,ec.gridy)].defaultState = tracks[mi(ec.gridx,ec.gridy)].state; //save current state to reset when train finished

					var train = getTrain(ec);
					var car;
					for (var c=0; c<train.length && car == undefined;  c++) {
						if (train[c].cargo) if (train[c].cargo.type == tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)].cargo.type) car = train[c];
					}
					
					if (car) {
						var state; 
						if (cargoValues[car.cargo.type][0] == "binary") {
							if (car.cargo.value == tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)].cargo.value) state = "left";
							else state = "right";
						} else {
							if (tracks[mi(ec.gridx,ec.gridy)].subtype == "compareless") { //for compareLess
								if (car.cargo.value <= tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)].cargo.value) state = "left";
								else state = "right";
							} 
							if (tracks[mi(ec.gridx,ec.gridy)].subtype == "comparegreater") { //for compareGreater
								if (car.cargo.value < tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)].cargo.value) state = "right";
								else state = "left";
							}
							if (tracks[mi(ec.gridx,ec.gridy)].subtype == "compareequal") { //for compareEqual
								if (car.cargo.value != tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)].cargo.value) state = "right";
								else state = "left";
							}
						}
						if (state != tracks[mi(ec.gridx,ec.gridy)].state) playSound("switch");
						tracks[mi(ec.gridx,ec.gridy)].state = state;
					}
	
				}

				//set compare wyes back to default direction when train exits
				if ((startTrack.subtype == "compareless" || startTrack.subtype == "comparegreater" || startTrack.subtype == "compareequal") && (startOri - startTrack.orientation +8)%8 == 0 && isLastCarInTrain(ec)) {
					startTrack.state = startTrack.defaultState; //save current state to reset when train finished
				}
			}
		}
	}

	function doesConnect(ec, next) { //checks if ec enters next track from valid direction
		//0=N, 1=NE, 2=E, 3=SE, 4=S, 5=SW, 6=W, 7=NW
		var tracknext = tracks[mi(next.gridx,next.gridy)]
		var oriDif = (tracknext.orientation-next.orientation+8)%8;
		if (ec.speed>0) { // ec going forward
			switch (tracknext.type)  {
				case "trackstraight":
					if (oriDif == 0 || oriDif == 4) return true;
					break;
				case "trackcross":
					if (oriDif == 0 || oriDif == 4 || oriDif == 2 || oriDif == 6) return true;
					break;
				case "track90right":
				case "track90":
					if (oriDif == 6 || oriDif == 0) return true;
					break;
				case "track45":
					if (oriDif == 5 || oriDif == 0) return true; //5 0
					break;
				case "trackwye":
					if (oriDif == 6 || oriDif == 0 || oriDif == 2) return true;
					break;
				case "trackwyeright":
					if (oriDif == 4 || oriDif == 0 || oriDif == 2) return true; //0 4 2
					break;
				case "trackwyeleft":
					if (oriDif == 6 || oriDif == 0 || oriDif == 4) return true; //4 0 6
					break;
			}
		} else { // ec going backwards
			console.log("Backwards- tracktyype="+tracknext.type+" oriDif="+oriDif);
			switch (tracknext.type)  {
				case "trackstraight":
					if (oriDif == 0 || oriDif == 4) return true;
					break;
				case "trackcross":
					if (oriDif == 0 || oriDif == 4 || oriDif == 2 || oriDif == 6) return true;
					break;
				case "track90right":
				case "track90":
					if (oriDif == 2 || oriDif == 4) return true;
					break;
				case "track45":
					if (oriDif == 1 || oriDif == 4) return true; // 1
					break;
				case "trackwye":
					if (oriDif == 4 || oriDif == 6 || oriDif == 2) return true; //6
					break;
				case "trackwyeright":
					if (oriDif == 4 || oriDif == 6 || oriDif == 0) return true; //4 6 0
					break;
				case "trackwyeleft":
					if (oriDif == 4 || oriDif == 0 || oriDif == 2) return true; //4
					break;
			}

		}
		return false;
	}
	
	function detectCrashes() { // determine if any ec is <1 tile from another ec
		var rebuildTrains = false;
		for (var t=0; t<trains.length; t++) { 
			var train = trains[t];
			if (train[0].speed >= 0) {
				var next = getNextTrack(train[0]);
				var nextEC = getEC(next.gridx, next.gridy);
				if (nextEC != undefined) {
					if (nextEC.position+1-train[0].position < 0.9) {
						if (!isInTrain(nextEC)) {
							playSound("connect");
							rebuildTrains = true;
						} else {
							crash(train[0]);
						}
					}
				}
			} else {
				var next = getNextTrack(train[train.length-1]);
				var nextEC = getEC(next.gridx, next.gridy);
				if (nextEC != undefined) {
					if (nextEC.position+1-train[train.length-1].position < 1.0) {
						if (!isInTrain(nextEC)) {
							rebuildTrains = true;
						} else {
							crash(train[0]);
						}
					}
				}
			}
		}	

		if (rebuildTrains) buildTrains(); //make trains if any new cars added

	}

	function detectStations() {
		for (var t=0; t<trains.length; t++) { //iterate through trains
			var train = trains[t];
			for (var c=0; c<train.length; c++) {
				var ec = train[c];
				if (ec.position >= 0.5 && ec.position < 0.5+ec.speed/1000 /*&& ec.type == "carbasic"*/) { //perform action when car reaches middle of track
					// pickup cargo lying on track (not on station)
					if (ec.cargo == undefined && tracks[mi(ec.gridx,ec.gridy)].cargo != undefined && ec.type == "carbasic") {
						//move cargo
						ec.cargo = tracks[mi(ec.gridx,ec.gridy)].cargo;
						tracks[mi(ec.gridx,ec.gridy)].cargo = undefined;
					} 
					
					var step = getTrackCargoStep(tracks[mi(ec.gridx,ec.gridy)]);
					var cargoLength;
					if (ec.cargo !=undefined) cargoLength = cargoValues[ec.cargo.type].length-1;

					if (isFirstCarInTrain(ec)) {
						trainStationLogReset(getEngine(ec), tracks[mi(ec.gridx,ec.gridy)]);//make new entry in stations log for this train
					}

					//divide, multiply, add, subtract cargo
					if ((tracks[mi(ec.gridx,ec.gridy)].subtype == "divide"
					 || tracks[mi(ec.gridx,ec.gridy)].subtype == "multiply"
					 || tracks[mi(ec.gridx,ec.gridy)].subtype == "add"
					 || tracks[mi(ec.gridx,ec.gridy)].subtype == "subtract") ){
					 //&& (trainStationLogGetTicks(getEngine(ec), tracks[mi(ec.gridx,ec.gridy)]) < 2)) {
						if (tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)].cargo != undefined)  { //station has cargo 
							if ((ec.cargo) && (tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)].cargo.type == ec.cargo.type)) { // same type so operate
								playSound(tracks[mi(ec.gridx,ec.gridy)].subtype);
								switch (tracks[mi(ec.gridx,ec.gridy)].subtype) {
									case "divide":
										if (cargoValues[ec.cargo.type][0] == "blocks") { //no zero for blocks but their value is 1 off
											ec.cargo.value = ((ec.cargo.value+1) / (tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)].cargo.value+1))-1;
										} else {
											if (tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)].cargo.value == 0) { //divide by zero
												ec.cargo.value = 8; // i (infinity)
												ec.cargo.type = 2;//lowercase
											} else {
												ec.cargo.value = Math.round(ec.cargo.value / tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)].cargo.value);
											}
										}
										break;
									case "multiply":
										if (cargoValues[ec.cargo.type][0] == "blocks") ec.cargo.value = (((ec.cargo.value+1) * (tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)].cargo.value+1))-1)%cargoLength;
										else ec.cargo.value = (ec.cargo.value * tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)].cargo.value)%cargoLength;
										break;
									case "add":
										if (cargoValues[ec.cargo.type][0] == "blocks") ec.cargo.value = (1 + ec.cargo.value + tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)].cargo.value)%cargoLength;
										else ec.cargo.value = (ec.cargo.value + tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)].cargo.value)%cargoLength;
										break;
									case "subtract":
										if (cargoValues[ec.cargo.type][0] == "blocks") ec.cargo.value = (ec.cargo.value - 1 - tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)].cargo.value + cargoLength)%cargoLength;
										else ec.cargo.value = (ec.cargo.value - tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)].cargo.value + cargoLength)%cargoLength;
										break;
								}
								animateCargo(tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)], ec, "dump-poof"); 
								trainStationLogAddTick(getEngine(ec), tracks[mi(ec.gridx,ec.gridy)]);
							}
						} else { // station does not have cargo so transfer cargo
							if (ec.cargo !=undefined) {
								tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)].cargo = new Cargo(ec.cargo.value, ec.cargo.type);
								animateCargo(ec, tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)], "move"); 
								trainStationLogAddTick(getEngine(ec), tracks[mi(ec.gridx,ec.gridy)]);
								playSound("pickdropreverse");
							}
						}
					}
					
					//catapult cargo  
					if (ec.cargo !=undefined && tracks[mi(ec.gridx,ec.gridy)].subtype == "catapult" && trainStationLogGetTicks(getEngine(ec), tracks[mi(ec.gridx,ec.gridy)]) < 2) {
						//console.log("Catapult switch");
						if (tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)].cargo != undefined)  { //station has cargo so catapult ec cargo and remove number from station and cargo from car
							playSound("catapult");
							var angle = ((tracks[mi(ec.gridx,ec.gridy)].orientation + 2 + 2) %8)*Math.PI/4;
							var value = tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)].cargo.value;
							if (cargoValues[tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)].cargo.type][0] == "blocks") value++;
							var stepX = value * Math.round(Math.cos(angle));
							var stepY = value * Math.round(Math.sin(angle));
							if (tracks[mi(ec.gridx+stepX,ec.gridy+stepY)] == undefined) new Track (ec.gridx+stepX, ec.gridy+stepY, "trackblank");
							animateCargo(ec, tracks[mi(ec.gridx+stepX,ec.gridy+stepY)], "move-spin");
							animateCargo(tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)],tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)],"dump");
							trainStationLogAddTick(getEngine(ec), tracks[mi(ec.gridx,ec.gridy)]);
						} else { // station does not have cargo so transfer cargo if its a number
							if (cargoValues[ec.cargo.type][0] == "numbers" || cargoValues[ec.cargo.type][0] == "blocks") {
								playSound("catapultWindup");
								animateCargo(ec, tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)], "move");
								trainStationLogAddTick(getEngine(ec), tracks[mi(ec.gridx,ec.gridy)]);
							}
						}
					} 

					//slingshot cargo
					if (ec.cargo !=undefined && tracks[mi(ec.gridx,ec.gridy)].subtype == "slingshot") {//no limit on amount to unload
						if (!tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)] || !tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)].cargo || tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)].cargo.type == ec. cargo.type) { //type specific
							playSound("slingshot");
							var angle = ((tracks[mi(ec.gridx,ec.gridy)].orientation + 2 + 2) %8)*Math.PI/4;
							var stepX = Math.round(Math.cos(angle));
							var stepY = Math.round(Math.sin(angle));
							
							var curX = ec.gridx;
							var curY = ec.gridy;
							var loops = 0;
	
							do {
								var nextX = curX + stepX;
								var nextY = curY + stepY;
								if (tracks[mi(nextX,nextY)] == undefined) new Track(nextX, nextY, "trackblank");
								if (loops == 0) {
									first = false;
									animateCargo(ec, tracks[mi(nextX,nextY)], "move", 15-loops);
								} else animateCargo(tracks[mi(curX,curY)], tracks[mi(nextX,nextY)], "move", 15-loops);
								curX = nextX;
								curY = nextY;
								loops++;
							} while (tracks[mi(curX,curY)].cargo);
						}							
					}
					
					//pickdrop cargo
					if (tracks[mi(ec.gridx,ec.gridy)].subtype == "pickdrop" && ec.type == "carbasic" && trainStationLogGetTicks(getEngine(ec), tracks[mi(ec.gridx,ec.gridy)]) < 1) {
						//if station has cargo and car doesn't, then swap station cargo to car
						if (ec.cargo == undefined && tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)].cargo != undefined) {
							playSound("pickdrop");
							animateCargo(tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)], ec, "move"); 
							trainStationLogAddTick(getEngine(ec), tracks[mi(ec.gridx,ec.gridy)]);
						}
						//if car has cargo and station doesn't, then swap car cargo to station
						else if (ec.cargo != undefined && tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)].cargo == undefined) {
							playSound("pickdropreverse");
							animateCargo(ec, tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)], "move"); 
							trainStationLogAddTick(getEngine(ec), tracks[mi(ec.gridx,ec.gridy)]);
						}
					}

					//home cargo
					//console.log("subtype="+tracks[mi(ec.gridx,ec.gridy)].subtype);
					if (tracks[mi(ec.gridx,ec.gridy)].subtype == "home") {
						//console.log("home");
						//if car has cargo and station doesn't, then swap car cargo to station
						if (ec.cargo != undefined && tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)].cargo == undefined
						&& cargoValues[ec.cargo.type][0] == "stuffedanimals" && ec.cargo.value == 0) {
							playSound("home");
							if (interactionState == 'Try level') {
								index = currentTrackSet + "-" + (currentTrackNumber+1);
								unlockedTrx[index] = true;
								if (currentTrackNumber == 9) {
									var nextTrackSet;
									for (i=0; i<trainerLevelNames.length; i++) {
										if (currentTrackSet == trainerLevelNames[i]) nextTrackSet = trainerLevelNames[i+1];
									}
									if (nextTrackSet) trainerLevelLocked[nextTrackSet] = false;
									trainerLevelCompleted[currentTrackSet] = true;
								}
								animationFrame = 0;
								interactionState = 'StarScreen';
								text = currentTrackSet + "-" + (currentTrackNumber);
								bestTime = 1;
								if (bestTrackTime[text]) bestTime= bestTrackTime[text];
								var d = new Date();
								now = d.getTime();
								currentTrackTime = now - startTimePlay;
								currentTrackScore = Math.round(1000*bestTrackTime[text]/currentTrackTime);
								newHighScore = false;
								if (currentTrackScore>1000) currentTrackScore = 1000; 
								console.log("trackTime['"+text+"'] = "+currentTrackTime);
							}
							animateCargo(ec, tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)], "move"); 
						}
					}
					
					//dump cargo
					if (ec.cargo !=undefined && tracks[mi(ec.gridx,ec.gridy)].subtype == "dump" && trainStationLogGetTicks(getEngine(ec), tracks[mi(ec.gridx,ec.gridy)]) < 1) {
						//dump only if cargo type on trackCargo matches or is nonexistent
						if (tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)]==undefined || tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)].cargo==undefined || tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)].type != "trackcargo" || tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)].cargo.type == ec.cargo.type) {
							playSound("dump");
							var endObj = tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)];
							if (endObj == undefined) endObj = ec;
							animateCargo(ec, endObj, "dump-poof"); 
							trainStationLogAddTick(getEngine(ec), tracks[mi(ec.gridx,ec.gridy)]);
						}
					}
					
					//increment cargo
					if (ec.cargo !=undefined && tracks[mi(ec.gridx,ec.gridy)].subtype == "increment" && trainStationLogGetTicks(getEngine(ec), tracks[mi(ec.gridx,ec.gridy)]) < 1) {
						//increment only if cargo type on trackCargo matches or is nonexistent
						if (!tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)] || !tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)].cargo || tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)].cargo.type == ec. cargo.type) {
							playSound("increment");
							ec.cargo.value++;
							ec.cargo.value %= cargoValues[ec.cargo.type].length-1;
							animateCargo(ec, ec, "spin", 8);
							trainStationLogAddTick(getEngine(ec), tracks[mi(ec.gridx,ec.gridy)]);
						}
					}
					
					//decrement cargo
					if (ec.cargo !=undefined && tracks[mi(ec.gridx,ec.gridy)].subtype == "decrement" && trainStationLogGetTicks(getEngine(ec), tracks[mi(ec.gridx,ec.gridy)]) < 1) {
						playSound("decrement");
						//decrement only if cargo type on trackCargo matches or is nonexistent
						if (!tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)] || !tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)].cargo || tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)].cargo.type == ec. cargo.type) {
							ec.cargo.value--;
							ec.cargo.value += cargoValues[ec.cargo.type].length-1;
							ec.cargo.value %= cargoValues[ec.cargo.type].length-1;
							animateCargo(ec, ec, "spin", 8);
							trainStationLogAddTick(getEngine(ec), tracks[mi(ec.gridx,ec.gridy)]);
						}
					}
					
					//supply station
					if (tracks[mi(ec.gridx,ec.gridy)].subtype == "supply" && ec.type == "carbasic" && trainStationLogGetTicks(getEngine(ec), tracks[mi(ec.gridx,ec.gridy)]) < 1) {
						//if station has cargo and car doesn't, then copy station cargo to car
						if (ec.cargo == undefined && tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)].cargo != undefined) {
							playSound("supply");
							ec.cargo = new Cargo(tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)].cargo.value, tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)].cargo.type); //copy cargo
							animateCargo(ec, tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)], "supply"); 
							trainStationLogAddTick(getEngine(ec), tracks[mi(ec.gridx,ec.gridy)]);
						}
												
						//if car has cargo and station doesn't, then move car cargo to station 
						if (ec.cargo != undefined && tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)].cargo == undefined) {
							playSound("supply");
							animateCargo(ec, tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)], "move");
							trainStationLogAddTick(getEngine(ec), tracks[mi(ec.gridx,ec.gridy)]);
						}
					}

					//tunnel
					if (tracks[mi(ec.gridx,ec.gridy)].subtype == "greentunnel" || tracks[mi(ec.gridx,ec.gridy)].subtype == "redtunnel" || tracks[mi(ec.gridx,ec.gridy)].subtype == "bluetunnel") {
						var transportKey, distance;
						
						//see if ec has arrived at this tunnel before if so transport back to sending tunnel and remove entry
						for (var i=0; i<ec.tunnelto.length; i++) {
							if (ec.tunnelto[i] == mi(ec.gridx,ec.gridy)) {
								transportKey = ec.tunnelfrom[i];
								ec.tunnelto.splice(i,1);
								ec.tunnelfrom.splice(i,1);
							}
						}
						if (transportKey) playSound("tunnelReverse");

						//if not transported before then transport to the farthest tunnel of same color
						if (!transportKey) {
							for (var key in tracks) {
							    if (tracks[key].subtype == tracks[mi(ec.gridx,ec.gridy)].subtype && key != mi(ec.gridx,ec.gridy)) {
							    	if (!transportKey) {
							    		transportKey = key;
							    		distance = Math.pow((tracks[key].gridx-ec.gridx),2) + Math.pow((tracks[key].gridy-ec.gridy),2);
							    	} else if (Math.pow((tracks[key].gridx-ec.gridx),2) + Math.pow((tracks[key].gridy-ec.gridy),2) > distance) {
							    		transportKey = key;
							    		distance = Math.pow((tracks[key].gridx-ec.gridx),2) + Math.pow((tracks[key].gridy-ec.gridy),2);
							    	}
							    }
							}
							
							if (transportKey) {
								playSound("tunnel");
								ec.tunnelto.push(mi(tracks[transportKey].gridx, tracks[transportKey].gridy));
								ec.tunnelfrom.push(mi(ec.gridx, ec.gridy));
							}
						}
						
						if (transportKey) { // transport EC is found another tunnel
							ec.orientation = (ec.orientation - (tracks[mi(ec.gridx,ec.gridy)].orientation - tracks[transportKey].orientation))%8;
							ec.gridx = tracks[transportKey].gridx;
							ec.gridy = tracks[transportKey].gridy;
						}
					}

					//drop off cargo at empty compareless or comapregreater or compareequal wyes
					if (tracks[mi(ec.gridx,ec.gridy)].subtype == "compareless" || tracks[mi(ec.gridx,ec.gridy)].subtype == "comparegreater" || tracks[mi(ec.gridx,ec.gridy)].subtype == "compareequal") {
						if (ec.cargo != undefined && tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)].cargo == undefined) {
							playSound("supply");
							animateCargo(ec, tracks[mi(ec.gridx+step.stepX,ec.gridy+step.stepY)], "move"); 
						}
					}
				}
			}
		}
		
	}	
	
	//set/make log entry with key combining engine and track to zero. Used to ensure that station operates on car only once (or twice) each time train goes by
	function trainStationLogReset(engine, track) {
		var key = getUniqueID(engine) + "-" + getUniqueID(track);
		trainStationLog[key] = 0;
	}
	
	//increment log entry with key combining engine and track to zero. Used to ensure that station operates on car only once (or twice) each time train goes by
	function trainStationLogAddTick(engine, track) {
		var key = getUniqueID(engine) + "-" + getUniqueID(track);
		trainStationLog[key] = trainStationLog[key] + 1;
	}
	
	//return log entry with key combining engine and track to zero. Used to ensure that station operates on car only once (or twice) each time train goes by
	function trainStationLogGetTicks(engine, track) {
		var key = getUniqueID(engine) + "-" + getUniqueID(track);
		var retValue = trainStationLog[key];
		if (retValue) return retValue;
		else return 0;
	}
	
	function animateCargo (startObj, endObj, type, frames) {
		if (startObj == undefined || endObj == undefined) return;
		if (startObj.cargo.isanimating) {
			console.log ("startObj is already animating so RETURN");
			return;
		}
		startObj.cargo.isanimating = true;
		startObj.cargo.animatestartobj = startObj;
		startObj.cargo.animateendobj = endObj;	
		var startObjspeed = 0;
		if (startObj.speed) startObjspeed = startObj.speed;
		var endObjspeed = 0;
		if (endObj.speed) endObjspeed = endObj.speed;
		var ecspeed = Math.max(startObjspeed, endObjspeed);
		var defaultFrames = Math.ceil(16*(maxEngineSpeed-ecspeed)/maxEngineSpeed);
		startObj.cargo.animatetype = type || "straight";
		startObj.cargo.animatetotalframes = frames || defaultFrames;
		startObj.cargo.animatedframes = 0;
	}
	
	function animatePoof (gridx, gridy, frames) {
		var poof = {};
		var defaultFrames = 8;
		poof.gridx = gridx;
		poof.gridy = gridy;
		poof.animatetotalframes = frames || defaultFrames;
		poof.animatedframes = 0;
		poofs.push(poof);
	}
	
	function playSound(name) { // play sound for the named event
		if (sounds[name]) {
			sounds[name].play();
		} else {
			console.log("ERROR- Play sound name undefined name="+name);
		}
	}
	
	function isInTrain(ec) { //returns true if ec is part of a train, returns false for free cars
		if (ec.type == "enginebasic") return true; //trivial case because engines are part of a train by definition
		
		for (var nTrain=0; nTrain<trains.length; nTrain++) {
			var train = trains[nTrain];
			for (var j=0; j<train.length; j++) {
				if (train[j] == ec) return true;
			}
		}
		
		return false;
	}
	
	function reverseOrientation(ec) { //flips the orientation of the ec so it is going the other way on the track. For track straight just ori+=4
		var track=tracks[mi(ec.gridx,ec.gridy)];
		for (var dif=1; dif<8; dif++) {
			var oriCheck = (ec.orientation+dif)%8;
			if (ec.speed >=0) oriCheck = (oriCheck+4)%8; //add 4 since orientation is based on orientation when entering
			if (trackConnects(track, oriCheck)) {
				ec.orientation = (oriCheck+4)%8;
				return;
			}
		}
		
		console.log("ERROR- couldn't reverse orientation");
	}
	
	function reverseSpeed(ec) { //reverse the speed of this engine or car. If straight then just speed = -speed. If on corner then must change ori
		console.log("ReverseSpeed");
		var type = getTypeForWye(ec, tracks[mi(ec.gridx,ec.gridy)]);
		if (type != "trackstraight" && type != "trackbridge" && type != "trackcross") {
			var ori;
			for (var dif=1; dif<9 && ori == undefined; dif++) {
				var testOri = (ec.orientation+dif)%8;
				var oriDif = (testOri-ec.orientation+8)%8;
				if ((trackConnects(tracks[mi(ec.gridx,ec.gridy)], testOri)) && oriDif !=4) {
					ori = testOri;
					if (ec.speed<0) ori = (ori+4)%8;
				}
			}
			if (dif == 8) console.log("ERROR- couldn't flip orientation");
			ec.orientation = ori;
		}
		ec.speed = -ec.speed;
	}
	
	function getPreviousTrack(ec) { //find previous track by reversing speed
		var ecCopy = jQuery.extend({},ec);
		if (ecCopy.speed == 0) ecCopy.speed = 10;
		reverseSpeed(ecCopy);
		return getNextTrack(ecCopy);
	}
	
	function getNextTrack(ec) {
		var track = tracks[mi(ec.gridx,ec.gridy)];
		if (!track) {
			console.log("ERROR no track found for getNextTrack ec.gridx="+ec.gridx+" y="+ec.gridy);
			return;
		}
		var type = getTypeForWye(ec, track);
		var gridx=0, gridy=0;
		var orientation = ec.orientation;
		var oriDif = (orientation - track.orientation+8)%8;
		
		switch (type)  {
			case "trackstraight":
			case "trackcross":
			case "trackbridge":
				if (ec.speed>=0 ) {
					gridx = ec.gridx + Math.round(Math.cos(Math.PI/4*(orientation-2)));
					gridy = ec.gridy + Math.round(Math.sin(Math.PI/4*(orientation-2)));
				} else {
					gridx = ec.gridx - Math.round(Math.cos(Math.PI/4*(orientation-2)));
					gridy = ec.gridy - Math.round(Math.sin(Math.PI/4*(orientation-2)));
				}
				break;
			case "track90":
				if (ec.speed>=0 ) {
					//turn left or right
					if (oriDif == 0) orientation += 6;
					else orientation += 2;
					orientation %= 8;
					//step in new orientation
					gridx = ec.gridx + Math.round(Math.cos(Math.PI/4*(orientation-2))); // -2 because x-axis is 0 radians whereas orientation=0 is negative y-axis
					gridy = ec.gridy + Math.round(Math.sin(Math.PI/4*(orientation-2)));
				} else {
					//turn left or right
					if (oriDif != 4) orientation += 2;
					else orientation += 6;
					orientation %= 8;
					//step in new orientation
					gridx = ec.gridx - Math.round(Math.cos(Math.PI/4*(orientation-2))); //if eng ori = trk ori then 0 , else+=4
					gridy = ec.gridy - Math.round(Math.sin(Math.PI/4*(orientation-2)));
				}
				break;
			case "track90right":
				if (ec.speed>=0 ) {
					//turn left or right
					if (oriDif == 0) orientation += 2;
					else orientation += 6;
					orientation %= 8;
					//step in new orientation
					gridx = ec.gridx + Math.round(Math.cos(Math.PI/4*(orientation-2))); // -2 because x-axis is 0 radians whereas orientation=0 is negative y-axis
					gridy = ec.gridy + Math.round(Math.sin(Math.PI/4*(orientation-2)));
				} else {
					//turn left or right
					if (oriDif != 4) orientation += 6;
					else orientation += 2;
					orientation %= 8;
					//step in new orientation
					gridx = ec.gridx - Math.round(Math.cos(Math.PI/4*(orientation-2))); //if eng ori = trk ori then 0 , else+=4
					gridy = ec.gridy - Math.round(Math.sin(Math.PI/4*(orientation-2)));
				}
				break;
			case "track45":
				if (ec.speed>=0 ) {
					//turn left or right
					if (oriDif == 0) orientation +=7;
					else orientation +=1;
					orientation %= 8;
					//step in new orientation
					gridx = ec.gridx + Math.round(Math.cos(Math.PI/4*(orientation-2)));
					gridy = ec.gridy + Math.round(Math.sin(Math.PI/4*(orientation-2)));
				} else {
					//turn left or right
					//console.log("oridif 45="+oriDif);
					if (oriDif == 4) orientation +=7;
					else orientation +=1;
					orientation %= 8;
					//step in new orientation
					gridx = ec.gridx - Math.round(Math.cos(Math.PI/4*(orientation-2)));
					gridy = ec.gridy - Math.round(Math.sin(Math.PI/4*(orientation-2)));
				}
				break;
		}

	    return {
	        'gridx': gridx,
	        'gridy': gridy,
	        'orientation': orientation
	    };  
	}

	function getTypeForWye(ec, track) { //converts a wye track into a basic track type for drawing and interpreting
		if (!track) return;
		if (!ec) return;
		var oriDif = (ec.orientation - track.orientation + 8)%8;
		if (ec.speed < 0) oriDif = (oriDif+4)%8;
		var type = track.type;
		switch (type) {
			case "trackwyeleft":
				switch (oriDif) {
					case 0:
						if (track.state == "left") type = "track90";
						else type = "trackstraight";
						break;
					case 4:
						type = "trackstraight";
						break;
					case 2:
						type = "track90";
						break;
					default:
						crash(ec);
						console.log("Crash AAA");
						break;
				}
				break;
			case "trackwyeright":
				switch (oriDif) {
					case 0:
						if (track.state == "left") type = "trackstraight";
						else type = "track90right";
						break;
					case 4:
						type = "trackstraight";
						break;
					case 6:
						type = "track90right";
						break;
					default:
						crash(ec);
						console.log("Crash YYY");
						break;
				}
				break;
			case "trackwye":
				switch (oriDif) {
					case 0:
						if (track.state == "left") type = "track90";
						else type = "track90right";
						break;
					case 2:
						type = "track90";
						break;
					case 6:
						type = "track90right";
						break;
					default:
						crash(ec);
						console.log("Crash ZZZ");
						break;
				}
		}
		
		return type;
	}
	
	function crash(ec) {
		console.log ("Engine crashed at gridx="+ ec.gridx + " gridy=" + ec.gridy);
		
		playSound("crash");
		if (window.TapticEngine) {
			TapticEngine.impact({
			style: 'heavy' // light | medium | heavy
		  });
		} else {
			console.log ("No TapticEngine");
		}

		animatePoof(ec.gridx, ec.gridy);
		if (interactionState == 'Try level') { 
			console.log ("Crashed on levels");
			interactionState = 'StarScreen';
			currentTrackScore = 0;
			newHighScore = false;
			playSound("failure");
		} else {
			//delete train if crashes
			var nEngine;
			var train = getTrain(ec);
			if (!train) return;
			console.log("Train length="+train.length);
			for (var i=0; i<train.length; i++) {
				if (train[i].type == "enginebasic") nEngine = i;
				console.log("delete i="+i);
				deleteEC(train[i]);
			}
			trains.splice(i,1);
		}
		buildTrains();		
	}
	
	function deleteEC(ecdel) { //removes engines and cars from their arrays
		if (ecdel.immutable) return;
		var found = false;
		if (ecdel.type == "enginebasic") {
			for (var j=0; j<engines.length && !found; j++) {
				if (engines[j] == ecdel) {
					engines.splice(j,1);
					found = true;
					console.log("Deleted engine "+j);
				}
			}
		} else {
			for (var j=0; j<cars.length && !found; j++) {
				if (cars[j] == ecdel) {
					cars.splice(j,1);
					found = true;
					console.log("Deleted car "+j);
				}
			}
		}
		
		if (found) delete ecdel;
		
	}
		
	function screenToWorld(x,y) { //converts point in pixels of canvas on screen to world coordinates in xtiles, ytiles
		var worldPoint = {};
		worldPoint.xtile = (x-(tracksWidth/2-centerTileX*tileWidth))/zoomScale/tileWidth;
		worldPoint.ytile = (y-(canvasHeight/2-centerTileY*tileWidth*tileRatio))/zoomScale/tileWidth/tileRatio;
		return worldPoint;	
	}
	
	function worldToScreen(xtile, ytile) { //converts points in world cordidates (units tiles) to screen coordinates (units pixels)
		var screenPoint	= {};
		screenPoint.x = xtile*tileWidth*zoomScale+(tracksWidth/2-centerTileX*tileWidth);
		screenPoint.y = ytile*tileWidth*zoomScale*tileRatio+(canvasHeight/2-centerTileY*tileWidth*tileRatio);
		return screenPoint;
	}
	
	function addPointTrack(x,y) { //x,y are in world coords
		var screenPoint = worldToScreen(x,y);
		if (screenPoint.x > tracksWidth) {console.log("Greater than trackWidth");return; }
		if (screenPoint.y > tracksHeight) return;

		drawingPointsTrackX.push(x);
		drawingPointsTrackY.push(y);
		if (!getButton("Play").down) drawPathTrack();
		
		//get tile coords
		var trackTileX = Math.floor(x);
		var trackTileY = Math.floor(y);
						
		//get tile quadrant (tile split into 3x3 grid, center is 8, 0 is N, 1 is NE, 2 is E...)
		var xFraction = (x-trackTileX) * (2+2*Math.SQRT2);
		var yFraction = (y-trackTileY) * (2+2*Math.SQRT2);
		var tileOrientation;

		if (useOctagons) {
			//if in the box (the space between octagons) then return
			if (xFraction + yFraction < Math.SQRT2) return;
			if ((2+2*Math.SQRT2)-xFraction + yFraction < Math.SQRT2) return;
			if (xFraction + (2+2*Math.SQRT2)-yFraction < Math.SQRT2) return;
			if ((2+2*Math.SQRT2)-xFraction + (2+2*Math.SQRT2)-yFraction < Math.SQRT2) return;
	
			//figure out orientation
			if (xFraction < Math.SQRT2) {
				if (yFraction < Math.SQRT2) {
					tileOrientation = 7;
				} else if (yFraction < Math.SQRT2+2) {
					tileOrientation = 6;
				} else {
					tileOrientation = 5;
				}
			} else if (xFraction < Math.SQRT2+2) {
				if (yFraction < Math.SQRT2) {
					tileOrientation = 0;
				} else if (yFraction < Math.SQRT2+2) {
					tileOrientation = 8;
				} else {
					tileOrientation = 4;
				}
			} else {
				if (yFraction < Math.SQRT2) {
					tileOrientation = 1;
				} else if (yFraction < Math.SQRT2+2) {
					tileOrientation = 2;
				} else {
					tileOrientation = 3;
				}
			} 
		} else { //use squares
			//divide square with an X to make 4 triangle shaped quadrants
			if (xFraction > yFraction) {
				if (xFraction > (2+2*Math.SQRT2)-yFraction) {
					tileOrientation = 2;
				} else {
					tileOrientation = 0;
				}
			} else {
				if (xFraction > (2+2*Math.SQRT2)-yFraction) {
					tileOrientation = 4;
				} else {
					tileOrientation = 6;
				}
			}
		}
		
		//if new tile position, then make tile for last position based on quadrant entered and exited
		if (currentXTile == undefined) {
			currentXTile = trackTileX;
			currentYTile = trackTileY;
			enteringOrientation = 8; //flag so as to not make track on initial tile
		}
		
		if (currentXTile != trackTileX || currentYTile != trackTileY) { //this is a new tile
			//compare enteringOrientation and exitingOrientation to make tile for currentXTile, currentYTile
			if (enteringOrientation != exitingOrientation && enteringOrientation != 8) {
				var type, orientation;
				var state = "";
				var subtype = "";
				switch ((8+enteringOrientation-exitingOrientation)%8) {
					case 1: 
						type="track135"; 
						break;
					case 2: 
						type="track90"; 
						orientation=(exitingOrientation+4)%8;
						break;
					case 3: 
						type="track45"; 
						orientation=(exitingOrientation+4)%8;
						break;
					case 4:
						type="trackstraight";
						orientation = (enteringOrientation+4)%8;
						break;
					case 5: 
						type="track45"; 
						orientation=(enteringOrientation+4)%8;
						break;
					case 6: 
						type="track90"; 
						orientation=(enteringOrientation+4)%8;
						break;
					case 7: 
						type="track135"; 
						break;
				}
				
				//make wyes and crosses when new track is on top of existing track for special cases (perpendicular and no 45s)
				switch (type) {
					case "track90":
						//if there is already a straight track then make a wye left track
						if (tracks[mi(currentXTile,currentYTile)]) {
							switch (tracks[mi(currentXTile,currentYTile)].type) {
								case "trackstraight":
									var difEnter = (tracks[mi(currentXTile,currentYTile)].orientation - enteringOrientation +8)%8;
									var difExit = (tracks[mi(currentXTile,currentYTile)].orientation - exitingOrientation +8)%8;
									if ((difEnter == 4 && difExit == 2) || (difEnter == 2 && difExit == 4) || (difEnter == 0 && difExit == 6) || (difEnter == 6 && difExit == 0)) {
											type = "trackwyeleft";
											state = "left";
											subtype = "sprung";
									    } else {
											type = "trackwyeright";
											state = "right";
											orientation = (orientation+2)%8;
											subtype = "sprung";
									    }
								break;
								case "track90":
									switch ((tracks[mi(currentXTile,currentYTile)].orientation - enteringOrientation +8)%8) {
										case 0:
										case 2:
											type = "trackwye";
											state = "left";
											subtype = "sprung";
											break;
										case 4:
										case 6:
											type = "trackwye";
											orientation = (orientation+2)%8;
											state = "right";
											subtype = "sprung";
											break;
									}
									break;
							}
						}
						break;	
					case "trackstraight":
						if (tracks[mi(currentXTile,currentYTile)] != undefined) {
							switch (tracks[mi(currentXTile,currentYTile)].type) {
								case "trackstraight":
								case "trackcross":
								//if new straight track crosses straight or cross track then make cross track
									switch ((tracks[mi(currentXTile,currentYTile)].orientation - enteringOrientation +8)%8) {
										case 2:
										case 6:
											type = "trackcross";
											break;
									}
									break;
								case "track90":
								//if new straight track crosses straight or cross track then make cross track
									var difEnter = (tracks[mi(currentXTile,currentYTile)].orientation - enteringOrientation +8)%8;
									var difExit = (tracks[mi(currentXTile,currentYTile)].orientation - exitingOrientation +8)%8;
									if ((difEnter == 4 && difExit == 0) || (difEnter == 0 && difExit == 4)) {
											type = "trackwyeleft";
											state = "right";
											subtype = "sprung";
											if (difEnter == 0) orientation = (orientation+4)%8;
									    } else {
											type = "trackwyeright";
											state = "left";
											subtype = "sprung";
											if (difEnter == 6) orientation = (orientation+4)%8;
									    }
								break;
							}
						}
						break;
				}
				
				if (type != "track135") { // 135 not allowed because too sharp
					if ((tracks[mi(currentXTile,currentYTile)] == undefined) || (!tracks[mi(currentXTile,currentYTile)].immutable)) new Track(currentXTile, currentYTile, type, orientation, state, subtype);
					ctx.save();
			        var screenCenter = worldToScreen(centerTileX, centerTileY);
					ctx.translate(screenCenter.x-centerTileX*tileWidth*zoomScale, screenCenter.y-centerTileY*tileWidth*tileRatio*zoomScale);
					ctx.scale(zoomScale, zoomScale);
					drawTrack(tracks[mi(currentXTile,currentYTile)]);
					ctx.restore();
					updateUndoHistory();
				}
			}
			
			//save entering orientation
			enteringOrientation = tileOrientation;
		}

		currentXTile = trackTileX;
		currentYTile = trackTileY;
		exitingOrientation = tileOrientation;
	}

	function drawPathTrack(){ //draw the mouse movements during track drawing
		if (drawingPointsTrackX.length == 0) return;
	    ctx.strokeStyle = "yellow";
	    ctx.lineJoin = "round";
	    ctx.lineWidth = 4;
	    ctx.save();
	
        ctx.beginPath();
        var screenPoint = worldToScreen(drawingPointsTrackX[0], drawingPointsTrackY[0]);
        ctx.moveTo(screenPoint.x, screenPoint.y);
        for (i=1; i<drawingPointsTrackX.length; i++) {
        	screenPoint = worldToScreen(drawingPointsTrackX[i], drawingPointsTrackY[i]);
	        ctx.lineTo(screenPoint.x, screenPoint.y);
        	
        }
	    ctx.stroke();
	    ctx.restore();
	}	

	function addPointEC(x,y) { //for drawing mouse movements when manually placing engines or cars //x,y are in world coords
		var screenPoint = worldToScreen(x,y);
		if (screenPoint.x > tracksWidth) return;
		if (screenPoint.y > tracksHeight) return;

		drawingPointsECX.push(x);
		drawingPointsECY.push(y);
		if (!getButton("Play").down) drawPathEC();
	}	

	function drawPathEC(){ //draw the mouse movements during drawing engines or cars
		if (drawingPointsECX.length == 0) return;
	    if (isDrawingEngine) ctx.strokeStyle = engineColor;
	    else ctx.strokeStyle = carColor;
	    
	    ctx.lineJoin = "round";
	    ctx.lineWidth = 4;
	    ctx.save();
		ctx.scale(globalScale,globalScale);
				
        ctx.beginPath();
        var screenPoint = worldToScreen(drawingPointsECX[0], drawingPointsECY[0]);
        ctx.moveTo(screenPoint.x, screenPoint.y);
        for (i=1; i<drawingPointsECX.length; i++) {
        	screenPoint = worldToScreen(drawingPointsECX[i], drawingPointsECY[i]);
	        ctx.lineTo(screenPoint.x, screenPoint.y);
        }
	    ctx.stroke();
	    ctx.restore();
	}	

	///////// convenience functions ////////////////////
	
	function createArray(length) {
	    var a = new Array(length || 0);
	
	    if (arguments.length > 1) {
	        var args = Array.prototype.slice.call(arguments, 1);
	        for (var i = 0; i < length; i++) {
	            a[i] = createArray.apply(this, args);
	        }
	    }
	
	    return a;
	}
	
	function ToolButton(x, y, width, height, name, group, down, disabled) {
		this.x = x || 10;
		this.y = y || 10;
		this.width = width || 50;
		this.height = height || 50;
		this.name = name || "default";
		this.group = group; //an integer. All buttons within same group act as radios
		this.down = down || false; 
		this.disabled = disabled || false;
		
		this.inside = inside;
		this.draw = draw;
		
		function inside (pointx, pointy) {
			if (pointx>x+canvasWidth && pointx<x+canvasWidth+width && pointy>y && pointy<y+height) return true;
			else return false;
		}

		function draw () {
			offset = -7;
			if (this.disabled) ctx.fillStyle = "#999999";
			else ctx.fillStyle = "Silver";
			ctx.save();
			ctx.translate(tracksWidth+x, y);
			ctx.fillRect(0, 0, width, height);
			
			switch (name) {
				case "Play":
					if (this.down) { //draw pause
						ctx.beginPath();
						ctx.fillStyle = "black";
						ctx.moveTo(0.25*width,0.2*height);
						ctx.lineTo(0.45*width,0.2*height);
						ctx.lineTo(0.45*width,0.8*height);
						ctx.lineTo(0.25*width,0.8*height);
						ctx.closePath();
						ctx.fillStyle = "goldenrod";
						ctx.fill();
						ctx.lineWidth = 1;
						ctx.strokeStyle = "black";
						ctx.stroke();

						ctx.moveTo(0.55*width,0.2*height);
						ctx.lineTo(0.75*width,0.2*height);
						ctx.lineTo(0.75*width,0.8*height);
						ctx.lineTo(0.55*width,0.8*height);
						ctx.closePath();
						if (this.disabled) ctx.fillStyle = "gray";
						else ctx.fillStyle = "goldenrod";
						ctx.fill();
						ctx.lineWidth = 1;
						ctx.strokeStyle = "black";
						ctx.stroke();
					} else { // draw play
						ctx.beginPath();
						ctx.moveTo(0.2*width,0.2*height);
						ctx.lineTo(0.2*width,0.8*height);
						ctx.lineTo(0.8*width, height/2);
						ctx.closePath();
						if (this.disabled) ctx.fillStyle = "gray";
						else ctx.fillStyle = "goldenrod";
						ctx.fill();
						ctx.lineWidth = 1;
						ctx.strokeStyle = "black";
						ctx.stroke();
					}
					//console.log ("FILL STYLE====="+ctx.fillStyle);
					break;
				case "Track":
					ctx.drawImage(imgTrackStraight[1], -9,-10,imgTrackWidth,imgTrackWidth); //bbb
					if (this.down) {
						ctx.lineWidth = 3;
					    ctx.strokeStyle = "yellow";
					    ctx.strokeRect(0, 0, width, height);        
					}
					break;
				case "Home":
					ctx.drawImage(imgButtonHome, 7, 4);
					break;
				case "Undo":
					ctx.drawImage(imgUndoIcon,12,13, imgUndoIcon.width*0.8, imgUndoIcon.height*0.8);
					break;
				case "Redo":
					ctx.drawImage(imgRedoIcon,12,13, imgRedoIcon.width*0.8, imgRedoIcon.height*0.8);
				break;
				case "Write":
					ctx.drawImage(imgWriteIcon,4,4);
					break;
				case "Read":
					ctx.drawImage(imgReadIcon,4,4);
					break;
				case "Cargo":
					ctx.drawImage(imgCargoUppercase[0][14], -8,3,imgTrackWidth,imgTrackWidth);
					if (this.down) {
						ctx.lineWidth = 3;
					    ctx.strokeStyle = "yellow";
					    ctx.strokeRect(0, 0, width, height);        
					}
					break;
				case "Clear":
				ctx.drawImage(imgTrashIcon,15,15, imgTrashIcon.width*0.7, imgTrashIcon.height*0.7);
					break;
				case "Engine":
					// engine icon
					ctx.drawImage(imgEngine[46], offset+1,offset,imgTrackWidth,imgTrackWidth);
					if (this.down) {
						ctx.lineWidth = 3;
					    ctx.strokeStyle = "yellow";
					    ctx.strokeRect(0, 0, width, height);        
					}
					break;
				case "Car":
					ctx.drawImage(imgCar[14], offset-1,offset,imgTrackWidth,imgTrackWidth);
					if (this.down) {
						ctx.lineWidth = 3;
					    ctx.strokeStyle = "yellow";
					    ctx.strokeRect(0, 0, width, height);        
					}
					break;
				case "Octagon":
					ctx.strokeStyle = gridColorDark;
					ctx.translate(width/2, height/2);
					ctx.scale (0.8,0.8);
					drawOctagonOrSquare(1,1);
					break;
				case "Water":
					ctx.save();
					ctx.scale (0.34,0.34);
					ctx.drawImage(imgWaterTile0, 17, 19);
					ctx.restore();
					if (this.down) {
						ctx.lineWidth = 3;
					    ctx.strokeStyle = "yellow";
					    ctx.strokeRect(0, 0, width, height);        
					}
					break;
				case "Eraser":
					if (this.down) {
						ctx.lineWidth = 3;
					    ctx.strokeStyle = "yellow";
					    ctx.strokeRect(0, 0, width, height);        
					}
					drawCrosshair(width,height);
					ctx.translate(width/2, height/2);
					ctx.rotate(Math.PI/4);
					ctx.translate(-0.3*width, -height/2);
					ctx.beginPath();
					ctx.fillStyle = "red";
					ctx.moveTo(0.45*width,0.2*height);
					ctx.lineTo(0.55*width,0.2*height);
					ctx.lineTo(0.55*width,0.45*height);
					ctx.lineTo(0.8*width,0.45*height);
					ctx.lineTo(0.8*width,0.55*height);
					ctx.lineTo(0.55*width,0.55*height);
					ctx.lineTo(0.55*width,0.8*height);
					ctx.lineTo(0.45*width,0.8*height);
					ctx.lineTo(0.45*width,0.55*height);
					ctx.lineTo(0.2*width,0.55*height);
					ctx.lineTo(0.2*width,0.45*height);
					ctx.lineTo(0.45*width,0.45*height);
					ctx.closePath();
					ctx.fill();
					ctx.lineWidth = 1;
					ctx.strokeStyle = "black";
					ctx.stroke();
					break;
				case "Select":
					if (this.down) {
						ctx.lineWidth = 3;
					    ctx.strokeStyle = "yellow";
					    ctx.strokeRect(0, 0, width, height);        
					}
					ctx.lineWidth = 2;
				    ctx.strokeStyle = "red";
				    ctx.beginPath();
					ctx.dashedLine(0.2*width, 0.3*height, 0.8* width, 0.3*height, [4,3]);
					ctx.dashedLine(0.8*width, 0.3*height, 0.8* width, 0.7*height, [4,3]);
					ctx.dashedLine(0.8*width, 0.7*height, 0.2* width, 0.7*height, [4,3]);
					ctx.dashedLine(0.2*width, 0.7*height, 0.2* width, 0.3*height, [4,3]);
					ctx.stroke();
					break;
				case "Save":
					ctx.drawImage(imgSaveIcon,4,4);
					break;
				case "Lock":
					ctx.drawImage(imgLockedIcon,14,12);
					if (this.down) {
						ctx.lineWidth = 3;
					    ctx.strokeStyle = "yellow";
					    ctx.strokeRect(0, 0, width, height);        
					}
					break;
				case "Open":
					ctx.drawImage(imgLoadIcon,5,4);
					break;
				case "Download":
					ctx.drawImage(imgDownloadIcon,5,7);
					break;
				case "Upload":
					ctx.drawImage(imgUploadIcon,5,7);
					break;
				case "Signin":
					ctx.drawImage(imgSigninIcon,5,7);
					break;
				case "Repeat":
					ctx.drawImage(imgRepeat,14,14);
					break;
				case "Back":
					ctx.drawImage(imgBack, 14, 14);
					break;
			}
			ctx.restore();
		}
	}
	
	function drawCrosshair(width, height) {
		ctx.lineWidth = 3;
		ctx.strokeStyle = "white";
		ctx.beginPath();
		ctx.moveTo(0.05*width, 0.25*height);
		ctx.lineTo(0.45*width, 0.25*height);
		ctx.stroke();
		
		ctx.lineWidth = 3;
		ctx.strokeStyle = "white";
		ctx.beginPath();
		ctx.moveTo(0.25*width, 0.05*height);
		ctx.lineTo(0.25*width, 0.45*height);
		ctx.stroke();
		
		ctx.lineWidth = 1;
		ctx.strokeStyle = "black";
		ctx.beginPath();
		ctx.moveTo(0.05*width+1, 0.25*height);
		ctx.lineTo(0.45*width-1, 0.25*height);
		ctx.stroke();
		
		ctx.lineWidth = 1;
		ctx.strokeStyle = "black";
		ctx.beginPath();
		ctx.moveTo(0.25*width, 0.05*height+1);
		ctx.lineTo(0.25*width, 0.45*height-1);
		ctx.stroke();
	}
		
});

/*
    cycle.js
    2017-02-07
    Public Domain.
    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html
    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.
*/

// The file uses the WeakMap feature of ES6.

/*jslint es6, eval */

/*property
    $ref, decycle, forEach, get, indexOf, isArray, keys, length, push,
    retrocycle, set, stringify, test
*/

if (typeof JSON.decycle !== "function") {
    JSON.decycle = function decycle(object, replacer) {
        "use strict";

// Make a deep copy of an object or array, assuring that there is at most
// one instance of each object or array in the resulting structure. The
// duplicate references (which might be forming cycles) are replaced with
// an object of the form

//      {"$ref": PATH}

// where the PATH is a JSONPath string that locates the first occurance.

// So,

//      var a = [];
//      a[0] = a;
//      return JSON.stringify(JSON.decycle(a));

// produces the string '[{"$ref":"$"}]'.

// If a replacer function is provided, then it will be called for each value.
// A replacer function receives a value and returns a replacement value.

// JSONPath is used to locate the unique object. $ indicates the top level of
// the object or array. [NUMBER] or [STRING] indicates a child element or
// property.

        var objects = new WeakMap();     // object to path mappings

        return (function derez(value, path) {

// The derez function recurses through the object, producing the deep copy.

            var old_path;   // The path of an earlier occurance of value
            var nu;         // The new object or array

// If a replacer function was provided, then call it to get a replacement value.

            if (replacer !== undefined) {
                value = replacer(value);
            }

// typeof null === "object", so go on if this value is really an object but not
// one of the weird builtin objects.

            if (
                typeof value === "object" && value !== null &&
                !(value instanceof Boolean) &&
                !(value instanceof Date) &&
                !(value instanceof Number) &&
                !(value instanceof RegExp) &&
                !(value instanceof String)
            ) {

// If the value is an object or array, look to see if we have already
// encountered it. If so, return a {"$ref":PATH} object. This uses an
// ES6 WeakMap.

                old_path = objects.get(value);
                if (old_path !== undefined) {
                    return {$ref: old_path};
                }

// Otherwise, accumulate the unique value and its path.

                objects.set(value, path);

// If it is an array, replicate the array.

                if (Array.isArray(value)) {
                    nu = [];
                    value.forEach(function (element, i) {
                        nu[i] = derez(element, path + "[" + i + "]");
                    });
                } else {

// If it is an object, replicate the object.

                    nu = {};
                    Object.keys(value).forEach(function (name) {
                        nu[name] = derez(
                            value[name],
                            path + "[" + JSON.stringify(name) + "]"
                        );
                    });
                }
                return nu;
            }
            return value;
        }(object, "$"));
    };
}


if (typeof JSON.retrocycle !== "function") {
    JSON.retrocycle = function retrocycle($) {
        "use strict";

// Restore an object that was reduced by decycle. Members whose values are
// objects of the form
//      {$ref: PATH}
// are replaced with references to the value found by the PATH. This will
// restore cycles. The object will be mutated.

// The eval function is used to locate the values described by a PATH. The
// root object is kept in a $ variable. A regular expression is used to
// assure that the PATH is extremely well formed. The regexp contains nested
// * quantifiers. That has been known to have extremely bad performance
// problems on some browsers for very long strings. A PATH is expected to be
// reasonably short. A PATH is allowed to belong to a very restricted subset of
// Goessner's JSONPath.

// So,
//      var s = '[{"$ref":"$"}]';
//      return JSON.retrocycle(JSON.parse(s));
// produces an array containing a single element which is the array itself.

        var px = /^\$(?:\[(?:\d+|"(?:[^\\"\u0000-\u001f]|\\([\\"\/bfnrt]|u[0-9a-zA-Z]{4}))*")\])*$/;

        (function rez(value) {

// The rez function walks recursively through the object looking for $ref
// properties. When it finds one that has a value that is a path, then it
// replaces the $ref object with a reference to the value that is found by
// the path.

            if (value && typeof value === "object") {
                if (Array.isArray(value)) {
                    value.forEach(function (element, i) {
                        if (typeof element === "object" && element !== null) {
                            var path = element.$ref;
                            if (typeof path === "string" && px.test(path)) {
                                value[i] = eval(path);
                            } else {
                                rez(element);
                            }
                        }
                    });
                } else {
                    Object.keys(value).forEach(function (name) {
                        var item = value[name];
                        if (typeof item === "object" && item !== null) {
                            var path = item.$ref;
                            if (typeof path === "string" && px.test(path)) {
                                value[name] = eval(path);
                            } else {
                                rez(item);
                            }
                        }
                    });
                }
            }
        }($));
        return $;
    };
}
