<?    require_once('functions.php'); ?>
    <html>
	<head>
<? print "	<title>ZENRRD: {$_REQUEST['device']} - {$_REQUEST['int']}</title>";?>

    <link type="text/css" href="css/smoothness/jquery-ui-1.8.23.custom.css" rel="stylesheet" />
    <link type="text/css" href="css/zenrrd.css" rel="stylesheet" />
	 
    <script language="JavaScript" type="text/javascript" src="js/core/jquery-1.7.1.min.js"></script>
    <script language="JavaScript" type="text/javascript" src="js/core/jquery-ui-1.8.23.custom.min.js"></script>
    <script language="JavaScript" type="text/javascript" src="js/core/jquery-ui-timepicker-addon.js"></script>
    <script language="JavaScript" type="text/javascript" src="js/zenrrd.min.js"></script>
	    
    <?
    print 'Global Search: <input type="text" name="search"  class="autocomplete"><p>';

$ints = LoadInts();

print "<div id=query_box>";
print '<form>';
print "<table id='device_table'>";
print "<tr><td>";
print "<select id='device_name' name='device' class='on_change_device'>";
print "<option value=>---- Select a Device -----</option>";

foreach ($ints as $dev_name => $dev_arr) {
    if ($dev_name == $_REQUEST['device']) { $sel = 'SELECTED'; } ELSE { $sel = '';}
    $dev_title = $dev_arr['title'];
    print "<option $sel value='$dev_name'>$dev_title</option>";
}
print "</select>";
print "</td><td>";


if ($_REQUEST['device']) {
    print "<select id='int_name' name='int' class='on_change_int'>";
    print "<option value=>---- Select an Interface -----</option>";
    if ($_REQUEST['int'] == 'ALLGRAPHS') { $sel = 'SELECTED'; } ELSE { $sel = '';}
    print "<option $sel value=ALLGRAPHS> *** All Interface Graphs </option>";
    print "<option value=></option>";
    // show interface list
    $array = $ints[$_REQUEST['device']] ;
    aasort($array,'name');
    foreach ($array as $int_name => $int_arr) {
	// If there is no operStatus.. this isn't a port
	if ($int_arr['operStatus'] > 0) {
	    $int_desc = $int_arr['desc'];
	    $int_oper = $int_arr['operStatus'];
	    if ($int_name == $_REQUEST['int']) { $sel = 'SELECTED'; } ELSE { $sel = '';}
	    if ($int_oper == 1) {
		print "<option $sel value='$int_name'>$int_name :: $int_desc</option>";
	    } else {
		$down .= "<option $sel value='$int_name'>$int_name :: $int_desc</option>";
	    }   
	}
    }
    if ($down) {
	print "<option value=></option>";
	print "<option value=>---- Ports that are down (last hour) -----</option>";
	print $down;
    }
    print "</select>";
    print "</td><td>";
    print '&nbsp;&nbsp;&nbsp;Width: <input size=4 maxsize=4 type="text" name=width value='. $_GET['width'] .'>';
    print "</td></tr>";

    // show dates
    print "<tr id=timeframe>";
    print '<td colspan=2>From: <input type="text" id="datepicker_start" name=start class="datepicker">';
    print '&nbsp;&nbsp;&nbsp;To: <input type="text" id="datepicker_end" name=end class="datepicker">';
    print "&nbsp;<input type=button id=reset_dates value='Clear Dates'>";
    //if ($_REQUEST['SHOW_URL']) { $c = 'CHECKED'; } ELSE { $c='';};
    //print "&nbsp; URL <input $c type=checkbox name=SHOW_URL>";

    print "</td><td align=right>";
    print "<input type=submit id=updategraph value='Show Graph'>";
    print "</td>";
 }
print "</tr></table>";
print '</form>';
print "</div>";

if ($_REQUEST['device'] && ($_REQUEST['int'] || $_REQUEST['ALL'])) {
    $device = $_REQUEST['device'];
    $int_name = $_REQUEST['int'];
    if ($_REQUEST['ALL'] || $int_name == 'ALLGRAPHS') {
    	foreach ($ints[$device] as $int_name => $int_arr) {
	    $int_oper = $int_arr['operStatus'];
	    if ($int_oper == 1) {
		printGraph($device,$int_name);
	    }
    	}
    } else {
	printGraph($device,$int_name);
    }
 }
?>