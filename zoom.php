<?
require_once('functions.php');
$ints = LoadInts();
?>

<html><head>
<? print "	<title>ZENRRD: [zoom] {$_REQUEST['device']} - {$_REQUEST['int']}</title>";?>

    <link type="text/css" href="css/smoothness/jquery-ui-1.8.23.custom.css" rel="stylesheet" />
    <link type="text/css" href="css/zenrrd.css" rel="stylesheet" />
	 
    <script language="JavaScript" type="text/javascript" src="js/core/jquery-1.7.1.min.js"></script>
    <script language="JavaScript" type="text/javascript" src="js/core/jquery-ui-1.8.23.custom.min.js"></script>
    <script language="JavaScript" type="text/javascript" src="js/core/jquery-ui-timepicker-addon.js"></script>
    <script language="JavaScript" type="text/javascript" src="js/zenrrd.min.js"></script>
        
	<script src="js/zenrrd_zoom.min.js" type="text/javascript"></script>
	<link rel="stylesheet" href="css/zenrrd_zoom.css" type="text/css" />
  </head>
  <body>
  <div id="outer"> <div class="graph">
      <? printGraph($_REQUEST['device'],$_REQUEST['int'],zoom); ?>
  </div></div>
<? /* debug coords
      <div>
      <label>X1 <input type="text" size="4" id="x1" name="x1" /></label>
      <label>Y1 <input type="text" size="4" id="y1" name="y1" /></label>
      <label>X2 <input type="text" size="4" id="x2" name="x2" /></label>
      <label>Y2 <input type="text" size="4" id="y2" name="y2" /></label>
      <label>W <input type="text" size="4" id="w" name="w" /></label>
      <label>H <input type="text" size="4" id="h" name="h" /></label>
      </div>
   */
?>

  </body>
</html>
