
<!DOCTYPE html>
<html>
<head>
<style>
table {
    width: 100%;
    border-collapse: collapse;
}

table, td, th {
    border: 1px solid black;
    padding: 5px;
}

th {text-align: left;}
</style>
</head>
<body>
Upload TRacks----
<?php
include 'connect.php';

$userID = htmlspecialchars($_GET["userID"]);
$trx = htmlspecialchars($_GET['trx']);
$trackName = htmlspecialchars($_GET['trackName']);
$trackDescription = htmlspecialchars($_GET['trackDescription']);
echo "<br>userID=".$userID.", trx=".$trx.", trackName=".$trackName.", trackDescription=".$trackDescription;

$con = mysqli_connect('localhost',$dbroot,$dbpassword,$dbname);
if (!$con) {
    die('Could not connect: ' . mysqli_error($con));
}

$sql = "INSERT INTO tracks (userID, track, trackName, trackDescription) VALUES ('".$userID."', '".$trx."', '".$trackName."', '".$trackDescription."')";
echo "<br>sql=".$sql;
$result = mysqli_query($con,$sql);
echo "<br>result=".$result;

mysqli_close($con);
?>
</body>
</html>