

/*-----------------------------------------------------------------------------------------------
  
This is the display item setting and window drawing setting script for MP(EP) and FP.
    
  how to use:
  Set parameters for units and classes.
  (If you can specify a percentage, use '10%' in addition to the numerical value.
   You can specify the percentage by setting)

  Author:
  o-to
  
  Change log:
  2016/01/06: New creation

  2016/01/11：
  Fixed a bug where an error would occur when exchanging items with a unit whose inventory was not full.
  Fixed a bug where the motion would be incorrect during real-time battles if EP/FP was interrupted during the attack.
  Fixed drawing of EP and FP to avoid conflict with Mr. CB's class description script.

  2016/07/31：
  Added processing when you want to implement only EP or FP

  2016/09/18:
  Images are not cached when drawing windows or gauges,
  Fixed an issue where memory was rapidly accumulating while launching the app.

  2017/05/17:
Fixed an issue where EP and FP were not displayed in the simple window in Ver1.127 or later.
  Corrected the display when specifying negative EP and FP consumption.
  Fixed an issue where FP was not consumed when the EP was lower than the used EP during an attack.

  2017/05/18:
  Fixed FP consumption and FP recovery as EP.

--------------------------------------------------------------------------*/

(function() {
//Declaration of Ep gauge materials and notation names
OT_EPFrameSetting = {
	  Name          : 'EP'
	, Material      : 'OT_AddStatus'
	, GaugeImg      : 'Gauge.png'
	, GaugeImgID    : 1
	, GaugeImgX     : 8
	, GaugeImgY     : -38
	, GaugeImgWidth : 100
	, DrawSide      : true
	, FontColor     : 0x00ffff
	, UseString     : 'Consumption'
	, RecoveryString: 'Recovery'
	, TextX         : 0
	, TextY         : 0
};

// Declaration of Fp gauge material and notation name
OT_FPFrameSetting = {
	  Name          : 'FP'
	, Material      : 'OT_AddStatus'
	, GaugeImg      : 'Gauge.png'
	, GaugeImgID    : 2
	, GaugeImgX     : 8
	, GaugeImgY     : -24
	, GaugeImgWidth : 100
	, DrawSide      : true
	, FontColor     : 0xffa000
	, CheckString   : 'Can be used in'
	, UseString     : 'Consumption'
	, RecoveryString: 'Recovery'
	, TextX         : 0
	, TextY         : 0
};

// Frame material declaration
OT_EnergyFrameSetting = {
	  Material      : 'OT_AddStatus'
	, WindowImg     : 'window.png'
	, WindowWidth   : 300
	, WindowHeight  : 32
};

//Declaration of frame material in the map
OT_SimpleFrameSetting = {
	  Material        : 'OT_AddStatus'
	, WindowImg       : 'window2.png'
	, WindowHeight    : 24
	, GaugeImg        : 'Gauge2.png'
	, GaugeImgX       : 54
	, GaugeImgY       : 5
	, GaugeImgWidth   : 60
	, GaugeImgEpID    : 1
	, GaugeImgFpID    : 2
};

//data for cache
var OT_Image_AddStatusUnitMenuWindow = null;
var OT_Image_AddStatusUnitMenuEP     = null;
var OT_Image_AddStatusUnitMenuFP     = null;
var OT_Image_AddStatusSimpleWindow   = null;
var OT_Image_AddStatusSimpleGauge    = null;

//Retain image data at the start of the game
var aliasSetup = SetupControl.setup
SetupControl.setup = function()
{
	aliasSetup.call(this);
	if(OT_Image_AddStatusUnitMenuWindow == null) OT_Image_AddStatusUnitMenuWindow = root.getMaterialManager().createImage(OT_EnergyFrameSetting.Material, OT_EnergyFrameSetting.WindowImg);
	if(OT_Image_AddStatusSimpleWindow == null)   OT_Image_AddStatusSimpleWindow   = root.getMaterialManager().createImage(OT_SimpleFrameSetting.Material, OT_SimpleFrameSetting.WindowImg);
	if(OT_Image_AddStatusSimpleGauge == null)    OT_Image_AddStatusSimpleGauge    = root.getMaterialManager().createImage(OT_SimpleFrameSetting.Material, OT_SimpleFrameSetting.GaugeImg);
	if(OT_Image_AddStatusUnitMenuEP == null)     OT_Image_AddStatusUnitMenuEP     = root.getMaterialManager().createImage(OT_EPFrameSetting.Material, OT_EPFrameSetting.GaugeImg);
	if(OT_Image_AddStatusUnitMenuFP == null)     OT_Image_AddStatusUnitMenuFP     = root.getMaterialManager().createImage(OT_FPFrameSetting.Material, OT_FPFrameSetting.GaugeImg);
};

var _ep = 0;
var _fp = 0;
var _mep = 0;
var _mfp = 0;
var _recoveryEP = 0;
var _recoveryFP = 0;

var _simpleEp = 0;
var _simpleFp = 0;
var _simpleMep = 0;
var _simpleMfp = 0;

var aliasSimpleUnitInfo = MapParts.UnitInfo.setUnit;
MapParts.UnitInfo.setUnit = function(unit) {
	aliasSimpleUnitInfo.call(this, unit);
	if(unit) {
		if(typeof UnitParameter.MEP !== 'undefined') {
			_simpleEp = OT_GetNowEP(unit);
			_simpleMep = ParamBonus.getEp(unit);
		}
		if(typeof UnitParameter.MFP !== 'undefined') {
			_simpleFp = OT_GetNowFP(unit);
			_simpleMfp = ParamBonus.getFp(unit);
		}
	}
}

var aliasUnitMenuTarget = UnitMenuTopWindow.changeUnitMenuTarget;
UnitMenuTopWindow.changeUnitMenuTarget = function(unit) {
	aliasUnitMenuTarget.call(this, unit);
	if(typeof UnitParameter.MEP !== 'undefined') {
		_ep = OT_GetNowEP(unit);
		_mep = ParamBonus.getEp(unit);
		_recoveryEP = OT_GetEPRecoveryAll(unit);
	}
	if(typeof UnitParameter.MFP !== 'undefined') {
		_fp = OT_GetNowFP(unit);
		_mfp = ParamBonus.getFp(unit);
		_recoveryFP = OT_GetFPRecoveryAll(unit);
	}
};

//Create a window for EP/FP
var alias900 = UnitMenuTopWindow.drawWindow;
UnitMenuTopWindow.drawWindow = function(x, y)
{
	var width = OT_EnergyFrameSetting.WindowWidth;
	var height = OT_EnergyFrameSetting.WindowHeight;
	
	WindowRenderer.drawStretchWindow(x, y - height, width, height + 2, OT_Image_AddStatusUnitMenuWindow);

	alias900.call(this, x, y);
};

//Display EP and FP in mini window when hovering over unit
var alias901 = UnitSimpleRenderer.drawContentEx;
UnitSimpleRenderer.drawContentEx = function(x, y, unit, textui, mhp)
{
	alias901.call(this, x, y, unit, textui, mhp);

	var width = MapParts.UnitInfo._getWindowWidth();
	var height = OT_SimpleFrameSetting.WindowHeight;
	
	var d = root.getGameAreaHeight() / 2;

	x -= DefineControl.getFaceXPadding();
	y -= DefineControl.getFaceYPadding();
	if(d < y)
	{
		y -= height;
	}
	else
	{
		y += MapParts.UnitInfo._getWindowHeight();
	}
	WindowRenderer.drawStretchWindow(x, y, width, height, OT_Image_AddStatusSimpleWindow);
	
	x += 4;
	if(typeof UnitParameter.MEP !== 'undefined')
	{
		ContentRenderer.drawUnitEpZoneSimple(x, y, unit, OT_Image_AddStatusSimpleGauge);
		x += MapParts.UnitInfo._getWindowWidth() / 2;
	}
	if(typeof UnitParameter.MFP !== 'undefined')
	{
		ContentRenderer.drawUnitFpZoneSimple(x, y, unit, OT_Image_AddStatusSimpleGauge);
	}
};

//EP gauge depiction (simple version)
ContentRenderer.drawUnitEpZoneSimple = function(x, y, unit, pic) {
	var ep = _simpleEp;
	var mep = _simpleMep;

	this.drawEpSimple(x, y, ep, mep);
	x += OT_SimpleFrameSetting.GaugeImgX;
	y += OT_SimpleFrameSetting.GaugeImgY;
	this.drawGauge(x, y, ep, mep, OT_SimpleFrameSetting.GaugeImgEpID, OT_SimpleFrameSetting.GaugeImgWidth, pic);
};

//EP numerical depiction (simple version)
ContentRenderer.drawEpSimple = function(x, y, ep, maxEp) {
	var textEp = UnitParameter.MEP.getParameterName();
	var dx = [0, 44];
	
	TextRenderer.drawSignText(x + dx[0], y, textEp);
	NumberRenderer.drawNumber(x + dx[1], y, ep);
};

//FP gauge depiction (simple version)
ContentRenderer.drawUnitFpZoneSimple = function(x, y, unit, pic) {
	var fp = _simpleFp;
	var mfp = _simpleMfp;
	
	this.drawFpSimple(x, y, fp, mfp);
	x += OT_SimpleFrameSetting.GaugeImgX;
	y += OT_SimpleFrameSetting.GaugeImgY;
	this.drawGauge(x, y, fp, mfp, OT_SimpleFrameSetting.GaugeImgFpID, OT_SimpleFrameSetting.GaugeImgWidth, pic);
};

//FP numerical depiction (simple version)
ContentRenderer.drawFpSimple = function(x, y, fp, maxFp) {
	var textFp = UnitParameter.MFP.getParameterName();
	var dx = [0, 44];

	TextRenderer.drawSignText(x + dx[0], y+1, textFp);
	NumberRenderer.drawNumber(x + dx[1], y, fp);
};

//Display ep in menu
var alias2 = UnitMenuTopWindow.drawWindowContent;
UnitMenuTopWindow.drawWindowContent = function(x, y) {
	alias2.call(this, x, y);
	
	if(typeof UnitParameter.MEP !== 'undefined') {
		this._drawUnitEp(x, y);
	}
};

//EP description
UnitMenuTopWindow._drawUnitEp = function(xBase, yBase) {
	var x = xBase + OT_EPFrameSetting.GaugeImgX;
	var y = yBase + OT_EPFrameSetting.GaugeImgY;
	
	ContentRenderer.drawUnitEpZone(x, y, this._unit, OT_Image_AddStatusUnitMenuEP);
};

//Gauge description
ContentRenderer.drawUnitEpZone = function(x, y, unit, pic) {
	var ep = _ep;
	var mep = _mep;
	var rep = _recoveryEP;
	var x2,y2;
	
	if( !OT_FPFrameSetting.DrawSide )
	{
		x2 = x;
		y2 = y + 20;
	}
	else
	{
		x  = x;
		y  = y;
		x2 = x + 160;
		y2 = y + 6;
	}
	
	this.drawEp(x, y, ep, mep, rep);
	this.drawGauge(x2, y2, ep, mep, OT_EPFrameSetting.GaugeImgID, OT_EPFrameSetting.GaugeImgWidth, pic);
};

//Numerical depiction
ContentRenderer.drawEp = function(x, y, ep, maxEp, RecoveryEp) {
	var textEp = UnitParameter.MEP.getParameterName();
	var textSlash = '/';
	var textRecovery = '(' + RecoveryEp + ')';
	var dx = [0, 44, 60, 98, 106];
	var textui = InfoWindow.getWindowTextUI();
	var color = textui.getColor();
	var font = textui.getFont();
	
	TextRenderer.drawSignText(x + dx[0], y, textEp);
	NumberRenderer.drawNumber(x + dx[1], y, ep);
	TextRenderer.drawSignText(x + dx[2], y, textSlash);
	NumberRenderer.drawNumber(x + dx[3], y, maxEp);
	TextRenderer.drawKeywordText(x + dx[4], y+1, textRecovery, -1, OT_EPFrameSetting.FontColor, font);
};

//Display consumed EP under item name
var alias3 = ItemListScrollbar.drawScrollContent;
ItemListScrollbar.drawScrollContent = function(x, y, object, isSelect, index)
{
	alias3.call(this, x, y, object, isSelect, index);

	if(typeof UnitParameter.MEP !== 'undefined')
	{
		var color = OT_EPFrameSetting.FontColor;
		var color2 = 0x000000;
		var textui = this.getParentTextUI();
		var font = textui.getFont();
		var iconWidth = GraphicsFormat.ICON_WIDTH + 5;
		var height = 13;
		var numEP = OT_GetStringUseEP(object);
		var text = '';
		if(numEP != 0)
		{
			var regex = /^(\-?)([0-9]+\%?)$/;
			if(numEP.match(regex))
			{
				var mainasu = RegExp.$1;
				var val = RegExp.$2;
				if( mainasu == '-' )
				{
					text = OT_EPFrameSetting.Name + val + OT_EPFrameSetting.RecoveryString;
				}
				else
				{
					text = OT_EPFrameSetting.Name + val + OT_EPFrameSetting.UseString;
				}
			}
			
			x += OT_EPFrameSetting.TextX;
			y += OT_EPFrameSetting.TextY;
			TextRenderer.drawKeywordText(x + iconWidth + 1, y + height +1, text, -1, color2, font);
			TextRenderer.drawKeywordText(x + iconWidth, y + height, text, -1, color, font);
		}
	}
};

//Display fp in menu
var alias4 = UnitMenuTopWindow.drawWindowContent;
UnitMenuTopWindow.drawWindowContent = function(x, y) {
	alias4.call(this, x, y);
	
	if(typeof UnitParameter.MFP !== 'undefined') {
		this._drawUnitFp(x, y);
	}
};

//FP description
UnitMenuTopWindow._drawUnitFp = function(xBase, yBase) {
	var x = xBase + OT_FPFrameSetting.GaugeImgX;
	var y = yBase + OT_FPFrameSetting.GaugeImgY;
	
	ContentRenderer.drawUnitFpZone(x, y, this._unit, OT_Image_AddStatusUnitMenuFP);
};

//Gauge description
ContentRenderer.drawUnitFpZone = function(x, y, unit, pic) {
	var fp = _fp;
	var mfp = _mfp;
	var rfp = _recoveryEP;
	var x2,y2;
	
	if( !OT_FPFrameSetting.DrawSide )
	{
		x2 = x;
		y2 = y + 20;
	}
	else
	{
		x  = x;
		y  = y;
		x2 = x + 160;
		y2 = y + 6;
	}
	
	this.drawFp(x, y, fp, mfp, rfp);
	this.drawGauge(x2, y2, fp, mfp, OT_FPFrameSetting.GaugeImgID, OT_FPFrameSetting.GaugeImgWidth, pic);
};

//Numerical depiction
ContentRenderer.drawFp = function(x, y, fp, maxFp, RecoveryFp) {
	var textFp = UnitParameter.MFP.getParameterName();
	var textSlash = '/';
	var textRecovery = '(' + RecoveryFp + ')';
	var dx = [0, 44, 60, 98, 106];
	var textui = InfoWindow.getWindowTextUI();
	var color = textui.getColor();
	var font = textui.getFont();

	TextRenderer.drawSignText(x + dx[0], y+1, textFp);
	NumberRenderer.drawNumber(x + dx[1], y, fp);
	TextRenderer.drawSignText(x + dx[2], y, textSlash);
	NumberRenderer.drawNumber(x + dx[3], y, maxFp);
	TextRenderer.drawKeywordText(x + dx[4], y+1, textRecovery, -1, OT_FPFrameSetting.FontColor, font);
};

//Display consumed FP under item name
var alias5 = ItemListScrollbar.drawScrollContent;
ItemListScrollbar.drawScrollContent = function(x, y, object, isSelect, index)
{
	alias5.call(this, x, y, object, isSelect, index);
	if(typeof UnitParameter.MFP !== 'undefined')
	{
		var color = OT_FPFrameSetting.FontColor;
		var color2 = 0x000000;
		var textui = this.getParentTextUI();
		var font = textui.getFont();
		var iconWidth = GraphicsFormat.ICON_WIDTH + 5;
		var height = 13;
		var numEP = 0;
		var numFP = OT_GetStringUseFP(object);
		var text = '';
		
		if(typeof OT_GetStringUseEP !== 'undefined') numEP = OT_GetStringUseEP(object);
	
		//If EP exists, shift it to the right
		if(numEP != 0)
		{
			iconWidth += 75;
		}
	
		if(numFP != 0)
		{
			var regex = /^(\-?)([0-9]+\%?)$/;
			if(numFP.match(regex))
			{
				var mainasu = RegExp.$1;
				var val = RegExp.$2;
				if( mainasu == '-' )
				{
					//If it is only FP check, it will not be displayed even if you specify a minus value
					if( OT_GetCheckOnlyFP(object) )
					{
						text = ''
					}
					else
					{
						text = OT_FPFrameSetting.Name + val + OT_FPFrameSetting.RecoveryString;
					}
				}
				else
				{
					if( OT_GetCheckOnlyFP(object) )
					{
						text = OT_FPFrameSetting.Name + val + OT_FPFrameSetting.CheckString;
					}
					else
					{
						text = OT_FPFrameSetting.Name + val + OT_FPFrameSetting.UseString;
					}
				}
			}
		
			x += OT_FPFrameSetting.TextX;
			y += OT_FPFrameSetting.TextY;
			TextRenderer.drawKeywordText(x + iconWidth + 1, y + height +1, text, -1, color2, font);
			TextRenderer.drawKeywordText(x + iconWidth, y + height, text, -1, color, font);
		}
	}
};

var ailas6 = UnitStatusScrollbar._isParameterDisplayable;
UnitStatusScrollbar._isParameterDisplayable = function(index)
{
	// Remove ep from display in unit menu
	if (ParamGroup.getParameterType(index) === ParamType.MEP) {
		return false;
	}

	// Remove fp from display in unit menu
	if (ParamGroup.getParameterType(index) === ParamType.MFP) {
		return false;
	}

	return ailas6.call(this, index);
};

})();
