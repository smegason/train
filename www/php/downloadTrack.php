<?php
include 'connect.php';

$trackID = htmlspecialchars($_GET["trackID"]);

$con = mysqli_connect('localhost',$dbroot,$dbpassword,$dbname);
if (!$con) {
    die('Could not connect: ' . mysqli_error($con));
}

mysqli_select_db($con,"ajax_demo");
//$sql = "SELECT track, trackName, trackDesription FROM tracks WHERE trackID='".$trackID."'";
$sql = "SELECT * FROM tracks WHERE trackID='".$trackID."'";
//echo "<br>sql=".$sql;
$result = mysqli_query($con,$sql);
$row = mysqli_fetch_array($result);
$strTrx=$row['track'];
$trackDescription = $row['trackDescription'];
$trackName = $row['trackName'];
$userID = $row['userID'];
echo $userID."&&&";
echo $strTrx."&&&";
echo $trackName."&&&";
echo $trackDescription."&&&";

mysqli_close($con);
?>