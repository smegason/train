
<?php
include 'connect.php';
$username = htmlspecialchars($_GET["username"]);
$password = htmlspecialchars($_GET['password']);

$con = mysqli_connect('localhost',$dbroot,$dbpassword,$dbname);
if (!$con) {
    die('fail-connect');
}

$sql = "SELECT * FROM users WHERE userName='".$username."' AND password='".$password."'";
$result = mysqli_query($con,$sql);
if ($result) {
	$row = mysqli_fetch_array($result);
	$userID = $row['userID'];
	$username = $row['userName'];
	echo "&&&".$userID."&&&".$username."&&&";
} else {
	echo "fail-login";
}
mysqli_close($con);
?>
