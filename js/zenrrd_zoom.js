$(document).ready(function(){
    var options = {
        onSelect:   zoomit,    
        onChange:   displayCoords,    
    };
    $('#graph').zoom_rrd(options);
});

function zoomit(e) {
    var params = parseQuery( window.location.search );
    var start = parseInt(params['start']);
    var end = parseInt(params['end']);
    
    /* this is just a quick and dirty way determine start/end epoch from x1,x2 coords */
    var diff = end-start;
    var width = $("#graph").width()-82; //the entire images is not a graph - ymmv (left is about 68px and right is about 15px)
    //console.log('width %s',width);
    var incr = diff/width; // each pixel is this many seconds..
    var graph_start = 66; // graph starts at 66th px
    var left = e.x-graph_start; // graph starts ~68px
    var right =e.x2-graph_start;
    if (left < 0) { left = 0;}
    //console.log('start %s, end %s', left, right);
    var newstart = parseInt((incr*left)+start); //incr 'px seconds' * X1 'left coord' + original start
    var newend = parseInt((incr*right)+start);  //incr 'px seconds' * X2 'right coord' + original start
    var now = parseInt((new Date).getTime()/1000);
    if (parseInt(newend) > parseInt(now)) { newend = now; }
    /* end dirty */
    
    /* debugging
    start_hum = new Date(1000*newstart);
    end_hum = new Date(1000*newend);
    console.log(start_hum.toLocaleString());
    console.log(end_hum.toLocaleString());
    */

    /* Build the new URL */
    var new_img_url = '?start=' + newstart + '&end=' + newend;
    /* attach any other parameters to new URL */
    $.each(params, function(key, value) { 
	if (key != 'start' && key != 'end' && key !='zo') { new_img_url += '&' + key + '=' + value; }
    });
    window.location = new_img_url;
};


function displayCoords(e){
    $('#x1').val(e.x);
    $('#y1').val(e.y);
    $('#x2').val(e.x2);
    $('#y2').val(e.y2);
    $('#w').val(e.w);
    $('#h').val(e.h);
};


(function ($) {
    /*
    * modified version of jCrop. RR 
    *
    */
    $.zoom_rrd = function (obj, opt) {
	var options = $.extend({}, $.zoom_rrd.defaults),
	docOffset, lastcurs, ie6mode = false;
	
	function px(n) {
	    return n + 'px';
	}
	function cssClass(cl) {
	    return options.baseClass + '-' + cl;
	}
	function supportsColorFade() {
	    return $.fx.step.hasOwnProperty('backgroundColor');
	}
	function getPos(obj) 
	{
	    var pos = $(obj).offset();
	    return [pos.left, pos.top];
	}
	function mouseAbs(e) 
	{
	    return [(e.pageX - docOffset[0]), (e.pageY - docOffset[1])];
	}
	function setOptions(opt) 
	{
	    if (typeof(opt) !== 'object') opt = {};
	    options = $.extend(options, opt);
	    
	    $.each(['onChange','onSelect','onRelease'],function(i,e) {
		if (typeof(options[e]) !== 'function') options[e] = function () {};
	    });
	}
	
	function presize($obj, w, h) 
	{
	    var nw = $obj.width(),
            nh = $obj.height();
	    if ((nw > w) && w > 0) {
		nw = w;
		nh = (w / $obj.width()) * $obj.height();
	    }
	    if ((nh > h) && h > 0) {
		nh = h;
		nw = (h / $obj.height()) * $obj.width();
	    }
	    xscale = $obj.width() / nw;
	    yscale = $obj.height() / nh;
	    $obj.width(nw).height(nh);
	}
	function unscale(c) 
	{
	    return {
		x: c.x * xscale,
		y: c.y * yscale,
		x2: c.x2 * xscale,
		y2: c.y2 * yscale,
		w: c.w * xscale,
		h: c.h * yscale
	    };
	}
	function doneSelect(pos) 
	{
	    var c = Coords.getFixed();
	    if ((c.w > options.minSelect[0]) && (c.h > options.minSelect[1])) {
		Selection.enableHandles();
		Selection.done();
	    } else {
		Selection.release();
	    }
	    Tracker.setCursor(options.allowSelect ? 'crosshair' : 'default');
	}

	function newSelection(e) 
	{
	    if (options.disabled) {
		return false;
	    }
	    if (!options.allowSelect) {
		return false;
	    }
	    btndown = true;
	    docOffset = getPos($img);
	    Selection.disableHandles();
	    Tracker.setCursor('crosshair');
	    var pos = mouseAbs(e);
	    Coords.setPressed(pos);
	    Selection.update();
	    Tracker.activateHandlers(selectDrag, doneSelect);
	    
	    e.stopPropagation();
	    e.preventDefault();
	    return false;
	}
	function selectDrag(pos)     {
	    Coords.setCurrent(pos);
	    Selection.update();
	}
	
	function newTracker()     {
	    var trk = $('<div></div>').addClass(cssClass('tracker'));
	    if ($.browser.msie) {
		trk.css({
		    opacity: 0,
		    backgroundColor: 'white'
		});
	    }
	    return trk;
	}
	if ($.browser.msie && ($.browser.version.split('.')[0] === '6')) {
	    ie6mode = true;
	}
	if (typeof(obj) !== 'object') {
	    obj = $(obj)[0];
	}
	if (typeof(opt) !== 'object') {
	    opt = {};
	}
	setOptions(opt);
	
	
	var img_css = {
	    border: 'none',
	    visibility: 'visible',
	    margin: 0,
	    padding: 0,
	    position: 'absolute',
	    top: 0,
	    left: 0
	};
	
	var $origimg = $(obj),
	img_mode = true;
	
	if (obj.tagName == 'IMG') {
	    // Fix size of crop image.
	    // Necessary when crop image is within a hidden element when page is loaded.
	    if ($origimg[0].width != 0 && $origimg[0].height != 0) {
		// Obtain dimensions from contained img element.
		$origimg.width($origimg[0].width);
		$origimg.height($origimg[0].height);
	    } else {
		// Obtain dimensions from temporary image in case the original is not loaded yet (e.g. IE 7.0). 
		var tempImage = new Image();
		tempImage.src = $origimg[0].src;
		$origimg.width(tempImage.width);
		$origimg.height(tempImage.height);
	    } 
	    
	    var $img = $origimg.clone().removeAttr('id').css(img_css).show();
	    
	    $img.width($origimg.width());
	    $img.height($origimg.height());
	    $origimg.after($img).hide();
	    
	} else {
	    $img = $origimg.css(img_css).show();
	    img_mode = false;
	    if (options.shade === null) { options.shade = true; }
	}
	
	presize($img, options.boxWidth, options.boxHeight);
	
	var boundx = $img.width(),
        boundy = $img.height(),
        
        
        $div = $('<div />').width(boundx).height(boundy).addClass(cssClass('holder')).css({
            position: 'relative',
            backgroundColor: options.bgColor
	}).insertAfter($origimg).append($img);
	
	if (options.addClass) {
	    $div.addClass(options.addClass);
	}
	
	var $img2 = $('<div />'),
	
        $img_holder = $('<div />') 
            .width('100%').height('100%').css({
		zIndex: 310,
		position: 'absolute',
		overflow: 'hidden'
            }),
	
        $hdl_holder = $('<div />') 
            .width('100%').height('100%').css('zIndex', 320), 
	
        $sel = $('<div />') 
            .css({
		position: 'absolute',
		zIndex: 600
            }).insertBefore($img).append($img_holder, $hdl_holder); 
	
	if (img_mode) {
	    $img2 = $('<img />').attr('src', $img.attr('src')).css(img_css).width(boundx).height(boundy),
	    $img_holder.append($img2);
	    
	}
	
	if (ie6mode) {
	    $sel.css({
		overflowY: 'hidden'
	    });
	}
	
	var graph_w= boundx-82;
	var graph_h=100; // maybe not right.. but height of actual graph seems to always be 100px
	
	//var $trk = newTracker().width(graph_w+5).height(graph_h+5).css({
	var $trk = newTracker().width(graph_w+5).height(boundy).css({
	    position: 'absolute',
	    top: '0px',
	    left: '65px',
	    zIndex: 290
	}).mousedown(newSelection);
	
	
	var bgcolor = options.bgColor,
        bgopacity = options.bgOpacity,
        xlimit, ylimit, xmin, ymin, xscale, yscale, enabled = true,
        btndown, animating, shift_down;
	
	docOffset = getPos($img);
	
	
	var Coords = (function () {
	    var x1 = 0,
            y1 = 0,
            x2 = 0,
            y2 = 0,
            ox, oy;
	    
	    function setPressed(pos) 
	    {
		pos = rebound(pos);
		x2 = x1 = pos[0];
		y2 = y1 = pos[1];
	    }

	    function setCurrent(pos) 
	    {
		pos = rebound(pos);
		ox = pos[0] - x2;
		oy = pos[1] - y2;
		x2 = pos[0];
		y2 = pos[1];
	    }

	    function getOffset() 
	    {
		return [ox, oy];
	    }

	    function moveOffset(offset) 
	    {
		var ox = offset[0],
		oy = offset[1];
		
		if (0 > x1 + ox) {
		    ox -= ox + x1;
		}
		if (0 > y1 + oy) {
		    oy -= oy + y1;
		}
		
		if (boundy < y2 + oy) {
		    oy += boundy - (y2 + oy);
		}
		if (boundx < x2 + ox) {
		    ox += boundx - (x2 + ox);
		}
		
		x1 += ox;
		x2 += ox;
		y1 += oy;
		y2 += oy;
	    }

	    function getCorner(ord) 
	    {
		var c = getFixed();
		switch (ord) {
		case 'ne':
		    return [c.x2, c.y];
		case 'nw':
		    return [c.x, c.y];
		case 'se':
		    return [c.x2, c.y2];
		case 'sw':
		    return [c.x, c.y2];
		}
	    }

	    function getFixed() 
	    {
		if (!options.aspectRatio) {
		    return getRect();
		}
		// This function could use some optimization I think...
		var aspect = options.aspectRatio,
		min_x = options.minSize[0] / xscale,
		
		
		max_x = options.maxSize[0] / xscale,
		max_y = options.maxSize[1] / yscale,
		rw = x2 - x1,
		rh = y2 - y1,
		rwa = Math.abs(rw),
		rha = Math.abs(rh),
		real_ratio = rwa / rha,
		xx, yy, w, h;
		
		if (max_x === 0) {
		    max_x = boundx * 10;
		}
		if (max_y === 0) {
		    max_y = boundy * 10;
		}
		if (real_ratio < aspect) {
		    yy = y2;
		    w = rha * aspect;
		    xx = rw < 0 ? x1 - w : w + x1;
		    
		    if (xx < 0) {
			xx = 0;
			h = Math.abs((xx - x1) / aspect);
			yy = rh < 0 ? y1 - h : h + y1;
		    } else if (xx > boundx) {
			xx = boundx;
			h = Math.abs((xx - x1) / aspect);
			yy = rh < 0 ? y1 - h : h + y1;
		    }
		} else {
		    xx = x2;
		    h = rwa / aspect;
		    yy = rh < 0 ? y1 - h : y1 + h;
		    if (yy < 0) {
			yy = 0;
			w = Math.abs((yy - y1) * aspect);
			xx = rw < 0 ? x1 - w : w + x1;
		    } else if (yy > boundy) {
			yy = boundy;
			w = Math.abs(yy - y1) * aspect;
			xx = rw < 0 ? x1 - w : w + x1;
		    }
		}
		
		// Magic %-)
		if (xx > x1) { // right side
		    if (xx - x1 < min_x) {
			xx = x1 + min_x;
		    } else if (xx - x1 > max_x) {
			xx = x1 + max_x;
		    }
		    if (yy > y1) {
			yy = y1 + (xx - x1) / aspect;
		    } else {
			yy = y1 - (xx - x1) / aspect;
		    }
		} else if (xx < x1) { // left side
		    if (x1 - xx < min_x) {
			xx = x1 - min_x;
		    } else if (x1 - xx > max_x) {
			xx = x1 - max_x;
		    }
		    if (yy > y1) {
			yy = y1 + (x1 - xx) / aspect;
		    } else {
			yy = y1 - (x1 - xx) / aspect;
		    }
		}
		
		if (xx < 0) {
		    x1 -= xx;
		    xx = 0;
		} else if (xx > boundx) {
		    x1 -= xx - boundx;
		    xx = boundx;
		}
		
		if (yy < 0) {
		    y1 -= yy;
		    yy = 0;
		} else if (yy > boundy) {
		    y1 -= yy - boundy;
		    yy = boundy;
		}
		
		return makeObj(flipCoords(x1, y1, xx, yy));
	    }

	    function rebound(p) 
	    {
		if (p[0] < 0) {
		    p[0] = 0;
		}
		if (p[1] < 0) {
		    p[1] = 0;
		}
		
		if (p[0] > boundx) {
		    p[0] = boundx;
		}
		if (p[1] > boundy) {
		    p[1] = boundy;
		}
		
		return [p[0], p[1]];
	    }

	    function flipCoords(x1, y1, x2, y2) 
	    {
		var xa = x1,
		xb = x2,
		ya = y1,
		yb = y2;
		if (x2 < x1) {
		    xa = x2;
		    xb = x1;
		}
		if (y2 < y1) {
		    ya = y2;
		    yb = y1;
		}
		return [xa, ya, xb, yb];
	    }

	    function getRect() 
	    {
		var xsize = x2 - x1,
		ysize = y2 - y1,
		delta;
		
		if (xlimit && (Math.abs(xsize) > xlimit)) {
		    x2 = (xsize > 0) ? (x1 + xlimit) : (x1 - xlimit);
		}
		if (ylimit && (Math.abs(ysize) > ylimit)) {
		    y2 = (ysize > 0) ? (y1 + ylimit) : (y1 - ylimit);
		}
		
		if (ymin / yscale && (Math.abs(ysize) < ymin / yscale)) {
		    y2 = (ysize > 0) ? (y1 + ymin / yscale) : (y1 - ymin / yscale);
		}
		if (xmin / xscale && (Math.abs(xsize) < xmin / xscale)) {
		    x2 = (xsize > 0) ? (x1 + xmin / xscale) : (x1 - xmin / xscale);
		}
		
		if (x1 < 0) {
		    x2 -= x1;
		    x1 -= x1;
		}
		if (y1 < 0) {
		    y2 -= y1;
		    y1 -= y1;
		}
		if (x2 < 0) {
		    x1 -= x2;
		    x2 -= x2;
		}
		if (y2 < 0) {
		    y1 -= y2;
		    y2 -= y2;
		}
		if (x2 > boundx) {
		    delta = x2 - boundx;
		    x1 -= delta;
		    x2 -= delta;
		}
		if (y2 > boundy) {
		    delta = y2 - boundy;
		    y1 -= delta;
		    y2 -= delta;
		}
		if (x1 > boundx) {
		    delta = x1 - boundy;
		    y2 -= delta;
		    y1 -= delta;
		}
		if (y1 > boundy) {
		    delta = y1 - boundy;
		    y2 -= delta;
		    y1 -= delta;
		}
		
		return makeObj(flipCoords(x1, y1, x2, y2));
	    }

	    function makeObj(a) 
	    {
		return {
		    x: a[0],
		    y: a[1],
		    x2: a[2],
		    y2: a[3],
		    w: a[2] - a[0],
		    h: a[3] - a[1]
		};
	    }
	    
	    return {
		flipCoords: flipCoords,
		setPressed: setPressed,
		setCurrent: setCurrent,
		getOffset: getOffset,
		moveOffset: moveOffset,
		getCorner: getCorner,
		getFixed: getFixed
	    };
	}());
	

	// Shade Module 
	var Shade = (function() {
	    var enabled = false,
            holder = $('<div />').css({
		position: 'absolute',
		zIndex: 240,
		opacity: 0
            }),
            shades = {
		top: createShade(),
		left: createShade().height(boundy),
		right: createShade().height(boundy),
		bottom: createShade()
            };
	    
	    function resizeShades(w,h) {
		shades.left.css({ height: px(h) });
		shades.right.css({ height: px(h) });
	    }
	    function updateAuto()
	    {
		return updateShade(Coords.getFixed());
	    }
	    function updateShade(c)
	    {
		shades.top.css({
		    left: px(c.x),
		    width: px(c.w),
		    height: px(c.y)
		});
		shades.bottom.css({
		    top: px(c.y2),
		    left: px(c.x),
		    width: px(c.w),
		    height: px(boundy-c.y2)
		});
		shades.right.css({
		    left: px(c.x2),
		    width: px(boundx-c.x2)
		});
		shades.left.css({
		    width: px(c.x)
		});
	    }
	    function createShade() {
		return $('<div />').css({
		    position: 'absolute',
		    backgroundColor: options.shadeColor||options.bgColor
		}).appendTo(holder);
	    }
	    function enableShade() {
		if (!enabled) {
		    enabled = true;
		    holder.insertBefore($img);
		    updateAuto();
		    Selection.setBgOpacity(1,0,1);
		    $img2.hide();
		    
		    setBgColor(options.shadeColor||options.bgColor,1);
		    if (Selection.isAwake())
		    {
			setOpacity(options.bgOpacity,1);
		    }
		    else setOpacity(1,1);
		}
	    }
	    function setBgColor(color,now) {
		colorChangeMacro(getShades(),color,now);
	    }
	    function disableShade() {
		if (enabled) {
		    holder.remove();
		    $img2.show();
		    enabled = false;
		    if (Selection.isAwake()) {
			Selection.setBgOpacity(options.bgOpacity,1,1);
		    } else {
			Selection.setBgOpacity(1,1,1);
			Selection.disableHandles();
		    }
		    colorChangeMacro($div,0,1);
		}
	    }
	    function setOpacity(opacity,now) {
		if (enabled) {
		    if (options.bgFade && !now) {
			holder.animate({
			    opacity: 1-opacity
			},{
			    queue: false,
			    duration: options.fadeTime
			});
		    }
		    else holder.css({opacity:1-opacity});
		}
	    }
	    function refreshAll() {
		options.shade ? enableShade() : disableShade();
		if (Selection.isAwake()) setOpacity(options.bgOpacity);
	    }
	    function getShades() {
		return holder.children();
	    }
	    
	    return {
		update: updateAuto,
		updateRaw: updateShade,
		getShades: getShades,
		setBgColor: setBgColor,
		enable: enableShade,
		disable: disableShade,
		resize: resizeShades,
		refresh: refreshAll,
		opacity: setOpacity
	    };
	}());

	// Selection Module 
	var Selection = (function () {
	    var awake,
            hdep = 370,
            borders = {},
            handle = {},
            seehandles = false;
	    
	    // Private Methods
	    function insertBorder(type) 
	    {
		var jq = $('<div />').css({
		    position: 'absolute',
		    opacity: options.borderOpacity
		}).addClass(cssClass(type));
		$img_holder.append(jq);
		return jq;
	    }


	    function insertHandle(ord) 
	    {
		var hs = options.handleSize;
	    }

	    function createBorders(li) 
	    {
		var cl,i;
		for (i = 0; i < li.length; i++) {
		    switch(li[i]){
		    case'n': cl='hline'; break;
		    case's': cl='hline bottom'; break;
		    case'e': cl='vline right'; break;
		    case'w': cl='vline'; break;
		    }
		    borders[li[i]] = insertBorder(cl);
		}
	    }

	    function createHandles(li) 
	    {
		var i;
		for (i = 0; i < li.length; i++) {
		    handle[li[i]] = insertHandle(li[i]);
		}
	    }

	    function moveto(x, y) 
	    {
		if (!options.shade) {
		    $img2.css({
			top: px(-y),
			left: px(-x)
		    });
		}
		$sel.css({
		    top: px(y),
		    left: px(x)
		});
	    }

	    function resize(w, h) 
	    {
		$sel.width(w).height(h);
	    }

	    function refresh() 
	    {
		var c = Coords.getFixed();
		
		Coords.setPressed([c.x, c.y]);
		Coords.setCurrent([c.x2, c.y2]);
		
		updateVisible();
	    }
	    
	    // Internal Methods
	    function updateVisible(select) 
	    {
		if (awake) {
		    return update(select);
		}
	    }

	    function update(select) 
	    {
		var c = Coords.getFixed();
		
		resize(c.w, c.h);
		moveto(c.x, c.y);
		if (options.shade) Shade.updateRaw(c);
		
		awake || show();
		
		if (select) {
		    options.onSelect.call(api, unscale(c));
		} else {
		    options.onChange.call(api, unscale(c));
		}
	    }

	    function setBgOpacity(opacity,force,now) 
	    {
		if (!awake && !force) return;
		if (options.bgFade && !now) {
		    $img.animate({
			opacity: opacity
		    },{
			queue: false,
			duration: options.fadeTime
		    });
		} else {
		    $img.css('opacity', opacity);
		}
	    }

	    function show() 
	    {
		$sel.show();
		
		if (options.shade) Shade.opacity(bgopacity);
		else setBgOpacity(bgopacity,true);
		
		awake = true;
	    }
	    
	    function release() 
	    {
		disableHandles();
            $sel.hide();
	    
            if (options.shade) Shade.opacity(1);
            else setBgOpacity(1);
	    
            awake = false;
            options.onRelease.call(api);
	}

	    function showHandles() 
	    {
		if (seehandles) {
		    $hdl_holder.show();
		}
	    }

	    function enableHandles() 
	    {
		seehandles = true;
		if (options.allowResize) {
		    $hdl_holder.show();
		    return true;
		}
	    }

	    function disableHandles() 
	    {
		seehandles = false;
		$hdl_holder.hide();
	    } 

	    function animMode(v) 
	    {
		if (animating === v) {
		    disableHandles();
		} else {
		    enableHandles();
		}
	    } 

	    function done() 
	    {
		animMode(false);
		refresh();
	    } 

	    // Insert draggable elements 
	    // Insert border divs for outline
	    
	    
	    if ($.isArray(options.createHandles))
		createHandles(options.createHandles);
	    
	    if (options.drawBorders && $.isArray(options.createBorders))
		createBorders(options.createBorders);
	    

	    
	    
	    disableHandles();
	    
	    return {
		updateVisible: updateVisible,
		update: update,
		release: release,
		refresh: refresh,
		isAwake: function () {
		    return awake;
		},
		
		enableHandles: enableHandles,
		enableOnly: function () {
		    seehandles = true;
		},
		showHandles: showHandles,
		disableHandles: disableHandles,
		animMode: animMode,
		setBgOpacity: setBgOpacity,
		done: done
	    };
	}());
	

	// Tracker Module 
	var Tracker = (function () {
	    var onMove = function () {},
            onDone = function () {},
            trackDoc = options.trackDocument;
	    
	    function toFront() 
	    {
		$trk.css({
		    zIndex: 450
		});
		
		if (trackDoc) {
		    $(document)
			.bind('mousemove.zoom_rrd',trackMove)
			.bind('mouseup.zoom_rrd',trackUp);
		}
	    } 

	    function toBack() 
	    {
		$trk.css({
		    zIndex: 290
		});
		$(document).unbind('.zoom_rrd');
	    } 

	    function trackMove(e) 
	    {
		onMove(mouseAbs(e));
		return false;
	    } 

	    function trackUp(e) 
	    {
		e.preventDefault();
		e.stopPropagation();
		
		if (btndown) {
		    btndown = false;
		    
		    onDone(mouseAbs(e));
		    
		    if (Selection.isAwake()) {
			options.onSelect.call(api, unscale(Coords.getFixed()));
		    }
		    
		    toBack();
		    onMove = function () {};
		    onDone = function () {};
		}
		
		return false;
	    }

	    function activateHandlers(move, done) 
	    {
		btndown = true;
		onMove = move;
		onDone = done;
		toFront();
		return false;
	    }

	    

	    function setCursor(t) 
	    {
		$trk.css('cursor', t);
	    }

	    
	    if (!trackDoc) {
		$trk.mousemove(trackMove).mouseup(trackUp).mouseout(trackUp);
	    }
	    
	    $img.before($trk);
	    return {
		activateHandlers: activateHandlers,
		setCursor: setCursor
	    };
	}());

	// KeyManager Module 
	var KeyManager = (function () {
	    var $keymgr = $('<input type="radio" />').css({
		position: 'fixed',
		left: '-120px',
		width: '12px'
	    }),
            $keywrap = $('<div />').css({
		position: 'absolute',
		overflow: 'hidden'
            }).append($keymgr);
	    
	    

	    function onBlur(e) 
	    {
		$keymgr.hide();
	    }

	    function doNudge(e, x, y) 
	    {
		e.preventDefault();
		e.stopPropagation();
	    }

	    
	    
	}());


	// API methods
	function setClass(cname) 
	{
	    $div.removeClass().addClass(cssClass('holder')).addClass(cname);
	}

	

	function setSelect(rect) 
	{
	    setSelectRaw([rect[0] / xscale, rect[1] / yscale, rect[2] / xscale, rect[3] / yscale]);
	    options.onSelect.call(api, unscale(Coords.getFixed()));
	    Selection.enableHandles();
	}

	function setSelectRaw(l) 
	{
	    Coords.setPressed([l[0], l[1]]);
	    Coords.setCurrent([l[2], l[3]]);
	    Selection.update();
	}

	function tellSelect() 
	{
	    return unscale(Coords.getFixed());
	}

	function tellScaled() 
	{
	    return Coords.getFixed();
	}

	function setOptionsNew(opt) 
	{
	    setOptions(opt);
	    interfaceUpdate();
	}

	function disableCrop() 
	{
	    options.disabled = true;
	    Selection.disableHandles();
	    Selection.setCursor('default');
	    Tracker.setCursor('default');
	}

	function enableCrop() 
	{
	    options.disabled = false;
	    interfaceUpdate();
	}

	function cancelCrop() 
	{
	    Selection.done();
	    Tracker.activateHandlers(null, null);
	}

	function destroy() 
	{
	    $div.remove();
	    $origimg.show();
	    $(obj).removeData('zoom_rrd');
	}

	function setImage(src, callback) 
	{
	    disableCrop();
	    var img = new Image();
	    img.onload = function () {
		var iw = img.width;
		var ih = img.height;
		var bw = options.boxWidth;
		var bh = options.boxHeight;
		$img.width(iw).height(ih);
		$img.attr('src', src);
		$img2.attr('src', src);
		presize($img, bw, bh);
		boundx = $img.width();
		boundy = $img.height();
		$img2.width(boundx).height(boundy);
		$trk.width(boundx + (bound * 2)).height(boundy + (bound * 2));
		$div.width(boundx).height(boundy);
		Shade.resize(boundx,boundy);
		enableCrop();
		
		if (typeof(callback) === 'function') {
		    callback.call(api);
		}
	    };
	    img.src = src;
	}

	function colorChangeMacro($obj,color,now) {
	    var mycolor = color || options.bgColor;
	    if (options.bgFade && supportsColorFade() && options.fadeTime && !now) {
		$obj.animate({
		    backgroundColor: mycolor
		}, {
		    queue: false,
		    duration: options.fadeTime
		});
	    } else {
		$obj.css('backgroundColor', mycolor);
	    }
	}
	function interfaceUpdate(alt) 
	// This method tweaks the interface based on options object.
	// Called when options are changed and at end of initialization.
	{
	    if (options.allowResize) {
		if (alt) {
		    Selection.enableOnly();
		} else {
		    Selection.enableHandles();
		}
	    } else {
		Selection.disableHandles();
	    }
	    
	    Tracker.setCursor(options.allowSelect ? 'crosshair' : 'default');
	    
	    
	    if (options.hasOwnProperty('trueSize')) {
		xscale = options.trueSize[0] / boundx;
		yscale = options.trueSize[1] / boundy;
	    }
	    
	    if (options.hasOwnProperty('setSelect')) {
		setSelect(options.setSelect);
		Selection.done();
		delete(options.setSelect);
	    }
	    
	    Shade.refresh();
	    
	    if (options.bgColor != bgcolor) {
		colorChangeMacro(
		    options.shade? Shade.getShades(): $div,
		    options.shade?
			(options.shadeColor || options.bgColor):
			options.bgColor
		);
		bgcolor = options.bgColor;
	    }
	    
	    if (bgopacity != options.bgOpacity) {
		bgopacity = options.bgOpacity;
		if (options.shade) Shade.refresh();
		else Selection.setBgOpacity(bgopacity);
	    }
	    
	    xlimit = options.maxSize[0] || 0;
	    ylimit = options.maxSize[1] || 0;
	    xmin = options.minSize[0] || 0;
	    ymin = options.minSize[1] || 0;
	    
	    if (options.hasOwnProperty('outerImage')) {
		$img.attr('src', options.outerImage);
		delete(options.outerImage);
	    }
	    
	    Selection.refresh();
	}


	
	
	$hdl_holder.hide();
	interfaceUpdate(true);
	
	var api = {
	    setImage: setImage,
	    setSelect: setSelect,
	    setOptions: setOptionsNew,
	    tellSelect: tellSelect,
	    tellScaled: tellScaled,
	    setClass: setClass,
	    
	    disable: disableCrop,
	    enable: enableCrop,
	    cancel: cancelCrop,
	    destroy: destroy,
	    
	    
	    getBounds: function () {
		return [boundx * xscale, boundy * yscale];
	    },
	    getWidgetSize: function () {
		return [boundx, boundy];
	    },
	    getScaleFactor: function () {
		return [xscale, yscale];
	    },
	    getOptions: function() {
		// careful: internal values are returned
		return options;
	    },
	    
	    ui: {
		holder: $div,
		selection: $sel
	    }
	};
	
	if ($.browser.msie)
	    $div.bind('selectstart', function () { return false; });
	
	$origimg.data('zoom_rrd', api);
	return api;
    };
    $.fn.zoom_rrd = function (options, callback) 
    {
	var api;
	// Iterate over each object, attach zoom_rrd
	this.each(function () {
	    // If we've already attached to this object
	    if ($(this).data('zoom_rrd')) {
		// The API can be requested this way (undocumented)
		if (options === 'api') return $(this).data('zoom_rrd');
		// Otherwise, we just reset the options...
		else $(this).data('zoom_rrd').setOptions(options);
	    }
	    // If we haven't been attached, preload and attach
	    else {
		if (this.tagName == 'IMG')
		    $.zoom_rrd.Loader(this,function(){
			$(this).css({display:'block',visibility:'hidden'});
			api = $.zoom_rrd(this, options);
			if ($.isFunction(callback)) callback.call(api);
		    });
		else {
		    $(this).css({display:'block',visibility:'hidden'});
		    api = $.zoom_rrd(this, options);
		    if ($.isFunction(callback)) callback.call(api);
		}
	    }
	});
	
	// Return "this" so the object is chainable (jQuery-style)
	return this;
    };

    
    $.zoom_rrd.Loader = function(imgobj,success,error){
	var $img = $(imgobj), img = $img[0];
	
	function completeCheck(){
	    if (img.complete) {
		$img.unbind('.jcloader');
		if ($.isFunction(success)) success.call(img);
	    }
	    else window.setTimeout(completeCheck,50);
	}
	
	$img
	    .bind('load.jcloader',completeCheck)
	    .bind('error.jcloader',function(e){
		$img.unbind('.jcloader');
		if ($.isFunction(error)) error.call(img);
	    });
	
	if (img.complete && $.isFunction(success)){
	    $img.unbind('.jcloader');
	    success.call(img);
	}
    };
    

    // Global Defaults 
    $.zoom_rrd.defaults = {
	
	// Basic Settings
	allowSelect: true,
	allowResize: true,
	trackDocument: true,
	
	// Styling Options
	baseClass: 'zoom_rrd',
	addClass: null,
	bgColor: 'black',
	bgOpacity: 0.6,
	bgFade: false,
	borderOpacity: 0.4,
	handleOpacity: 0.5,
	handleSize: 7,
	
	aspectRatio: 0,
	createHandles: ['n','s','e','w','nw','ne','se','sw'],
	createBorders: ['n','s','e','w'],
	drawBorders: true,
	fixedSupport: true,
	shade: null,
	boxWidth: 0,
	boxHeight: 0,
	fadeTime: 400,
	animationDelay: 20,
	swingSpeed: 3,
	minSelect: [0, 0],
	maxSize: [0, 0],
	minSize: [0, 0],
	
	onChange: function () {},
	onSelect: function () {},
    };
    
}(jQuery));
