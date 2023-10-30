

/*-----------------------------------------------------------------------------------------------
  
  Add MP(EP) to the unit parameters.
    
  how to use:
  Set parameters for units and classes.
  (If you can specify a percentage, you can specify a percentage by setting it as '10%' in addition to the numerical value.)
   When specifying a percentage, be sure to enclose it in '')

  ·Character
  {
      OT_EP : { Value:5, Growth:80, Recovery:5 }
  }
  Value: Parameter
  Growth: growth rate
  Recovery: Amount of charge after a turn (percentage can be specified, in which case it should be specified by surrounding it with ', e.g. Recovery:'10%')
  (The above settings have an initial value of 5, growth value of 80%, and 5 recovery every turn)
  *If each value is omitted, it will be the same as specifying 0.

  ·class
  {
      OT_EP : { Value:5, Growth:100, Max:100, Recovery:5, MoveCost:2.0,
                AddState:[ { Range:'0-10', State:[1], Dispel:true } ],
                BattleBonus:{ Hit:5, NoHit:1, Damage:4 , Avoid:5} }
  }
  Value: Parameter bonus
  Growth: Growth value bonus
  Max: Class upper limit
  Recovery: Charge amount after turn (percentage can be specified)
  MoveCost: Amount consumed each time you move one square
  AddState: Set the state added when EP becomes a specific area
              Range: Specify the amount of FP that the state will be given, you can specify the percentage as '0-10%'
              State: Specify the state ID, multiple specifications can be specified by separating them with commas in []
                      Specifying 'DEAD' instead of [(number)] will result in instant death.
              Dispel: Automatically cancel when the EP amount is out of a specific range with true
  BattleBonus: Set the EP obtained for attack hit (Hit), attack miss (No Hit), hit (Damage), and avoidance (Avoid) (percentage can be specified)
  *If each value is omitted, Max is the value of global parameter OT_EP:MAX,
    AddState is not set, otherwise it is the same as specifying 0.
  
  ·weapon
  {
      OT_EP : { Use:5, Value:100, Growth:100, Recovery:5,
                BattleBonus:{ Hit:5, NoHit:1, Damage:4 , Avoid:5} }
      }
  }
  Use: EP consumed when using (percentage can be specified, negative specification allows recovery when using)
  Value: Parameter bonus when equipped
  Growth: Growth value bonus when equipped
  Recovery: Charge amount after turn (percentage can be specified)
  BattleBonus: Set the EP obtained for attack hit (Hit), attack miss (No Hit), hit (Damage), and avoidance (Avoid) (percentage can be specified)
  *If each value is omitted, it will be the same as specifying 0.
  
  ·item
  {
      OT_EP : { Use:5, Value:100, Growth:100, Doping:5, Recovery:5,
                BattleBonus:{ Hit:5, NoHit:1, Damage:4 , Avoid:5} }
      }
  }
  Use: EP consumed when using (percentage can be specified, negative specification allows recovery when using)
  Value: Parameter bonus when possessing
  Growth: Growth value bonus when possessed
  Doping: Increased value when doping (doping items only)
  Recovery: Charge amount after turn (percentage can be specified)
  BattleBonus: Set the EP obtained for attack hit (Hit), attack miss (No Hit), hit (Damage), and avoidance (Avoid) (percentage can be specified)
  *If each value is omitted, it will be the same as specifying 0.
  
  ・State
  {
      OT_EP : { Doping:5, Recovery:5,
                BattleBonus:{ Hit:5, NoHit:1, Damage:4 , Avoid:5} }
      }
  }
  Doping: Parameter bonus when adding state
  Recovery: Recovery amount when state is granted (percentage can be specified)
  BattleBonus: Set the EP obtained for attack hit (Hit), attack miss (No Hit), hit (Damage), and avoidance (Avoid) (percentage can be specified)
  *If each value is omitted, it will be the same as specifying 0.
  
  ·global
  {
      OT_EP: { Max:9999 }
  }
  Max: Parameter maximum value limit
  *If omitted, it will be 30.

  Author:
  o-to
  
  Change log:
  2016/01/06: New creation

  2016/01/11：
  Fixed a bug where an error would occur when exchanging items with a unit whose inventory was not full.
  Fixed a bug where the motion would be incorrect during real-time battles if EP/FP was interrupted during the attack.

  2016/04/26:
  Fixed EP and FP constants
  
  2016/06/13：
  Corrected a bug where EP and FP were not consumed when making weapons infinite in the tool user expansion.

  2016/07/31：
  Compatible with 1.086, fixed because initial EP and FP were in the state of 0
  Implemented automatic EP recovery value in unit, class, and item settings.
  Fixed an error in the natural EP recovery value.

  2016/08/22:
  Fixed a bug where the EP and FP of units that became friends through information gathering were set to 0.
  Corrected the class settings so that it can be set to grant a state or die when EP and FP reach a specific range.

  2016/09/18:
  EP consumption and FP consumption can now be set according to movement cost (movement power required to move to that point)

  2016/10/03:
  Fixed an issue that would occur if the EP and FP were lower than the EP and FP usage of the weapon used after a pursuit.

  2017/02/05:
  Fixed a place where I forgot to declare the variable used for the for loop.
  *If there is another script that also forgets to declare it, unintended behavior will occur.

  2017/05/17:
  Fixed an issue where EP and FP were not displayed in the simple window in Ver1.127 or later.
  Corrected the display when specifying negative EP and FP consumption.
  Fixed an issue where FP was not consumed when the EP after attacking was less than the used EP when setting the consumed EP and FP.

  2018/03/18:
  Added a function to recover EP/FP by actions in battle (attack hit, attack miss, hit, evasion)
  Fixed a bug where FP movement cost was not working properly.

  2022/10/22：
  When a weapon has a recovery bonus when taking damage or evading
  Fixed an issue where the opponent would receive a recovery bonus when taking damage and evading in battles using that weapon.

-----------------------------------------------------------------------------------------------*/

(function() {

//Maximum ep upper limit (maximum ep grows up to this value)
MaxEPDefaultMax = 30;

//Declaration of Ep
ParamType.MEP = 100;

//Are the EP settings set?
OT_isEPCustom = function(obj, paramName)
{
	if( obj == null )
	{
		return false;
	}
	
	if( obj.custom.OT_EP == null )
	{
		return false;
	}
	
	if( paramName == null ) {
		return true;
	}
	
	if( typeof obj.custom.OT_EP[paramName] == 'undefined' ) {
		return false;
	}
	
	return true;
};

// Get Ep usage value
OT_GetUseEP = function(unit, value)
{
	var unitMaxEp = OT_GetMaxEP(unit);
	return OT_GetEPValue(value, unitMaxEp);
};

// Get the object's ep usage value
OT_GetItemUseEP = function(unit, obj)
{
	if(unit == null || obj == null)
	{
		return 0;
	}
	
	if(!OT_isEPCustom(obj))
	{
		return 0;
	}
	
	return OT_GetUseEP(unit, obj.custom.OT_EP.Use);
};

// Normalize and obtain the value of Ep
OT_GetEPValue = function(value, epMax)
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
		var num = Math.floor( epMax * (percent / 100) );

		return parseInt(num);
	}
	else if( value.match(regexNum) )
	{
		return parseInt(value);
	}
	
	return 0;
};

// Get current remaining EP
OT_GetNowEP = function(unit)
{
	var ep;

	if (typeof unit.custom.tmpNowEp === 'number')
	{
		ep = unit.custom.tmpNowEp;
	}
	else
	{
		ep = 0;
	}
	
	return parseInt(ep);
};

// Set current remaining EP
OT_SetNowEP = function(unit, ep)
{
	var max = ParamBonus.getEp(unit);
	unit.custom.tmpNowEp = OT_GetEPValue(ep, max);
	unit.custom.tmpEpChange = true;
	
	if( unit.custom.tmpNowEp > max )
	{
		unit.custom.tmpNowEp = max;
	}
	else if( unit.custom.tmpNowEp < 0 )
	{
		unit.custom.tmpNowEp = 0;
	}
};

// Reply
OT_RecoveryNowEP = function(unit, value)
{
	var use = 0;
	var max = 0;
	
	if( unit == null || value == null )
	{
		return;
	}
	
	max = ParamBonus.getEp(unit);
	use = OT_GetEPValue( value, max );
	
	if (typeof unit.custom.tmpNowEp === 'number')
	{
		unit.custom.tmpNowEp += use;
	}
	else
	{
		unit.custom.tmpNowEp = 0;
	}

	if( unit.custom.tmpNowEp > max )
	{
		unit.custom.tmpNowEp = max;
	}
	else if( unit.custom.tmpNowEp < 0 )
	{
		unit.custom.tmpNowEp = 0;
	}
};

// Ep use
OT_UseNowEP = function(unit, value)
{
	var use = 0;
	var max = 0;
	
	if( unit == null || value == null )
	{
		return;
	}
	
	max = ParamBonus.getEp(unit);
	use = OT_GetEPValue( value, max );
	
	if (typeof unit.custom.tmpNowEp === 'number')
	{
		unit.custom.tmpNowEp -= use;
	}
	else
	{
		unit.custom.tmpNowEp = 0;
	}

	if( unit.custom.tmpNowEp > max )
	{
		unit.custom.tmpNowEp = max;
	}
	else if( unit.custom.tmpNowEp < 0 )
	{
		unit.custom.tmpNowEp = 0;
	}
};

// Get current max ep (for external reference)
OT_GetMaxEP = function(unit)
{
	var ep;

	if (typeof unit.custom.tmpMaxEp === 'number')
	{
		ep = unit.custom.tmpMaxEp;
	}
	else
	{
		ep = 0;
	}
	
	return parseInt(ep);
};

// Set current max ep (for external reference)
OT_SetMaxEP = function(unit, ep)
{
	unit.custom.tmpMaxEp = ep;
};

// Get used ep (character)
OT_GetStringUseEP = function(obj)
{
	if( obj == null )
	{
		return 0;
	}
	
	if( !OT_isEPCustom(obj) )
	{
		return 0;
	}
	
	if( obj.custom.OT_EP.Use == null )
	{
		return 0;
	}

	var regex = /^(\-?)([0-9]+)(\%?)$/;
	if (typeof obj.custom.OT_EP.Use === 'number')
	{
		ep = obj.custom.OT_EP.Use;
	}
	else if(obj.custom.OT_EP.Use.match(regex))
	{
		ep = obj.custom.OT_EP.Use;
	}
	else
	{
		ep = 0;
	}
	
	return '' + ep;
};

// Obtain ep obtained during battle
OT_GetBattleBonusEP = function(unit, weapon)
{
	var i, count, item, n, id;
	var d = 0;
	var arr = [];
	var BattleBonusEP = {
		  Hit:0
		, NoHit:0
		, Damage:0
		, Avoid:0
	};

	var unitClass = unit.getClass();
	// EP obtained when attacking
	if( OT_isEPCustom(unitClass, 'BattleBonus') ) {
		BattleBonusEP.Hit    += OT_GetUseEP(unit, unitClass.custom.OT_EP.BattleBonus.Hit);
		BattleBonusEP.NoHit  += OT_GetUseEP(unit, unitClass.custom.OT_EP.BattleBonus.NoHit);
		BattleBonusEP.Damage += OT_GetUseEP(unit, unitClass.custom.OT_EP.BattleBonus.Damage);
		BattleBonusEP.Avoid  += OT_GetUseEP(unit, unitClass.custom.OT_EP.BattleBonus.Avoid);
	}

	if (weapon !== null) {
		if( OT_isEPCustom(weapon, 'BattleBonus') ) {
			BattleBonusEP.Hit    += OT_GetUseEP(unit, weapon.custom.OT_EP.BattleBonus.Hit);
			BattleBonusEP.NoHit  += OT_GetUseEP(unit, weapon.custom.OT_EP.BattleBonus.NoHit);
			BattleBonusEP.Damage += OT_GetUseEP(unit, weapon.custom.OT_EP.BattleBonus.Damage);
			BattleBonusEP.Avoid  += OT_GetUseEP(unit, weapon.custom.OT_EP.BattleBonus.Avoid);
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
			
			// By calling ItemControl.isItemUsable,
			// Corrections are disabled for units whose use is not permitted.
			if (ItemControl.isItemUsable(unit, item)) {
				if( OT_isEPCustom(item, 'BattleBonus') ) {
					BattleBonusEP.Hit    += OT_GetUseEP(unit, item.custom.OT_EP.BattleBonus.Hit);
					BattleBonusEP.NoHit  += OT_GetUseEP(unit, item.custom.OT_EP.BattleBonus.NoHit);
					BattleBonusEP.Damage += OT_GetUseEP(unit, item.custom.OT_EP.BattleBonus.Damage);
					BattleBonusEP.Avoid  += OT_GetUseEP(unit, item.custom.OT_EP.BattleBonus.Avoid);
				}
			}
		}
	}

	var i, state;
	var list = unit.getTurnStateList();
	var count = list.getCount();
	
	for (i = 0; i < count; i++) {
		state = list.getData(i).getState();
		
		if( OT_isEPCustom(state, 'BattleBonus') ) {
			BattleBonusEP.Hit    += OT_GetUseEP(unit, state.custom.OT_EP.BattleBonus.Hit);
			BattleBonusEP.NoHit  += OT_GetUseEP(unit, state.custom.OT_EP.BattleBonus.NoHit);
			BattleBonusEP.Damage += OT_GetUseEP(unit, state.custom.OT_EP.BattleBonus.Damage);
			BattleBonusEP.Avoid  += OT_GetUseEP(unit, state.custom.OT_EP.BattleBonus.Avoid);
		}
	}

	return BattleBonusEP;
};

// Get Ep charge amount (unit, class, item)
OT_GetEPRecovery = function(unit)
{
	return OT_GetEPRecoveryBonus(unit, unit) + OT_GetEPRecoveryBonus(unit, unit.getClass()) + OT_GetEPRecoveryItemBonus(unit);
	//return this.getClassUnitValue(unit, index) + this.getUnitTotalParamBonus(unit, index) + StateControl.getStateParameter(unit, index);
};

// Get Ep charge amount (unit, class, item, state)
OT_GetEPRecoveryAll = function(unit)
{
	return OT_GetEPRecovery(unit) + StateControl.getEpValue(unit);
	//return this.getClassUnitValue(unit, index) + this.getUnitTotalParamBonus(unit, index) + StateControl.getStateParameter(unit, index);
};

// Get the ep charge amount for each object
OT_GetEPRecoveryBonus = function(unit, obj)
{
	var Ep;
	var max = ParamBonus.getEp(unit);
	
	if( !OT_isEPCustom(obj) ) return 0;
	
	if (obj.custom.OT_EP.Recovery != null)
	{
		Ep = OT_GetEPValue( obj.custom.OT_EP.Recovery, max );
	}
	else
	{
		Ep = 0;
	}
	
	return Ep;
};

// Get the ep charge amount of your inventory
OT_GetEPRecoveryItemBonus = function(unit)
{
	var i, count, item, n, id;
	var d = 0;
	var weapon = ItemControl.getEquippedWeapon(unit);
	var arr = [];
	
	if (weapon !== null) {
		d += OT_GetEPRecoveryBonus(unit, weapon);
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
			
			n = OT_GetEPRecoveryBonus(unit, item);
			// By calling ItemControl.isItemUsable,
			// Corrections are disabled for units whose use is not permitted.
			if (n !== 0 && ItemControl.isItemUsable(unit, item)) {
				d += n;
			}
		}
	}
	
	return d;
};

// Get ep cost due to movement
OT_GetMoveCostEP = function(obj, movePoint)
{
	if( obj == null )
	{
		return 0;
	}
	
	if( !OT_isEPCustom(obj) )
	{
		return 0;
	}

	var cost = 0;
	if( typeof obj.custom.OT_EP.MoveCost === 'number' )
	{
		cost = Math.floor(obj.custom.OT_EP.MoveCost * movePoint);
	}
	
	return cost;
};

UnitParameter.MEP = defineObject(BaseUnitParameter,
{	
	getUnitValue: function(unit) {
		var ep;
		
		if( !OT_isEPCustom(unit) ) return 0;

		if (typeof unit.custom.OT_EP.Value === 'number') {
			ep = unit.custom.OT_EP.Value;
		}
		else {
			ep = 0;
		}
		
		return ep;
	},
	
	setUnitValue: function(unit, value) {
		if( !OT_isEPCustom(unit) )
		{
			unit.custom.OT_EP = {};
		}

		unit.custom.OT_EP.Value = value;
	},

	// Get the amount of ep recovery per turn
	getUnitRecoveryValue: function(unit) {
		var ep;
		
		if( !OT_isEPCustom(unit) ) return 0;

		var value = unit.custom.OT_EP.Recovery;
		if (typeof value === 'number') {
			ep = value;
		} else if(typeof value === 'string') {
			var regex = /^([\-]*[0-9]+)\%$/;
			var regexNum = /^([\-]*[0-9]+)$/;
			
			if(value.match(regex)) {
				ep = value;
			} else if(value.match(regexNum)) {
				ep = parseInt(value);
			} else {
				ep = 0;
			}
		} else {
			ep = 0;
		}
		
		return ep;
	},

	// Set the amount of FP recovery per turn
	setUnitRecoveryValue: function(unit, value) {
		if( !OT_isEPCustom(unit) )
		{
			unit.custom.OT_EP = {};
		}

		unit.custom.OT_EP.Recovery = value;
	},

	// Obj is a unit, class, weapon, etc.
	getParameterBonus: function(obj) {
		var ep;
		
		if( obj == null ) return 0;

		if( !OT_isEPCustom(obj) ) return 0;
		
		if (typeof obj.custom.OT_EP.Value === 'number')
		{
			ep = obj.custom.OT_EP.Value;
		}
		else
		{
			ep = 0;
		}
		
		return ep;
	},
	
	// Obj is a unit, class, weapon, etc.
	getGrowthBonus: function(obj) {
		var ep;
		
		if( obj == null ) return 0;

		if( !OT_isEPCustom(obj) ) return 0;

		if (typeof obj.custom.OT_EP.Growth === 'number') {
			ep = obj.custom.OT_EP.Growth;
		}
		else {
			ep = 0;
		}
		
		return ep;
	},
	
	// Obj can be command parameter change, item, state, or turn state
	getDopingParameter: function(obj) {
		var ep;
		
		if( obj == null ) return 0;

		try
		{
			// If it is a turn state, get state() will be processed normally.
			var state = obj.getState();
			var turn = state.getTurn() - obj.getTurn();
			if( !OT_isEPCustom(state) ) return 0;
			
			if (typeof state.custom.OT_EP.Doping === 'number') {
				ep = state.custom.OT_EP.Doping;
				
				if( ep > 0 )
				{
					ep = ep - ( state.getTurnChangeValue() * turn );
				}
				else if( ep < 0 )
				{
					ep = ep + ( state.getTurnChangeValue() * turn );
				}
			}
			else {
				ep = 0;
			}
		}
		catch (e)
		{
			// If it is not the turn state, get state() will always fail, so perform the following process.
			if (typeof obj.custom !== 'object') {
				return 0;
			}
			
			if( !OT_isEPCustom(obj) ) return 0;
	
			if (typeof obj.custom.OT_EP.Doping === 'number') {
				ep = obj.custom.OT_EP.Doping;
			}
			else {
				ep = 0;
			}
		}

		return ep;
	},
	
	getMaxValue: function(unit) {
		var epMax;
		
		if (root.getUserExtension().isClassLimitEnabled())
		{
			if ( OT_isEPCustom(unit.getClass()) && typeof unit.getClass().custom.OT_EP.Max === 'number')
			{
				epMax = unit.getClass().custom.OT_EP.Max;
			}
			else if ( root.getMetaSession().global.OT_EP != null && typeof root.getMetaSession().global.OT_EP.Max === 'number')
			{
				epMax = root.getMetaSession().global.OT_EP.Max;
			}
			else
			{
				epMax = MaxEPDefaultMax;
			}
		}
		else
		{
			if ( root.getMetaSession().global.OT_EP != null && typeof root.getMetaSession().global.OT_EP.Max === 'number')
			{
				epMax = root.getMetaSession().global.OT_EP.Max;
			}
			else
			{
				epMax = MaxEPDefaultMax;
			}
		}
		
		return epMax;
	},
	
	getMinValue: function(unit) {
		return 0;
	},

	getParameterType: function() {
		return ParamType.MEP;
	},

	getParameterName: function() {
		return OT_EPFrameSetting.Name;
	}
}
);

// Obtain the character's maximum EP value (including additional bonuses for classes and items)
ParamBonus.getEp = function(unit)
{
	var n = this.getBonus(unit, ParamType.MEP);
	
	// Holds values ​​for external references
	OT_SetMaxEP(unit, n);
	return n;
};

// Get the character's maximum ep value (unit and class total)
ParamBonus.getEpClassUnit = function(unit)
{
	var i, typeTarget, n;
	var index = -1;
	var count = ParamGroup.getParameterCount();
	var type = ParamType.MEP;
	
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

// Make ep visible in the unit menu
var alias1 = ParamGroup._configureUnitParameters;
ParamGroup._configureUnitParameters = function(groupArray) {
	alias1.call(this, groupArray);
	groupArray.insertObject(UnitParameter.MEP, 1);
};

// Add ep consumption to the method that determines whether a weapon can be equipped or not.
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
	
	var unitEp = OT_GetNowEP(unit);
	
	// Max ep will crash in an infinite loop if you don't get something for external reference
	var unitMaxEp = OT_GetMaxEP(unit);

	var weaponEp = 0;
	if ( OT_isEPCustom(weapon) )
	{
		weaponEp = OT_GetEPValue( weapon.custom.OT_EP.Use, unitMaxEp );
	}

	if(weaponEp > 0)
	{
		if(typeof unit.custom.tmpMoveEP === 'number')
		{
			weaponEp += unit.custom.tmpMoveEP;
		}
	}
		
	// A weapon can be equipped only if the unit's ep exceeds the weapon's ep consumption.
	return unitEp >= weaponEp;
};

/*
//Set EP when unit appears (obsolete)
var alias5 = Miscellaneous.setupFirstUnit;
Miscellaneous.setupFirstUnit = function(unit)
{
	alias5.call(this, unit);
	
	unit.custom.tmpNowEp = ParamBonus.getEp(unit);
	unit.custom.tmpUseEP = 0;
};
*/

// Adjusted ep when equipping items
var alias6 = ItemControl.updatePossessionItem;
ItemControl.updatePossessionItem = function(unit)
{
	alias6.call(this, unit);

	var scene = root.getCurrentScene();
	
	// If the scene is neither FREE nor EVENT, EP is always the maximum EP.
    // If you do not check this, the EP will change due to item exchange on the map or increase or decrease of items in events.
	if (scene !== SceneType.FREE && scene !== SceneType.EVENT) {
		unit.custom.tmpNowEp = ParamBonus.getEp(unit);
	}
	
	// Prevent Ep from exceeding max ep
	OT_SetNowEP(unit, OT_GetNowEP(unit));
};

// EP automatic recovery by state
var alias7 = RecoveryAllFlowEntry._completeMemberData;
RecoveryAllFlowEntry._completeMemberData = function(turnChange)
{
	var result = alias7.call(this, turnChange);
	var unit, recoveryValue;
	var list = TurnControl.getActorList();
	var count = list.getCount();

	var commandCount = 0;
	var isSkipMode = CurrentMap.isTurnSkipMode();
	var generator = this._dynamicEvent.acquireEventGenerator();
	
	for (var i = 0 ; i < count; i++) {
		unit = list.getData(i);

		recoveryValue = OT_GetEPRecovery(unit);
		recoveryValue += StateControl.getEpValue(unit);

		OT_RecoveryNowEP(unit, recoveryValue);

		// If you want to add a state if Ep is within the specified range
		if( OT_isEPCustom(unit.getClass()) )
		{
			var add = unit.getClass().custom.OT_EP.AddState;
			var nowEP = OT_GetNowEP(unit);
			var unitMaxEp = ParamBonus.getEp(unit);

			if(typeof add === 'object')
			{
				var list2 = root.getBaseData().getStateList();
				var length = add.length;
				for(var j = 0; j < length; j++)
				{
					var obj = add[j];
					var length2 = obj['State'].length;

					if(OT_isValueInRange(nowEP, unitMaxEp, obj['Range']))
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

// Get Ep natural recovery value
StateControl.getEpValue = function(unit) {
	var i, state;
	var list = unit.getTurnStateList();
	var count = list.getCount();
	var recoveryValue = 0;
	
	for (i = 0; i < count; i++) {
		state = list.getData(i).getState();
		
		if ( OT_isEPCustom(state) )
		{
			recoveryValue += OT_GetEPValue(state.custom.OT_EP.Recovery, ParamBonus.getEp(unit));
		}
	}
	
	return recoveryValue;
};

// Adjust maximum ep value when item is lost
var alias8 = ItemControl.deleteItem;
ItemControl.deleteItem = function(unit, item)
{
	var result = alias8.call(this, unit, item);
	
	ItemControl.updatePossessionItem(unit);
	
	return result;
};

// Add ep consumption to the method that determines whether the item can be used
var alias9 = ItemControl.isItemUsable;
ItemControl.isItemUsable = function(unit, item) {
	var result = alias9.call(this, unit, item);
	
	if (!result)
	{
		// Unavailable, do not continue
		return false;
	}
	
	var unitEp = OT_GetNowEP(unit);
	
	// Max ep will crash in an infinite loop if you don't get something for external reference
	var unitMaxEp = OT_GetMaxEP(unit);
	var itemEp = 0;
	
	if ( OT_isEPCustom(item) )
	{
		itemEp = OT_GetEPValue( item.custom.OT_EP.Use, unitMaxEp );
	}

	if(itemEp > 0)
	{
		if(typeof unit.custom.tmpMoveEP === 'number')
		{
			itemEp += unit.custom.tmpMoveEP;
		}
	}

	// The condition is that the unit's ep exceeds the item's consumed ep.
	return unitEp >= itemEp;
};

// Consumes ep when using items
var alias10 = ItemUseParent.decreaseItem;
ItemUseParent.decreaseItem = function() {
	alias10.call(this);
	
	var unit = this._itemTargetInfo.unit;
	var item = this._itemTargetInfo.item;
	var unitEp = OT_GetNowEP(unit);
	var unitMaxEp = ParamBonus.getEp(unit);
	var weaponEp = 0;

	if( OT_isEPCustom(item) )
	{
		itemEp = OT_GetEPValue( item.custom.OT_EP.Use, unitMaxEp );
		OT_UseNowEP(unit, itemEp);
	}
};

// If recovery is allowed in the base settings, make sure your allies have full EP when selecting a sortie.
var alias11 = UnitProvider.recoveryPrepareUnit;
UnitProvider.recoveryPrepareUnit = function(unit)
{
	alias11.call(this, unit);
	OT_SetNowEP(unit, ParamBonus.getEp(unit));
};

// Fully recover the ep of test member units and reinforcement units
var alias12 = ScriptCall_AppearEventUnit;
ScriptCall_AppearEventUnit = function(unit)
{
	alias12.call(this, unit);
	OT_SetNowEP(unit, ParamBonus.getEp(unit));
};

// Fully recover the EP of the character placed on the map from the beginning
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
			OT_SetNowEP(unit, ParamBonus.getEp(unit));
		}
	}
	
	list = root.getCurrentSession().getGuestList();
	count = list.getCount();
	for (j = 0; j < count; j++) {
		unit = list.getData(j);
		OT_SetNowEP(unit, ParamBonus.getEp(unit));
	}
};

// Characters who become friends through information gathering have never had their EP adjusted.
// Correct when selecting a character to deploy and selecting unit information.
var alias14 = UnitSortieScreen.setScreenData;
UnitSortieScreen.setScreenData = function(screenParam) {
	alias14.call(this, screenParam);
	
	var i, unit;
	var list = PlayerList.getMainList();
	var count = list.getCount();
	
	for (i = 0; i < count; i++) {
		unit = list.getData(i);
		
		if( unit.custom.tmpEpChange != true)
		{
			//root.log(unit.getName());
			OT_SetNowEP(unit, ParamBonus.getEp(unit));
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
		
		if( unit.custom.tmpEpChange != true)
		{
			//root.log(unit.getName());
			OT_SetNowEP(unit, ParamBonus.getEp(unit));
		}
	}
};

// Determine if there is enough ep when attacking during battle
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
	var unitEp = OT_GetNowEP(unit);
	var unitMaxEp = ParamBonus.getEp(unit);
	var weaponEp = 0;

	if( OT_isEPCustom(weapon) )
	{
		weaponEp = OT_GetEPValue( weapon.custom.OT_EP.Use, unitMaxEp );
		
		// Cannot attack when not enough ep is consumed
		if(unitEp < weaponEp + unit.custom.tmpUseEP)
		{
			return false;
		}
	}

	return true;
};

// Adds ep consumed each time you attack during battle
var alias201 = NormalAttackOrderBuilder._createAndRegisterAttackEntry;
NormalAttackOrderBuilder._createAndRegisterAttackEntry = function(virtualActive, virtualPassive) {
	var attackEntry = alias201.call(this, virtualActive, virtualPassive);
	
	var weapon = virtualActive.weapon;
	if (weapon !== null) {
		var unit = virtualActive.unitSelf;
		var targetUnit = virtualPassive.unitSelf;
		var unitMaxEp = ParamBonus.getEp(unit);
		var weaponEp = 0;
	
		if( OT_isEPCustom(weapon) )
		{
			weaponEp = OT_GetEPValue( weapon.custom.OT_EP.Use, unitMaxEp );
			unit.custom.tmpUseEP += weaponEp;
		}

		// EP obtained when attacking
		var bonus = OT_GetBattleBonusEP(unit, weapon);
		if( attackEntry.isHit ) {
			unit.custom.tmpUseEP -= bonus.Hit;
		} else {
			unit.custom.tmpUseEP -= bonus.NoHit;
		}

		// ep obtained when defending
		var bonus2 = OT_GetBattleBonusEP(targetUnit, virtualPassive.weapon);
		if( attackEntry.isHit ) {
			targetUnit.custom.tmpUseEP -= bonus2.Damage;
		} else {
			targetUnit.custom.tmpUseEP -= bonus2.Avoid;
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
	
	OT_UseNowEP(active, active.custom.tmpUseEP );
	OT_UseNowEP(passive, passive.custom.tmpUseEP);
	//root.log('_endVirtualAttack'+active.getName()+active.custom.tmpUseFP);
	//root.log('_endVirtualAttack'+passive.getName()+passive.custom.tmpUseFP);

	active.custom.tmpUseEP  = 0;
	passive.custom.tmpUseEP = 0;
};

// Add ep to use when creating virtual attack
var alias203 = VirtualAttackControl.createVirtualAttackUnit;
VirtualAttackControl.createVirtualAttackUnit = function(unitSelf, targetUnit, isSrc, attackInfo)
{
	var virtualAttack = alias203.call(this, unitSelf, targetUnit, isSrc, attackInfo);
	
	unitSelf.custom.tmpUseEP = 0;
	
	return virtualAttack;
};

// EP consumption when moving (tentative)
// Processing when each character moves
// Get the movement cost at this time
var alias300 = SimulateMove.startMove;
SimulateMove.startMove = function(unit, moveCource)
{
	alias300.call(this, unit, moveCource);

	var objClass = unit.getClass();
	if( OT_isEPCustom(objClass) )
	{
		if( typeof objClass.custom.OT_EP.MoveCost === 'number' )
		{
			// Save expended movement power
			this._saveMostResentMov(unit, moveCource);
			var cost = objClass.custom.OT_EP.MoveCost;
			unit.custom.tmpMoveEP = Math.floor(unit.getMostResentMov() * cost);
			//root.log(unit.custom.tmpMoveEP);
		}
	}
};

// During player action
var alias301 = MapSequenceCommand._doLastAction;
MapSequenceCommand._doLastAction = function()
{
	var result = alias301.call(this);
	var p = 0;

	if(typeof this._targetUnit.custom.tmpMoveEP === 'number')
	{
		p = this._targetUnit.custom.tmpMoveEP;
	}
	
	if (result === 0 || result === 1) {
		//root.log(this._targetUnit.getName());
		//root.log(p);
		OT_UseNowEP(this._targetUnit, p);
	}
	
	delete this._targetUnit.custom.tmpMoveEP;
	return result;
};

// For relocation
var alias302 = RepeatMoveFlowEntry.moveFlowEntry;
RepeatMoveFlowEntry.moveFlowEntry = function()
{
	var result = alias302.call(this);
	if (result === MoveResult.END) {
		this._mapSequenceArea.UseEP();
	}
	
	return result;
};

MapSequenceArea.UseEP = function()
{
	var p = 0;

	if(typeof this._targetUnit.custom.tmpMoveEP === 'number')
	{
		p = this._targetUnit.custom.tmpMoveEP;
	}

	//root.log(this._targetUnit.getName());
	//root.log(p);
	OT_UseNowEP(this._targetUnit, p);
	delete this._targetUnit.custom.tmpMoveEP;
};

// Exclusive to skip when enemy moves
var alias303 = SimulateMove.skipMove;
SimulateMove.skipMove = function(unit, moveCource)
{
	var objClass = unit.getClass();
	if( OT_isEPCustom(objClass) )
	{
		if( typeof objClass.custom.OT_EP.MoveCost === 'number' )
		{
			// Save expended movement power
			this._saveMostResentMov(unit, moveCource);
			var cost = objClass.custom.OT_EP.MoveCost;
			unit.custom.tmpMoveEP = Math.floor(unit.getMostResentMov() * cost);
			//root.log(unit.custom.tmpEP);
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
	if(typeof this._unit.custom.tmpMoveEP === 'number')
	{
		p = this._unit.custom.tmpMoveEP;
	}

	OT_UseNowEP(this._unit, p);
	delete this._unit.custom.tmpMoveEP;

	return result;
};

// Control when enemy AI decides to take action
// According to the official source, the weapon and opponent used for attack are determined during the first check, and the movement location is determined during the second check.
// In the first check, if there is no point where the consumed EP does not exceed the remaining EP amount, control will not be performed with that weapon,
// The second check controls the movement so that the consumed EP does not exceed the remaining EP amount.
var alias305 = CombinationSelector._getTotalScore;
CombinationSelector._getTotalScore = function(unit, combination)
{
	var totalScore = alias305.call(this, unit, combination);

	// If the movement EP cost + attack EP cost exceeds the remaining EP amount, do not perform that action.
	if( OT_isEPCustom(combination.item) )
	{
		var unitEp = OT_GetNowEP(unit);
		var unitMaxEp = OT_GetMaxEP(unit);

		// 第一チェックではposIndexが0である
		if( combination.posIndex == 0 )
		{
			// During the first check, exclude actions where the remaining ep amount is negative no matter where you take the action.
			count = combination.costArray.length;
			for (var i = 0; i < count; i++) {
				var costData = combination.costArray[i];
				var useEP = OT_GetEPValue( combination.item.custom.OT_EP.Use, unitMaxEp ) + OT_GetMoveCostEP(unit.getClass(), costData.movePoint);
				
				if(unitEp - useEP >= 0)
				{
					return totalScore;
				}
			}
			return -1;
		}
		else
		{
			// During the second check, exclude those that move to a point where the remaining ep amount becomes negative.
			var useEP = OT_GetEPValue( combination.item.custom.OT_EP.Use, unitMaxEp ) + OT_GetMoveCostEP(unit.getClass(), combination.movePoint);

			if(unitEp - useEP < 0)
			{
				return -1;
			}
		}
	}
	
	return totalScore;
};

})();
