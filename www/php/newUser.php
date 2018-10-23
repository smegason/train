
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
New user----
<?php
include 'connect.php';

$username = htmlspecialchars($_GET["username"]);
$email = htmlspecialchars($_GET['email']);
$password = htmlspecialchars($_GET['password']);
echo "<br>username=".$username.", pass=".$password.", email=".$email;

$con = mysqli_connect('localhost',$dbroot,$dbpassword,$dbname);
if (!$con) {
    die('Could not connect: ' . mysqli_error($con));
}

$sql = "INSERT INTO users (userName, password, email) VALUES ('".$username."', '".$password."', '".$email."')";
echo "<br>sql=".$sql;
$result = mysqli_query($con,$sql);
echo "<br>result=".$result;

mysqli_close($con);
?>
</body>
</html>