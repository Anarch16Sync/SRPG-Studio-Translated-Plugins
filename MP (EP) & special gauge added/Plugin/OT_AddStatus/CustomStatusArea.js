
/*--------------------------------------------------------------------------
  
Display items in the unit status column,
  This is a script that adjusts the number of rows and columns of items when leveling up.
  
  Deprecated due to official 1.048 support
  
  Author:
  o-to
  
  Change log:
  2016/01/06: New creation
  2016/01/11: Deprecated
  
--------------------------------------------------------------------------*/

(function() {
/*
OT_MinUnitItemCount = 5;

// Setting hidden items
OT_SetDisableStatus = function()
{
	var disableStatus = {};
	
	OT_isStatusInCheck(disableStatus, ParamType.MHP);
	OT_isStatusInCheck(disableStatus, ParamType.MEP );
	OT_isStatusInCheck(disableStatus, ParamType.MFP );

	return disableStatus;
};

// Make sure the parameter is defined and insert it into the hidden list
OT_isStatusInCheck = function(disableStatus, status)
{
	if( typeof status === 'undefined' )
	{
		return;
	}

	disableStatus[status] = true;
};
//Components of unit status display part
UnitMenuBottomWindow._createStatusEntry = function(unit) {
	var i;
	var count = ParamGroup.getParameterCount();
	var statusEntry = StructureBuilder.buildStatusEntry();
	var disableStatus = OT_SetDisableStatus();
	
	statusEntry.typeArray = [];
	statusEntry.paramArray = [];
	
	for (i = 0; i < count; i++) {
		// If there are excluded items, they will not be displayed in the status column of the unit menu.
		if( disableStatus[ParamGroup.getParameterType(i)] == true )
		{
			continue;
		}
		
		statusEntry.typeArray.push(ParamGroup.getParameterName(i));
		
		// Also add bonus
		statusEntry.paramArray.push(ParamGroup.getLastValue(unit, i));
	}
	
	return statusEntry;
};

// Adjust the arrangement when displaying on the status screen
UnitMenuBottomWindow._setStatusArea = function(unit) {
	var statusEntry = this._createStatusEntry(unit);
	
	// The third argument is the number of columns, and the fourth argument is the number of rows.
	this._statusScrollbar.setStatusFromParam(statusEntry.typeArray, statusEntry.paramArray, 2, 5);
};


// Number of item columns when leveling up
StatusScrollbar.getDefaultCol = function() {
	return 3;
};

// Number of item lines when leveling up
StatusScrollbar.getDefaultRow = function() {
	return 4;
};

// For ep display in item column
ItemRenderer.getItemHeight = function() {
	return 32;
};

//In the current official source, increasing the height of the item column
//The unit status field will be small, so we will process it here
DataConfig.getMinUnitItemCount = function()
{
	var max = DataConfig.getMaxUnitItemCount();
	
	if( max < OT_MinUnitItemCount )
	{
		return max;
	}
	
	return OT_MinUnitItemCount;
};

var alias1 = DefineControl.getVisibleUnitItemCount;
DefineControl.getVisibleUnitItemCount = function()
{
	var count = alias1.call(this);
	
	if( count < DataConfig.getMinUnitItemCount() )
	{
		count = DataConfig.getMinUnitItemCount();
	}
	
	return count;
};
*/
})();
