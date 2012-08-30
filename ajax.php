<?
    require_once('functions.php');    
    require_once('inc/jsonwrapper.php');    

$ints = LoadInts();

foreach ($ints as $dev_name => $dev_arr) {
    foreach ($dev_arr as $int_name => $int_arr) {
	if ($int_arr['operStatus'] > 0) {
	    $int_desc = $int_arr['desc'];
	    $int_oper = $int_arr['operStatus'];
	    $dev_title = $dev_arr['title'];
	    if ($_GET['term']) {
		$check2 = str_replace('/','_',$_GET['term']);
		if (preg_match("/{$_GET['term']}/i" , $int_name) ||
		    preg_match("/{$_GET['term']}/i" , $int_desc) ||
		    preg_match("/{$_GET['term']}/i" , $dev_name) ||
		    preg_match("/{$_GET['term']}/i" , $dev_title) ||
		    preg_match("/$check2/i" , $int_name) ||
		    preg_match("/$check2/i" , $int_desc) ||
		    preg_match("/$check2/i" , $int_title) ||
		    preg_match("/$check2/i" , $dev_name )
		    ) {
		    if ($int_oper == 1) {
			$status = 'UP';
		    } else {
			$status = 'DOWN';
		    }
		    $info['value'] = "$dev_title :: $int_name :: $int_desc :: $status";
		    $info['id'] = $dev_name;
		    $info['name'] = $int_name;
		    $info['int'] = $int_name;
		    $info['device'] = $dev_name;
		    $row_set[] = $info;
		}
	    }
	}
    }
}

if (!$row_set) {
    $info['value'] = "search string not found...";
    $row_set[] = $info;
 }
echo json_encode($row_set);
exit;
?>
