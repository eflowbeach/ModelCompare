<?php
include_once("./util/sanitize.php");

// jSON URL which should be requested
$wfo = isset($_REQUEST["wfo"]) ? sanitize($_REQUEST["wfo"], "") : 0;


$json_url = "http://www.weather.gov/source/".$wfo."/modelcompare/config.json";

// Initializing curl
$ch = curl_init( $json_url );

// Configuring curl options
$options = array(
		CURLOPT_RETURNTRANSFER => true,
		CURLOPT_HTTPHEADER => array('Content-type: application/json')
);

// Setting curl options
curl_setopt_array( $ch, $options );

// Getting results
$result =  curl_exec($ch); // Getting jSON result string

echo $result;

?>