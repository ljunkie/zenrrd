#!/usr/bin/perl
use Compress::Zlib;
use MIME::Base64::URLSafe;
use Time::ParseDate;
use LWP::UserAgent;
use CGI;

my $debug = 0; ## will print text if debug is set
my %config = &zenrrdConfig();

if (!$config{'renderserver_url'}) {    &exitcgi('renderserver_url is not set. Verify your zenrrd.config file');}
if (!$config{'zenoss_perf_dir'}) {    &exitcgi('device_dir is not set. Verify your zenrrd.config file');}
my $url_start = $config{'renderserver_url'};
my $device_dir = $config{'zenoss_perf_dir'} . '/Devices/';
$device_dir =~ s/\/\//\//g; ## replace dupe // (incase they include trailing / or not..
my $int_csv = '../bin/interfaces.csv';
my $ints = &LoadInts($int_csv);

## quick and dirty info if debug is set.
if ($debug) {
    my $filesize = -s $int_csv;
    my $modtime = localtime((stat($int_csv))[9]);
    my $out = '<pre>'.
	'renderserver_url=' . $config{'renderserver_url'} . "\n\n".
	'zenoss_perf_dir=' . $config{'zenoss_perf_dir'} . "\n\n".
	'interfaces_file=../bin/interfaces.csv'." (size:$filesize time:$modtime)\n\n".
	'</pre>';
    &exitcgi($out);
}
## end debug

my $q = CGI->new;
$params = { map { $_ => ($q->param($_))[0] } $q->param };

exit if !$params->{'device'};
exit if !$params->{'int'};

## Set some defaults
my $start = time-86400;
my $end = time;
my $width = 800;
my $start_date = localtime($start);
my $end_date = localtime($end);
## End

if ($params->{'width'}){    $width = $params->{'width'};}
if ($params->{'start'}){
    $start = $params->{'start'};
    # parse the date if it's not a epoch time stamp
    if ($params->{'start'} =~ /[-\/]+/) {	$start = &parsedate($start);    }
    $start_date = localtime($start);
}
if ($params->{'end'}){
    $end = $params->{'end'};
    if ($params->{'end'} =~ /[-\/]+/) {	$end = &parsedate($end);    }    
    $end_date = localtime($end);
}

## These are required to create the graph
my $device = $params->{'device'};
my $int  = $params->{'int'};

my $comment =  "$start_date    through    $end_date";

## These can be set from parameters.. if not, we will set from csv
my $desc = $params->{'int_desc'};
my $title = $params->{'title'};
if (!$title) {    $title = $ints->{$device}->{$int}[2];}
if (!$desc) {    $desc = $ints->{$device}->{$int}[0];}

## we now parse the interfaces.csv file for 64bit or 32bit Counter.. No need for file access
#if (-f $inHC && -f $outHC) {    $in = $inHC;    $out = $outHC; }
# Set HC counter if 64bit interface
my $inHC = $device_dir . $device . '/os/interfaces/'.$int .'/ifHCInOctets_ifHCInOctets.rrd';
my $outHC = $device_dir . $device . '/os/interfaces/'.$int.'/ifHCOutOctets_ifHCOutOctets.rrd';
my $in = $device_dir . $device . '/os/interfaces/'.$int .'/ifInOctets_ifInOctets.rrd';
my $out = $device_dir . $device . '/os/interfaces/'.$int.'/ifOutOctets_ifOutOctets.rrd';
if ($ints->{$device}->{$int}[3] =~ /64bit/) {
    $in = $inHC;
    $out = $outHC;
}

my $url_end = '&drange=129600&width=' . $width . '&start=' . $start .'&end='.$end;

### COMMENT data cannot have any non escaped colons..
$comment =~ s/\\//g; ## remove escapes..
$comment =~ s/:/\\:/g; ## add them back in
$device =~ s/\\//g; ## remove escapes..
$device =~ s/:/\:/g; ## add them back in
$title =~ s/\\//g; ## remove escapes..
$title =~ s/:/\:/g; ## add them back in

my @options =(
'-F',
'-E',
"-t $int :: $desc",
'--disable-rrdtool-tag',
'--height=100',
'--lower-limit=0',
'--rigid',
'--vertical-label=bits/sec',
"COMMENT: $title ". '\c',
"COMMENT: $comment ". '\c',
"COMMENT: ". '\c',
'DEF:ifHCInOctets-raw='.$in.':ds0:AVERAGE',
'DEF:ifHCInOctets-raw-max='.$in.':ds0:MAX',
'CDEF:ifHCInOctets-rpn=ifHCInOctets-raw,8,*',
'CDEF:ifHCInOctets-rpn-max=ifHCInOctets-raw-max,8,*',
'CDEF:ifHCInOctets=ifHCInOctets-rpn',
'AREA:ifHCInOctets-rpn#00cc00ff:Inbound       ',
'GPRINT:ifHCInOctets-rpn:LAST:cur\:%5.2lf%s',
'GPRINT:ifHCInOctets-rpn:AVERAGE:avg\:%5.2lf%s',
'GPRINT:ifHCInOctets-rpn-max:MAX:max\:%5.2lf%s\j',
'DEF:ifHCOutOctets-raw='.$out.':ds0:AVERAGE',
'DEF:ifHCOutOctets-raw-max='.$out.':ds0:MAX',
'CDEF:ifHCOutOctets-rpn=ifHCOutOctets-raw,8,*',
'CDEF:ifHCOutOctets-rpn-max=ifHCOutOctets-raw-max,8,*',
'CDEF:ifHCOutOctets=ifHCOutOctets-rpn',
'LINE1:ifHCOutOctets-rpn#0000ff99:Outbound      ',
'GPRINT:ifHCOutOctets-rpn:LAST:cur\:%5.2lf%s',
'GPRINT:ifHCOutOctets-rpn:AVERAGE:avg\:%5.2lf%s',
'GPRINT:ifHCOutOctets-rpn-max:MAX:max\:%5.2lf%s\j',
'CDEF:allbits=ifHCInOctets-rpn,ifHCOutOctets-rpn,MAX',
'VDEF:95=allbits,95,PERCENT',
'VDEF:95th=allbits,95,PERCENT',
'HRULE:95th#FF0000:95th',
'GPRINT:95th:%0.2lf %Sbps\l',
	      );

my $diff = $end-$start;
my $xgrid;
if ($diff > 86400*15) {
    $xgrid = '--x-grid=DAY:1:DAY:7:DAY:2:86400:%D ';
}
if ($diff > 86400*20) {
    $xgrid = '--x-grid=DAY:1:DAY:7:DAY:2:86400:%m-%d ';
}
if ($diff > 86400*32) {
    $xgrid = '';
}
if ($xgrid) {
    push(@options,$xgrid);
}
my $gopts = urlsafe_b64encode(compress(join('|', @options), 9)) . '==';
my $URL = $url_start . $gopts . $url_end;

my $res = LWP::UserAgent->new->request(new HTTP::Request GET => $URL);
if ($res->is_success) {
    binmode(STDOUT);
    print "Content-type: image/png\n\n";
    print $res->content;
} else {
    print "Content-type: text/html\n\n";
    print $res->status_line;
}
exit;




sub exitcgi() {
    my $msg = shift;
    print  "Content-type: text/html\n\n";
    print $msg;
    exit;
}

sub LoadInts() {
    my $file = shift;
    open my $fh, '<', $file or &exitcgi("Could not open interfaces csv '$file' = $!");
    while (my $line = <$fh>) {
	$line =~ s/\s*\z//;
	$line =~ s/\"//g;
	my @array = split /,/, $line;
	my $device = shift @array;
	my $int = shift @array;
	$ints->{$device}->{$int} = \@array;
    }
    close $fh;
    return $ints;
}


sub zenrrdConfig() {
    my $file = "../zenrrd.config";
    open(CONFIG, "< $file")  or &exitcgi("Could not open $file = $!");
    my %config = map { 
	s/#.*//; # Remove comments
	s/^\s+//; # Remove opening whitespace
	s/\s+$//;  # Remove closing whitespace
	m/(.*?)=(.*)/; 
    } <CONFIG>;
    close CONFIG;
    return %config;
}

###########################################################################
### This is the ability to decode the gopts from zenoss (the RRD template)
#$gopts = '';
#
#my @results = myDecode($gopts);
#print "<pre>";
#foreach (@results) {
#    print "$_\n";
#}
#print "</pre>";
#
#sub myDecode {
#    my $data = shift;
#    my @results = split /\|/, uncompress(urlsafe_b64decode($data));
#    return(@results);
#}

