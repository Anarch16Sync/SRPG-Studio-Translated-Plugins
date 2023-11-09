
/*--------------------------------------------------------------------------------------------------
  
  This is a script for activating skills from commands.
  It displays the "Command Skill" in the unit command.

  How to use :
  Set the skill's custom parameters to something like {EC_Command:'ATTACK'}.
  
  Created by :
  o-to
  
  Update history:
  06/12/2015: Newly created
  2016/01/11:Added EP, FP and number of turns to the display conditions of command skills
  2016/04/24: Fixed a bug that the standby type cannot proceed from the weapon selection screen if it does not have a weapon.
  2017/05/15:
  Fixed an issue where the command skill attached to an unequipped weapon is displayed when selecting a command skill.
  After selecting a command skill attached to a weapon, the weapon selection screen will now only show the weapon with the relevant skill.
  Fixed a bug where the number of times you used a command skill was not counted correctly when re-activating.
  
  30/05/2018:
  When a weapon with a command skill is not selectable
  Fixed a bug that allowed you to select the command skill of a weapon when the weapon with the command skill was not selectable.
  Fixed an issue with offensive command skills where you can't select an opponent that the skill doesn't work on when selecting a target after selecting a weapon (some conditions only).

  2019/10/06:
  Fixed a bug in the offensive command skill that if you turn off the "mouse control" option in the preferences
  Fixed an issue where the cursor would not move correctly when selecting a target to attack after selecting a weapon.
  Fixed an issue where the attack command skill would make a double sound when canceling after choosing a weapon.
  
  19/11/2019:
  Re-activation, support, parameter bonus and weapon use reduction can now be triggered by command skills.
  Added duration and cool time settings for command skills.
  If you have specified the weapon type as physical or magic in the skill activation conditions
  Fixed the weapon selection screen to show only the relevant weapons in the list.

  09/12/2019:
  Fixed a re-occurrence of a fix made on 10/06/2019.
  Fixed a bug in the weapon selection list for offensive command skills where the range of the weapon does not match the distance of the activation condition.

  2020/05/18:
  In version 1.210 of the studio, a new feature was added to allow you to change weapons when attacking and then cancel.
  Fixed an error when cancelling in the weapon selection screen of the attack type command skill.

  2023/10/24:
  Move some of the functions to ExtraConfigSkill.js
  Parameter bonus skill related changes have been significantly revised.
  
  Significantly revised the command display of command skills, the list of usable command skills, and the processing of the weapon list.
  Previously, it was determined whether a command skill could be used based on the current equipment state.
  If you can use command skills by equipping the weapon you own, even if you don't have it equipped.
  It will now be displayed in the command skill list,
  The weapon list has also been corrected so that weapons that fall outside of the activation conditions will not be displayed when equipped.
  From now on, the update history will not be included in the script header, but will be written in readme.txt.
  
--------------------------------------------------------------------------------------------------*/

OT_CommandDurationUndefined = -100; // For undefined durations (cannot be changed)
OT_CommandDefaultCoolTime = 0;	// Cool time default value (can be changed)

(function() {

var alias1 = UnitCommand.configureCommands;
UnitCommand.configureCommands = function(groupArray) {
	alias1.call(this, groupArray);
	groupArray.insertObject(UnitCommand.SkillCommand, groupArray.length - 1);
};

var OT_SkillCommandMode = {
	SKILL: 100,
	WEAPONSELECT: 101,
	TOP: 0,
	SELECTION: 1,
	RESULT: 2
};

// Get command validity time
EC_GetCommandDuration = function(skill) {
	if( skill == null ) {
		return OT_CommandDurationUndefined;
	}
	
	var duration = skill.custom.EC_CommandDuration;
	if( typeof skill.custom.EC_CommandDuration != 'number' ) {
		//root.log('test2:' + skill.getName() + duration);
		return OT_CommandDurationUndefined;
	}
	
	return duration;
};

// Get command validity time (Id)
EC_GetCommandDurationID = function(id) {
	var list = DataVariable.Sdb.getList();
	var skill = list.getDataFromId(id);
	if( skill != null ) {
		return EC_GetCommandDuration(skill);
	}
	return OT_CommandDurationUndefined;
};

// Get command execution cool time
EC_GetCommandCoolTime = function(skill) {
	if( skill == null ) {
		return OT_CommandDefaultCoolTime;
	}
	
	if( typeof skill.custom.EC_CommandCoolTime != 'number' ) {
		return OT_CommandDefaultCoolTime;
	}
	
	return skill.custom.EC_CommandCoolTime;
};

UnitCommand.SkillCommand = defineObject(UnitCommand.Attack,
{
	_skillSelectMenu: null,
	_weaponSelectMenu2: null,
	_selectSkillEntry: null,
	_selectWeapon: null,
	_skill: null,
	_weaponArray: null,

	moveCommand: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === OT_SkillCommandMode.SKILL) {
			result = this._moveSkill();
		}
		else if (mode === OT_SkillCommandMode.WEAPONSELECT) {
			// Weapon selection window for standby command skills
			result = this._moveWeapon();
		}
		else if (mode === OT_SkillCommandMode.TOP) {
			// Weapon selection window for offensive command skills
			result = this._moveTop();
		}
		else if (mode === OT_SkillCommandMode.SELECTION) {
			result = this._moveSelection();
		}
		else if (mode === OT_SkillCommandMode.RESULT) {
			result = this._moveResult();
		}
		
		return result;
	},

	drawCommand: function() {
		var mode = this.getCycleMode();
		
		if (mode === OT_SkillCommandMode.SKILL) {
			this._drawSkill();
		}
		else if (mode === OT_SkillCommandMode.WEAPONSELECT) {
			this._drawWeapon();
		}
		else if (mode === OT_SkillCommandMode.TOP) {
			this._drawTop();
		}
		else if (mode === OT_SkillCommandMode.SELECTION) {
			this._drawSelection();
		}
		else if (mode === OT_SkillCommandMode.RESULT) {
			this._drawResult();
		}
	},

	_prepareCommandMemberData: function() {
		this._weaponPrev = null;	//Processing for ver1.209
		UnitCommand.Attack._prepareCommandMemberData.call(this);
		this._skillSelectMenu = createObject(OT_SkillSelectMenu);
		this._weaponSelectMenu2 = createObject(OT_WeaponAllSelectMenu);
	},
	
	_completeCommandMemberData: function() {
		this._skillSelectMenu.setMenuTarget(this.getCommandTarget());
		this.changeCycleMode(OT_SkillCommandMode.SKILL);
	},
			
	_moveSkill: function() {
		var unit = this.getCommandTarget();
		var input = this._skillSelectMenu.moveWindowManager();
		var skill;
		
		if (input === ScrollbarInput.SELECT) {
			_selectSkillEntry = this._skillSelectMenu.getSelectSkillEntry();
			skill = _selectSkillEntry.skill;
			unit.custom.tmpCommandSkillID = skill.getId();
			this._skill = skill;

			switch( skill.custom.EC_Command )
			{
				case 'ATTACK':
					this._weaponSelectMenu.setMenuTarget(this.getCommandTarget());
					//if(_selectSkillEntry.objecttype === ObjectType.WEAPON) {
					//	this._weaponSelectMenu._setWeaponSkillFormation(skill);
					//	this._weaponSelectMenu._setWeaponSkillbar(this.getCommandTarget(), skill);
					//}
					this._weaponSelectMenu._initWeaponArray(skill, _selectSkillEntry.objecttype);
					this._weaponSelectMenu._setWeaponSkillFormation(skill, _selectSkillEntry.objecttype);
					this._weaponSelectMenu._setWeaponSkillbar(this.getCommandTarget(), skill, _selectSkillEntry.objecttype);
					
					if(this._weaponPrev == null) {
						this._weaponPrev = this._selectWeapon = this._weaponSelectMenu.getSelectWeapon();
					}
					this.changeCycleMode(OT_SkillCommandMode.TOP);
					break;

				case 'WAIT':
					this._weaponSelectMenu2.setMenuTarget(this.getCommandTarget(), _selectSkillEntry);
					if( this._weaponSelectMenu2.getWeaponCount() > 0 )
					{
						// If there is a weapon you can equip, go to Weapon Select
						this.changeCycleMode(OT_SkillCommandMode.WEAPONSELECT);
					}
					else
					{
						// If you don't have a weapon to equip, you're done.
						this.setCommandAfterSetting(unit);
						this.endCommandAction();
						return MoveResult.END;
					}
					break;
			}

			//root.log(skill.getName());
		}
		else if (input === ScrollbarInput.CANCEL) {
			delete unit.custom.tmpCommandSkillID;

			// Officially added handling of changing weapons in weapon selection here
			if (this._weaponPrev !== this._selectWeapon) {
				// The weapon you were equipped with has changed, so the command is reconstructed.
				// For example, if the equipped weapon includes "Steal" as an additional skill, then "Steal" must be removed from the command.
				this.rebuildCommand();
			}
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},

	_moveWeapon: function() {
		var item, filter, indexArray;
		var unit = this.getCommandTarget();
		var input = this._weaponSelectMenu2.moveWindowManager();
		
		if (input === ScrollbarInput.SELECT) {
			item = this._weaponSelectMenu2.getSelectWeapon();
			
			// Equip the selected item
			ItemControl.setEquippedWeapon(unit, item);
			
			this.setCommandAfterSetting(unit);
			this.endCommandAction();
			return MoveResult.END;
		}
		else if (input === ScrollbarInput.CANCEL) {
			this._skillSelectMenu.setMenuTarget(this.getCommandTarget());
			this.changeCycleMode(OT_SkillCommandMode.SKILL);
		}
		
		return MoveResult.CONTINUE;
	},

	// I was running the official function, but
	// switch to original processing because of the problem caused by the processing added in ver1.210.
	_moveTop: function() {
		var weapon;
		var input = this._weaponSelectMenu.moveWindowManager();
		
		if (input === ScrollbarInput.SELECT) {
			weapon = this._weaponSelectMenu.getSelectWeapon();
			this._selectWeapon = weapon;
			this._startSelection(weapon);
		} else if (input === ScrollbarInput.CANCEL) {
			this._skillSelectMenu.setMenuTarget(this.getCommandTarget());
			this.changeCycleMode(OT_SkillCommandMode.SKILL);
		}

		//var moveResult = UnitCommand.Attack._moveTop.call(this);
		//
		//if (moveResult === MoveResult.END) {
		//	this._skillSelectMenu.setMenuTarget(this.getCommandTarget());
		//	this.changeCycleMode(OT_SkillCommandMode.SKILL);
		//}

		return MoveResult.CONTINUE;
	},

	_moveResult: function() {
		var result = UnitCommand.Attack._moveResult.call(this);
		if (result === MoveResult.END) {
			var unit = this.getCommandTarget();
			//root.log(unit.custom.tmpCommandSkillID);
			this.setCommandAfterSetting(unit);
		}
		return result;
	},

	// When selecting an enemy after weapon selection
	// you can no longer select an enemy that is not eligible to activate the skill.
	_startSelection: function(weapon) {
		var i;
		var unit = this.getCommandTarget();
		var filter = this._getUnitFilter();
		var indexArray = [];
		var indexArrayTmp = this._getIndexArray(unit, weapon);
		var count = indexArrayTmp.length;
		
		// Equip selected item
		ItemControl.setEquippedWeapon(unit, weapon);
		
		for (i = 0; i < count; i++) {
			var index = indexArrayTmp[i];
			var x = CurrentMap.getX(index);
			var y = CurrentMap.getY(index);
			var targetUnit = PosChecker.getUnitFromPos(x, y);
			if (targetUnit !== null && unit !== targetUnit) {
				// Check that you meet the skill activation requirements
				if( EC_SkillCheck.isSkillCheckEnableTypeAttack(unit, targetUnit, this._skill) == true ) {
					indexArray.push(index);
				}
			}
		}
		
		this._posSelector.setUnitOnly(unit, weapon, indexArray, PosMenuType.Attack, filter);
		this._posSelector.setFirstPos();
		
		this.changeCycleMode(AttackCommandMode.SELECTION);
	},

	_moveSelection: function() {
		var moveResult = UnitCommand.Attack._moveSelection.call(this);
		var mode = this.getCycleMode();
		
		if (mode === AttackCommandMode.TOP) {
			//if(_selectSkillEntry.objecttype === ObjectType.WEAPON)
			//{
			//	this._weaponSelectMenu._setWeaponSkillFormation(_selectSkillEntry.skill);
			//	this._weaponSelectMenu._setWeaponSkillbar(this.getCommandTarget(), _selectSkillEntry.skill);
			//}
			this._weaponSelectMenu._initWeaponArray(_selectSkillEntry.skill, _selectSkillEntry.objecttype);
			this._weaponSelectMenu._setWeaponSkillFormation(_selectSkillEntry.skill, _selectSkillEntry.objecttype);
			this._weaponSelectMenu._setWeaponSkillbar(this.getCommandTarget(), _selectSkillEntry.skill, _selectSkillEntry.objecttype);
		} else if(mode === OT_SkillCommandMode.RESULT) {
			var skill = _selectSkillEntry.skill;
			var unit = this.getCommandTarget();
			
			//// If you set prohibition on follow-up when activated
			//if(EC_isRoundNoAttack(skill)) {
			//	unit.custom.EC_TmpRoundNoAttack = true;
			//	unit.custom.EC_TmpRoundLimitCommandSkill = true;
			//}
			//
			//// If you set prohibition of follow-up (attack once) when activated.
			//if(EC_isRoundOneAttack(skill)) {
			//	unit.custom.EC_TmpRoundOneAttack = true;
			//	unit.custom.EC_TmpRoundLimitCommandSkill = true;
			//}
		}
		
		return moveResult;
	},
		
	_drawSkill: function() {
		this._skillSelectMenu.drawWindowManager();
	},

	_drawWeapon: function() {
		this._weaponSelectMenu2.drawWindowManager();
	},
	
	// Set the skill effective turn from the command effective time setting.
	// If not set, 1 turn, cancel on re-action (same as script behaviour until 6/10/2019)
	// If it is set, it will be active for the duration of the turn and will not be dismissed on re-action
	// If cool time is set, also set cool time
	setCommandAfterSetting: function(unit) {
		//Set cool time
		EC_SkillCheck.setCoolTime(unit, this._skill)
		
		//Set validity time
		var duration = EC_GetCommandDuration(this._skill);
		if( duration != OT_CommandDurationUndefined ) {
			//root.log(unit.getName());
			if(duration > 0) {
				EC_SkillCheck.insertDuration(unit, this._skill)
			}
			EC_SkillCheck.TriggerCountUpCommand(unit, unit.custom.tmpCommandSkillID);
			delete unit.custom.tmpCommandSkillID;
		} else {
			//root.log('Duration not set');
		}

		switch(this._skill.getSkillType()) {
			// EP and FP consumption of passive skills should be used when selecting command skills
			case SkillType.PARAMBONUS:
			case SkillType.SUPPORT:
			case SkillType.REACTION:
			case SkillType.NOWEAPONDECREMENT:
				EC_SkillCheck.UseSkillCommandExpendData(unit, this._skill);
				break;
		}
	},

	isCommandDisplayable: function() {
		var unit = this.getCommandTarget();
		var arr = OT_getCommandSkillArrayAll(unit, -1, '');
		var count = arr.length;
		
		// Make sure you have a command-type skill
		for( var i=0 ; i<count ; i++ ) {
			if( arr[i].skill.custom.EC_Command == OT_SkillCommandType.ATTACK ) {
				if( !AttackChecker.isUnitAttackable(unit) ) continue;
				
				// Check that you can attack with the relevant weapon
				if( !EC_SkillCheck.isCommandSkillAttackable(unit, arr[i].skill, arr[i].objecttype) ) continue;
			} else {
				if( !EC_SkillCheck.isSkillCheckEnableALLWeapon(unit, arr[i].skill) ) continue;
				if( !EC_SkillCheck.isCommandSkillEnableWeaponCheck(unit, arr[i].skill) ) continue;
			}
			return true;
		}

		return false;
	},

	getCommandName: function() {
		return 'Command Skills';
	},

	endCommandAction: function() {
		//var unit = this.getCommandTarget();
		//var skill = this._skillSelectMenu.getSelectSkill();

		//EC_SkillCheck.TriggerCountUpCommand(unit, skill);
		UnitCommand.Attack.endCommandAction.call(this);
	}
}
);

//Window for command skill standby
var OT_WeaponAllSelectMenu = defineObject(WeaponSelectMenu,
{
	setMenuTarget: function(unit, skillEntry) {
		this._unit = unit;
		this._itemListWindow = createWindowObject(ItemListWindow, this);
		this._itemInfoWindow = createWindowObject(ItemInfoWindow, this); 
		
		var skill = skillEntry.skill;
		
		//if(_selectSkillEntry.objecttype === ObjectType.WEAPON)
		//{
		//	this._setWeaponSkillFormation(skill);
		//	this._setWeaponSkillbar(unit, skill);
		//}
		//else
		//{
		//	this._setWeaponFormation();
		//	this._setWeaponbar(unit);
		//}
		this._initWeaponArray(skill, _selectSkillEntry.objecttype);
		this._setWeaponSkillFormation(skill, _selectSkillEntry.objecttype);
		this._setWeaponSkillbar(unit, skill, _selectSkillEntry.objecttype);
		this._itemListWindow.setActive(true);
	},
	
	_isWeaponAllowed: function(unit, item) {
		return ItemControl.isWeaponAvailable(unit, item);
	}
}
);

// If the activation condition specifies a physical or magical attribute or distance.
// Also, when you try to use a command skill attached to a weapon.
// and when trying to use a command skill attached to a weapon, the window frame is adjusted to show only the weapons that can activate the skill.
WeaponSelectMenu._setWeaponSkillFormation = function(skill, type) {
	var count = this.getWeaponSkillCount(skill, type);
	var visibleCount = 8;
	
	if (count > visibleCount) {
		count = visibleCount;
	}
	
	this._itemListWindow.setItemFormation(count);
};

// Obtain the weapon that can activate the relevant skill and store it in the array
WeaponSelectMenu._initWeaponArray = function(skill, type) {
	this._weaponArray = new Array();
	
	var i, j, item;
	var weaponCount = 0;
	var tmpHP = this._unit.getHp();
	var tmpEP = 0;
	var tmpFP = 0;
	if(typeof UnitParameter.MEP !== 'undefined') {
		tmpEP = OT_GetNowEP(this._unit);
	}
	if(typeof UnitParameter.MFP !== 'undefined') {
		tmpFP = OT_GetNowFP(this._unit);
	}
	
	var weapon = ItemControl.getEquippedWeapon(this._unit);
	
	var Items = EC_GetEquipableWeapons(this._unit);
	var count = Items.length
	
	var count = Items.length;
	for (i = 0; i < count; i++) {
		item = Items[i];
		if (this._isWeaponAllowed(this._unit, item)) {
			if(this._unit.getHp() < tmpHP) {
				this._unit.setHp(tmpHP);
			}
			if(typeof UnitParameter.MEP !== 'undefined') {
				if(OT_GetNowEP(this._unit) < tmpEP) {
					this._unit.custom.tmpNowEp = tmpEP;
				}
			}
			if(typeof UnitParameter.MFP !== 'undefined') {
				if(OT_GetNowFP(this._unit) < tmpFP) {
					this._unit.custom.tmpNowFp = tmpFP;
				}
			}
			ItemControl.setEquippedWeapon(this._unit, item);
			if(EC_SkillCheck.isCommandSkillAttackableWeapon(this._unit, skill, item, type)) {
				this._weaponArray.push(item);
			}
		}
	}
	
	if(weapon) {
		ItemControl.setEquippedWeapon(this._unit, weapon);
	}
	
	// Fixed hp decreased during check process
	if(this._unit.getHp() < tmpHP) {
		this._unit.setHp(tmpHP);
	}
	if(typeof UnitParameter.MEP !== 'undefined') {
		if(OT_GetNowEP(this._unit) < tmpEP) {
			this._unit.custom.tmpNowEp = tmpEP;
		}
	}
	if(typeof UnitParameter.MFP !== 'undefined') {
		if(OT_GetNowFP(this._unit) < tmpFP) {
			this._unit.custom.tmpNowFp = tmpFP;
		}
	}
};


//If physical or magic attribute or distance is specified as the activation condition
//Also, when trying to use a command skill attached to a weapon,
//Get the total number of weapons that can activate the skill
WeaponSelectMenu.getWeaponSkillCount = function(skill, type) {
	var i, j, item;
	var weaponCount = 0;
	var count = this._weaponArray.length;
	for (i = 0; i < count; i++) {
		weaponCount++;
	}
	
	return weaponCount;
}

//If physical or magic attribute or distance is specified as the activation condition
//Also, when trying to use a command skill attached to a weapon,
//Insert weapons into the list so that only weapons that can activate the skill are displayed
WeaponSelectMenu._setWeaponSkillbar = function(unit, skill, type) {
	var i;
	var scrollbar = this._itemListWindow.getItemScrollbar();
	scrollbar.resetScrollData();

	var count = this._weaponArray.length;
	for (i = 0; i < count; i++) {
		scrollbar.objectSet(this._weaponArray[i]);
	}
	
	scrollbar.objectSetEnd();
};

//Check after unit action to see if the unit is ready to move by re-action.
//If the command skill has been used, cancel the usage state and count the number of times it has been used
var alias2 = PlayerTurn._checkAutoTurnEnd;
PlayerTurn._checkAutoTurnEnd = function() {
	
	if (this.getCycleMode() === PlayerTurnMode.MAP) {
		var i, unit;
		var list = PlayerList.getSortieList();
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			unit = list.getData(i);
			
			if(unit.custom.tmpCommandSkillID != null) {
				if (!unit.isWait()) {
					EC_SkillCheck.TriggerCountUpCommand(unit, unit.custom.tmpCommandSkillID);
					delete unit.custom.tmpCommandSkillID;
					//root.log('reset');
				}
			}
		}
	}

	return alias2.call(this);
};

//In the case of attack-type command skills, re-action skills may be activated.
//For standby command skills, if there is no continuous turn setting, re-action skills will not be activated.
var alias3 = ReactionFlowEntry._completeMemberData;
ReactionFlowEntry._completeMemberData = function(playerTurn) {
	var list = DataVariable.Sdb.getList();
	var id = this._targetUnit.custom.tmpCommandSkillID;

	if (id != null) {
		var skill = list.getDataFromId(id);
		if( skill.custom.EC_Command == OT_SkillCommandType.WAIT ) {
			switch(skill.getSkillType()) {
				case SkillType.REACTION:
					break;
					
				default :
					// If there is no set duration turn, the command skill will be cancelled by re-acting, so disable it.
					var duration = EC_GetCommandDuration(skill);
					if( duration == OT_CommandDurationUndefined) {
						return EnterResult.NOTENTER;
					}
			}
		}
	}

	var result = alias3.call(this, playerTurn);
	
	// Counting the number of uses after the end of an existing treatment
	if( result == EnterResult.OK ) {
		if( this._skill != null ) {
			EC_SkillCheck.TriggerCountUp(this._targetUnit, this._skill);
		}
	}
	return result;
};

//If Kaspara, which prohibits pursuit while activated, is added to the command skill,
//Correct the number of attacks in the battle prediction
var CommandNoAttackMode = false;
var CommandOneAttackMode = false;
var alias4 = PosAttackWindow.setPosTarget;
PosAttackWindow.setPosTarget = function(unit, item, targetUnit, targetItem, isSrc) {
	//May be triggered by command skill
	var arr = OT_getCommandSkillArrayAll(unit, -1, '');
	var count = arr.length;
	
	//Make sure you have command type skills
	for( var i=0 ; i<count ; i++ ) {
		var skill = arr[i].skill;
		
		//Command skill activated
		if(EC_SkillCheck.SkillCheckCommand(unit, skill, false)) {
			//If you set prohibition on follow-up when activated
			if(EC_isRoundNoAttack(skill)) {
				CommandNoAttackMode = true;
			}
			
			// If you set prohibition of follow-up (attack once) when activated.
			if(EC_isRoundOneAttack(skill)) {
				CommandOneAttackMode = true;
			}
		}
	}

	alias4.call(this, unit, item, targetUnit, targetItem, isSrc);
	
	if(CommandNoAttackMode) {
		this._statusArray = AttackChecker.getNonStatus();
		this._roundAttackCount = 0;
	}
	
	CommandNoAttackMode = false;
	CommandOneAttackMode = false;
	//calculateRoundCount: function(active, passive, weapon) {
};

var alias5 = Calculator.calculateRoundCount;
Calculator.calculateRoundCount = function(active, passive, weapon) {
	var cnt = alias5.call(this, active, passive, weapon);
	
	if(CommandOneAttackMode) {
		return 1;
	}
	
	return cnt;
};

//var alias6 = AttackChecker.getAttackStatusInternal;
//AttackChecker.getAttackStatusInternal = function(unit, weapon, targetUnit) {
//	var arr = alias6.call(this, unit, weapon, targetUnit);
//	
//	if(CommandNoAttackMode) {
//		return this.getNonStatus();
//	}
//	
//	return arr;
//}

})();

