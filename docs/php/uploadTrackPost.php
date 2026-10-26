
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

$userID = htmlspecialchars($_POST["userID"]);
$trx = htmlspecialchars($_POST['trx']);
$trackName = htmlspecialchars($_POST['trackName']);
$trackDescription = htmlspecialchars($_POST['trackDescription']);
$imgPreview = htmlspecialchars($_POST['imgPreview']);
echo "<br>userID=".$userID.", trx=".$trx.", trackName=".$trackName.", trackDescription=".$trackDescription.", imgPreview=".$imgPreview;

$con = mysqli_connect('localhost',$dbroot,$dbpassword,$dbname);
if (!$con) {
    die('Could not connect: ' . mysqli_error($con));
}

$sql = "INSERT INTO tracks (userID, track, trackName, trackDescription, imgPreview) VALUES ('".$userID."', '".$trx."', '".$trackName."', '".$trackDescription."', '".$imgPreview."')";
echo "<br>sql=".$sql;
$result = mysqli_query($con,$sql);
echo "<br>result=".$result;

mysqli_close($con);
?>
</body>
</html>