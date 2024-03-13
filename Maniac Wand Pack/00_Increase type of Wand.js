
/*--------------------------------------------------------------------------
  
　00_Weapon type: Increase staff

■Summary
Usually, there is only one weapon type: cane (weapon type: among the items, only ID:0 is judged as a cane).
Weapon type: The weapon type added to the item can be set as a cane, and the types of canes can be increased.

*This plugin is for "classes that can use canes (classes that have checked the class details to be able to use canes)"
This is a plug-in that allows you to categorize the canes you use.
(If a unit of a class that cannot use a staff learns a skill that allows it to use a staff, it currently has no effect.)

■Advance preparation
Weapon type: Please enter {isWand:XX} (XX is a value of 1 or more) in the custom parameter of the weapon type added to the item.
As a result, the weapon type will be determined as a cane, and you can use it with the "cane" command.

■Customize
・I want to create two additional "weapon type: canes" and specify whether or not "traditional cane", "added cane 1", and "added cane 2" can be used for each class.
→ First, add {isWand:1} to the custom parameters of “Added Wand 1”
Please specify {isWand:2} in the custom parameter of "Added Wand 2"

　　　On top of that, check the class that can use a cane (the class that has checked the class details to be able to use a cane).
Set the following in custom parameters

A. Classes that want to use all of the “traditional cane”, “added cane 1”, and “added cane 2”
　　　　　　→You don't have to do anything in particular.

B. A class that only wants to use “added wand 1”
→ Please enter {extraWandId:[1]} in the custom parameter of the class.

C. A class that only wants to use “added wand 2”
→ Please enter {extraWandId:[2]} in the custom parameter of the class

D. A class where you only want to use a “traditional cane”
→ Please enter {extraWandId:[0]} in the custom parameter of the class.

E. Classes that want to use two types: “traditional cane” and “added cane 1”
→ Please enter {extraWandId:[0,1]} in the custom parameter of the class
F. Classes that want to use two types: “traditional cane” and “added cane 2”
→ Please enter {extraWandId:[0,2]} in the custom parameter of the class

G. Classes that want to use two types: “Added Staff 1” and “Added Staff 2”
→ Please enter {extraWandId:[1,2]} in the custom parameter of the class


18/12/01 New creation
18/12/02 For classes that can use canes, it is now possible to specify which of the added "weapon types: canes" can be used.
21/01/10 Compatible with FPEP plugin
21/09/17 Compatible with 1.244
23/11/18 1.288 compatible


■Compatible version
　SRPG Studio Version:1.288


■Terms
・Use is limited to games using SRPG Studio.
・It doesn't matter if it's commercial or non-commercial. It's free.
・There are no problems with processing, etc. Please keep modifying it.
・No credit specified OK
・Redistribution and reprint OK
・Please comply with the SRPG Studio Terms of Use.
  
--------------------------------------------------------------------------*/


//-------------------------------------------------------
// Settings (external)
//-------------------------------------------------------
var isWandTypeExtra = true;				// For judgment with different plugins




(function() {
//-------------------------------------------------------
// Settings (for internal use)
//-------------------------------------------------------




//-------------------------------------------------------
// Below is the program
//-------------------------------------------------------

//-----------------------------
// Wand checker class
//-----------------------------
// Determining whether the cane is usable or not
WandChecker.isWandUsableInternal= function(unit, wand) {
		var obj;
		
		if( this.isWand(wand) == false ) {
			return false;
		}
		
		if (!ItemControl.isItemUsable(unit, wand)) {
			return false;
		}
		
		obj = ItemPackageControl.getItemAvailabilityObject(wand);
		if (obj === null) {
			return false;
		}
		
		return obj.isItemAvailableCondition(unit, wand);
}


// Determining whether it is a cane or not
WandChecker.isWand= function(item) {
		// Wand.is wand() if itue (conventional processing)
		if ( item.isWand() == true ) {
			return true;
		}
		
		// Wand checker.is extra wand() if itue (additional processing)
		if( this.isExtraWand(item) == true ) {
			return true;
		}
		
		return false;
}


// Added weapon type: Cane staff (additional processing) 
WandChecker.isExtraWand= function(item) {
		// Returns whether the added "weapon type: cane"
		return this.isExtraWandWeaponType(item.getWeaponType());
}


// Added weapon type: Cane staff (additional processing)
WandChecker.isExtraWandWeaponType= function(weaponType) {
		// If the weapon type has a custom parameter {is wand:xx} (xx is 1 or more), it is the added "weapon type: wand". 
		var isWand = weaponType.custom.isWand;
		if (typeof isWand === 'number' && isWand >= 1) {
			return true;
		}
		
		return false;
}


// Determining whether or not a unit that can use a normal staff is a combination of a normal staff.
WandChecker.isUnitUsableTargetWand= function(unit, item) {
		// Get cane type id
		var wandTypeId = this.getWandTypeId(item);

		// Returns whether the cane type ID and the unit's usable cane types match.
		return this.isUnitUsableWandTypeId( unit, wandTypeId);
}


// Normal weapon type: Is the unit capable of using canes (additional processing)? 
WandChecker.getWandTypeId= function(item) {
		// If the item is a cane, the cane type ID is 0.
		if( item.isWand() == true ) {
			return 0;
		}
		
		// If the weapon type does not have a custom parameter {is wand:xx} (xx is greater than or equal to 1) or is less than 1, an error occurs (returns 1)
		var isWand = item.getWeaponType().custom.isWand;
		if (typeof isWand !== 'number' || isWand < 1) {
			return -1;
		}
		
		// If the weapon type has a custom parameter {is wand:xx} (xx is 1 or more), that value becomes the wand type ID.
		return isWand;
}


// Normal weapon type: Is the unit capable of using canes (additional processing)? 
WandChecker.isUnitUsableWandTypeId= function(unit, wandTypeId) {
		var i, cnt;
		
		// If the cane type ID is 1, it is false because it is not a cane.
		if ( wandTypeId == -1 ) {
			return false;
		}
		
		// False if the unit is a class that cannot use wands.
		if ( !(unit.getClass().getClassOption() & ClassOptionFlag.WAND) ) {
			return false;
		}
		
		// If there is no Custom Parameter related to the added "weapon type: staff", it will be matched unconditionally.
		// (If Custom Parameter is not specified for the class, any staff can be used.)
		var extraWandIdArr = this.getExtraWandArray(unit.getClass());
		if( extraWandIdArr == null ) {
			return true;
		}
		
		// True if the added "weapon type: wand" array has something that matches the wand type id
		cnt = extraWandIdArr.length
		for( i = 0;i < cnt;i++ ) {
			if( extraWandIdArr[i] == wandTypeId ) {
				return true;
			}
		}
		
		// True if the added "weapon type: wand" array has something that matches the wand type id
		return false;
}


// Get array of usable "weapon type: staff" from class Custom Parameter
WandChecker.getExtraWandArray= function(cls) {
		var extraWandId = cls.custom.extraWandId;
		
		// null if there is no array in the class's caspara
		if( typeof extraWandId === 'undefined' ) {
			return null;
		}
		
		return extraWandId;
}




//-------------------------------------------
// Base item info class
//-------------------------------------------
var alias10 = BaseItemInfo.getItemTypeName;
BaseItemInfo.getItemTypeName= function(name) {
		if( WandChecker.isExtraWand(this._item) ) {
			return name + StringTable.ItemWord_SuffixWand;
		}
		return alias10.call(this, name);
}




//-------------------------------------------
// State score checker class
//-------------------------------------------
var alias20 = StateScoreChecker._getFlagData;
StateScoreChecker._getFlagData= function(unit, flag) {
		var data = alias20.call(this, unit, flag);
		
		var i, item;
		var count = UnitItemControl.getPossessionItemCount(unit);
		
		for (i = 0; i < count; i++) {
			item = UnitItemControl.getItem(unit, i);
			if (item === null) {
				continue;
			}
			
			if (flag & BadStateFlag.WAND) {
				if (ItemControl.isItemUsable(unit, item) && WandChecker.isExtraWand(item)) {
					data.wand++;
				}
			}
		}
		
		return data;
}




//-------------------------------------------
// Item control class
//-------------------------------------------
// Check if unit can use item
var alias30 = ItemControl.isItemUsable;
ItemControl.isItemUsable= function(unit, item) {
		var result = alias30.call(this, unit, item);
		
		// If it is not a cane, the conventional process will end.
		if (!WandChecker.isWand(item)) {
			return result;
		}
		
		// For canes, false unless the combination is with a class that can use the cane.
		if( !WandChecker.isUnitUsableTargetWand(unit, item) == true ) {
			return false;
		}
		
		// From now on, the judgment will be based on the class that can use the staff in question.
		
		// Since the normal cane has been checked, the result is returned as is.
		if (!WandChecker.isExtraWand(item)) {
			return result;
		}
		
		// Added weapon type: Staff only, check unchecked parts
		
		// False if there is not enough Ep
		if( this._isEpEnough(unit, item) !== true ) {
			return false;
		}
		
		// False if Fp is not enough
		if( this._isFpEnough(unit, item) !== true ) {
			return false;
		}
		
		// Find out if an item is prohibited from use
		if (StateControl.isBadStateFlag(unit, BadStateFlag.ITEM)) {
			return false;
		}
		
		// If the item is a wand, the class must be able to use wands.
		if (!(unit.getClass().getClassOption() & ClassOptionFlag.WAND)) {
			return false;
		}
		
		// Find out if the use of canes is prohibited
		if (StateControl.isBadStateFlag(unit, BadStateFlag.WAND)) {
			return false;
		}
		
		if (item.getItemType() === ItemType.KEY) {
			if( root.getScriptVersion() >= 1288 ) {
				if (!this._isItemTypeAllowed(unit, item)) {
					return false;
				}
			}
			else {
				if (item.getKeyInfo().isAdvancedKey()) {
					// If it is a "private key", the class must be able to use the key
					if (!(unit.getClass().getClassOption() & ClassOptionFlag.KEY)) {
						return false;
					}
				}
			}
		}
		
		// Check “Special Data”
		if (!this.isOnlyData(unit, item)) {
			return false;
		}
		
		return true;
}


// Get the key item including the flag from the items owned by the unit.
ItemControl.getKeyItem= function(unit, flag) {
		var i, item, info, isKey;
		var count = UnitItemControl.getPossessionItemCount(unit);
		
		// Examine items in order.
		//Items in the front have priority.
		for (i = 0; i < count; i++) {
			item = UnitItemControl.getItem(unit, i);
			if (item === null) {
				continue;
			}
			
			if (!item.isWeapon() && item.getItemType() === ItemType.KEY && this.isItemUsable(unit, item)) {
				isKey = false;
				info = item.getKeyInfo();
				
				// If it is a cane, do not return the item.
				if (!WandChecker.isWand(item)) {
					if (info.getKeyFlag() & flag) {
						isKey = true;
					}
					else {
						isKey = false;
					}
				}
				
				if (isKey) {
					return item;
				}
			}
		}
		
		return null;
}


// Check if there are enough EPs
ItemControl._isEpEnough= function(unit, item) {
		
		// True if there is no Ep ability score
		if( typeof ParamType.MEP === 'undefined' ) {
			return true;
		}
		
		// True if the item does not have ep specified
		if( item.custom.OT_EP == null ) {
			return true;
		}
		
		var unitEp = 0;
		if (typeof unit.custom.tmpNowEp === 'number') {
			unitEp = parseInt(unit.custom.tmpNowEp)
		}
		
		var unitMaxEp = 0;
		if (typeof unit.custom.tmpMaxEp === 'number') {
			unitMaxEp = parseInt(unit.custom.tmpMaxEp);
		}
		
		// Calculate item consumption ep
		var itemEp = this._getValueForExtraWand( item.custom.OT_EP.Use, unitMaxEp );
		
		if(itemEp > 0) {
			if(typeof unit.custom.tmpMoveEP === 'number') {
				itemEp += unit.custom.tmpMoveEP;
			}
		}
		
		// The condition is that the unit's ep exceeds the item's consumed ep.
		return unitEp >= itemEp;
}


// Check if there is enough Fp
ItemControl._isFpEnough= function(unit, item) {
		
		// True if there is no ability score of Fp
		if( typeof ParamType.MFP === 'undefined' ) {
			return true;
		}
		
		// True if the item does not have fp specified
		if( item.custom.OT_FP == null ) {
			return true;
		}
		
		var unitFp = 0;
		if (typeof unit.custom.tmpNowFp === 'number') {
			unitFp = parseInt(unit.custom.tmpNowFp)
		}
		
		var unitMaxFp = 0;
		if (typeof unit.custom.tmpMaxFp === 'number') {
			unitMaxFp = parseInt(unit.custom.tmpMaxFp);
		}
		
		// Calculate item consumption fp
		var itemFp = this._getValueForExtraWand( item.custom.OT_FP.Use, unitMaxFp );
		
		if(itemFp > 0) {
			if(typeof unit.custom.tmpMoveFP === 'number') {
				itemFp += unit.custom.tmpMoveFP;
			}
		}
		
		// The condition is that the unit's fp exceeds the item's consumed fp
		return unitFp >= itemFp;
}


// Normalize and obtain the Epfp value
ItemControl._getValueForExtraWand = function(value, valueMax)
{
	if( value == null ) {
		return 0;
	}
	
	if (typeof value === 'number') {
		return parseInt(value);
	}
	
	var regex = /^([\-]*[0-9]+)\%$/;
	var regexNum = /^([\-]*[0-9]+)$/;
	
	if(value.match(regex)) {
		var percent = parseInt(RegExp.$1);
		var num = Math.floor( valueMax * (percent / 100) );

		return parseInt(num);
	}
	else if( value.match(regexNum) ) {
		return parseInt(value);
	}
	
	return 0;
}




//-------------------------------------------
// Item select menu class
//-------------------------------------------
var alias40 = ItemSelectMenu._isItemUsable;
ItemSelectMenu._isItemUsable= function(item) {
		
		// The added wand can no longer be used from the item column.
		if (WandChecker.isExtraWand(item)) {
			return false;
		}
		
		return alias40.call(this, item);
}




//-------------------------------------------
// Calculator class
//-------------------------------------------
var alias50 = Calculator.calculateRecoveryItemPlus;
Calculator.calculateRecoveryItemPlus= function(unit, targetUnit, item) {
		var plus = alias50.call(this, unit, targetUnit, item);
		var itemType = item.getItemType();
		
		if (itemType !== ItemType.RECOVERY && itemType !== ItemType.ENTIRERECOVERY) {
			return plus;
		}
		
		// If the item is an added wand, add the user's magic power.
		if (WandChecker.isExtraWand(item)) {
			plus = ParamBonus.getMag(unit);
		}
		
		return plus;
}


var alias60 = Calculator.calculateDamageItemPlus;
Calculator.calculateDamageItemPlus= function(unit, targetUnit, item) {
		var plus = alias50.call(this, unit, targetUnit, item);

		var damageInfo, damageType;
		var itemType = item.getItemType();
		
		if (itemType !== ItemType.DAMAGE) {
			return plus;
		}

		damageInfo = item.getDamageInfo();
		damageType = damageInfo.getDamageType();
		// If the item is an added wand, add the user's magic power.
		if (WandChecker.isExtraWand(item)) {
			if (damageType === DamageType.MAGIC) {
				plus = ParamBonus.getMag(unit);
			}
		}
		
		return plus;
}


})();