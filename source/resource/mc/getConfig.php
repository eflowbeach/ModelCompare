<?php
include_once("./util/sanitize.php");

// jSON URL which should be requested
$wfo = isset($_REQUEST["wfo"]) ? sanitize($_REQUEST["wfo"], "") : 0;

$userAgent = 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.134 Safari/537.36';

$json_url = "http://www.weather.gov/source/".$wfo."/modelcompare/config.json";

// Initializing curl
$ch = curl_init( $json_url );

// Configuring curl options
$options = array(
        CURLOPT_USERAGENT=> $userAgent,
		CURLOPT_RETURNTRANSFER => true,
		CURLOPT_HTTPHEADER => array('Content-type: application/json')
);

// Setting curl options
curl_setopt_array( $ch, $options );

// Getting results
$result =  curl_exec($ch); // Getting jSON result string

echo $result;

?>