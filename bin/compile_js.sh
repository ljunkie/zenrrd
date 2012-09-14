#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BASE=$DIR'/../'
COMPILE=$BASE'js/core/compiler.jar'

zenrrd_js=$BASE'js/zenrrd.js'
zenrrd_min_js=$BASE'js/zenrrd.min.js'
zoom_js=$BASE'js/zenrrd_zoom.js'
zoom_min_js=$BASE'js/zenrrd_zoom.min.js'

echo -e "\nminimizing $zenrrd_js > $zenrrd_min_js"
java -jar $COMPILE --jscomp_off uselessCode --jscomp_off internetExplorerChecks --jscomp_off=externsValidation --compilation_level=SIMPLE_OPTIMIZATIONS  $zenrrd_js  > $zenrrd_min_js
echo  -e "\nminimizing $zoom_js > $zoom_min_js"
java -jar $COMPILE --jscomp_off uselessCode --jscomp_off internetExplorerChecks --jscomp_off=externsValidation --compilation_level=SIMPLE_OPTIMIZATIONS  $zoom_js  > $zoom_min_js

