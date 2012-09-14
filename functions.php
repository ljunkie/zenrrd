<?
$config_filename = 'zenrrd.config';
if (!file_exists($config_filename)) {
    echo "The file <b>$config_filename</b> does not exist</b>";
    $file = file_get_contents('README');
    print "<p>Please read the file README<p>";
    print "<pre>$file</pre>";
    exit;
 } else {
  foreach (file($config_filename) as $line_num => $line) {
    if ( ! preg_match("/#.*/", $line) && preg_match("/\S/", $line)) {
      list( $key, $value ) = explode( "=", trim( $line ), 2);
      define(strtolower($key), $value);
      define(strtoupper($key), $value);
    }
  }
  $req = array("renderserver_url", "zenoss_perf_dir", "zenoss_user" );
  $config_error=0;
  foreach ($req as $val) {
    if (!defined($val)) {
      $missing .=  "missing: <b>$val=</b><br>";
      $config_error=1;
    }
  }
  if (!empty($config_error)) {
    echo "<p>The file <b>$config_filename</b> contains errors.</b><p>$missing<p>";
    print "<hr>-----------------------------contents----------------------------<br>";
    $file = file_get_contents($config_filename);
    print "<p><p>";
    print "<pre>$file</pre>";
    exit;
  }
 }

function removeqsvar($url, $varname) {
    list($urlpart, $qspart) = array_pad(explode('?', $url), 2, '');
    parse_str($qspart, $qsvars);
    unset($qsvars[$varname]);
    $newqs = http_build_query($qsvars);
    return $urlpart . '?' . $newqs;
}

function printGraph($device,$int,$dozoom =null,$show_url = 1,$type = null) {
    global $ints;
    
    if ($_REQUEST['zo']) {	
	$link = getHost() . $_SERVER[REQUEST_URI];
	$new_url = $link;
	$new_url = removeqsvar($new_url,'zo');
	$new_url = removeqsvar($new_url,'start');
	$new_url = removeqsvar($new_url,'end');
	
	if ($_REQUEST['d'] == 'end') {
	    // go fowards
	    $new_start = $_REQUEST['start']+$_REQUEST['zo'];
	    $new_end = $_REQUEST['end']+$_REQUEST['zo'];
	} elseif ($_REQUEST['d'] == 'start') {
	    // go backwards
	    $new_start = $_REQUEST['start']-$_REQUEST['zo'];
	    $new_end = $_REQUEST['end']-$_REQUEST['zo'];
	} else {
	    // zoom out - split timeframe requested in each direction
	    $tf = $_REQUEST['zo']/2;
	    $new_start = $_REQUEST['start']-$tf;
	    $new_end = $_REQUEST['end']+$tf;
	}
	// if end is > now, take diff (end-now) and subtract from start
	if ($new_end > time() ) {
	    $new_start = $new_start-($new_end-time());
	    $new_end = time();
	}
	$new_url .=  '&start=' .  $new_start .'&end=' .  $new_end;
	header("Location: $new_url");
	exit;
    }
    
    
    if (!empty($_REQUEST['end'])) {
      
      $extraParams .="&end={$_REQUEST['end']}";   
      if ($dozoom) {
	$zoomParams .='&end=' . $_REQUEST['end'];
      } else {
	$zoomParams .='&end=' . strtotime($_REQUEST['end']);
      }
    } else {
      

      // no date set - default to NOW
      if (defined('DEMO')) {
	// set default date
	$zoomParams .='&end=' . DEMO;
	$extraParams .='&end=' . DEMO;
      } else {
	$zoomParams .='&end=' . time();
	$extraParams .='&end=' . time();
      }
	
    }
    
    // start date
    if (!empty($_REQUEST['start'])) {
      
      $extraParams .="&start={$_REQUEST['start']}";    
      if ($dozoom) {
	$zoomParams .='&start=' . $_REQUEST['start'];
	} else {
	    $zoomParams .='&start=' . strtotime($_REQUEST['start']);
	}
    } else {
      // no date set - default to one day of graphs
      $start = time()-86400;
      if (defined('DEMO')) {
	$start = DEMO-86400; //demo mode.. fixed date
      }
      $extraParams .='&start=' . $start;
      $zoomParams .='&start=' . $start;
    }
    
    // If the interface description is not the same as the interface.. we will include it for display
    if ($ints[$device][$int]['desc'] != $int) {
	$int_desc = $ints[$device][$int]['desc'];
	$extraParams .= "&int_desc=" . urlencode($int_desc);
	$zoomParams .= "&int_desc=" . urlencode($int_desc);
    }
    
    $dev_title = $ints[$device]['title'];
    $extraParams .= "&title=" . urlencode($dev_title);
    $zoomParams .= "&title=" . urlencode($dev_title);
    
    if ($_REQUEST['width']) {
	$extraParams .= "&width=" . urlencode($_REQUEST['width']);
	$zoomParams .= "&width=" . urlencode($_REQUEST['width']);
    }

    if ($int) {
	$cgi_query = '?device=' . $device . '&int=' . $int . $extraParams;
	$zoom = 'zoom.php?device=' . $device . '&int=' . $int . $zoomParams;
	$url = getHost(1) . 'cgi-bin/zenoss_rrd.cgi' . $cgi_query;
    } else {
	$cgi_query = '?device=' . $device . $extraParams;
	$zoom = 'zoom.php?device=' . $device . $zoomParams;
	$url = getHost(1) . 'cgi-bin/zenoss_rrd.cgi' . $cgi_query;
    }
    
    
    if ($dozoom) {
	if ($_REQUEST['type']) {
	    $url .= "&type={$_REQUEST['type']}";
	}
	print "<table><tr>";
	print "<td><font size=2>zoom out:";
	
	$dur = 86400;
	print "</td><td align=center>";
	print "<a href='$zoom&zo=$dur'>day</a> ";
	print "<br>  <a href='$zoom&zo=$dur&d=start'><<</a>";
	print "&nbsp;&nbsp;  <a href='$zoom&zo=$dur&d=end'>>></a>";
	
	$dur = 604800;
	print "</td><td align=center>";
	print "  <a href='$zoom&zo=$dur'>week</a>";
	print "<br>  <a href='$zoom&zo=$dur&d=start'><<</a>";
	print "&nbsp;&nbsp;  <a href='$zoom&zo=$dur&d=end'>>></a>";
	$dur = 2592000;
	print "</td><td align=center>";
	print "  <a href='$zoom&zo=$dur'>month</a>";
	print "<br>  <a href='$zoom&zo=$dur&d=start'><<</a>";
	print "&nbsp;&nbsp;  <a href='$zoom&zo=$dur&d=end'>>></a>";
	$dur = 31536000;
	print "</td><td align=center>";
	print " <a href='$zoom&zo=$dur'>year</a>";
	print "<br>  <a href='$zoom&zo=$dur&d=start'><<</a>";
	print "&nbsp;&nbsp;  <a href='$zoom&zo=$dur&d=end'>>></a>";
	print "</td>";
	print "</tr></table>";
	print "<p><img src='$url' id='graph'>";
	if ($show_url) {	    print "<br><font size=2><a href='$url' target='_blank'>$url</a></font>";	}
    } elseif($int) {
	print "<p><a href='$zoom' target='_Blank' class='zoom_cur'><img title='Click to ZOOM' src='$url' ></a>";
	if ($show_url) {	    print "<br><font size=2><a href='$url' target='_blank'>$url</a></font>";	}
	## &type=pkts
	$type = 'pkts';
	print "<p><a href='$zoom&type=$type' target='_Blank' class='zoom_cur'><img title='Click to ZOOM' src='$url&type=$type' ></a>";
	if ($show_url) {	print "<br><font size=2><a href='$url&type=$type' target='_blank'>$url&type=$type</a></font>"; }
	$type = 'err';
	print "<p><a href='$zoom&type=$type' target='_Blank' class='zoom_cur'><img title='Click to ZOOM' src='$url&type=$type' ></a>";
	if ($show_url) {	print "<br><font size=2><a href='$url&type=$type' target='_blank'>$url&type=$type</a></font>"; }
    }     else {
	$type = 'cpu';
	print "<p><a href='$zoom&type=$type' target='_Blank' class='zoom_cur'><img title='Click to ZOOM' src='$url&type=$type' ></a>";
	if ($show_url) {	print "<br><font size=2><a href='$url&type=$type' target='_blank'>$url&type=$type</a></font>"; }
	$type = 'mem';
	print "<p><a href='$zoom&type=$type' target='_Blank' class='zoom_cur'><img title='Click to ZOOM' src='$url&type=$type' ></a>";
	if ($show_url) {	print "<br><font size=2><a href='$url&type=$type' target='_blank'>$url&type=$type</a></font>"; }
    }
}

function LoadInts() {
    $filename = 'bin/interfaces.csv';
    if (!file_exists($filename)) {
	echo "The file <b>$filename</b> does not exist</b>";
	$file = file_get_contents('README');
	print "<p>Please read the file README<p>";
	print "<pre>$file</pre>";
	exit;
    }    else {
	$handle = fopen($filename, "r");
	while (($data = fgetcsv($handle)) !== FALSE) {
	    $device = $data[0];
	    $int = $data[1];
	    $desc = $data[2];
	    if (!$desc) { $desc=$int; }
	    $ints[$device][$int]['name'] = $int;
	    $ints[$device][$int]['desc'] = $desc;
	    $ints[$device][$int]['operStatus'] = $data[3];
	    if   (!$data[4]) { $ints[$device]['title'] = strtolower($data[0]);} 
	    else {$ints[$device]['title'] = strtolower($data[4]); }
	}
	fclose($handle);
	// Sort the Array by Device TITLE, not key (key is a mix of IP or FQDN)
	// Title uses the zenoss device TITLE
	aasort($ints,'title');
	return $ints;
    }
}

function aasort (&$array, $key) {
    $sorter=array();
    $ret=array();
    reset($array);
    foreach ($array as $ii => $va) { $sorter[$ii]=$va[$key]; }
    natcasesort($sorter);
    foreach ($sorter as $ii => $va) { $ret[$ii]=$array[$ii]; }
    $array=$ret;
}

function getHost($with_base){
    $protocol = ($_SERVER['HTTPS'] && $_SERVER['HTTPS'] != "off") ? "https" : "http";
    if ($with_base) {
	return $protocol . "://" . $_SERVER['HTTP_HOST'] .(dirname($_SERVER['SCRIPT_NAME']) != '/' ? dirname($_SERVER["SCRIPT_NAME"]).'/' : '/');
    } else {
	return $protocol . "://" . $_SERVER['HTTP_HOST'];
    }
}


?>