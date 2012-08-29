###Custom graph front-end for ZENOSS - Cacti Like Graphs including date ranges and zoom

#### Initial Graph
##### Device: testrouter.title   Interface: TenGigabitEthernet1/4   Desc: Interface Description Test
![Graph RRD](https://raw.github.com/ljunkie/zenrrd/master/screenshots/zenrrd_graph1.png)

#### Date Time Picker
![Graph RRD](https://raw.github.com/ljunkie/zenrrd/master/screenshots/zenrrd_graph_datetimepicker.png)

#### Zoom a graph (like cacti)
![Graph RRD](https://raw.github.com/ljunkie/zenrrd/master/screenshots/zenrrd_graph_zoom1.png)

#### End Result of Zoom
![Graph RRD](https://raw.github.com/ljunkie/zenrrd/master/screenshots/zenrrd_graph_zoom2.png)


##Requirements:

 * ZENOSS 4.2+ (This will probably work with older versions)
 * Apache with CGI access (other flavors would work, just not tested)
 * This MUST run on the same box as the ZENOSS collector
 * sudo access as root (reason: step #3, bash wrapper runs sudo -i -h zenoss) 
 * PHP5 (older version will probably work)
 * Perl
  - Time::ParseDate
  - Compress::Zlib
  - MIME::Base64::URLSafe
  - CGI
  - LWP::UserAgent

##Installing: 

1) unpack files into a <webroot> of your choice (apache has been tested)
   * <webroot>/cgi-bin/.htaccess file is included to add cgi-support 
     (AllowOverride All is needed to be set in the apache conf)

2) copy <webroot>/zenrrd.config.dist to <webroot>/zenrrd.config
   
   ** You must set 3 variables in the file before continuing. More details are in the config
   -   renderserver_url=
   -   zenoss_perf_dir=
   -   zenoss_users=
   
3) execute <webroot>/bin/zenoss_rrd_int_csv.sh
   - you might needs to the change the first line in <webroot>/bin/get_interface_csv.py  (depending on your zenoss install dir)
   
     I.E. #!/opt/zenoss/bin/python  

   - verify it created the file "<webroot>/bin/interfaces.csv"
      INFO: All this does is execute a python script as the zenoss user (to access the zenoss device database)
            and creates the <webroot>/bin/interfaces.csv file.
  
   * debug: you can run '<webroot>/bin/zenoss_rrd_int_csv.sh debug'  to see the output

4) ADD to crontab: (once you have verified step 3 created a <webroot>/bin/interfaces.csv)
    - this will update your interface csv
    
    30 * * * * root <webroot>/bin/zenoss_rrd_int_csv.sh

5) [optional] To allow graph access without the need to login to zenoss first..
     - Visit: http://<your_zenoss_url>/zport/RenderServer/manage_access
     - Allow anonymouse to 'View' -- it's close to the bottom of the page

6) Go to your website (wherever you put your <webroot>)
     ...and explorer

 
