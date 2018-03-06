var gui = require('nw.gui');
var win = gui.Window.get();
$(document).ready(function (){
	// drag Window
	var $win = window;
	var $dragTitle = document.body;
	var dragging = false;
	var mouse_x, mouse_y;
	var win_x, win_y;
	$dragTitle.onmousedown = function (e) {
		e = e.originalEvent || e;
		var isDragTitle = $(e.target).closest('.header' ).length == 1;
		if (!isDragTitle) return;
		dragging = true
		mouse_x = e.screenX;
		mouse_y = e.screenY;
		win_x = win.x;
		win_y = win.y;
	};
	$win.onmousemove = function (e) {
		if (!dragging) return
		win.x = win_x + (e.screenX - mouse_x);
		win.y = win_y + (e.screenY - mouse_y);
	};
	$win.onmouseup = function () {
		dragging = false;
	};
	// minimize window
	$('#cpp_min').click(function () {
		win.minimize();
	});
	// close window
	$('#cpp_close').click(function () {
		win.close();
	});
	// refresh window
	$('#cpp_refresh').click(function () {
		win.reload();
	});
	// step buttons event
	$('#firstStepBtn').click(function () {
		$('#loadTypeContainer').attr('src', 'pages/' + $('#databaseType').val() + '_page.html?type=' + $('#option').val());
		$('#loadTypeContainer').removeClass('hd');
	//	$('#step2Btn').removeClass('hd');
		$('#firstStepContainer').addClass('hd');
	//	$('#' + $('#option').val() + 'Content').removeClass('hd');
		$('#firstStep').removeClass('on');
		$('#secondStep').addClass('on');
	});
});
