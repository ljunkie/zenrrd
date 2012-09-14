#!/usr/bin/perl
use Compress::Zlib;
use MIME::Base64::URLSafe;
use Time::ParseDate;
use LWP::UserAgent;
use CGI;
use Data::Dumper;

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
if (!$params->{'device'} ){    &exitcgi('missing  parameter device=');}

## Set some defaults
# $start,$end will alway be epoch format
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

## if start > end - start 1 day prior
if ($start > $end) {
    $start = $end-86400; 
    $start_date = localtime($start);
}

## These are required to create the graph
my $device = $params->{'device'};
my $int  = $params->{'int'};



## These can be set from parameters.. if not, we will set from csv
my $int_desc = $params->{'int_desc'};
my $dev_title = $params->{'title'};
if (!$dev_title) {    $dev_title = $ints->{$device}->{$int}[2];}
if (!$int_desc) {    $int_desc = $ints->{$device}->{$int}[0];}

my $rrd_base = $device_dir . $device . '/';
my $rrd_base_int = $rrd_base . 'os/interfaces/'.$int.'/';


my $rrd_cpu = 'cpu5min_cpu5min.rrd';
my $rrd_mem = 'mem5minFree_mem5minFree.rrd';
my $rrd_uptime = 'sysUpTime_sysUpTime.rrd';

my $rrd_in_oct = 'ifHCInOctets_ifHCInOctets.rrd';
my $rrd_out_oct = 'ifHCOutOctets_ifHCOutOctets.rrd';

my $rrd_in_pkt = 'ifHCInUcastPkts_ifHCInUcastPkts.rrd';
my $rrd_out_pkt = 'ifHCInUcastPkts_ifHCInUcastPkts.rrd';

my $rrd_in_err = 'ifInErrors_ifInErrors.rrd';
my $rrd_out_err = 'ifOutErrors_ifOutErrors.rrd';




## we now parse the interfaces.csv file for 64bit or 32bit Counter.. No need for file access
#if (-f $inHC && -f $outHC) {    $in = $inHC;    $out = $outHC; }
my $is_64bit =0;
if ($ints->{$device}->{$int}[3] =~ /64bit/) {    $is_64bit = 1;}


my @options;

## default is throughput and in/out oct
my $req_int = 1;
my $label = 'Throughput';
my $rrd_template = 'throughput';

my $rrd_in = $rrd_base_int . $rrd_in_oct;
my $rrd_out = $rrd_base_int . $rrd_out_oct;

if (defined($params->{'type'}) ) {
    
    ## Packets Per Second
    ##   Template: packets
    if ($params->{'type'} =~ /pkt/) {
	$rrd_template = 'packets';
	$label = 'Packets';
	$rrd_in = $rrd_base_int . $rrd_in_pkt;
	$rrd_out = $rrd_base_int . $rrd_out_pkt;
    } 
    
    
    ## Errors Per Second
    ##   Template: errors
    elsif ($params->{'type'} =~ /err/) {
	$rrd_template = 'errors';
	$label = 'Errors';
	$rrd_in = $rrd_base_int . $rrd_in_err;
	$rrd_out = $rrd_base_int . $rrd_out_err;
    } 

    ## Memroy usage for Device
    ##   Template: memory
    elsif ($params->{'type'} =~ /mem/) {
	$rrd_template = 'memory';
	$req_int = 0; # does not require interface
	$label = 'Memory';
	$rrd_in = $rrd_base . $rrd_mem;
    } 

    ## Memroy usage for Device
    ##   Template: memory
    elsif ($params->{'type'} =~ /cpu/) {
	$rrd_template = 'cpu';
	$req_int = 0; # does not require interface
	$label = 'CPU';
	$rrd_in = $rrd_base . $rrd_cpu;
    } 
    
}

## if counter is not 64bit, replace any ifHC with if
if (!$is_64bit) {
    $rrd_in =~ s/ifHC/if/gi;
    $rrd_out =~ s/ifHC/if/gi;
}

## Load the RRD template
@options = &LoadRRDtemplate($rrd_template,$rrd_in,$rrd_out);


## if interface parameter is requires -- exit
if (!$params->{'int'} && $req_int){    &exitcgi('missing  parameter int=');}

my $url_end = '&drange=129600&width=' . $width . '&start=' . $start .'&end='.$end;

### COMMENT data cannot have any non escaped colons..
my $comment =  "$start_date    through    $end_date";
my $rrd_title = "$label :: $int";
if ($int_desc) {    $rrd_title = "$label :: $int :: $int_desc";}
if (!$req_int){      $rrd_title = "$label";}

$comment =~ s/\\//g; ## remove escapes..
$comment =~ s/:/\\:/g; ## add them back in
$dev_title =~ s/\\//g; ## remove escapes..
$dev_title =~ s/:/\:/g; ## add them back in

my @def_options =(
		  "-t $rrd_title",
		  "COMMENT: $dev_title ". '\c',
		  "COMMENT: $comment ". '\c',
		  "COMMENT: ". '\c',
		  );


## append the default RRD options
@options = (@def_options,@options);    



my $diff = $end-$start;
my $xgrid;
if ($diff > 86400*15) {    $xgrid = '--x-grid=DAY:1:DAY:7:DAY:2:86400:%D ';}
if ($diff > 86400*20) {    $xgrid = '--x-grid=DAY:1:DAY:7:DAY:2:86400:%m-%d ';}
if ($diff > 86400*32) {    $xgrid = '';}
if ($xgrid) {    push(@options,$xgrid);}

## now build the zenoss URL from the RRD template
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


sub LoadRRDtemplate() {
    my ($file,$in,$out) = @_;

    open my $fh, '<', "../templates/$file" or &exitcgi("Could not open template '$file' = $!");
    my @o;
    while (my $line = <$fh>) {
	$line =~ s/{\$rrd_file_in}/$in/g;
	$line =~ s/{\$rrd_file_out}/$out/g;
	chomp $line;
	push (@o,$line);
    }
    close $fh;
    return @o;
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

