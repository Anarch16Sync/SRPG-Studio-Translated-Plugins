
/*--------------------------------------------------------------------------
  
  Changing the maximum value and current value of EP and FP, changing the amount of EP and FP recovered each turn,
  Add events to get the maximum and current values ​​of EP and FP.
    
  how to use:
  ■EP maximum value change
    Check "Run code" in "Run script" of the event command and write the code.
    
    OT_CommandChangeMaxEP(0);
    
    Write it like this.
    Specify the unit in "Unit" on the "Original data" tab,
    Set the value to be used for addition and subtraction in "Number 1".
    The behavior depending on the value passed to the argument in the code is as follows.
    
    0: Addition
    1: Subtraction
    2: Multiplication
    3: Division
    4: Surplus
    5: Assignment
    
    If used in a base or battle preparation, the current EP will be adjusted to the maximum value.

   ■Maximum FP value change
    Check "Run code" in "Run script" of the event command and write the code.
    
    OT_CommandChangeMaxFP(0);
    
    Write it like this.
    
    Other settings are the same as changing the EP maximum value.
    Unlike EP, it will not change even if you use it for bases or battle preparations unless the current FP exceeds the maximum value.

  ■EP current value change
    Check "Run code" in "Run script" of the event command and write the code.
    
    OT_CommandChengeEP(0);
    
    Write it like this.
    
    Other settings are the same as changing the EP maximum value.

  ■FP current value change
    Check "Run code" in "Run script" of the event command and write the code.
    
    OT_CommandChengeFP(0);
    
    Write it like this.
    
    Other settings are the same as changing the EP maximum value.

  ■Change the amount of EP recovery per turn
    Check "Run code" in "Run script" of the event command and write the code.
    
    OT_CommandChengeRecoveryEP(0);
    
    Write it like this.
    
    Other settings are the same as changing the EP maximum value.
    *If the recovery amount set for the unit is specified as a percentage,
      It will be a percentage change. (If Recovery:'10%' is specified as an additional value of 5, it will be changed to Recovery:'15%')

  ■Change in FP recovery amount per turn
    Check "Run code" in "Run script" of the event command and write the code.
    
    OT_CommandChengeRecoveryFP(0);
    
    Write it like this.
    Other settings are the same as changing the amount of ep recovery per turn.

  ■Get current EP value
    Check “Run code” in “Event command “Screen” script execution” and write the code.
    
    OT_CommandGetEP();
    
    Write it like this.
    
    Specify the unit in "Unit" on the "Original data" tab,
    Check "Receive the return value as a variable" on the "Script" tab and specify the variable where it will be stored.

  ■Get current FP value
    Check "Run code" in "Run script" of the event command and write the code.
    
    OT_CommandGetFP();
    
    Write it like this.
    
    Specify the unit in "Unit" on the "Original data" tab,
    Check "Receive the return value as a variable" on the "Script" tab and specify the variable where it will be stored.

  ■Get maximum EP value
    Check "Run code" in "Run script" of the event command and write the code.
    
    OT_CommandGetMaxEP(0);
    
    Write it like this.
    
    Specify the unit in "Unit" on the "Original data" tab,
    Check "Receive the return value as a variable" on the "Script" tab and specify the variable where it will be stored.

    The behavior depending on the value passed to the argument in the code is as follows.
    0: Get the maximum value set for the unit (value before item and class correction)
    1: Get the maximum value including corrections by item and class

 ■Get maximum FP value
    Check "Run code" in "Run script" of the event command and write the code.
    
    OT_CommandGetMaxFP(0);
    
    Write it like this.
    
    Specify the unit in "Unit" on the "Original data" tab,
    Check "Receive the return value as a variable" on the "Script" tab and specify the variable where it will be stored.
    
    The behavior depending on the value passed to the argument in the code is as follows.
    0: Get the maximum value set for the unit (value before item and class correction)
    1: Get the maximum value including corrections by item and class
    
  Author:
  o-to

  2019/06/16：
  Create New
  In the event command "Run Script"
  Changing the maximum value and current value of EP and FP, changing the amount of EP and FP recovered each turn,
  Added a method to get the maximum value and current value of EP and FP
  
--------------------------------------------------------------------------*/

EPFP_DefineValue = {
	  ADD   : 0
	, SUB   : 1
	, MUL   : 2
	, DIV   : 3
	, MOD   : 4
	, EXC   : 5
};

// Change the maximum value of Ep
function OT_CommandChengeMaxEP(type) {
	var i, item, count;
	var content = root.getEventCommandObject().getOriginalContent();
	var unit = content.getUnit();
	var weapon = content.getItem();
	var value = content.getValue(0);
	
	if (unit === null) {
		return;
	}
	
	var nowValue = UnitParameter.MEP.getUnitValue(unit);
	switch(type) {
		case EPFP_DefineValue.ADD:
			nowValue += value;
			break;
			
		case EPFP_DefineValue.SUB:
			nowValue -= value;
			break;
			
		case EPFP_DefineValue.MUL:
			nowValue *= value;
			break;
			
		case EPFP_DefineValue.DIV:
			nowValue /= value;
			break;
			
		case EPFP_DefineValue.MOD:
			nowValue %= value;
			break;
			
		case EPFP_DefineValue.EXC:
			nowValue = value;
			break;
	}
	nowValue = Math.floor(nowValue);
	var scene = root.getBaseScene();
	UnitParameter.MEP.setUnitValue(unit, nowValue);
	
	// If the event is on the battle preparation screen or before the stage starts, fully recover.
	var setEP = OT_GetNowEP(unit);
	if (Miscellaneous.isPrepareScene() && DataConfig.isBattleSetupRecoverable()) {
		setEP = ParamBonus.getEp(unit);
	}

	// Reset current ep to match maximum ep
	OT_SetNowEP(unit, setEP);
}

// Change the maximum value of Fp
function OT_CommandChengeMaxFP(type) {
	var i, item, count;
	var content = root.getEventCommandObject().getOriginalContent();
	var unit = content.getUnit();
	var weapon = content.getItem();
	var value = content.getValue(0);
	
	if (unit === null) {
		return;
	}
	
	var nowValue = UnitParameter.MFP.getUnitValue(unit);
	switch(type) {
		case EPFP_DefineValue.ADD:
			nowValue += value;
			break;
			
		case EPFP_DefineValue.SUB:
			nowValue -= value;
			break;
			
		case EPFP_DefineValue.MUL:
			nowValue *= value;
			break;
			
		case EPFP_DefineValue.DIV:
			nowValue /= value;
			break;
			
		case EPFP_DefineValue.MOD:
			nowValue %= value;
			break;
			
		case EPFP_DefineValue.EXC:
			nowValue = value;
			break;
	}
	nowValue = Math.floor(nowValue);
	UnitParameter.MFP.setUnitValue(unit, nowValue);
	
	// Reset current fp to match maximum fp
	OT_SetNowFP(unit, OT_GetNowFP(unit));
}

// Change the current value of Ep
function OT_CommandChengeEP(type) {
	var i, item, count;
	var content = root.getEventCommandObject().getOriginalContent();
	var unit = content.getUnit();
	var weapon = content.getItem();
	var value = content.getValue(0);
	
	if (unit === null) {
		return;
	}
	
	var nowValue = OT_GetNowEP(unit);
	switch(type) {
		case EPFP_DefineValue.ADD:
			nowValue += value;
			break;
			
		case EPFP_DefineValue.SUB:
			nowValue -= value;
			break;
			
		case EPFP_DefineValue.MUL:
			nowValue *= value;
			break;
			
		case EPFP_DefineValue.DIV:
			nowValue /= value;
			break;
			
		case EPFP_DefineValue.MOD:
			nowValue %= value;
			break;
			
		case EPFP_DefineValue.EXC:
			nowValue = value;
			break;
	}
	nowValue = Math.floor(nowValue);
	OT_SetNowEP(unit, nowValue);
}

// Change the current value of Fp
function OT_CommandChengeFP(type) {
	var i, item, count;
	var content = root.getEventCommandObject().getOriginalContent();
	var unit = content.getUnit();
	var weapon = content.getItem();
	var value = content.getValue(0);
	
	if (unit === null) {
		return;
	}
	
	var nowValue = OT_GetNowFP(unit);
	switch(type) {
		case EPFP_DefineValue.ADD:
			nowValue += value;
			break;
			
		case EPFP_DefineValue.SUB:
			nowValue -= value;
			break;
			
		case EPFP_DefineValue.MUL:
			nowValue *= value;
			break;
			
		case EPFP_DefineValue.DIV:
			nowValue /= value;
			break;
			
		case EPFP_DefineValue.MOD:
			nowValue %= value;
			break;
			
		case EPFP_DefineValue.EXC:
			nowValue = value;
			break;
	}
	nowValue = Math.floor(nowValue);
	OT_SetNowFP(unit, nowValue);
}

// Change the amount of Ep recovered
function OT_CommandChengeRecoveryEP(type) {
	var i, item, count;
	var content = root.getEventCommandObject().getOriginalContent();
	var unit = content.getUnit();
	var weapon = content.getItem();
	var value = content.getValue(0);
	
	if (unit === null) {
		return;
	}
	
	var nowRecovery = UnitParameter.MEP.getUnitRecoveryValue(unit);
	if (typeof nowRecovery === 'number') {
		switch(type) {
			case EPFP_DefineValue.ADD:
				nowRecovery += value;
				break;
				
			case EPFP_DefineValue.SUB:
				nowRecovery -= value;
				break;
				
			case EPFP_DefineValue.MUL:
				nowRecovery *= value;
				break;
				
			case EPFP_DefineValue.DIV:
				nowRecovery /= value;
				break;
				
			case EPFP_DefineValue.MOD:
				nowRecovery %= value;
				break;
				
			case EPFP_DefineValue.EXC:
				nowRecovery = value;
				break;
		}
		nowRecovery = Math.floor(nowRecovery);
	} else if(typeof nowRecovery == 'string') {
		var regex = /^([\-]*[0-9]+)\%$/;
		var percent = 0;
		if(nowRecovery.match(regex)) {
			percent = parseInt(RegExp.$1);
		} else {
			return;
		}
		
		switch(type) {
			case EPFP_DefineValue.ADD:
				percent += value;
				break;
				
			case EPFP_DefineValue.SUB:
				percent -= value;
				break;
				
			case EPFP_DefineValue.MUL:
				percent *= value;
				break;
				
			case EPFP_DefineValue.DIV:
				percent /= value;
				break;
				
			case EPFP_DefineValue.MOD:
				percent %= value;
				break;
				
			case EPFP_DefineValue.EXC:
				percent = value;
				break;
		}
		percent = Math.floor(percent);
		nowRecovery = percent + '%';
	}
	
	UnitParameter.MEP.setUnitRecoveryValue(unit, nowRecovery);
}

// Change the amount of Fp recovered
function OT_CommandChengeRecoveryFP(type) {
	var i, item, count;
	var content = root.getEventCommandObject().getOriginalContent();
	var unit = content.getUnit();
	var weapon = content.getItem();
	var value = content.getValue(0);
	
	if (unit === null) {
		return;
	}
	
	var nowRecovery = UnitParameter.MFP.getUnitRecoveryValue(unit);
	if (typeof nowRecovery === 'number') {
		switch(type) {
			case EPFP_DefineValue.ADD:
				nowRecovery += value;
				break;
				
			case EPFP_DefineValue.SUB:
				nowRecovery -= value;
				break;
				
			case EPFP_DefineValue.MUL:
				nowRecovery *= value;
				break;
				
			case EPFP_DefineValue.DIV:
				nowRecovery /= value;
				break;
				
			case EPFP_DefineValue.MOD:
				nowRecovery %= value;
				break;
				
			case EPFP_DefineValue.EXC:
				nowRecovery = value;
				break;
		}
		nowRecovery = Math.floor(nowRecovery);
	} else if(typeof nowRecovery == 'string') {
		var regex = /^([\-]*[0-9]+)\%$/;
		var percent = 0;
		if(nowRecovery.match(regex)) {
			percent = parseInt(RegExp.$1);
		} else {
			return;
		}
		
		switch(type) {
			case EPFP_DefineValue.ADD:
				percent += value;
				break;
				
			case EPFP_DefineValue.SUB:
				percent -= value;
				break;
				
			case EPFP_DefineValue.MUL:
				percent *= value;
				break;
				
			case EPFP_DefineValue.DIV:
				percent /= value;
				break;
				
			case EPFP_DefineValue.MOD:
				percent %= value;
				break;
				
			case EPFP_DefineValue.EXC:
				percent = value;
				break;
		}
		percent = Math.floor(percent);
		nowRecovery = percent + '%';
	}
	UnitParameter.MFP.setUnitRecoveryValue(unit, nowRecovery);
}


// Get the current value of Ep
function OT_CommandGetEP() {
	var content = root.getEventCommandObject().getOriginalContent();
	var unit = content.getUnit();
	
	if (unit === null) {
		return;
	}
	return OT_GetNowEP(unit);
}

// Get the current value of Fp
function OT_CommandGetFP() {
	var content = root.getEventCommandObject().getOriginalContent();
	var unit = content.getUnit();
	
	if (unit === null) {
		return;
	}
	return OT_GetNowFP(unit);
}

// Get the maximum value of Ep
function OT_CommandGetMaxEP(type) {
	var content = root.getEventCommandObject().getOriginalContent();
	var unit = content.getUnit();
	
	if (unit === null) {
		return;
	}

	var nowValue = 0;
	switch(type) {
		case 1:
			nowValue = ParamBonus.getEp(unit);
			break;
			
		default:
			nowValue = UnitParameter.MEP.getUnitValue(unit);
			break;
	}
	
	return nowValue;
}

// Get the maximum value of Fp
function OT_CommandGetMaxFP(type) {
	var content = root.getEventCommandObject().getOriginalContent();
	var unit = content.getUnit();
	
	if (unit === null) {
		return;
	}
	
	var nowValue = 0;
	switch(type) {
		case 1:
			nowValue = ParamBonus.getFp(unit);
			break;
			
		default:
			nowValue = UnitParameter.MFP.getUnitValue(unit);
			break;
	}
	
	return nowValue;
}
