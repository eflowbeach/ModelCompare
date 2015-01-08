<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <title>Model Compare</title>
  <script type="text/javascript" src="script/mc.js"></script>

  <style type="text/css">

    #isle {
      width: 100%;
      height: 1px;
    }

      body {
      font-family: "Helvetica Neue", Helvetica, sans-serif;
      margin: 10px auto;
      width: 1200px;
      <!--position: relative;-->
      }

    #demo {
    font-family: "Helvetica Neue", Helvetica, sans-serif;
    margin: 0px auto;
    width: 1200px;
    position: relative;
    }


    header {
      padding: 6px 0;
      }

      .group {
      margin-bottom: 1em;
      }

      .axis {
      font: 10px sans-serif;
      position: fixed;
      pointer-events: none;
      z-index: 2;
      }

      .axis text {
      -webkit-transition: fill-opacity 250ms linear;
      }

      .axis path {
      display: none;
      }

      .axis line {
      stroke: #000;
      shape-rendering: crispEdges;
      }

      .axis.top {
      background-image: linear-gradient(top, #fff 0%, rgba(255,255,255,0) 100%);
      background-image: -o-linear-gradient(top, #fff 0%, rgba(255,255,255,0) 100%);
      background-image: -moz-linear-gradient(top, #fff 0%, rgba(255,255,255,0) 100%);
      background-image: -webkit-linear-gradient(top, #fff 0%, rgba(255,255,255,0) 100%);
      background-image: -ms-linear-gradient(top, #fff 0%, rgba(255,255,255,0) 100%);
      top: 0px;
      padding: 0 0 24px 0;
      }

      .axis.bottom {
      background-image: linear-gradient(bottom, #fff 0%, rgba(255,255,255,0) 100%);
      background-image: -o-linear-gradient(bottom, #fff 0%, rgba(255,255,255,0) 100%);
      background-image: -moz-linear-gradient(bottom, #fff 0%, rgba(255,255,255,0) 100%);
      background-image: -webkit-linear-gradient(bottom, #fff 0%, rgba(255,255,255,0) 100%);
      background-image: -ms-linear-gradient(bottom, #fff 0%, rgba(255,255,255,0) 100%);
      bottom: 0px;
      padding: 24px 0 0 0;
      }

      .horizon {
      border-bottom: solid 1px #000;
      overflow: hidden;
      position: relative;

      }

      .horizon {
      border-top: solid 1px #000;
      border-bottom: solid 1px #000;
      }

      .horizon + .horizon {
      border-top: none;
      }

      .horizon canvas {
      display: block;
      }

      .horizon .title,
      .horizon .value {
      bottom: 0;
      line-height: 30px;
      margin: 0 6px;
      position: absolute;
      text-shadow: 0 1px 0 rgba(255,255,255,.5);
      white-space: nowrap;
      }

      .horizon .title {
      left: 0px;
      top: -5px;
    font-size: x-small;
      }

      .horizon .value {
      right: 0;
    font-weight: 600;
      }

      .line {
      background: #000;
      z-index: 2;
      }

      path {
      fill: none;
      stroke: black;
      }

      svg .data-point {
      stroke: blue;
      stroke-width: 1.5px;
      fill: blue;
      }

      svg .data-point-text {
      font-family: sans-serif;
      font-size: 11px;
      fill: red;
      }

      svg .axis path,
      svg .axis line {
      fill: none;
      stroke: black;
      }

      svg .axis text {
      font-family: sans-serif;
      font-size: 12px;
      }

    </style>


</head>
<body>

      <div id="isle"></div>
      <div id="demo"></div>
</body>

 <!-- Get WFO -->
      <script type="text/javascript">
                        <?php

                          $wfo = $_REQUEST['wfo'];
                        	echo "var wfo = \"$wfo\";";
                        	?>
      </script>



<!--D3 code here so DOM elements are valid-->
<script src="resource/mc/d3.v3.min.js" charset="utf-8"></script>
<script src="resource/mc/cubism.v1.min.js"></script>
</html>
