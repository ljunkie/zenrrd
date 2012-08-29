$(document).ready(function(){
    $('#int_name').focus();

    $('#reset_dates').click(function(e) {
	localStorage.removeItem( 'datestart');
	localStorage.removeItem( 'dateend');
	$('#datepicker_start, #datepicker_end').val('');
    });
    var test = $('#int_name').val();
    if (typeof test != 'undefined') {
	if ($('#int_name').val().length > 0) {
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
            var endDateTextBox = $('#datepicker_end');
            if (endDateTextBox.val() != '') {
		var testStartDate = new Date(dateText);
		var testEndDate = new Date(endDateTextBox.val());
		if (testStartDate > testEndDate) {
                    endDateTextBox.val(dateText);
		    localStorage.setItem( 'dateend', dateText );
		}
            }
            else {
		localStorage.setItem( 'dateend', dateText );
		endDateTextBox.val(dateText);
            }
	    localStorage.setItem( 'datestart', dateText );
	},
	onSelect: function (selectedDateTime){
            var start = $(this).datetimepicker('getDate');
            $('#datepicket_end').datetimepicker('option', 'minDate', new Date(start.getTime()));
	}
    }).datepicker('setDate', localStorage.getItem( 'datestart'));

    $('#datepicker_end').datetimepicker({
	onClose: function(dateText, inst) {
            var startDateTextBox = $('#datepicker_start');
            if (startDateTextBox.val() != '') {
		var testStartDate = new Date(startDateTextBox.val());
		var testEndDate = new Date(dateText);
		if (testStartDate > testEndDate) {
                    startDateTextBox.val(dateText);
		    localStorage.setItem( 'datestart', dateText );
		}
		localStorage.setItem( 'dateend', dateText );
            }
            else {
		localStorage.setItem( 'datestart', dateText );
		startDateTextBox.val(dateText);
            }
	    localStorage.setItem( 'dateend', dateText );
	},
	onSelect: function (selectedDateTime){
            var end = $(this).datetimepicker('getDate');
            $('#datepicker_start').datetimepicker('option', 'maxDate', new Date(end.getTime()) );
	}
    }).datepicker('setDate', localStorage.getItem( 'dateend'));

    var end = localStorage.removeItem( 'dateend');
    if (typeof end == 'undefined') {
	date = new Date();
	$('#datepicker_end').datetimepicker('setDate', (new Date()) );
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