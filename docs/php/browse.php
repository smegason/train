<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
   "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"
Cache-Control:public;
>
<!--[if lt IE 7]>      <html class="no-js lt-ie9 lt-ie8 lt-ie7"> <![endif]-->
<!--[if IE 7]>         <html class="no-js lt-ie9 lt-ie8"> <![endif]-->
<!--[if IE 8]>         <html class="no-js lt-ie9"> <![endif]-->
<!--[if gt IE 8]><!--> <html class="no-js"> <!--<![endif]-->
    <head>
		<meta content="text/html;charset=utf-8" http-equiv="Content-Type">
		<meta content="utf-8" http-equiv="encoding">        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
        <title>Train- Browse Tracks</title>
  		<link rel="stylesheet" href="css/normalize.css">
    </head>

    <body>
        		
<!--
	    <script src="//ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js"></script>
        <script>window.jQuery || document.write('<script src="js/vendor/jquery-1.8.3.min.js"><\/script>')</script>
        <script src="https://code.jquery.com/jquery-1.12.4.js"></script>
        <script src="https://code.jquery.com/ui/1.12.1/jquery-ui.js"></script>
        <script src="js/train.js" type="text/javascript"></script>
-->
        <h1>Browse Tracks</h1>
		<?php
		include 'php/connect.php';
		include 'php/fullescape.php';
		
		$con = mysqli_connect('localhost',$dbroot,$dbpassword,$dbname);
		if (!$con) {
		    echo "fail-connect";
		}
		
		//Trx=   [[[null,null,null,null,null,null,null,null,null,null],[null,{"gridx":1,"gridy":1,"type":"Track90","orientation":6,"state":"left","subtype":""},{"gridx":1,"gridy":2,"type":"TrackStraight","orientation":0,"state":"left","subtype":""},{"gridx":1,"gridy":3,"type":"Track45","orientation":1,"state":"left","subtype":""},{"gridx":1,"gridy":4,"type":"Track90","orientation":1,"state":"left","subtype":""},{"gridx":1,"gridy":5,"type":"Track90","orientation":1,"state":"left","subtype":""},{"gridx":1,"gridy":6,"type":"Track45","orientation":3,"state":"left","subtype":""},null,null,null],[null,{"gridx":2,"gridy":1,"type":"Track90","orientation":0,"state":"left","subtype":""},{"gridx":2,"gridy":2,"type":"TrackStraight","orientation":4,"state":"left","subtype":""},{"gridx":2,"gridy":3,"type":"TrackStraight","orientation":4,"state":"left","subtype":""},{"gridx":2,"gridy":4,"type":"TrackStraight","orientation":4,"state":"left","subtype":""},{"gridx":2,"gridy":5,"type":"Track45","orientation":4,"state":"left","subtype":""},{"gridx":2,"gridy":6,"type":"TrackStraight","orientation":6,"state":"left","subtype":""},null,null,null],[null,null,null,{"gridx":3,"gridy":3,"type":"TrackStraight","orientation":4,"state":"left","subtype":""},{"gridx":3,"gridy":4,"type":"TrackStraight","orientation":4,"state":"left","subtype":""},{"gridx":3,"gridy":5,"type":"Track45","orientation":6,"state":"left","subtype":""},{"gridx":3,"gridy":6,"type":"Track90","orientation":2,"state":"left","subtype":""},null,null,null],[null,{"gridx":4,"gridy":1,"type":"TrackStraight","orientation":0,"state":"left","subtype":""},{"gridx":4,"gridy":2,"type":"Track45","orientation":4,"state":"left","subtype":""},{"gridx":4,"gridy":3,"type":"Track45","orientation":5,"state":"left","subtype":""},{"gridx":4,"gridy":4,"type":"TrackStraight","orientation":0,"state":"left","subtype":""},{"gridx":4,"gridy":5,"type":"Track90","orientation":2,"state":"left","subtype":""},null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,{"gridx":6,"gridy":2,"type":"Track90","orientation":6,"state":"left","subtype":""},{"gridx":6,"gridy":3,"type":"TrackWyeLeft","orientation":4,"state":"left","subtype":"lazy"},{"gridx":6,"gridy":4,"type":"TrackStraight","orientation":0,"state":"left","subtype":"supply"},{"gridx":6,"gridy":5,"type":"TrackStraight","orientation":0,"state":"left","subtype":""},{"gridx":6,"gridy":6,"type":"Track90","orientation":4,"state":"left","subtype":""},null,null,null],[null,null,{"gridx":7,"gridy":2,"type":"TrackStraight","orientation":2,"state":"left","subtype":""},{"gridx":7,"gridy":3,"type":"TrackStraight","orientation":6,"state":"left","subtype":"increment"},{"gridx":7,"gridy":4,"type":"TrackCargo","orientation":0,"state":"left","subtype":"","cargo":{"value":0,"type":["numbers","0","1","2","3","4","5","6","7","8","9"]}},null,{"gridx":7,"gridy":6,"type":"TrackStraight","orientation":6,"state":"left","subtype":""},null,null,null],[null,{"gridx":8,"gridy":1,"type":"TrackCargo","orientation":0,"state":"left","subtype":"","cargo":{"value":4,"type":["numbers","0","1","2","3","4","5","6","7","8","9"]}},{"gridx":8,"gridy":2,"type":"TrackWyeRight","orientation":2,"state":"left","subtype":"compareGreater"},{"gridx":8,"gridy":3,"type":"Track90","orientation":2,"state":"left","subtype":""},null,null,{"gridx":8,"gridy":6,"type":"TrackStraight","orientation":6,"state":"left","subtype":""},null,null,null],[null,null,{"gridx":9,"gridy":2,"type":"TrackStraight","orientation":2,"state":"left","subtype":""},null,null,null,{"gridx":9,"gridy":6,"type":"TrackStraight","orientation":6,"state":"left","subtype":""},null,null,null],[null,null,{"gridx":10,"gridy":2,"type":"Track90","orientation":0,"state":"left","subtype":""},{"gridx":10,"gridy":3,"type":"TrackStraight","orientation":4,"state":"left","subtype":""},{"gridx":10,"gridy":4,"type":"TrackStraight","orientation":4,"state":"left","subtype":""},{"gridx":10,"gridy":5,"type":"TrackStraight","orientation":4,"state":"left","subtype":""},{"gridx":10,"gridy":6,"type":"Track90","orientation":2,"state":"left","subtype":""},null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null]],[{"gridx":6,"gridy":5,"type":"EngineBasic","orientation":0,"state":"","speed":20,"position":0.5}],[{"gridx":6,"gridy":6,"type":"CarBasic","orientation":6,"state":"","speed":20,"position":0.5}]]
		//trx=   [[[nullXXXnullXXXnullXXXnullXXXnullXXXnullXXXnullXXXnullXXXnullXXXnull]XXX[nullXXX{"gridx"YYY1XXX"gridy"YYY1XXX"type"YYY"TrackStraight"XXX"orientation"YYY2XXX"state"YYY"left"XXX"subtype"YYY""}XXXnullXXXnullXXXnullXXXnullXXXnullXXXnullXXXnullXXXnull]XXX[nullXXX{"gridx"YYY2XXX"gridy"YYY1XXX"type"YYY"TrackStraight"XXX"orientation"YYY2XXX"state"YYY"left"XXX"subtype"YYY""}XXXnullXXXnullXXX{"gridx"YYY2XXX"gridy"YYY4XXX"type"YYY"Track90"XXX"orientation"YYY6XXX"state"YYY"left"XXX"subtype"YYY""}XXX{"gridx"YYY2XXX"gridy"YYY5XXX"type"YYY"Track90"XXX"orientation"YYY4XXX"state"YYY"left"XXX"subtype"YYY""}XXXnullXXXnullXXXnullXXXnull]XXX[nullXXX{"gridx"YYY3XXX"gridy"YYY1XXX"type"YYY"TrackStraight"XXX"orientation"YYY2XXX"state"YYY"left"XXX"subtype"YYY""}XXXnullXXXnullXXX{"gridx"YYY3XXX"gridy"YYY4XXX"type"YYY"Track90"XXX"orientation"YYY0XXX"state"YYY"left"XXX"subtype"YYY""}XXX{"gridx"YYY3XXX"gridy"YYY5XXX"type"YYY"TrackWyeLeft"XXX"orientation"YYY2XXX"state"YYY"left"XXX"subtype"YYY"sprung"}XXXnullXXXnullXXXnullXXXnull]XXX[nullXXX{"gridx"YYY4XXX"gridy"YYY1XXX"type"YYY"TrackStraight"XXX"orientation"YYY2XXX"state"YYY"left"XXX"subtype"YYY""}XXXnullXXXnullXXXnullXXX{"gridx"YYY4XXX"gridy"YYY5XXX"type"YYY"TrackStraight"XXX"orientation"YYY6XXX"state"YYY"left"XXX"subtype"YYY""}XXXnullXXXnullXXXnullXXXnull]XXX[nullXXX{"gridx"YYY5XXX"gridy"YYY1XXX"type"YYY"TrackStraight"XXX"orientation"YYY2XXX"state"YYY"left"XXX"subtype"YYY""}XXXnullXXXnullXXXnullXXX{"gridx"YYY5XXX"gridy"YYY5XXX"type"YYY"TrackStraight"XXX"orientation"YYY2XXX"state"YYY"left"XXX"subtype"YYY"pickDrop"}XXX{"gridx"YYY5XXX"gridy"YYY6XXX"type"YYY"TrackCargo"XXX"orientation"YYY0XXX"state"YYY"left"XXX"subtype"YYY""XXX"cargo"YYY{"value"YYY12XXX"type"YYY["dinosaurs"XXX"archaeopteryx"XXX"ankylosaurus"XXX"brachiosaurus"XXX"elasmosaurus"XXX"hadrosaurus"XXX"iguanodon"XXX"megalosaurus"XXX"microraptor"XXX"ornithomimus"XXX"pteranodon"XXX"quetzalcoatlus"XXX"stegosaurus"XXX"triceratops"XXX"troodon"XXX"tyranosaurus"XXX"velociraptor"]}}XXXnullXXXnullXXXnull]XXX[nullXXX{"gridx"YYY6XXX"gridy"YYY1XXX"type"YYY"Track90"XXX"orientation"YYY0XXX"state"YYY"left"XXX"subtype"YYY""}XXX{"gridx"YYY6XXX"gridy"YYY2XXX"type"YYY"TrackStraight"XXX"orientation"YYY4XXX"state"YYY"left"XXX"subtype"YYY""}XXX{"gridx"YYY6XXX"gridy"YYY3XXX"type"YYY"TrackStraight"XXX"orientation"YYY4XXX"state"YYY"left"XXX"subtype"YYY"greentunnel"}XXX{"gridx"YYY6XXX"gridy"YYY4XXX"type"YYY"TrackStraight"XXX"orientation"YYY4XXX"state"YYY"left"XXX"subtype"YYY""}XXX{"gridx"YYY6XXX"gridy"YYY5XXX"type"YYY"Track90"XXX"orientation"YYY2XXX"state"YYY"left"XXX"subtype"YYY""}XXXnullXXXnullXXXnullXXXnull]XXX[nullXXXnullXXXnullXXXnullXXXnullXXXnullXXXnullXXXnullXXXnullXXXnull]XXX[nullXXXnullXXXnullXXXnullXXXnullXXXnullXXXnullXXXnullXXXnullXXXnull]XXX[nullXXX{"gridx"YYY9XXX"gridy"YYY1XXX"type"YYY"Track90"XXX"orientation"YYY6XXX"state"YYY"left"XXX"subtype"YYY""}XXX{"gridx"YYY9XXX"gridy"YYY2XXX"type"YYY"TrackStraight"XXX"orientation"YYY4XXX"state"YYY"left"XXX"subtype"YYY""}XXX{"gridx"YYY9XXX"gridy"YYY3XXX"type"YYY"TrackStraight"XXX"orientation"YYY4XXX"state"YYY"left"XXX"subtype"YYY"greentunnel"}XXX{"gridx"YYY9XXX"gridy"YYY4XXX"type"YYY"TrackStraight"XXX"orientation"YYY0XXX"state"YYY"left"XXX"subtype"YYY"pickDrop"}XXX{"gridx"YYY9XXX"gridy"YYY5XXX"type"YYY"Track90"XXX"orientation"YYY4XXX"state"YYY"left"XXX"subtype"YYY""}XXXnullXXXnullXXXnullXXXnull]XXX[nullXXX{"gridx"YYY10XXX"gridy"YYY1XXX"type"YYY"TrackStraight"XXX"orientation"YYY6XXX"state"YYY"left"XXX"subtype"YYY""}XXXnullXXXnullXXX{"gridx"YYY10XXX"gridy"YYY4XXX"type"YYY"TrackCargo"XXX"orientation"YYY0XXX"state"YYY"left"XXX"subtype"YYY""}XXX{"gridx"YYY10XXX"gridy"YYY5XXX"type"YYY"TrackStraight"XXX"orientation"YYY6XXX"state"YYY"left"XXX"subtype"YYY"pickDrop"}XXXnullXXXnullXXXnullXXXnull]XXX[nullXXX{"gridx"YYY11XXX"gridy"YYY1XXX"type"YYY"Track90"XXX"orientation"YYY0XXX"state"YYY"left"XXX"subtype"YYY""}XXX{"gridx"YYY11XXX"gridy"YYY2XXX"type"YYY"TrackStraight"XXX"orientation"YYY0XXX"state"YYY"left"XXX"subtype"YYY""}XXX{"gridx"YYY11XXX"gridy"YYY3XXX"type"YYY"TrackStraight"XXX"orientation"YYY0XXX"state"YYY"left"XXX"subtype"YYY""}XXX{"gridx"YYY11XXX"gridy"YYY4XXX"type"YYY"TrackStraight"XXX"orientation"YYY4XXX"state"YYY"left"XXX"subtype"YYY"pickDrop"}XXX{"gridx"YYY11XXX"gridy"YYY5XXX"type"YYY"Track90"XXX"orientation"YYY2XXX"state"YYY"left"XXX"subtype"YYY""}XXXnullXXXnullXXXnullXXXnull]XXX[nullXXXnullXXXnullXXXnullXXXnullXXXnullXXXnullXXXnullXXXnullXXXnull]XXX[nullXXXnullXXXnullXXXnullXXXnullXXXnullXXXnullXXXnullXXXnullXXXnull]]XXX[{"gridx"YYY4XXX"gridy"YYY1XXX"type"YYY"EngineBasic"XXX"orientation"YYY2XXX"state"YYY""XXX"speed"YYY20XXX"position"YYY0.5}]XXX[{"gridx"YYY1XXX"gridy"YYY1XXX"type"YYY"CarBasic"XXX"orientation"YYY2XXX"state"YYY""XXX"speed"YYY20XXX"position"YYY0.5}XXX{"gridx"YYY2XXX"gridy"YYY1XXX"type"YYY"CarBasic"XXX"orientation"YYY2XXX"state"YYY""XXX"speed"YYY20XXX"position"YYY0.5}XXX{"gridx"YYY3XXX"gridy"YYY1XXX"type"YYY"CarBasic"XXX"orientation"YYY2XXX"state"YYY""XXX"speed"YYY20XXX"position"YYY0.5XXX"cargo"YYY{"value"YYY0XXX"type"YYY["stuffedAnimals"XXX"bunny"]}}]]
		//encTrx=[[[null%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull]%2C[null%2C{"gridx"%3A1%2C"gridy"%3A1%2C"type"%3A"Track90"%2C"orientation"%3A6%2C"state"%3A"left"%2C"subtype"%3A""}%2C{"gridx"%3A1%2C"gridy"%3A2%2C"type"%3A"TrackStraight"%2C"orientation"%3A0%2C"state"%3A"left"%2C"subtype"%3A""}%2C{"gridx"%3A1%2C"gridy"%3A3%2C"type"%3A"Track45"%2C"orientation"%3A1%2C"state"%3A"left"%2C"subtype"%3A""}%2C{"gridx"%3A1%2C"gridy"%3A4%2C"type"%3A"Track90"%2C"orientation"%3A1%2C"state"%3A"left"%2C"subtype"%3A""}%2C{"gridx"%3A1%2C"gridy"%3A5%2C"type"%3A"Track90"%2C"orientation"%3A1%2C"state"%3A"left"%2C"subtype"%3A""}%2C{"gridx"%3A1%2C"gridy"%3A6%2C"type"%3A"Track45"%2C"orientation"%3A3%2C"state"%3A"left"%2C"subtype"%3A""}%2Cnull%2Cnull%2Cnull]%2C[null%2C{"gridx"%3A2%2C"gridy"%3A1%2C"type"%3A"Track90"%2C"orientation"%3A0%2C"state"%3A"left"%2C"subtype"%3A""}%2C{"gridx"%3A2%2C"gridy"%3A2%2C"type"%3A"TrackStraight"%2C"orientation"%3A4%2C"state"%3A"left"%2C"subtype"%3A""}%2C{"gridx"%3A2%2C"gridy"%3A3%2C"type"%3A"TrackStraight"%2C"orientation"%3A4%2C"state"%3A"left"%2C"subtype"%3A""}%2C{"gridx"%3A2%2C"gridy"%3A4%2C"type"%3A"TrackStraight"%2C"orientation"%3A4%2C"state"%3A"left"%2C"subtype"%3A""}%2C{"gridx"%3A2%2C"gridy"%3A5%2C"type"%3A"Track45"%2C"orientation"%3A4%2C"state"%3A"left"%2C"subtype"%3A""}%2C{"gridx"%3A2%2C"gridy"%3A6%2C"type"%3A"TrackStraight"%2C"orientation"%3A6%2C"state"%3A"left"%2C"subtype"%3A""}%2Cnull%2Cnull%2Cnull]%2C[null%2Cnull%2Cnull%2C{"gridx"%3A3%2C"gridy"%3A3%2C"type"%3A"TrackStraight"%2C"orientation"%3A4%2C"state"%3A"left"%2C"subtype"%3A""}%2C{"gridx"%3A3%2C"gridy"%3A4%2C"type"%3A"TrackStraight"%2C"orientation"%3A4%2C"state"%3A"left"%2C"subtype"%3A""}%2C{"gridx"%3A3%2C"gridy"%3A5%2C"type"%3A"Track45"%2C"orientation"%3A6%2C"state"%3A"left"%2C"subtype"%3A""}%2C{"gridx"%3A3%2C"gridy"%3A6%2C"type"%3A"Track90"%2C"orientation"%3A2%2C"state"%3A"left"%2C"subtype"%3A""}%2Cnull%2Cnull%2Cnull]%2C[null%2C{"gridx"%3A4%2C"gridy"%3A1%2C"type"%3A"TrackStraight"%2C"orientation"%3A0%2C"state"%3A"left"%2C"subtype"%3A""}%2C{"gridx"%3A4%2C"gridy"%3A2%2C"type"%3A"Track45"%2C"orientation"%3A4%2C"state"%3A"left"%2C"subtype"%3A""}%2C{"gridx"%3A4%2C"gridy"%3A3%2C"type"%3A"Track45"%2C"orientation"%3A5%2C"state"%3A"left"%2C"subtype"%3A""}%2C{"gridx"%3A4%2C"gridy"%3A4%2C"type"%3A"TrackStraight"%2C"orientation"%3A0%2C"state"%3A"left"%2C"subtype"%3A""}%2C{"gridx"%3A4%2C"gridy"%3A5%2C"type"%3A"Track90"%2C"orientation"%3A2%2C"state"%3A"left"%2C"subtype"%3A""}%2Cnull%2Cnull%2Cnull%2Cnull]%2C[null%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull]%2C[null%2Cnull%2C{"gridx"%3A6%2C"gridy"%3A2%2C"type"%3A"Track90"%2C"orientation"%3A6%2C"state"%3A"left"%2C"subtype"%3A""}%2C{"gridx"%3A6%2C"gridy"%3A3%2C"type"%3A"TrackWyeLeft"%2C"orientation"%3A4%2C"state"%3A"left"%2C"subtype"%3A"lazy"}%2C{"gridx"%3A6%2C"gridy"%3A4%2C"type"%3A"TrackStraight"%2C"orientation"%3A0%2C"state"%3A"left"%2C"subtype"%3A"supply"}%2C{"gridx"%3A6%2C"gridy"%3A5%2C"type"%3A"TrackStraight"%2C"orientation"%3A0%2C"state"%3A"left"%2C"subtype"%3A""}%2C{"gridx"%3A6%2C"gridy"%3A6%2C"type"%3A"Track90"%2C"orientation"%3A4%2C"state"%3A"left"%2C"subtype"%3A""}%2Cnull%2Cnull%2Cnull]%2C[null%2Cnull%2C{"gridx"%3A7%2C"gridy"%3A2%2C"type"%3A"TrackStraight"%2C"orientation"%3A2%2C"state"%3A"left"%2C"subtype"%3A""}%2C{"gridx"%3A7%2C"gridy"%3A3%2C"type"%3A"TrackStraight"%2C"orientation"%3A6%2C"state"%3A"left"%2C"subtype"%3A"increment"}%2C{"gridx"%3A7%2C"gridy"%3A4%2C"type"%3A"TrackCargo"%2C"orientation"%3A0%2C"state"%3A"left"%2C"subtype"%3A""%2C"cargo"%3A{"value"%3A0%2C"type"%3A["numbers"%2C"0"%2C"1"%2C"2"%2C"3"%2C"4"%2C"5"%2C"6"%2C"7"%2C"8"%2C"9"]}}%2Cnull%2C{"gridx"%3A7%2C"gridy"%3A6%2C"type"%3A"TrackStraight"%2C"orientation"%3A6%2C"state"%3A"left"%2C"subtype"%3A""}%2Cnull%2Cnull%2Cnull]%2C[null%2C{"gridx"%3A8%2C"gridy"%3A1%2C"type"%3A"TrackCargo"%2C"orientation"%3A0%2C"state"%3A"left"%2C"subtype"%3A""%2C"cargo"%3A{"value"%3A4%2C"type"%3A["numbers"%2C"0"%2C"1"%2C"2"%2C"3"%2C"4"%2C"5"%2C"6"%2C"7"%2C"8"%2C"9"]}}%2C{"gridx"%3A8%2C"gridy"%3A2%2C"type"%3A"TrackWyeRight"%2C"orientation"%3A2%2C"state"%3A"left"%2C"subtype"%3A"compareGreater"}%2C{"gridx"%3A8%2C"gridy"%3A3%2C"type"%3A"Track90"%2C"orientation"%3A2%2C"state"%3A"left"%2C"subtype"%3A""}%2Cnull%2Cnull%2C{"gridx"%3A8%2C"gridy"%3A6%2C"type"%3A"TrackStraight"%2C"orientation"%3A6%2C"state"%3A"left"%2C"subtype"%3A""}%2Cnull%2Cnull%2Cnull]%2C[null%2Cnull%2C{"gridx"%3A9%2C"gridy"%3A2%2C"type"%3A"TrackStraight"%2C"orientation"%3A2%2C"state"%3A"left"%2C"subtype"%3A""}%2Cnull%2Cnull%2Cnull%2C{"gridx"%3A9%2C"gridy"%3A6%2C"type"%3A"TrackStraight"%2C"orientation"%3A6%2C"state"%3A"left"%2C"subtype"%3A""}%2Cnull%2Cnull%2Cnull]%2C[null%2Cnull%2C{"gridx"%3A10%2C"gridy"%3A2%2C"type"%3A"Track90"%2C"orientation"%3A0%2C"state"%3A"left"%2C"subtype"%3A""}%2C{"gridx"%3A10%2C"gridy"%3A3%2C"type"%3A"TrackStraight"%2C"orientation"%3A4%2C"state"%3A"left"%2C"subtype"%3A""}%2C{"gridx"%3A10%2C"gridy"%3A4%2C"type"%3A"TrackStraight"%2C"orientation"%3A4%2C"state"%3A"left"%2C"subtype"%3A""}%2C{"gridx"%3A10%2C"gridy"%3A5%2C"type"%3A"TrackStraight"%2C"orientation"%3A4%2C"state"%3A"left"%2C"subtype"%3A""}%2C{"gridx"%3A10%2C"gridy"%3A6%2C"type"%3A"Track90"%2C"orientation"%3A2%2C"state"%3A"left"%2C"subtype"%3A""}%2Cnull%2Cnull%2Cnull]%2C[null%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull]%2C[null%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull]%2C[null%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull]]%2C[{"gridx"%3A6%2C"gridy"%3A5%2C"type"%3A"EngineBasic"%2C"orientation"%3A0%2C"state"%3A""%2C"speed"%3A20%2C"position"%3A0.5}]%2C[{"gridx"%3A6%2C"gridy"%3A6%2C"type"%3A"CarBasic"%2C"orientation"%3A6%2C"state"%3A""%2C"speed"%3A20%2C"position"%3A0.5}]]

		//simple circle trx
		// raw=[[[null,null,null,null,null,null,null,null,null,null],[null,{"gridx":1,"gridy":1,"type":"Track90","orientation":6,"state":"left","subtype":""},{"gridx":1,"gridy":2,"type":"Track90","orientation":4,"state":"left","subtype":""},null,null,null,null,null,null,null],[null,{"gridx":2,"gridy":1,"type":"Track90","orientation":0,"state":"left","subtype":""},{"gridx":2,"gridy":2,"type":"Track90","orientation":2,"state":"left","subtype":""},null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null]],[],[]]
		// enc=[[[null%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull]%2C[null%2C{"gridx"%3A1%2C"gridy"%3A1%2C"type":"Track90"%2C"orientation":6%2C"state":"left"%2C"subtype":""}%2C{"gridx":1%2C"gridy"%3A2%2C"type"%3A"Track90"%2C"orientation"%3A4%2C"state"%3A"left"%2C"subtype"%3A""}%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull]%2C[null%2C{"gridx"%3A2%2C"gridy"%3A1%2C"type"%3A"Track90"%2C"orientation"%3A0%2C"state"%3A"left"%2C"subtype"%3A""}%2C{"gridx"%3A2%2C"gridy"%3A2%2C"type"%3A"Track90"%2C"orientation"%3A2%2C"state"%3A"left"%2C"subtype"%3A""}%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull]%2C[null%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull]%2C[null%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull]%2C[null%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull]%2C[null%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull]%2C[null%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull]%2C[null%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull]%2C[null%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull]%2C[null%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull]%2C[null%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull]%2C[null%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull]%2C[null%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull]]%2C[]%2C[]]
		
				$sql = "SELECT * FROM users, tracks WHERE users.userID = tracks.userID";
		$result = mysqli_query($con,$sql);
		$i=0;
		if ($result) {
			echo "<table>";
			while($row = mysqli_fetch_array($result)) {   //Creates a loop to loop through results
				$userID = $row['userID'];
				$trackID = $row['trackID'];
				$trackName = $row['trackName'];
				$trackDescription = $row['trackDescription'];
				$trainusername = $row['userName'];
//				$imgPreview = $row['imgPreview'];
				$encodedTrx = ($row['track']);
				$encodedTrx = str_replace(",", "%2C", $encodedTrx);  // ,
				$encodedTrx = str_replace(":", "%3A", $encodedTrx); // :
//				$url= "train.html?resize=0&toolbar=0&trx=".$encodedTrx;
				$url= "train.html?resize=0&toolbar=0&scale=35&trackID=".$trackID."&iconscale=0.25";
				$url2= "train.html?trackID=".$trackID."&showBrowse=0&showTrain=1&";
				//echo "url=".$url;
//				$url= 'train.html?resize=0&toolbar=0&trx=[[[null%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull]%2C[null%2C{"gridx"%3A1%2C"gridy"%3A1%2C"type":"Track90"%2C"orientation":6%2C"state":"left"%2C"subtype":""}%2C{"gridx":1%2C"gridy"%3A2%2C"type"%3A"Track90"%2C"orientation"%3A4%2C"state"%3A"left"%2C"subtype"%3A""}%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull]%2C[null%2C{"gridx"%3A2%2C"gridy"%3A1%2C"type"%3A"Track90"%2C"orientation"%3A0%2C"state"%3A"left"%2C"subtype"%3A""}%2C{"gridx"%3A2%2C"gridy"%3A2%2C"type"%3A"Track90"%2C"orientation"%3A2%2C"state"%3A"left"%2C"subtype"%3A""}%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull]%2C[null%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull]%2C[null%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull]%2C[null%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull]%2C[null%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull]%2C[null%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull]%2C[null%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull]%2C[null%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull]%2C[null%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull]%2C[null%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull]%2C[null%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull]%2C[null%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull]]%2C[]%2C[]]';
								
				echo "\n<tr>";
				echo "\n<td>";
				echo "<h2>".$trackName."</h2>";
				echo "<i> by ".$trainusername."</i>";
//				echo "<p>TrackID=".$trackID."</p>";
				echo "<p>".$trackDescription."</p>";
//				echo "<p>DDD".$imgPreview."</p>";
				echo "<p><a target='trainframe' href='".$url2."'>Launch</a></p>";
//				echo "<p>Trx=".$row['track']."</p>";
//				echo "<p>encTrx=".$encodedTrx."</p>";
				echo "</td>";

				echo "\n<td class='style24' style='width: 300px'>";
//				echo "row=".$i;
				echo "<div id='outerdiv".$i."' style='width:300px; overflow-x:hidden;'>";
				echo "\n<iframe src='".$url."' width='300' height='200' frameborder='0' id='inneriframe".$i."' scrolling='no' > </iframe>";
//				echo "\nImage= <img src='";
//				echo $imgPreview;
//				echo "'> </br>";
				echo "</div>";
				echo "\n</td>";
				echo "</tr>";
				
				$i++;
			}
			echo "\n</table>";
		} else {
			echo "fail-login";
		}
		mysqli_close($con);
		?>
		       
		<!-- Dialog box for new user -->
		<div id="dialog-newUser" title="Create new user" style="display: none;">
		  <p class="validateTips"> </p>
		 
		  <form>
		    <fieldset>
		      <label for="name">Username</label>
		      <input type="text" name="username" id="username" value="" class="text ui-widget-content ui-corner-all">
		      <label for="password">Password</label>
		      <input type="password" name="password" id="password" value="" class="text ui-widget-content ui-corner-all">
		      <label for="email">Email</label>
		      <input type="text" name="email" id="email" value="" class="text ui-widget-content ui-corner-all">
		 
		      <!-- Allow form submission with keyboard without duplicating the dialog button -->
		      <input type="submit" tabindex="-1" style="position:absolute; top:-1000px">
		    </fieldset>
		  </form>
		</div>
		 
		<!-- Dialog box for forgot password -->
		<div id="dialog-forgotPassword" title="Forgot password" style="display: none;">
		  <p class="validateTips"> </p>
		 
		  <form>
		    <fieldset>
		      <label for="email">Email</label>
		      <input type="text" name="email" id="email" value="" class="text ui-widget-content ui-corner-all">
		 
		      <!-- Allow form submission with keyboard without duplicating the dialog button -->
		      <input type="submit" tabindex="-1" style="position:absolute; top:-1000px">
		    </fieldset>
		  </form>
		</div>
		 
		<!-- Dialog box for signinUser -->
		<div id="dialog-signinUser" title="Sign-in user" style="display: none;">
		  <p class="validateTips"> </p>
		  <form>
		    <fieldset>
		      <label for="name">Username</label>
		      <input type="text" name="username" id="usernameSignin" value="" class="text ui-widget-content ui-corner-all">
		      <label for="password">Password</label>
		      <input type="password" name="password" id="passwordSignin" value="" class="text ui-widget-content ui-corner-all">
		 	  <!---<input type="button" value="New User" id="newuser" style="float: right;">  --->
		 	  <div id="newuserlink" style="color:#0000FF; float: right;">New User</div>
		      <!-- Allow form submission with keyboard without duplicating the dialog button -->
		      <input type="submit" tabindex="-1" style="position:absolute; top:-1000px">
		    </fieldset>
		  </form>
		</div>
		 
		<!-- Dialog box for browse tracks for download -->
		<div id="dialog-downloadTrack" title="Download track" style="display: none;">
		  <p class="validateTips"> </p>
		 
		  <form>
		    <fieldset>
		      <label for="name">Username</label>
		      <input type="text" name="username" id="username" value="" class="text ui-widget-content ui-corner-all">
		 
		      <!-- Allow form submission with keyboard without duplicating the dialog button -->
		      <input type="submit" tabindex="-1" style="position:absolute; top:-1000px">
		    </fieldset>
		  </form>
		</div>
		 
		<!-- Dialog box for upload tracks -->
		<div id="dialog-uploadTrack" title="Upload track" style="display: none;">
		  <p class="validateTips"> </p>
		  <form>
		  	Upload your current track to train-hub.org
		    <fieldset>
		      <label for="trackname">Track name</label>
		      <input type="text" name="trackname" id="trackname" value="" class="text ui-widget-content ui-corner-all">
		      <label for="trackdescription">Track description</label>
		      <textarea name="trackdescription" id="trackdescription" value="" class="text ui-widget-content ui-corner-all" cols="35" rows="6"></textarea>
		      <!-- Allow form submission with keyboard without duplicating the dialog button -->
		      <input type="submit" tabindex="-1" style="position:absolute; top:-1000px">
		    </fieldset>
		  </form>
		</div>


        <!--Train is open source on <a href="https://github.com/smegason/train/">github</a> -->
        
        <!-- Google Analytics: change UA-XXXXX-X to be your site's ID. -->
        <!-- <script>
            var _gaq=[['_setAccount','UA-XXXXX-X'],['_trackPageview']];
            (function(d,t){var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
            g.src=('https:'==location.protocol?'//ssl':'//www')+'.google-analytics.com/ga.js';
            s.parentNode.insertBefore(g,s)}(document,'script'));
        </script> -->



    </body>
</html>
        
<!--		<?php
		include 'php/connect.php';
		echo $dbroot.", ".$dbpassword.", ".$dbname;
		$con = mysqli_connect('localhost',$dbroot,$dbpassword,$dbname);
		if (!$con) {
		    echo "fail-connect";
		}
		echo "Connected";
		$sql = "SELECT * FROM tracks";
		$result = mysqli_query($con,$sql);
		echo $result;
		if ($result) {
			echo ".";
			echo "<table>"; // start a table tag in the HTML
			
			while($row = mysql_fetch_array($result)) {   //Creates a loop to loop through results
				echo "<tr><td>" . $row['trackID'] . "</td><td>" . $row['userID'] . "</td> <td>" . $row['trackName'] . "</td><td>" . $row['trackDescription'] . "</tr>"; 
			}
			
			echo "</table>"; //Close the table in HTML
			
		} else {
			echo "fail-login";
		}
		mysqli_close($con);
		?>  -->
