
/*--------------------------------------------------------------------------
  
  Adds special gauge (FP) to unit parameters.

  how to use:
  Set parameters for units and classes.
  (If you can specify a percentage, use '10%' in addition to the numerical value.
   You can specify the percentage by setting)

  ·Character
  {
      OT_FP : { Value:5, Growth:100, Recovery:5, Default:10 }
  }
  Value: Parameter (maximum value)
  Growth: Growth rate (probability of maximum increase in level up)
  Recovery: Amount of charge after a turn (percentage can be specified, in which case it should be specified by surrounding it with ', e.g. Recovery:'10%')
              The start of the first turn is also included in the turn progress.
              (By setting FirstTurnRecovery in UnitFP.js to false, turn recovery can be done from the second turn)
  Default: Initial value when starting the map (percentage can be specified)
  *If each value is omitted, it will be the same as specifying 0.
    If the initial value of FP is not set on the class side, the current value of FP starts from 0.
    
  ·class
  {
      OT_FP : { Value:5, Growth:100, Max:100, Recovery:5, Default:10, MoveCost:2.0,
                AddState:[ { Range:'0-10', State:[1], Dispel:true } ],
                BattleBonus:{ Hit:5, NoHit:1, Damage:4 , Avoid:5}
      }
  }
  Value: Parameter bonus (plus the unit's maximum FP value)
  Growth: Growth value bonus
  Max: Class upper limit value (limit value of maximum value increase by unit growth)
  Recovery: Charge amount after turn (percentage can be specified)
  Default: Added to the initial value at the start of the map (percentage can be specified) and the default value of the unit.
  MoveCost: Amount consumed each time you move one square
  AddState: Set the state added when FP becomes a specific area
              Range: Specify the amount of FP that the state will be given, you can specify the percentage as '0-10%'
              State: Specify the state ID, multiple specifications can be specified by separating them with commas in []
                      Specifying 'DEAD' instead of [(number)] will result in instant death.
              Dispel: Automatically cancel when true and FP amount is out of a specific area
  BattleBonus: Set the FP obtained for attack hit (Hit), attack miss (No Hit), hit (Damage), and avoidance (Avoid) (percentage can be specified)
  *If each value is omitted, Max is the value of global parameter OT_FP:MAX,
    AddState is not set, otherwise it is the same as specifying 0.
  
  ·weapon
  {
      OT_FP : { Use:5, CheckOnly:true, Value:100, Growth:100, Recovery:5,
                BattleBonus:{ Hit:5, NoHit:1, Damage:4 , Avoid:5}
      }
  }
  Use: FP consumed when used (percentage can be specified, if CheckOnly is false, specify a negative value to recover when used)
  CheckOnly: If true, FP is required for use, but FP is not consumed when used.
  Value: Parameter bonus when equipped
  Growth: Growth value bonus when equipped
  Recovery: Charge amount after turn (percentage can be specified)
  BattleBonus: Set the FP obtained for attack hit (Hit), attack miss (No Hit), hit (Damage), and avoidance (Avoid) (percentage can be specified)
  *If each value is omitted, it will be the same as specifying 0.
    CheckOnly is the same as specifying false.
  
  ·item
  {
      OT_FP : { Use:5, CheckOnly:true, Value:100, Growth:100, Recovery:5, Doping:5,
                BattleBonus:{ Hit:5, NoHit:1, Damage:4 , Avoid:5} }
      }
  }
  Use: FP consumed when used (percentage can be specified, if CheckOnly is false, specify a negative value to recover when used)
  CheckOnly: If true, FP is required for use, but FP is not consumed when used.
  Value: Parameter bonus when possessing
  Growth: Growth value bonus when possessed
  Recovery: Charge amount after turn (percentage can be specified)
  Doping: Increased value when doping (doping items only)
  BattleBonus: Set the FP obtained for attack hit (Hit), attack miss (No Hit), hit (Damage), and avoidance (Avoid) (percentage can be specified)
  *If each value is omitted, it will be the same as specifying 0.
    CheckOnly is the same as specifying false.

  ・State
  {
      OT_FP : { Doping:5, Recovery:5,
                BattleBonus:{ Hit:5, NoHit:1, Damage:4 , Avoid:5} }
      }
  }
  Doping: Parameter bonus when adding state
  Recovery: Recovery amount when state is granted (percentage can be specified)
  BattleBonus: Set the FP obtained for attack hit (Hit), attack miss (No Hit), hit (Damage), and avoidance (Avoid) (percentage can be specified)
  *If each value is omitted, it will be the same as specifying 0.

  ・Global parameters
  {
      OT_FP:{ Max:200 }
  }
  Max: Parameter maximum value limit
  *If omitted, it will be 100.
  
  Author:
  o-to
  
  Change log:
  2016/01/06: New creation

  2016/01/11：
  Fixed a bug where an error would occur when exchanging items with a unit whose inventory is not full.
  Fixed a bug in real-time battles where the motion would go awry if EP/FP was interrupted mid-attack.

  2016/04/26:
  Fixed EP and FP constants
  
  2016/06/13：
  Corrected a bug where EP and FP were not consumed when making weapons infinite in the tool user expansion.
  
  2016/07/31：
  Compatible with 1.086, fixed because initial EP and FP were in the state of 0
  Implemented automatic EP recovery value in unit, class, and item settings.

  2016/08/22:
  Fixed a bug where the EP and FP of units that became friends through information gathering were set to 0.
  Corrected the class settings so that it can be set to grant a state or die when EP and FP reach a specific range.

  2016/09/18:
  EP consumption and FP consumption can now be set according to movement cost (movement power required to move to that point)

  2016/10/03:
  Fixed an issue that would occur if the EP and FP were lower than the EP and FP usage of the weapon used after a pursuit.

  2016/10/17:
  Corrected an error caused by a variable error regarding whether or not items can be used.

  2017/02/05:
  Fixed a place where I forgot to declare the variable used for the for loop.
  *If there is another script that also forgets to declare it, unintended behavior will occur.

  2017/05/17:
  Fixed an issue where EP and FP were not displayed in the simple window in Ver1.127 or later.
  Corrected the display when specifying negative EP and FP consumption.
  Fixed an issue where FP was not consumed when the EP was lower than the used EP during an attack.

  2018/03/18:
  Added a function to recover EP/FP by actions in battle (attack hit, attack miss, hit, evasion)
  Fixed a bug where FP movement cost was not working properly.

  2020/08/24:
  If you do not use EP and only use FP,
  Fixed an issue where an error would occur when deleting UnitEP.js
  (Modified OT_GetUseFP function in UnitFP.js)

  2022/10/22：
  When a weapon has a recovery bonus when taking damage or evading
  Fixed an issue where the opponent would receive a recovery bonus when taking damage and evading in battles using that weapon.
  In FP, it is now possible to set recovery after a turn to start from the second turn.
  (This is possible by setting FirstTurnRecovery of UnitFP.js to false)
  Fixed FP so that it is possible to set the initial FP value at the start of the map for each unit.
  (The initial FP value at the start of the map is the initial value set for the unit + the initial value set for the class.)

--------------------------------------------------------------------------*/

(function() {

// Do you recover FP for the turn at the start of the 1st turn?
// If set to false, FP recovery will be performed after the second turn.
var FirstTurnRecovery = true;

// Maximum fp upper limit (maximum fp will grow to this value)
MaxFPDefaultMax = 100;

// Fp declaration
ParamType.MFP = 101;

// Is Fp set?
OT_isFPCustom = function(obj, paramName)
{
	if( obj == null )
	{
		return false;
	}

	if( obj.custom.OT_FP == null )
	{
		return false;
	}
	
	if( paramName == null ) {
		return true;
	}
	
	if( typeof obj.custom.OT_FP[paramName] == 'undefined' ) {
		return false;
	}
	
	return true;
};

// Get Fp usage value
OT_GetUseFP = function(unit, value)
{
	var unitMaxFp = OT_GetMaxFP(unit);
	return OT_GetFPValue(value, unitMaxFp);
};

// Get the object's fp usage value
OT_GetItemUseFP = function(unit, obj)
{
	if(unit == null)
	{
		return 0;
	}
	
	if(!OT_isFPCustom(obj))
	{
		return 0;
	}
	
	return OT_GetUseFP(unit, obj.custom.OT_FP.Use);
};

// Normalize and obtain the value of Fp
OT_GetFPValue = function(value, fpMax)
{
	if( value == null )
	{
		return 0;
	}
	
	if (typeof value === 'number') {
		return parseInt(value);
	}
	
	var regex = /^([\-]*[0-9]+)\%$/;
	var regexNum = /^([\-]*[0-9]+)$/;
	if(value.match(regex))
	{
		var percent = parseInt(RegExp.$1);
		var num = Math.floor( fpMax * (percent / 100) );

		return parseInt(num);
	}
	else if( value.match(regexNum) )
	{
		return parseInt(value);
	}
	
	return 0;
};

// Get current remaining fp
OT_GetNowFP = function(unit)
{
	var fp;

	if (typeof unit.custom.tmpNowFp === 'number')
	{
		fp = unit.custom.tmpNowFp;
	}
	else
	{
		fp = 0;
	}
	
	return parseInt(fp);
};

// Set current remaining fp
OT_SetNowFP = function(unit, fp)
{
	var max = ParamBonus.getFp(unit);
	unit.custom.tmpNowFp = OT_GetFPValue(fp, max);
	unit.custom.tmpFpChange = true;
	
	if( unit.custom.tmpNowFp > max )
	{
		unit.custom.tmpNowFp = max;
	}
	else if( unit.custom.tmpNowFp < 0 )
	{
		unit.custom.tmpNowFp = 0;
	}
};

// Fp recovery
OT_RecoveryNowFP = function(unit, value)
{
	var use = 0;
	var max = 0;
	
	if( unit == null || value == null )
	{
		return;
	}
	
	max = ParamBonus.getFp(unit);
	use = OT_GetFPValue( value, max );
	
	if (typeof unit.custom.tmpNowFp === 'number')
	{
		unit.custom.tmpNowFp += use;
	}
	else
	{
		unit.custom.tmpNowFp = 0;
	}

	if( unit.custom.tmpNowFp > max )
	{
		unit.custom.tmpNowFp = max;
	}
	else if( unit.custom.tmpNowFp < 0 )
	{
		unit.custom.tmpNowFp = 0;
	}
};

// FP use
OT_UseNowFP = function(unit, value)
{
	var use = 0;
	var max = 0;
	
	if( unit == null || value == null )
	{
		return;
	}
	
	max = ParamBonus.getFp(unit);
	use = OT_GetFPValue( value, max );
	
	if (typeof unit.custom.tmpNowFp === 'number')
	{
		unit.custom.tmpNowFp -= use;
	}
	else
	{
		unit.custom.tmpNowFp = 0;
	}

	if( unit.custom.tmpNowFp > max )
	{
		unit.custom.tmpNowFp = max;
	}
	else if( unit.custom.tmpNowFp < 0 )
	{
		unit.custom.tmpNowFp = 0;
	}
};

// Get current max fp (for external reference)
OT_GetMaxFP = function(unit)
{
	var fp;

	if (typeof unit.custom.tmpMaxFp === 'number')
	{
		fp = unit.custom.tmpMaxFp;
	}
	else
	{
		fp = 0;
	}
	
	return parseInt(fp);
};

// Set current max fp (for external reference)
OT_SetMaxFP = function(unit, fp)
{
	unit.custom.tmpMaxFp = fp;
};

// Get used fp (character)
OT_GetStringUseFP = function(obj)
{
	if( obj == null )
	{
		return 0;
	}
	
	if( !OT_isFPCustom(obj) )
	{
		return 0;
	}
	
	if( obj.custom.OT_FP.Use == null )
	{
		return 0;
	}

	var regex = /^(\-?)([0-9]+)(\%?)$/;
	if (typeof obj.custom.OT_FP.Use === 'number')
	{
		fp = obj.custom.OT_FP.Use;
	}
	else if(obj.custom.OT_FP.Use.match(regex))
	{
		fp = obj.custom.OT_FP.Use;
	}
	else
	{
		fp = 0;
	}
	
	return '' + fp;
};

// Obtain FP obtained during battle
OT_GetBattleBonusFP = function(unit, weapon)
{
	var i, count, item, n, id;
	var d = 0;
	var arr = [];
	var BattleBonusFP = {
		  Hit:0
		, NoHit:0
		, Damage:0
		, Avoid:0
	};

	var unitClass = unit.getClass();
	// FP obtained when attacking
	if( OT_isFPCustom(unitClass, 'BattleBonus') ) {
		BattleBonusFP.Hit    += OT_GetUseFP(unit, unitClass.custom.OT_FP.BattleBonus.Hit);
		BattleBonusFP.NoHit  += OT_GetUseFP(unit, unitClass.custom.OT_FP.BattleBonus.NoHit);
		BattleBonusFP.Damage += OT_GetUseFP(unit, unitClass.custom.OT_FP.BattleBonus.Damage);
		BattleBonusFP.Avoid  += OT_GetUseFP(unit, unitClass.custom.OT_FP.BattleBonus.Avoid);
	}

	if (weapon !== null) {
		if( OT_isFPCustom(weapon, 'BattleBonus') ) {
			BattleBonusFP.Hit    += OT_GetUseFP(unit, weapon.custom.OT_FP.BattleBonus.Hit);
			BattleBonusFP.NoHit  += OT_GetUseFP(unit, weapon.custom.OT_FP.BattleBonus.NoHit);
			BattleBonusFP.Damage += OT_GetUseFP(unit, weapon.custom.OT_FP.BattleBonus.Damage);
			BattleBonusFP.Avoid  += OT_GetUseFP(unit, weapon.custom.OT_FP.BattleBonus.Avoid);
		}
	}
	
	count = UnitItemControl.getPossessionItemCount(unit);
	for (i = 0; i < count; i++) {
		item = UnitItemControl.getItem(unit, i);
		if (item !== null && !item.isWeapon()) {
			id = item.getId();
			if (arr.indexOf(id) !== -1) {
				continue;
			}
			arr.push(id);
			
			//By calling ItemControl.isItemUsable,
			//Corrections are disabled for units whose use is not permitted.
			if (ItemControl.isItemUsable(unit, item)) {
				if( OT_isFPCustom(item, 'BattleBonus') ) {
					BattleBonusFP.Hit    += OT_GetUseFP(unit, item.custom.OT_FP.BattleBonus.Hit);
					BattleBonusFP.NoHit  += OT_GetUseFP(unit, item.custom.OT_FP.BattleBonus.NoHit);
					BattleBonusFP.Damage += OT_GetUseFP(unit, item.custom.OT_FP.BattleBonus.Damage);
					BattleBonusFP.Avoid  += OT_GetUseFP(unit, item.custom.OT_FP.BattleBonus.Avoid);
				}
			}
		}
	}

	var i, state;
	var list = unit.getTurnStateList();
	var count = list.getCount();
	
	for (i = 0; i < count; i++) {
		state = list.getData(i).getState();
		
		if( OT_isFPCustom(state, 'BattleBonus') ) {
			BattleBonusFP.Hit    += OT_GetUseFP(unit, state.custom.OT_FP.BattleBonus.Hit);
			BattleBonusFP.NoHit  += OT_GetUseFP(unit, state.custom.OT_FP.BattleBonus.NoHit);
			BattleBonusFP.Damage += OT_GetUseFP(unit, state.custom.OT_FP.BattleBonus.Damage);
			BattleBonusFP.Avoid  += OT_GetUseFP(unit, state.custom.OT_FP.BattleBonus.Avoid);
		}
	}

	//root.log('BattleBonusFP Damage:' + BattleBonusFP.Damage);
	return BattleBonusFP;
};

// Get Fp charge amount (unit, class, item)
OT_GetFPRecovery = function(unit)
{
	//root.log('OT_GetFPRecovery:' + unit.getName());
	return OT_GetFPRecoveryBonus(unit, unit) + OT_GetFPRecoveryBonus(unit, unit.getClass()) + OT_GetFPRecoveryItemBonus(unit);
	//return this.getClassUnitValue(unit, index) + this.getUnitTotalParamBonus(unit, index) + StateControl.getStateParameter(unit, index);
};

// Get Fp charge amount (unit, class, item, state)
OT_GetFPRecoveryAll = function(unit)
{
	return OT_GetFPRecovery(unit) + StateControl.getFpValue(unit);
	//return this.getClassUnitValue(unit, index) + this.getUnitTotalParamBonus(unit, index) + StateControl.getStateParameter(unit, index);
};

// Get the fp charge amount for each object
OT_GetFPRecoveryBonus = function(unit, obj)
{
	var fp;
	var max = ParamBonus.getFp(unit);
	
	if( !OT_isFPCustom(obj) ) return 0;
	
	if (obj.custom.OT_FP.Recovery != null)
	{
		fp = OT_GetFPValue( obj.custom.OT_FP.Recovery, max );
	}
	else
	{
		fp = 0;
	}
	
	return fp;
};

// Get the amount of fp charge in your inventory
OT_GetFPRecoveryItemBonus = function(unit)
{
	var i, count, item, n, id;
	var d = 0;
	var weapon = ItemControl.getEquippedWeapon(unit);
	var arr = [];
	
	if (weapon !== null) {
		d += OT_GetFPRecoveryBonus(unit, weapon);
	}
	
	count = UnitItemControl.getPossessionItemCount(unit);
	for (i = 0; i < count; i++) {
		item = UnitItemControl.getItem(unit, i);
		if (item !== null && !item.isWeapon()) {
			id = item.getId();
			if (arr.indexOf(id) !== -1) {
				continue;
			}
			arr.push(id);
			
			n = OT_GetFPRecoveryBonus(unit, item);
			// By calling ItemControl.isItemUsable,
			// Corrections are disabled for units whose use is not permitted.
			if (n !== 0 && ItemControl.isItemUsable(unit, item)) {
				d += n;
			}
		}
	}
	
	return d;
};

// Get the initial fp value at the start of the map
OT_GetDefaultFP = function(unit)
{
	var unitBonus  = 0;
	var classBonus = 0;
	
	if( OT_isFPCustom(unit) ) {
		unitBonus = OT_GetFPValue(unit.custom.OT_FP.Default, ParamBonus.getFp(unit));
	}

	if( OT_isFPCustom(unit.getClass()) ) {
		classBonus = OT_GetFPValue(unit.getClass().custom.OT_FP.Default, ParamBonus.getFp(unit));
	}
	
	return unitBonus + classBonus;
};

// Get read-only
OT_GetCheckOnlyFP = function(obj)
{
	var fp;

	if ( !OT_isFPCustom(obj) )
	{
		return false;
	}
	
	if( typeof obj.custom.OT_FP.CheckOnly != 'boolean' )
	{
		return false;
	}
	
	return obj.custom.OT_FP.CheckOnly;
};

// Get fp cost due to movement
OT_GetMoveCostFP = function(obj, movePoint)
{
	if( obj == null )
	{
		return 0;
	}
	
	if( !OT_isFPCustom(obj) )
	{
		return 0;
	}

	var cost = 0;
	if( typeof obj.custom.OT_FP.MoveCost === 'number' )
	{
		cost = Math.floor(obj.custom.OT_FP.MoveCost * movePoint);
	}
	
	return cost;
};

UnitParameter.MFP = defineObject(BaseUnitParameter,
{	
	getUnitValue: function(unit) {
		var fp;
		
		if( !OT_isFPCustom(unit) ) return 0;

		if (typeof unit.custom.OT_FP.Value === 'number') {
			fp = unit.custom.OT_FP.Value;
		}
		else {
			fp = 0;
		}
		
		return fp;
	},
	
	setUnitValue: function(unit, value) {
		if( !OT_isFPCustom(unit) )
		{
			unit.custom.OT_FP = {};
		}

		unit.custom.OT_FP.Value = value;
	},

	// Get the amount of FP recovery per turn
	getUnitRecoveryValue: function(unit) {
		var fp;
		
		if( !OT_isFPCustom(unit) ) return 0;

		var value = unit.custom.OT_FP.Recovery;
		if (typeof value === 'number') {
			fp = value;
		} else if(typeof value === 'string') {
			var regex = /^([\-]*[0-9]+)\%$/;
			var regexNum = /^([\-]*[0-9]+)$/;
			
			if(value.match(regex)) {
				fp = value;
			} else if(value.match(regexNum)) {
				fp = parseInt(value);
			} else {
				fp = 0;
			}
		} else {
			fp = 0;
		}
		
		return fp;
	},

	// Set the amount of FP recovery per turn
	setUnitRecoveryValue: function(unit, value) {
		if( !OT_isFPCustom(unit) )
		{
			unit.custom.OT_FP = {};
		}

		unit.custom.OT_FP.Recovery = value;
	},

	// Obj is a unit, class, weapon, etc.
	getParameterBonus: function(obj) {
		var fp;
		
		if( obj == null ) return 0;

		if( !OT_isFPCustom(obj) ) return 0;
		
		if (typeof obj.custom.OT_FP.Value === 'number')
		{
			fp = obj.custom.OT_FP.Value;
		}
		else
		{
			fp = 0;
		}
		
		return fp;
	},
	
	// Obj is a unit, class, weapon, etc.
	getGrowthBonus: function(obj) {
		var fp;
		
		if( obj == null ) return 0;

		if( !OT_isFPCustom(obj) ) return 0;

		if (typeof obj.custom.OT_FP.Growth === 'number') {
			fp = obj.custom.OT_FP.Growth;
		}
		else {
			fp = 0;
		}
		
		return fp;
	},
	
	// Obj can be command parameter change, item, state, or turn state
	getDopingParameter: function(obj) {
		var fp;
		
		if( obj == null ) return 0;

		try
		{
			// If it is a turn state, get state() will be processed normally.
			var state = obj.getState();
			var turn = state.getTurn() - obj.getTurn();
			if( !OT_isFPCustom(state) ) return 0;
	
			if (typeof state.custom.OT_FP.Doping === 'number') {
				fp = state.custom.OT_FP.Doping;

				if( fp > 0 )
				{
					fp = fp - ( state.getTurnChangeValue() * turn );
				}
				else if( fp < 0 )
				{
					fp = fp + ( state.getTurnChangeValue() * turn );
				}
			}
			else {
				fp = 0;
			}
		}
		catch (e)
		{
			// If it is not the turn state, get state() will always fail, so perform the following process.
			if (typeof obj.custom !== 'object') {
				return 0;
			}
			
			if( !OT_isFPCustom(obj) ) return 0;
	
			if (typeof obj.custom.OT_FP.Doping === 'number') {
				fp = obj.custom.OT_FP.Doping;
			}
			else {
				fp = 0;
			}
		}
		
		return fp;
	},
	
	getMaxValue: function(unit) {
		var fpMax;
		
		if (root.getUserExtension().isClassLimitEnabled())
		{
			if ( OT_isFPCustom(unit.getClass()) && typeof unit.getClass().custom.OT_FP.Max === 'number')
			{
				fpMax = unit.getClass().custom.OT_FP.Max;
			}
			else if( root.getMetaSession().global.OT_FP != null && typeof root.getMetaSession().global.OT_FP.Max === 'number')
			{
				fpMax = root.getMetaSession().global.OT_FP.Max;
			}
			else
			{
				fpMax = MaxFPDefaultMax;
			}
		}
		else
		{
			if ( root.getMetaSession().global.OT_FP != null && typeof root.getMetaSession().global.OT_FP.Max === 'number')
			{
				fpMax = root.getMetaSession().global.OT_FP.Max;
			}
			else
			{
				fpMax = MaxFPDefaultMax;
			}
		}
		
		return fpMax;
	},
	
	getMinValue: function(unit) {
		return 0;
	},

	getParameterType: function() {
		return ParamType.MFP;
	},

	getParameterName: function() {
		return OT_FPFrameSetting.Name;
	}
}
);

// Get the character's maximum fp value (including additional bonuses for classes and items)
ParamBonus.getFp = function(unit)
{
	var n = this.getBonus(unit, ParamType.MFP);
	
	// Holds values ​​for external references
	OT_SetMaxFP(unit, n);
	return n;
};

// Get the character's maximum fp value (unit and class total)
ParamBonus.getFpClassUnit = function(unit)
{
	var i, typeTarget, n;
	var index = -1;
	var count = ParamGroup.getParameterCount();
	var type = ParamType.MFP;
	
	for (i = 0; i < count; i++) {
		typeTarget = ParamGroup.getParameterType(i);
		if (type === typeTarget) {
			index = i;
			break;
		}
	}
	
	if (index === -1) {
		return 0;
	}
	
	n = ParamGroup.getClassUnitValue(unit, index);
	if (n < 0) {
		n = 0;
	}
	return n;
};

// Check that the value is within the range
OT_isValueInRange = function(nowValue, maxValue, range)
{
	if( typeof range !== 'string' )
	{
		return false;
	}
	
	var regex = /^([0-9]+)\-([0-9]+)\%$/;
	var regexNum = /^([0-9]+)\-([0-9]+)$/;

	if (range.match(regex))
	{
		var min = parseInt(RegExp.$1);
		var max = parseInt(RegExp.$2);
		var MinPercent = Math.floor( maxValue * (min / 100) );
		var MaxPercent = Math.floor( maxValue * (max / 100) );
		//root.log(range);
		//root.log(MinPercent+':'+MaxPercent);

		if( MinPercent <= nowValue && nowValue <= MaxPercent )
		{
			return true;
		}
	}
	else if(range.match(regexNum))
	{
		var min = parseInt(RegExp.$1);
		var max = parseInt(RegExp.$2);

		if( min <= nowValue && nowValue <= max )
		{
			return true;
		}
	}
	
	return false;
};

// Make fp visible in the unit menu
var alias1 = ParamGroup._configureUnitParameters;
ParamGroup._configureUnitParameters = function(groupArray) {
	alias1.call(this, groupArray);
	groupArray.insertObject(UnitParameter.MFP, 2);
};

// Add fp consumption to the method that determines whether a weapon can be equipped or not.
var alias2 = ItemControl.isWeaponAvailable;
ItemControl.isWeaponAvailable = function(unit, item) {
	var i, count, n, id;
	var d = 0;
	var arr = [];
	var weapon = item;
	var result = alias2.call(this, unit, weapon);
	
	if (!result)
	{
		// Can't continue because it can't be equipped
		return false;
	}
	
	var unitFp = OT_GetNowFP(unit);
	
	// Max fp will crash in an infinite loop if you don't get something for external reference
	var unitMaxFp = OT_GetMaxFP(unit);
	
	var weaponFp = 0;
	if ( OT_isFPCustom(weapon) )
	{
		weaponFp = OT_GetFPValue( weapon.custom.OT_FP.Use, unitMaxFp );
	}
	
	if(weaponFp > 0)
	{
		if(typeof unit.custom.tmpMoveFP === 'number')
		{
			weaponFp += unit.custom.tmpMoveFP;
		}
	}
	
	// A weapon can be equipped only if the unit's FP exceeds the weapon's FP consumption.
	return unitFp >= weaponFp;
};

/*
//Set FP when unit appears
var alias5 = Miscellaneous.setupFirstUnit;
Miscellaneous.setupFirstUnit = function(unit)
{
	alias5.call(this, unit);
	
	unit.custom.tmpNowFp = OT_GetDefaultFP(unit);
	unit.custom.tmpUseFp = 0;
};
*/

// Adjusted fp when equipping items
var alias6 = ItemControl.updatePossessionItem;
ItemControl.updatePossessionItem = function(unit)
{
	alias6.call(this, unit);

	var scene = root.getCurrentScene();
	
	// If the scene is neither FREE nor EVENT, FP is always the default FP.
    // If you don't check this, your FP will change when you exchange items on the map or increase or decrease items in events.
	if (scene !== SceneType.FREE && scene !== SceneType.EVENT) {
		unit.custom.tmpNowFp = OT_GetDefaultFP(unit);
	}
	
	// Prevent Fp from exceeding maximum fp
	OT_SetNowFP(unit, OT_GetNowFP(unit));
};

// FP automatic charge every turn
var alias7 = RecoveryAllFlowEntry._completeMemberData;
RecoveryAllFlowEntry._completeMemberData = function(turnChange)
{
	var result = alias7.call(this, turnChange);
	var i, unit, recoveryValue;
	var list = TurnControl.getActorList();
	var count = list.getCount();
	var nowTurn = getNowTurn();
	
	var commandCount = 0;
	var isSkipMode = CurrentMap.isTurnSkipMode();
	var generator = this._dynamicEvent.acquireEventGenerator();
	
	//root.log('RecoveryAllFlowEntry._completeMemberData:' + getNowTurn());
	
	for (i = 0 ; i < count; i++) {
		unit = list.getData(i);
		recoveryValue = OT_GetFPRecovery(unit);
		recoveryValue += StateControl.getFpValue(unit);
		
		if(nowTurn > 1 || FirstTurnRecovery) {
			//root.log('nowTurn:' + nowTurn);
			OT_RecoveryNowFP(unit, recoveryValue);
		}

		// If you want to add a state if Fp is within the specified range
		if( OT_isFPCustom(unit.getClass()) )
		{
			var add = unit.getClass().custom.OT_FP.AddState;
			var nowFP = OT_GetNowFP(unit);
			var unitMaxFp = ParamBonus.getFp(unit);

			if(typeof add === 'object')
			{
				var list2 = root.getBaseData().getStateList();
				var length = add.length;
				for(var j = 0; j < length; j++)
				{
					var obj = add[j];
					var length2 = obj['State'].length;

					//root.log(nowFP + ':' + unitMaxFp);
					if(OT_isValueInRange(nowFP, unitMaxFp, obj['Range']))
					{
						if(obj['State'] == 'DEAD')
						{
							generator.damageHit(unit, this._getTurnDamageAnime(), 9999, DamageType.FIXED, {}, isSkipMode);
							commandCount++;
							break;
						}

						for(var h=0 ; h<length2 ; h++)
						{
							var state = list2.getDataFromId(obj['State'][h]);
							StateControl.arrangeState(unit, state, IncreaseType.INCREASE);
						}
					}
					else if(obj.Dispel == true)
					{
						for(var h=0 ; h<length2 ; h++)
						{
							var state = list2.getDataFromId(obj['State'][h]);
							StateControl.arrangeState(unit, state, IncreaseType.DECREASE);
						}
					}
				}
			}
		}
	}

	if (commandCount !== 0) {
		return this._dynamicEvent.executeDynamicEvent();
	}

	return result;
};

// Get Fp natural recovery value
StateControl.getFpValue = function(unit) {
	var i, state;
	var list = unit.getTurnStateList();
	var count = list.getCount();
	var recoveryValue = 0;
	
	for (i = 0; i < count; i++) {
		state = list.getData(i).getState();
		
		if ( OT_isFPCustom(state) )
		{
			recoveryValue += OT_GetFPValue(state.custom.OT_FP.Recovery, ParamBonus.getFp(unit));
		}
	}
	
	return recoveryValue;
};

// Adjust maximum fp value when item is lost
var alias8 = ItemControl.deleteItem;
ItemControl.deleteItem = function(unit, item)
{
	var result = alias8.call(this, unit, item);
	
	ItemControl.updatePossessionItem(unit);
	
	return result;
};

// Add fp consumption to the method that determines whether the item can be used
var alias9 = ItemControl.isItemUsable;
ItemControl.isItemUsable = function(unit, item) {
	var result = alias9.call(this, unit, item);
	if (!result)
	{
		// Unavailable, do not continue
		return false;
	}
	
	var unitFp = OT_GetNowFP(unit);
	
	// Max fp will crash in an infinite loop if you don't get something for external reference
	var unitMaxFp = OT_GetMaxFP(unit);
	
	var itemFp = 0;
	if ( OT_isFPCustom(item) )
	{
		itemFp = OT_GetFPValue( item.custom.OT_FP.Use, unitMaxFp );
	}

	if(itemFp > 0)
	{
		if(typeof unit.custom.tmpMoveFP === 'number')
		{
			itemFp += unit.custom.tmpMoveFP;
		}
	}
	
	// The condition is that the unit's fp exceeds the item's consumed fp
	return unitFp >= itemFp;
};

// Consumes FP when using items
var alias10 = ItemUseParent.decreaseItem;
ItemUseParent.decreaseItem = function() {
	alias10.call(this);
	
	var unit = this._itemTargetInfo.unit;
	var item = this._itemTargetInfo.item;

	if( !OT_GetCheckOnlyFP(item) )
	{
		var unitFp = OT_GetNowFP(unit);
		var unitMaxFp = ParamBonus.getFp(unit);
		var weaponFp = 0;
		
		if( OT_isFPCustom(item) )
		{
			itemFp = OT_GetFPValue( item.custom.OT_FP.Use, unitMaxFp );
			OT_UseNowFP(unit, itemFp);
		}
	}
};

// If recovery is allowed in the base settings, make sure your allies have full FP when selecting a sortie.
var alias11 = UnitProvider.recoveryPrepareUnit;
UnitProvider.recoveryPrepareUnit = function(unit)
{
	alias11.call(this, unit);
	OT_SetNowFP(unit, OT_GetDefaultFP(unit));
};

// Fully recover FP of test member units and reinforcement units
var alias12 = ScriptCall_AppearEventUnit;
ScriptCall_AppearEventUnit = function(unit)
{
	alias12.call(this, unit);
	OT_SetNowFP(unit, OT_GetDefaultFP(unit));
};

// Fully recover the FP of the character placed on the map from the beginning
var alias13 = OpeningEventFlowEntry._checkUnitParameter;
OpeningEventFlowEntry._checkUnitParameter = function() {
	alias13.call(this);
	
	var i, j, list, unit, listCount, count;
	var listArray = FilterControl.getAliveListArray(UnitFilterFlag.ENEMY | UnitFilterFlag.ALLY);
	
	listCount = listArray.length;
	for (i = 0; i < listCount; i++) {
		list = listArray[i];
		count = list.getCount();
		for (j = 0; j < count; j++) {
			unit = list.getData(j);
			OT_SetNowFP(unit, OT_GetDefaultFP(unit));
		}
	}
	
	list = root.getCurrentSession().getGuestList();
	count = list.getCount();
	for (j = 0; j < count; j++) {
		unit = list.getData(j);
		OT_SetNowFP(unit, OT_GetDefaultFP(unit));
	}
};

// Characters who become friends through information gathering have never had their FP adjusted.
// Correct when selecting a character to deploy and selecting unit information.
var alias14 = UnitSortieScreen.setScreenData;
UnitSortieScreen.setScreenData = function(screenParam) {
	alias14.call(this, screenParam);
	
	var i, unit;
	var list = PlayerList.getMainList();
	var count = list.getCount();
	
	for (i = 0; i < count; i++) {
		unit = list.getData(i);
		
		if( unit.custom.tmpFpChange != true)
		{
			OT_SetNowFP(unit, OT_GetDefaultFP(unit));
		}
	}
};

var alias15 = MarshalScreen.setScreenData;
MarshalScreen.setScreenData = function(screenParam) {
	alias15.call(this, screenParam);
	
	var i, unit;
	var list = PlayerList.getMainList();
	var count = list.getCount();
	
	for (i = 0; i < count; i++) {
		unit = list.getData(i);
		
		if( unit.custom.tmpFpChange != true)
		{
			OT_SetNowFP(unit, OT_GetDefaultFP(unit));
		}
	}
};

// Determine if there is enough fp when attacking during battle
var alias200 = VirtualAttackControl.isAttackContinue;
VirtualAttackControl.isAttackContinue = function(virtualAttackUnit)
{
	var i, count;
	var weapon = virtualAttackUnit.weapon;
	var result = alias200.call(this, virtualAttackUnit);

	// Cannot continue because attack is not possible
	if( result == false )
	{
		return false;
	}

	var unit = virtualAttackUnit.unitSelf;
	var unitFp = OT_GetNowFP(unit);
	var unitMaxFp = ParamBonus.getFp(unit);
	var weaponFp = 0;

	if( OT_isFPCustom(weapon) )
	{
		weaponFp = OT_GetFPValue( weapon.custom.OT_FP.Use, unitMaxFp );
		
		// Cannot attack when consumed FP is insufficient
		if( unitFp < weaponFp + unit.custom.tmpUseFP)
		{
			return false;
		}
	}

	return true;
};

// Adds FP consumption each time you attack during battle
var alias201 = NormalAttackOrderBuilder._createAndRegisterAttackEntry;
NormalAttackOrderBuilder._createAndRegisterAttackEntry = function(virtualActive, virtualPassive) {
	var attackEntry = alias201.call(this, virtualActive, virtualPassive);
	
	var weapon = virtualActive.weapon;
	if (weapon !== null) {
		var unit = virtualActive.unitSelf;
		var targetUnit = virtualPassive.unitSelf;
		
		if( !OT_GetCheckOnlyFP(weapon) )
		{
			var unitFp = OT_GetNowFP(unit);
			var unitMaxFp = ParamBonus.getFp(unit);
			var weaponFp = 0;
		
			if( OT_isFPCustom(weapon) )
			{
				weaponFp = OT_GetFPValue( weapon.custom.OT_FP.Use, unitMaxFp );
				unit.custom.tmpUseFP += weaponFp;
			}
		}
		
		// FP obtained when attacking
		var bonus = OT_GetBattleBonusFP(unit, weapon);
		//root.log(unit.getName() + ' BattleBonusFP Damage:' + bonus.Damage);
		if( attackEntry.isHit ) {
			unit.custom.tmpUseFP -= bonus.Hit;
		} else {
			unit.custom.tmpUseFP -= bonus.NoHit;
		}

		// FP obtained when defending
		var bonus2 = OT_GetBattleBonusFP(targetUnit, virtualPassive.weapon);
		//root.log(targetUnit.getName() + ' BattleBonusFP Damage:' + bonus2.Damage);
		if( attackEntry.isHit ) {
			targetUnit.custom.tmpUseFP -= bonus2.Damage;
		} else {
			targetUnit.custom.tmpUseFP -= bonus2.Avoid;
		}
	}

	return attackEntry;
};

// Reduce fp after battle completion
var alias202 = PreAttack._doEndAction;
PreAttack._doEndAction = function()
{
	alias202.call(this);
	
	var active  = this.getActiveUnit();
	var passive = this.getPassiveUnit();
	
	OT_UseNowFP(active, active.custom.tmpUseFP );
	OT_UseNowFP(passive, passive.custom.tmpUseFP);

	//root.log('_endVirtualAttack'+active.getName()+active.custom.tmpUseFP);
	//root.log('_endVirtualAttack'+passive.getName()+passive.custom.tmpUseFP);

	active.custom.tmpUseFP  = 0;
	passive.custom.tmpUseFP = 0;
};

// Add fp to use when creating a virtual attack
var alias203 = VirtualAttackControl.createVirtualAttackUnit;
VirtualAttackControl.createVirtualAttackUnit = function(unitSelf, targetUnit, isSrc, attackInfo)
{
	var virtualAttack = alias203.call(this, unitSelf, targetUnit, isSrc, attackInfo);
	
	unitSelf.custom.tmpUseFP = 0;
	
	//root.log('createVirtualAttackUnit'+unitSelf.getName());
	return virtualAttack;
};

// FP consumption when moving (tentative)
// Processing when each character moves
// Get the movement cost at this time
var alias300 = SimulateMove.startMove;
SimulateMove.startMove = function(unit, moveCource)
{
	alias300.call(this, unit, moveCource);

	var objClass = unit.getClass();
	if( OT_isFPCustom(objClass) )
	{
		if( typeof objClass.custom.OT_FP.MoveCost === 'number' )
		{
			// Save expended movement power
			this._saveMostResentMov(unit, moveCource);
			var cost = objClass.custom.OT_FP.MoveCost;
			unit.custom.tmpMoveFP = Math.floor(unit.getMostResentMov() * cost);
			//root.log(unit.custom.tmpMoveFP);
		}
	}
};

// During player action
var alias301 = MapSequenceCommand._doLastAction;
MapSequenceCommand._doLastAction = function()
{
	var result = alias301.call(this);
	var p = 0;

	if(typeof this._targetUnit.custom.tmpMoveFP === 'number')
	{
		p = this._targetUnit.custom.tmpMoveFP;
	}
	
	if (result === 0 || result === 1) {
		//root.log(this._targetUnit.getName());
		//root.log(p);
		OT_UseNowFP(this._targetUnit, p);
	}
	
	delete this._targetUnit.custom.tmpMoveFP;
	return result;
};

// For relocation
var alias302 = RepeatMoveFlowEntry.moveFlowEntry;
RepeatMoveFlowEntry.moveFlowEntry = function()
{
	var result = alias302.call(this);
	if (result === MoveResult.END) {
		this._mapSequenceArea.UseFP();
	}
	
	return result;
};

MapSequenceArea.UseFP = function()
{
	var p = 0;

	if(typeof this._targetUnit.custom.tmpMoveFP === 'number')
	{
		p = this._targetUnit.custom.tmpMoveFP;
	}

	//root.log(this._targetUnit.getName());
	//root.log(p);
	OT_UseNowFP(this._targetUnit, p);
	delete this._targetUnit.custom.tmpMoveFP;
};

// Exclusive to skip when enemy moves
var alias303 = SimulateMove.skipMove;
SimulateMove.skipMove = function(unit, moveCource)
{
	var objClass = unit.getClass();
	if( OT_isFPCustom(objClass) )
	{
		if( typeof objClass.custom.OT_FP.MoveCost === 'number' )
		{
			// Save expended movement power
			this._saveMostResentMov(unit, moveCource);
			var cost = objClass.custom.OT_FP.MoveCost;
			unit.custom.tmpMoveFP = Math.floor(unit.getMostResentMov() * cost);
			//root.log(unit.custom.tmpFP);
		}
	}

	alias303.call(this, unit, moveCource);
};

// For enemy movement only
var alias304 = MoveAutoAction.enterAutoAction;
MoveAutoAction.enterAutoAction = function()
{
	var result = alias304.call(this);
	
	var p = 0;
	if(typeof this._unit.custom.tmpMoveFP === 'number')
	{
		p = this._unit.custom.tmpMoveFP;
	}

	OT_UseNowFP(this._unit, p);
	delete this._unit.custom.tmpMoveFP;

	return result;
};

// Control when enemy AI decides to take action
// According to the official source, the weapon and opponent used for attack are determined during the first check, and the movement location is determined during the second check.
// In the first check, if there is no point where the consumed FP does not exceed the remaining FP amount, control will not be performed with that weapon,
// The second check controls the movement so that the consumed FP does not exceed the remaining FP amount.
var alias305 = CombinationSelector._getTotalScore;
CombinationSelector._getTotalScore = function(unit, combination)
{
	var totalScore = alias305.call(this, unit, combination);

	// If the movement FP cost + attack FP cost exceeds the remaining FP amount, do not perform that action.
	if( OT_isFPCustom(combination.item) )
	{
		var unitFp = OT_GetNowFP(unit);
		var unitMaxFp = OT_GetMaxFP(unit);

		// In the first check, pos index is 0
		if( combination.posIndex == 0 )
		{
			// At the first check, exclude actions where the remaining fp becomes negative no matter where you take the action.
			count = combination.costArray.length;
			for (var i = 0; i < count; i++) {
				var costData = combination.costArray[i];
				var useFP = OT_GetFPValue( combination.item.custom.OT_FP.Use, unitMaxFp ) + OT_GetMoveCostFP(unit.getClass(), costData.movePoint);
				
				if(unitFp - useFP >= 0)
				{
					return totalScore;
				}
			}
			return -1;
		}
		else
		{
			// During the second check, exclude those that move to a point where the fp remaining amount becomes negative.
			var useFP = OT_GetFPValue( combination.item.custom.OT_FP.Use, unitMaxFp ) + OT_GetMoveCostFP(unit.getClass(), combination.movePoint);

			if(unitFp - useFP < 0)
			{
				return -1;
			}
		}
	}
	
	return totalScore;
};

function getNowTurn() {
	var turn = 1;
	var cSession = root.getCurrentSession();
	//root.log('test:' + ("getTurnCount" in cSession));
	
	if( cSession != null ) {
		// Determine whether the content obtained with Root.get current session() is a game session
		if(("getTurnCount" in cSession)) {
			turn = cSession.getTurnCount();
			
			// Fixed an issue where the number of turns would become 0 when a forced battle occurred before the map started.
			if(turn < 1) {
				turn = 1;
			}
		}
	}
	
	return turn;
};

})();
