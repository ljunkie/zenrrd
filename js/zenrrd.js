$(document).ready(function(){
    $('#int_name').focus();

    $('#reset_dates').click(function(e) {
	localStorage.removeItem( 'datestart');
	localStorage.removeItem( 'dateend');
	$('#datepicker_start, #datepicker_end').val('');
    });
    
    /* redirect initial load to include start/end dates if save */
    var has_start =localStorage.getItem( 'datestart');
    var has_end = localStorage.getItem( 'dateend');
    var params = parseQuery( window.location.search );
    // do not even try if we just reloaded..
    if (params['reloaded'] != 1) {
	var reload = 0;
	var new_params ='';
	//if (typeof has_start != 'undefined' && typeof params['start'] == 'undefined' && has_start != null) {
	if (!$.isBlank(has_start) && $.isBlank(params['start'])) {
	    reload = 1;
	    new_params += '&start=' + has_start; 
	}
	// if (typeof has_end != 'undefined' && typeof params['end'] == 'undefined' && has_end != null) {
	if (!$.isBlank(has_end) && $.isBlank(params['end'])) {
	    reload = 1;
	    new_params += '&end=' + has_end; 
	}
	if (reload == 1) {
	    var orig_params = '';
	    $.each(params, function(key, value) { orig_params += '&' + key + '=' + value; });
	    window.location = '?reloaded=1' + orig_params + new_params;
	}
    }
    /* end redirect */
    
    var test = $('#device_name').val();
    if (typeof test != 'undefined') {
	if (test.length > 0) {
	    $('#updategraph').show();
	    $('#timeframe').show();
	} else {
	    $('#updategraph').hide();
	    $('#timeframe').hide();
	}
    }
    
    
    /* on device change.. set interface to none */
    $(".on_change_device").change(function(e) {
	$('#int_name').val('');
	$(this).closest("form").submit(); 
    });
    
    /* submit form on int selection */
    $(".on_change_int").change(function(e) {
	$(this).closest("form").submit(); 
    });
   
   
    /* dateTIMEpicker fun... */
    $('#datepicker_start').datetimepicker({
	onClose: function(dateText, inst) {
	    localStorage.setItem( 'datestart', dateText );
            var endDateTextBox = $('#datepicker_end');
            if (endDateTextBox.val() != '') {
		var testStartDate = new Date(dateText);
		var testEndDate = new Date(endDateTextBox.val());
		if (testStartDate >= testEndDate) {
		    var actualDate = new Date(dateText); // convert to actual date
		    var newDate = getFormattedDate( new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate()+1) );
                    endDateTextBox.val(newDate);
		    localStorage.setItem( 'dateend', newDate );
		}
            }
	    
	},
	onSelect: function (dateText){
	    // set min start time for End Date
            var start = $(this).datetimepicker('getDate');
            $('#datepicker_end').datetimepicker('option', 'minDate', new Date(start.getTime()));
	}
    }).datepicker('setDate', localStorage.getItem( 'datestart'));

    $('#datepicker_end').datetimepicker({
	onClose: function(dateText, inst) {
	    localStorage.setItem( 'dateend', dateText );
	    var startDateTextBox = $('#datepicker_start');
	    
	    // check if START 
            if (startDateTextBox.val() != '') {
		var testStartDate = new Date(startDateTextBox.val());
		var testEndDate = new Date(dateText);
		if (testStartDate >= testEndDate) {
		    var actualDate = new Date(dateText); // convert to actual date
		    var newDate = getFormattedDate( new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate()-1) );
                    startDateTextBox.val(newDate);
		    localStorage.setItem( 'datestart', newDate );
		}
            }
	},
	onSelect: function (selectedDateTime){
            var end = $(this).datetimepicker('getDate');
            $('#datepicker_start').datetimepicker('option', 'maxDate', new Date(end.getTime()) );
	}
    }).datepicker('setDate', localStorage.getItem( 'dateend'));
    
    // max date for end is always now
    $('#datepicker_end').datetimepicker('option', 'maxDate', new Date() );
    var end = localStorage.getItem( 'dateend');
    if (!$.isBlank(end)) {
	$('#datepicker_start').datetimepicker('option', 'maxDate', new Date(end) );
    } else {
	$('#datepicker_start').datetimepicker('option', 'maxDate', new Date() );
    }
    
    $( ".autocomplete" ).autocomplete({
	source: "ajax.php?ac=1&t=interface",
	minLength: 2,
	select: function( event, ui ) {
	    event.preventDefault();
	    $('#device_name').val(ui.item.device);
	    var url = "?device=" + ui.item.device + "&int=" + ui.item['int'];
	    window.location = url
	}
    });
});


function getFormattedDate(date) {
    var day = ('0'+date.getDate()).substr(-2)
    var month = ('0'+(date.getMonth() + 1)).substr(-2)
    var year = date.getFullYear();
    return month + '/' + day + '/' + year;
}

function parseQuery ( query ) {
    var Params = new Object ();
    if ( ! query ) return Params; // return empty object
    var Pairs = query.split(/[;&]/);
    for ( var i = 0; i < Pairs.length; i++ ) {
	var KeyVal = Pairs[i].split('=');
	if ( ! KeyVal || KeyVal.length != 2 ) continue;
	var key = unescape( KeyVal[0] );
	key = key.replace(/\?/g, '');
	var val = unescape( KeyVal[1] );
	val = val.replace(/\+/g, ' ');
	Params[key] = val;
    }
    return Params;
}


(function($){
    $.isBlank = function(obj){
	return(!obj || $.trim(obj) === "");
    };
})(jQuery);
