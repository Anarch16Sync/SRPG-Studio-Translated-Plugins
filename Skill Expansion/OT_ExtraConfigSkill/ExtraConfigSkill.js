
/*--------------------------------------------------------------------------
  
  You will now be able to set more detailed conditions for the activation of skills.

  How to use:
  Set the skill's custom parameter as {EC_NowHP:'0-50%'}.
  (See the Appendix for more details)
  Please make sure you include this with TemporaryDataVirtualAttack.js.
  
  Created by :
  o-to
  
  Update history:
  30/05/2015: Newly created
  15/06/2015: Added triggering condition for this script.
             modified to call official function if custom parameter is not set
  2015/11/09:Fixed undefined display due to removal of official definition
  2015/12/06: Added command skills, created conditions to limit the number of times a skill can be used.
  2016/01/11:
  The return value of EC_SkillCheck.isCheckTriggerCount is now true if the trigger count limit is not tripped, and false if it is.
  If it is, it is false.
  Added the ability to judge the current value of EP and FP, and to set the EP and FP consumed.
  Added EP, FP and number of turns to command skill display conditions.
  Some parts are not working with official 1.048.
  Changed the algorithm of EC_OverStatus and EC_UnderStatus, since proficiency and physique are now included in the formula.
  Added EC_NowStatus and EC_OpponentNowStatus settings for range conditions on parameters other than HP.
  EC_NowHP will eventually be obsolete, so please set it to EC_NowStatus in the future.

  In the future, if a parameter is added, it will be possible to add a new parameter, except for the maximum value and the current value that exist separately, such as HP and MP.
  Unless there are exceptions, such as different naming conventions
  EC_NowStatus, EC_OpponentNowStatus
  EC_OverStatus and EC_UnderStatus without having to modify this script.

  24/04/2016:
  Moved most of the processing to ExtraConfigBase.js

  2016/08/29:
  Settings related to activation rate and disabling opponent's lookout skill
  Fixed a bug that caused the editor to ignore valid opponent settings.

  2017/02/05:
  Fixed a bug where you forgot to declare a variable used for the for loop.
  Fixed a bug that caused unintended behavior when another script forgot to declare the same variable.

  2017/05/15:
  Fixed the display of command skills attached to non-equipped weapons when selecting a command skill.
  After selecting a command skill attached to a weapon, the weapon selection screen now only shows the weapon with the relevant skill.
  Fixed a bug where the number of times you used a command skill was not counted correctly when re-activating

  01/05/2018:
  Fixed script details
  
  30/05/2018:
  When a weapon with a command skill is not selectable
  Fixed an issue where a weapon with a command skill could be selected
  Fixed a bug that when you select a weapon with an offensive command skill, you can't select an opponent that the skill doesn't work on (only in some conditions).
  
  19/11/2019:
  Added duration and cool time settings in command skills.
  EC_SkillCheck.isCheckTriggerCount function fixed.
  EC_SkillCheck.isCheckTriggerCountCommand function added and
  Fixed the count check process when the limit of the number of times a skill can be triggered in one map is set to command type.
  
  09/12/2019:
  Fixed the weapon selection list for offensive command skills that do not match the distance of the trigger condition and the range of the weapon.
  (Optimised isCommandSkillAttackable function)

  2020/01/01
  Added Custom Parameter to add the specified parameter to the activation rate.
  
  2020/03/29
  Fixed the possibility to set the cool time even if it is not a command skill.
  
--------------------------------------------------------------------------*/

//When checking the correction amount due to parameter bonus skills for unit parameters
//If the value of the parameter being checked does not change,
//Whether to perform processing to avoid unnecessary checks
//If operation becomes unstable due to conflict with other plugins, set it to false
EC_GetSkillCustomCheckPerformance = true;

(function() {
var OT_NowStatusChk = false;

// Type of Fusion type limitation
OT_SkillFusionType = {
	  NORMAL: 'NORMAL'
	, ATTACK: 'ATTACK'
	, ALL   : 'ALL'
};

// Limited number of skills
OT_SkillTriggerCountType = {
	  BATTLE :'BATTLE'
	, TURN   :'TURN'
	, MAP    :'MAP'
	, ALL    :'ALL'
};

// Type of command skill
OT_SkillCommandType = {
	  ATTACK: 'ATTACK'
	, WAIT  : 'WAIT'
};

// Type of map type frequency limitation
OT_SkillTriggerMapType = {
	  MAP      : 'MAP'
	, COMMAND  : 'COMMAND'
};

// Set of command skill times
OT_CommandSkillSet = function() {
	return {
		  BATTLE : 0
		, TURN   : 0
		, MAP    : 0
	};
};

var alias1 = SkillRandomizer._isSkillInvokedInternal;
SkillRandomizer._isSkillInvokedInternal = function(active, passive, skill)
{
	// Show skill names
	EC_Putlog('Skill Name:'+skill.getName(), skill);
	
	// Once the data has been passed, it is checked for errors in the official functions.
	var result = alias1.call(this, active, passive, skill);

	var Percent = 0;
	var type = skill.getInvocationType();
	var value = skill.getInvocationValue();
	var DefaultPercent = 0;
	var Param = 0;

	// Check if the skill is a command skill, and if it is, check that it is selected from the command list.
	if( EC_SkillCheck.SkillCheckCommand(active, skill) == false )
	{
		return false;
	}

	// Check that you meet the skill activation requirements
	if( EC_EnableManager.SkillCheckActivity(active, passive, skill) == false )
	{
		return false;
	}
	
	//---Correction of the activation rate from the following---------------------------------------

	//--- If you have not made any settings regarding the correction of the rate of activation and the cut-off
	//--- Returns the result of a call to a formula function as is
	if(    skill.custom.EC_DefaultPercent == null
		&& skill.custom.EC_Correction == null
		&& skill.custom.EC_ScopePercent == null
		&& skill.custom.EC_isAbandonIgnore == null
		&& skill.custom.EC_AddTriggerRate == null
		&& skill.custom.EC_ParamBonusCheck == null
	)
	{
		EC_Putlog('No compensation for the rate of activation', skill);

		//Get probabilities for logging
		Percent = Probability.getInvocationPercent(active, type, value);
		
		EC_Putlog('Probability of activation:' + Percent + '%', skill);
	} else {
		// If settings around activation rate are set, correct them.

		// Check valid partners
		if (!skill.getTargetAggregation().isCondition(passive)) {
			EC_Putlog('Cannot be activated because it is not a valid opponent', skill);
			return false;
		}
		
		//--- Check if the skill is an invalid type skill.
		if( skill.custom.EC_isAbandonIgnore == null || skill.custom.EC_isAbandonIgnore == false )
		{
			// If the opponent can nullify the skill, do not activate the skill.
			if (SkillControl.getBattleSkillFromFlag(passive, active, SkillType.INVALID, InvalidFlag.SKILL) !== null) {
				EC_Putlog('Cannot be activated because the opponent has Closeout.', skill);
				return false;
			}
		}
		else
		{
			EC_Putlog('Skills that invalidate opponents abandonment', skill);
		}
		
		// default probability
		if( skill.custom.EC_DefaultPercent != null )
		{
			DefaultPercent = skill.custom.EC_DefaultPercent;
			EC_Putlog('Default activation rate:'+DefaultPercent, skill);
		}
		
		//EC_Putlog('coefficient:' + value, skill);
		
		// Correction value
		if( skill.custom.EC_Correction != null )
		{
			//The actual skill activation rate will be rounded down to the nearest whole number.
			value = value * skill.custom.EC_Correction;
			EC_Putlog('Correction value:'+skill.custom.EC_Correction, skill);
			EC_Putlog('Corrected coefficient:'+value, skill);
		}
	
		// Get probability from parameters
		// Fixed because a function for calculating the activation probability is now available.
		if (type === InvocationType.HPDOWN || type === InvocationType.ABSOLUTE || type === InvocationType.LV) {
			Percent = Probability.getInvocationPercent(active, type, value);
		} else {
			if(typeof skill.custom.EC_ParamBonusCheck === 'boolean') {
				EC_Putlog('Regarding whether parameter bonuses are considered in activation rate:', skill);
				EC_Putlog('Prioritize skill settings:' + skill.custom.EC_ParamBonusCheck, skill);
				Percent = EC_GetParamBonusPercent(active, type, skill) * value;
			} else {
				Percent = Probability.getInvocationPercent(active, type, value);
			}
		}
		
		EC_Putlog('Additional value of activation rate depending on parameters:'+Percent, skill);
		Percent += DefaultPercent;
		
		// Status value reflected in activation rate
		Percent += OT_GetECAddTriggerRate(active, skill);

		// probability range
		if( skill.custom.EC_ScopePercent != null ) {
			var str = skill.custom.EC_ScopePercent;
			
			EC_Putlog('probability range:' + skill.custom.EC_ScopePercent, skill);
			var regex = /^([0-9]+)\-([0-9]+)\%$/;
			if (str.match(regex)) {
				var min = parseInt(RegExp.$1);
				var max = parseInt(RegExp.$2);
				if(Percent < min) {
					Percent = min;
				}
	
				if(Percent > max) {
					Percent = max;
				}
			}
		}
		EC_Putlog('Activation probability (rounded to the nearest whole number):' + Math.round( Percent ) + '%', skill);
		result = Probability.getProbability(Percent);
	}

	if( result == true ) {
		EC_SkillCheck.TriggerCountUp(active, skill);
		EC_SkillCheck.UseSkillExpendData(active, skill);

		// If it is not a command type
		// If cool time is set, set cool time.
		if( OT_isCommandSkill(skill) == false ) {
			EC_SkillCheck.setCoolTime(active, skill);
		}
		
		//EC_SkillCheck.setExtraEnableSkill(active, skill);
		
		// For processing in another script
		switch(skill.getSkillType()) {
			case SkillType.FASTATTACK:
				active.custom.tmpActivateFastAttack = true;
				break;
		}
		
		// If you set prohibition on follow-up when activated
		if(EC_isRoundNoAttack(skill)) {
			EC_Putlog('Pursuit prohibited by skill activation', skill);
			active.custom.EC_TmpRoundNoAttack = true;
		}
		
		// If you set prohibition of follow-up (attack once) when activated.
		if(EC_isRoundOneAttack(skill)) {
			EC_Putlog('Pursuit prohibited by skill activation', skill);
			active.custom.EC_TmpRoundOneAttack = true;
		}
	}
	
	EC_Putlog('Skill activation:' + result, skill);
	return result;
};

EC_SkillCheck = {

	// Count the number of skill activations
	TriggerCountUp: function(active, skill) {
		var id = skill.getId();

		if( skill.custom.EC_TriggerCountBattle == null && skill.custom.EC_TriggerCountTurn == null && skill.custom.EC_TriggerCountMap == null )
		{
			return false;
		}

		// Initialize the number of activations
		if( active.custom.tmpSkillTriggerCount == null )
		{
			active.custom.tmpSkillTriggerCount = Array();
		}
		
		if( active.custom.tmpSkillTriggerCount[id] == null )
		{
			active.custom.tmpSkillTriggerCount[id] = OT_CommandSkillSet();
		}
		
		// Count of activations
		active.custom.tmpSkillTriggerCount[id].BATTLE++;
		active.custom.tmpSkillTriggerCount[id].TURN++;

		// If the map type frequency limit is the type where the frequency is reduced when the skill is activated
		if( skill.custom.EC_TriggerCountMap != null )
		{
			if( skill.custom.EC_TriggerCountMap[1] == OT_SkillTriggerMapType.MAP )
			{
				active.custom.tmpSkillTriggerCount[id].MAP++;
			}
		}
	},

	// Count the number of times the skill is activated (for commands)
	TriggerCountUpCommand: function(active, id) {
		var list = DataVariable.Sdb.getList();
		
		if( id == null ) {
			return ;
		}

		var skill = list.getDataFromId(id);

		if( skill.custom.EC_TriggerCountMap != null )
		{
			if( skill.custom.EC_TriggerCountMap[1] == OT_SkillTriggerMapType.COMMAND )
			{
				// Initialisation of the number of activations
				if( active.custom.tmpSkillTriggerCount == null )
				{
					active.custom.tmpSkillTriggerCount = Array();
				}
				
				if( active.custom.tmpSkillTriggerCount[id] == null )
				{
					active.custom.tmpSkillTriggerCount[id] = OT_CommandSkillSet();
				}

				active.custom.tmpSkillTriggerCount[id].MAP++;
			}
		}
	},

	// Check that the number of times you have used the skill has not exceeded the number of times it can be used.
	isCheckTriggerCount: function(active, skill) {
		var id = skill.getId();
		
		if( skill.custom.EC_TriggerCountBattle == null && skill.custom.EC_TriggerCountTurn == null && skill.custom.EC_TriggerCountMap == null )
		{
			return true;
		}

		// Debug message composition
		var msg = 'Number of times it can be activated';

		// Combat
		if( skill.custom.EC_TriggerCountBattle != null )
		{
			msg += ' Combat:' + skill.custom.EC_TriggerCountBattle;
		}

		// Turn
		if( skill.custom.EC_TriggerCountTurn != null )
		{
			msg += ' TURN:' + skill.custom.EC_TriggerCountTurn;
		}

		// Maps
		if( skill.custom.EC_TriggerCountMap != null )
		{
			msg += ' MAP:' + skill.custom.EC_TriggerCountMap[0];
		}
		
		// Check activation conditions from here
		EC_Putlog(msg, skill);
		if( active.custom.tmpSkillTriggerCount == null )
		{
			EC_Putlog('Number of activations Combat:0 TURN:0 MAP:0', skill);
			return true;
		}

		if( active.custom.tmpSkillTriggerCount[id] == null )
		{
			EC_Putlog('Number of activations Combat:0 TURN:0 MAP:0', skill);
			return true;
		}

		var tmp = active.custom.tmpSkillTriggerCount[id];
		EC_Putlog('Number of activations Combat:' + tmp.BATTLE + ' TURN:' + tmp.TURN + ' MAP:' + tmp.MAP, skill);
		
		// Combat
		if( skill.custom.EC_TriggerCountBattle != null )
		{
			if( skill.custom.EC_TriggerCountBattle <= tmp.BATTLE )
			{
				return false;
			}
		}

		// turn
		if( skill.custom.EC_TriggerCountTurn != null )
		{
			if( skill.custom.EC_TriggerCountTurn <= tmp.TURN )
			{
				return false;
			}
		}

		// map
		if( skill.custom.EC_TriggerCountMap != null )
		{
			if( skill.custom.EC_TriggerCountMap[1] == OT_SkillTriggerMapType.MAP) {
				if( skill.custom.EC_TriggerCountMap[0] <= tmp.MAP ) {
					return false;
				}
			}
		}

		return true;
	},

	// Check that the number of skill activations does not exceed the number of activations (for commands) 
	isCheckTriggerCountCommand: function(active, skill, isAfterCheck) {
		var id = skill.getId();
		
		if( skill.custom.EC_TriggerCountBattle == null && skill.custom.EC_TriggerCountTurn == null && skill.custom.EC_TriggerCountMap == null )
		{
			return true;
		}

		if(typeof isAfterCheck == 'undefined') {
			isAfterCheck = false;
		}
		
		//Debug message composition
		var msg = 'Number of times it can be activated ';
		var msg2 = '';

		// Combat
		if( skill.custom.EC_TriggerCountBattle != null )
		{
			msg += ' Combat:' + skill.custom.EC_TriggerCountBattle;
		}

		// turn
		if( skill.custom.EC_TriggerCountTurn != null )
		{
			msg += 'TURN:' + skill.custom.EC_TriggerCountTurn;
		}

		// map
		if( skill.custom.EC_TriggerCountMap != null && !isAfterCheck)
		{
			msg += ' MAP:' + skill.custom.EC_TriggerCountMap[0];
		}
		
		// Check the activation conditions from here
		EC_Putlog(msg, skill);
		if( active.custom.tmpSkillTriggerCount == null )
		{
			EC_Putlog('Number of activations Combat:0 TURN:0 Command:0', skill);
			return true;
		}

		if( active.custom.tmpSkillTriggerCount[id] == null )
		{
			EC_Putlog('Number of activations Combat:0 TURN:0 Command:0', skill);
			return true;
		}

		var tmp = active.custom.tmpSkillTriggerCount[id];
		EC_Putlog('Number of activations Combat:' + tmp.BATTLE + ' TURN:' + tmp.TURN + ' Command:' + tmp.MAP, skill);
		
		// Combat
		if( skill.custom.EC_TriggerCountBattle != null )
		{
			if( skill.custom.EC_TriggerCountBattle <= tmp.BATTLE )
			{
				return false;
			}
		}

		// Turn
		if( skill.custom.EC_TriggerCountTurn != null )
		{
			if( skill.custom.EC_TriggerCountTurn <= tmp.TURN )
			{
				return false;
			}
		}
		
		// Map
		if( skill.custom.EC_TriggerCountMap != null && !isAfterCheck)
		{
			if( skill.custom.EC_TriggerCountMap[0] <= tmp.MAP ) {
				return false;
			}
		}
		
		return true;
	},

	// Reset the number of skill activations
	ResetTriggerCount: function(unit, type) {
		var length = 0;
		var i = 0;
	
		if( unit.custom.tmpSkillTriggerCount != null )
		{
			// Reset all times at the end of the map
			if( type == OT_SkillTriggerCountType.ALL )
			{
				delete unit.custom.tmpSkillTriggerCount;
				//root.log(unit.getName() + 'Reset the number of skill activations');
				return;
			}

			length = unit.custom.tmpSkillTriggerCount.length;
			
			for( i=0 ; i<length ; i++ )
			{
				if( unit.custom.tmpSkillTriggerCount[i] != null )
				{
					switch(type)
					{
						case OT_SkillTriggerCountType.TURN :
							unit.custom.tmpSkillTriggerCount[i].TURN = 0;

						case OT_SkillTriggerCountType.BATTLE :
							unit.custom.tmpSkillTriggerCount[i].BATTLE = 0;
							break;
					}
				}
			}
		}
	},
	
	// Check if you selected the skill from the command
	SkillCheckCommand: function(active, skill, dbgMsg) {
		if(typeof dbgMsg == 'undefined') {
			dbgMsg = true;
		}
		
		// If it is not a command type, it will pass through
		if( OT_isCommandSkill(skill) == false )
		{
			return true;
		}
		
		if(dbgMsg) {
			if(active.custom.tmpCommandSkillID) {
				EC_Putlog('Triggered from a command:' + active.custom.tmpCommandSkillID, skill);
			} else {
				EC_Putlog('Triggered from a command', skill);
			}
		}

		if( active.custom.tmpCommandSkillID == skill.getId() ) {
			return true;
		} else {
			var duration = EC_GetCommandDuration(skill);
			if( duration != OT_CommandDurationUndefined) {
				return EC_SkillCheck.isDuration(active, skill.getId());
			}
		}
		
		return false;
	},
    //Determine whether command skills can be used based on the current state when using them
	isSkillCheckEnable: function(unit, skill, isAfterCheck, isNoTarget) {
		if( unit == null || skill == null )
		{
			return false;
		}
		
		if(typeof isAfterCheck == 'undefined') {
			isAfterCheck = false;
		}
		
		if(typeof isNoTarget == 'undefined') {
			isNoTarget = false;
		}
		
		// Display skill name
		EC_Putlog('Skill name:'+skill.getName(), skill);
		
		// Check that the number of commands is not within the limit.
		if( !this.isCheckTriggerCountCommand(unit, skill, isAfterCheck) ) return false;

		// When setting up the other party's status check
		// Check that the other person is present
		//var targetUnit = null;
		//if(typeof unit.custom.tmpNowVirtualAttack != 'undefined') {
		//	EC_Putlog('tmpNowVirtualAttack', skill);
		//	targetUnit = unit.custom.tmpNowVirtualAttack.tmpECTargetUnit;
		//} else if(unit.custom.tmpECTarget) {
		//	targetUnit = unit.custom.tmpECTarget;
		//	EC_Putlog('unit.custom.tmpECTarget', skill);
		//}
		
		// When setting up the other party's status check
		// Measures to prevent it from being reflected when opening the menu etc.
		if(isAfterCheck && !isNoTarget) {
			if( skill.custom.EC_OpponentNowStatus != null ) {
				// no target specified
				//EC_Putlog('no target specified', skill);
				return false;
			}

			if( skill.custom.EC_OverStatus != null ) {
				// no target specified
				//EC_Putlog('no target specified', skill);
				return false;
			}

			if( skill.custom.EC_UnderStatus != null ) {
				// no target specified
				//EC_Putlog('no target specified', skill);
				return false;
			}
		}
		
		if(!isAfterCheck) {
			// Check if it's in cool time
			if( this.getCoolTime(unit, skill.getId()) > 0 ) return false;

			// Confirm that EP has a certain value before use
			if( !this.isUseEP(unit, skill, skill.custom.EC_UseEP) ) return false;
	
			// Confirm that FP has a certain value before use
			if( !this.isUseFP(unit, skill, skill.custom.EC_UseFP) ) return false;
		}
		
		//Check if the status is within a certain range
		if( !this.isNowStatusInRange(unit, null, skill) ) return false;
		
		// Check if it can be activated by the number of turns
		if( !EC_SituationCheck.isEnableTurn(skill) ) return false;

		return true;
	},

	//When using a command skill, determine whether it can be used based on the current state
	isSkillCheckEnableALLWeapon: function(unit, skill, isAfterCheck) {
		var weapon = ItemControl.getEquippedWeapon(unit);
		var tmpHP = unit.getHp();
		var tmpEP = 0;
		var tmpFP = 0;
		if(typeof UnitParameter.MEP !== 'undefined') {
			tmpEP = OT_GetNowEP(unit);
		}
		if(typeof UnitParameter.MFP !== 'undefined') {
			tmpFP = OT_GetNowFP(unit);
		}
		
		var Items = EC_GetEquipableWeapons(unit);
		var count = Items.length
		
		var isOK = false;
		count = Items.length;
		//Make sure you have command type skills
		for( var i=0 ; i<count ; i++ ) {
			var item = Items[i];
			//If the weapon is not equipped, the judgment cannot be performed correctly, so temporarily equip it.
			if(unit.getHp() < tmpHP) {
				unit.setHp(tmpHP);
			}
			if(typeof UnitParameter.MEP !== 'undefined') {
				if(OT_GetNowEP(unit) < tmpEP) {
					unit.custom.tmpNowEp = tmpEP;
				}
			}
			if(typeof UnitParameter.MFP !== 'undefined') {
				if(OT_GetNowFP(unit) < tmpFP) {
					unit.custom.tmpNowFp = tmpFP;
				}
			}
			ItemControl.setEquippedWeapon(unit, item);
			if( EC_SkillCheck.isSkillCheckEnable(unit, skill, isAfterCheck) ) {
				isOK = true;
				break;
			}
		}

		// Change to the equipment equipped before the check process
		if(weapon) {
			ItemControl.setEquippedWeapon(unit, weapon);
		}
		
		// Fixed hp decreased during check process
		if(unit.getHp() < tmpHP) {
			unit.setHp(tmpHP);
		}
		if(typeof UnitParameter.MEP !== 'undefined') {
			if(OT_GetNowEP(unit) < tmpEP) {
				unit.custom.tmpNowEp = tmpEP;
			}
		}
		if(typeof UnitParameter.MFP !== 'undefined') {
			if(OT_GetNowFP(unit) < tmpFP) {
				unit.custom.tmpNowFp = tmpFP;
			}
		}
		
		return isOK;
	},

	// When using offensive command skills, determine whether they can be used based on the current state.
	isSkillCheckEnableTypeAttack: function(unit, targetUnit, skill, isAfterCheck) {
		if( unit == null || skill == null )
		{
			return false;
		}

		if(typeof isAfterCheck == 'undefined') {
			isAfterCheck = false;
		}
		
		// Display skill name
		EC_Putlog('Skill name:'+skill.getName(), skill);

		// Check that the number of commands is not within the limit.
		if( !this.isCheckTriggerCountCommand(unit, skill, isAfterCheck) ) return false;
		
		if(!isAfterCheck) {
			// Check if it is not in cooldown time
			if( this.getCoolTime(unit, skill.getId()) > 0 ) return false;
			
			// Confirm that Ep is at a certain value before use.
			if( !this.isUseEP(unit, skill, skill.custom.EC_UseEP) ) return false;
	
			// Confirm that Fp is at a certain value before use.
			if( !this.isUseFP(unit, skill, skill.custom.EC_UseFP) ) return false;
		}
		
		// Check if the status is within a certain range
		if( !this.isNowStatusInRange(unit, targetUnit, skill) ) return false;

		//---Activates if the status is higher than the opponent's.
		if( !this.CheckOverStatus(unit, targetUnit, skill) ) return false;
	
		//---Activates if the status is lower than the opponent's.
		if( !this.CheckUnderStatus(unit, targetUnit, skill) ) return false;
		
		// Activates at a distance from the opponent
		if( !EC_SituationCheck.isRangeEnable(unit, targetUnit, skill) ) return false;
		
		// Check if it can be activated in the number of turns
		if( !EC_SituationCheck.isEnableTurn(skill) ) return false;

		return true;
	},
	
	// In the case of attack type, is there an enemy within range?
	// If the weapon type is set to physical or magic in the skill activation condition, do you have the corresponding weapon?
	// Check if the command skill attached to the weapon can attack with the set weapon
	isCommandSkillAttackable: function(unit, skill, objecttype) {
		var i, j, k, item, indexArray;
		var weapon = ItemControl.getEquippedWeapon(unit);
		var tmpHP = unit.getHp();
		var tmpEP = 0;
		var tmpFP = 0;
		if(typeof UnitParameter.MEP !== 'undefined') {
			tmpEP = OT_GetNowEP(unit);
		}
		if(typeof UnitParameter.MFP !== 'undefined') {
			tmpFP = OT_GetNowFP(unit);
		}
		
		var isOK = false;
		var Items = EC_GetEquipableWeapons(unit);
		var count = Items.length
		for (i = 0; i < count; i++) {
			item = Items[i];
			if(unit.getHp() < tmpHP) {
				unit.setHp(tmpHP);
			}
			if(typeof UnitParameter.MEP !== 'undefined') {
				if(OT_GetNowEP(unit) < tmpEP) {
					unit.custom.tmpNowEp = tmpEP;
				}
			}
			if(typeof UnitParameter.MFP !== 'undefined') {
				if(OT_GetNowFP(unit) < tmpFP) {
					unit.custom.tmpNowFp = tmpFP;
				}
			}
			ItemControl.setEquippedWeapon(unit, item);
			if(this.isCommandSkillAttackableWeapon(unit, skill, item, objecttype)) {
				isOK = true;
				break;
			}
		}
		
		if(weapon) {
			ItemControl.setEquippedWeapon(unit, weapon);
		}
		if(unit.getHp() < tmpHP) {
			unit.setHp(tmpHP);
		}
		if(typeof UnitParameter.MEP !== 'undefined') {
			if(OT_GetNowEP(unit) < tmpEP) {
				unit.custom.tmpNowEp = tmpEP;
			}
		}
		if(typeof UnitParameter.MFP !== 'undefined') {
			if(OT_GetNowFP(unit) < tmpFP) {
				unit.custom.tmpNowFp = tmpFP;
			}
		}
		return isOK;
	},

	// Check if the weapon matches the command skill conditions and can attack.
	isCommandSkillAttackableWeapon: function(unit, skill, item, objecttype) {
		var i, j, k, item, indexArray;
		if (ItemControl.isWeaponAvailable(unit, item)) {
			//When checking whether the weapon is physical or magical,
			//Do you have a matching weapon?
			if( typeof skill.custom.EC_isPhysics == 'boolean' ) {
				var isPhysics = Miscellaneous.isPhysicsBattle(item);
				if( isPhysics != skill.custom.EC_isPhysics ) {
				return false;
				}
			}
				
			// If the skill is attached to a weapon, check whether you can attack with that weapon.
			if(objecttype === ObjectType.WEAPON) {
				var bNG = true;
					var list = item.getSkillReferenceList();
					var count2 = list.getTypeCount();
					for (j = 0; j < count2; j++) {
						if(skill == list.getTypeData(j)) {
						bNG = false;
						break;
					}
				}
				
				if(bNG) return false;
			}
			
			if( skill.custom.EC_Command == OT_SkillCommandType.ATTACK ) {
				// If it is an attack type, check if the skill can be activated against enemies within range.
				indexArray = AttackChecker.getAttackIndexArray(unit, item, false);
				if (indexArray.length == 0) {
					return false;
				}
				
				var count3 = indexArray.length;
				for (k = 0; k < count3; k++) {
					var index = indexArray[k];
					var x = CurrentMap.getX(index);
					var y = CurrentMap.getY(index);
					var targetUnit = PosChecker.getUnitFromPos(x, y);
					if (targetUnit !== null && unit !== targetUnit) {
						// Check if skill activation conditions are met
						if( this.isSkillCheckEnableTypeAttack(unit, targetUnit, skill) == true ) {
							return true;
						}
					}
				}
			} else {
				// If it is a standby type, it will not check against enemies within range.
				return true;
			}
		}
		return false;
	},

	// When a weapon condition is set in the activation condition of the skill, check whether it can be activated with the weapon you own.
	isCommandSkillEnableWeaponCheck: function(unit, skill) {
		var i, j, k, item, indexArray;
		var Items = EC_GetEquipableWeapons(unit);
		var count = Items.length
		var err = true;

		count = Items.length
		for (i = 0; i < count; i++) {
			item = Items[i];
			// When checking whether the attack type is physical or magic,
			// Do you have a matching weapon in your possession?
			if( typeof skill.custom.EC_isPhysics == 'boolean' ) {
				var isPhysics = Miscellaneous.isPhysicsBattle(item);
				if( isPhysics == skill.custom.EC_isPhysics ) {
					return true;
				}
			} else {
				return true;
			}
		}
		
		// If you do not have a weapon, you will not be able to select the skill if it has activation conditions related to a weapon.
		if(count == 0) {
			if( typeof skill.custom.EC_isPhysics == 'boolean' ) {
				return false;
			}
			return true;
		}
		
		return false;
	},
		
	// Check that the specified status is within the range
	isNowStatusInRange: function(active, passive, skill) {
		var now         = skill.custom.EC_NowStatus;
		var opponentNow = skill.custom.EC_OpponentNowStatus;

		if( now != null && active != null ) {
			EC_Putlog('Casters status range check', skill);
			for( var key in now )
			{
				if( !this.isParamInRange(active, skill, key, now[key]) )
				{
					return false;
				}
			}
		}
		
		if( opponentNow != null && passive != null ) {
			EC_Putlog('Check opponents status range', skill);
			for( var key in opponentNow )
			{
				if( !this.isParamInRange(passive, skill, key, opponentNow[key]) )
				{
					return false;
				}
			}
		}
		
		return true;
	},

	// Check if parameters are within range
	isParamInRange: function(unit, skill, type, strRange, isSelf) {
		if(OT_NowStatusChk) {
			return false;
		}
			
		if(skill.getSkillType() == SkillType.PARAMBONUS) {
			OT_NowStatusChk = true;
		}
		
		var val = EC_StatusCheck.isParamInRange(unit, skill, type, strRange);
		
		if(skill.getSkillType() == SkillType.PARAMBONUS) {
			OT_NowStatusChk = false;
		}
		
		return val;
	},

	// Check if value is within range
	isValueInRange: function(skill, nowValue, maxValue, str, paramName) {
		return EC_StatusCheck.isValueInRange(skill, nowValue, maxValue, str, paramName);
	},

	// Check if your status is higher than your opponent
	CheckOverStatus: function(active, passive, skill) {
		if(typeof skill.custom.EC_OverStatus === 'undefined') {
			//EC_Putlog('CheckOverStatus:Not declared', skill)
			return true;
		}
		
		if(OT_NowStatusChk) {
			return false;
		}
			
		if(skill.getSkillType() == SkillType.PARAMBONUS) {
			OT_NowStatusChk = true;
		}
		
		var val = EC_StatusCheck.CheckOverStatus(active, passive, skill);
		
		if(skill.getSkillType() == SkillType.PARAMBONUS) {
			OT_NowStatusChk = false;
		}

		return val;
	},

	// Check if your status is lower than your opponent
	CheckUnderStatus: function(active, passive, skill) {
		if(typeof skill.custom.EC_UnderStatus === 'undefined') {
			//EC_Putlog('CheckUnderStatus:Not declared', skill)
			return true;
		}
		
		if(OT_NowStatusChk) {
			return false;
		}
			
		if(skill.getSkillType() == SkillType.PARAMBONUS) {
			OT_NowStatusChk = true;
		}
		
		var val = EC_StatusCheck.CheckUnderStatus(active, passive, skill);
		
		if(skill.getSkillType() == SkillType.PARAMBONUS) {
			OT_NowStatusChk = false;
		}

		return val;
	},

	// Check if there is enough ep consumed
	isUseEP: function(unit, skill, value) {
		if( unit == null || skill == null )
		{
			return false;
		}
		
		// Check consumption ep
		// If you can only attack or activate skills, prioritize attack.
		if( value != null )
		{
			if(typeof OT_GetUseEP === 'undefined')
			{
				root.log('Using EP: EP system has not been installed');
			}
			else
			{
				var weapon = ItemControl.getEquippedWeapon(unit);

				var nowEP = OT_GetNowEP(unit);
				if(typeof unit.custom.tmpUseEP == 'number') {
					nowEP -= unit.custom.tmpUseEP;
				}
				
				var useEP = OT_GetUseEP(unit, value);
				if( OT_BeforeAttackSkill ) {
					useEP += OT_GetItemUseEP(unit, weapon);
				}
				
				EC_Putlog('Current EP:' + nowEP + ' EP consumed:' + useEP, skill)
				if( nowEP < useEP )
				{
					return false;
				}
			}
		}
		
		return true;
	},

	// Check if the consumption FP is enough
	isUseFP: function(unit, skill, value) {
		if( unit == null || skill == null )
		{
			return false;
		}

		// Check consumption FP
		// If you can only attack or activate the skill, give priority to the attack
		if( value != null )
		{
			if(typeof OT_GetUseFP === 'undefined')
			{
				root.log('Using FP: FP system is not installed');
			}
			else
			{
				var weapon = ItemControl.getEquippedWeapon(unit);

				var nowFP = OT_GetNowFP(unit);
				if(typeof unit.custom.tmpUseFP == 'number') {
					nowFP -= unit.custom.tmpUseFP;
				}
				
				var useFP = OT_GetUseFP(unit, value);
				if( OT_BeforeAttackSkill ) {
					useFP += OT_GetItemUseFP(unit, weapon);
				}
				
				EC_Putlog('Current FP:' + nowFP + ' Consumed FP:' + useFP, skill)
				if( nowFP < useFP )
				{
					return false;
				}
			}
		}
		
		return true;
	},

	// EP and FP consumption when using skills
	UseSkillExpendData: function(unit, skill) {
		// Consume EP
		if( skill.custom.EC_UseEP != null )
		{
			if(typeof OT_GetUseEP === 'undefined')
			{
				root.log('EP use: EP system not installed');
			}
			else
			{
				unit.custom.tmpUseEP += OT_GetUseEP(unit, skill.custom.EC_UseEP);
			}
		}

		// Consume FP
		if( skill.custom.EC_UseFP != null )
		{
			if(typeof OT_GetUseFP === 'undefined')
			{
				root.log('Using FP: FP system is not installed');
			}
			else
			{
				unit.custom.tmpUseFP += OT_GetUseFP(unit, skill.custom.EC_UseFP);
			}
		}
	},

	// Immediate consumption of EP and FP when using skills (for commands)
	UseSkillCommandExpendData: function(unit, skill) {
		// Consume EP
		if( skill.custom.EC_UseEP != null ) {
			if(typeof OT_GetUseEP === 'undefined') {
				root.log('EP use: EP system not installed');
			} else {
				OT_UseNowEP( unit, OT_GetUseEP(unit, skill.custom.EC_UseEP) );
			}
		}

		//Consume FP
		if( skill.custom.EC_UseFP != null ) {
			if(typeof OT_GetUseFP === 'undefined') {
				root.log('Using FP: FP system is not installed');
			} else {
				OT_UseNowFP( unit, OT_GetUseFP(unit, skill.custom.EC_UseFP) );
			}
		}
	},
	
	//Make sure you meet the requirements for fusion skills
	isFusionSkill: function(active, passive, skill) {
		// Check your fusion ID
		if( !this.isSkillFusionID(active, skill, skill.custom.EC_FusionID) )
		{
			return false;
		}
		
		// Check the fusion ID of the other party
		if( !this.isSkillFusionID(passive, skill, skill.custom.EC_OpponentFusionID) )
		{
			return false;
		}
		
		return true;
	},

	// Check if the fusion type is specified
	isSkillFusionID: function(unit, skill, id) {

		if(unit == null || id == null)
		{
			return true;
		}
		
		var data = FusionControl.getFusionData(unit);
		var msg  = unit.getName();
		
		// False if not fused
		if( data == null )
		{
			EC_Putlog(msg + 'Cannot be activated because it is not fused', skill);
			return false;
		}

		var dataID = data.getId();
		EC_Putlog(msg + 'Fusion ID', skill);
		EC_Putlog('Activate if you include either:' + id, skill);
		
		for( var key in id )
		{
			if(typeof id[key] !== 'number') continue;

			if(id[key] === dataID) 
			{
				return true;
			}
		}
		
		return false;
	},

	// Set skill duration
	insertDuration: function(unit, skill) {
		var id = skill.getId()
		var duration = EC_GetCommandDuration(skill);
		//root.log("OK2:"+ id);
		EC_Putlog('Skill connection time：'+duration, skill);
		
		if( duration > 0 ) {
			// Initialization of the number of activations
			if( unit.custom.tmpECSkillDuration == null ) {
				unit.custom.tmpECSkillDuration = Array();
			}
			unit.custom.tmpECSkillDuration[id] = duration;
		}
	},

	// Check if the skill is ongoing
	isDuration: function(unit, id) {
		if( unit.custom.tmpECSkillDuration == null ) {
			return false;
		}
		
		if( typeof unit.custom.tmpECSkillDuration[id] == 'number' ) {
			if( unit.custom.tmpECSkillDuration[id] > 0 ) {
				return true;
			}
		}
		
		return false;
	},

	// Get skill duration
	getDuration: function(unit, id) {
		if( unit.custom.tmpECSkillDuration == null ) {
			return 0;
		}
		
		if( typeof unit.custom.tmpECSkillDuration[id] == 'number' ) {
			if( unit.custom.tmpECSkillDuration[id] > 0 ) {
				return unit.custom.tmpECSkillDuration[id];
			}
		}
		
		return 0;
	},

	// Reduced skill duration
	countDuration: function(unit, time) {
		if( typeof unit.custom.tmpECSkillDuration != 'undefined' ) {
			for( var key in unit.custom.tmpECSkillDuration ) {
				if( typeof unit.custom.tmpECSkillDuration[key] == 'number' ) {
					unit.custom.tmpECSkillDuration[key] -= time;
					//root.log(key + ':' + unit.custom.tmpECSkillDuration[key]);
				}
			}
		}
	},
	
	// Reset skill duration
	resetDuration: function(unit) {
		delete unit.custom.tmpECSkillDuration;
	},

	// Set reusable turns for skills
	setCoolTime: function(unit, skill) {
		var id = skill.getId()
		var coolTime = EC_GetCommandCoolTime(skill);
		
		//root.log("OK2:"+ id);
		
		if( coolTime > 0 ) {
			EC_Putlog('Number of turns required to reuse skills：' + coolTime, skill);
			// Initialization of the number of activations
			if( unit.custom.tmpECSkillCoolTime == null ) {
				unit.custom.tmpECSkillCoolTime = Array();
			}
			unit.custom.tmpECSkillCoolTime[id] = coolTime;
		}
	},

	// Check if there is a cool time for the skill
	getCoolTime: function(unit, id) {
		if( unit.custom.tmpECSkillCoolTime == null ) {
			return 0;
		}
		
		if( typeof unit.custom.tmpECSkillCoolTime[id] == 'number' ) {
			if( unit.custom.tmpECSkillCoolTime[id] > 0 ) {
				EC_PutlogDebug('Number of turns required to reuse skills：' + unit.custom.tmpECSkillCoolTime[id], id);
				return unit.custom.tmpECSkillCoolTime[id];
			}
		}
		
		return 0;
	},

	// Reduced skill reusable turns
	countCoolTime: function(unit, time) {
		if( typeof unit.custom.tmpECSkillCoolTime != 'undefined' ) {
			for( var key in unit.custom.tmpECSkillCoolTime ) {
				if( typeof unit.custom.tmpECSkillCoolTime[key] == 'number' ) {
					unit.custom.tmpECSkillCoolTime[key] -= time;
					//root.log(key + ':' + unit.custom.tmpECSkillCoolTime[key]);
				}
			}
		}
	},

	// Reset skill reusable turns
	resetCoolTime: function(unit) {
		delete unit.custom.tmpECSkillCoolTime;
	}

	//// Reset skill reusable turns
	//setExtraEnableSkill: function(unit, skill) {
	//	if( (skill.custom.EC_ExtraEnableSkill instanceof Array) == false ) {
	//		return;
	//	}
	//	
	//	if( unit.custom.tmpExtraEnableSkill == null ) {
	//		unit.custom.tmpExtraEnableSkill = Array();
	//	}
	//	
	//	var tmpArray = skill.custom.EC_ExtraEnableSkill;
	//	for(var i=0 ; i<tmpArray.length ; i++) {
	//		unit.custom.tmpExtraEnableSkill[] = tmpArray[i];
	//	}
	//},

	//// Reset skill reusable turns
	//getExtraEnableSkill: function(unit, skill) {
	//	if( (unit.custom.tmpExtraEnableSkill instanceof Array) == false ) {
	//		return false;
	//	}
	//	
	//	var result = unit.custom.tmpExtraEnableSkill.indexOf( skill.getId() );
	//	
	//	if( retult == -1 ) return false;
	//	
	//	return true;
	//}
};

//If the activation count limit type is battle, reset the activation count after battle
var alias2 = NormalAttackOrderBuilder._endVirtualAttack;
NormalAttackOrderBuilder._endVirtualAttack = function(virtualActive, virtualPassive)
{
	alias2.call(this, virtualActive, virtualPassive);

	var active  = virtualActive.unitSelf;
	var passive = virtualPassive.unitSelf;
	
	EC_SkillCheck.ResetTriggerCount(active, OT_SkillTriggerCountType.BATTLE);
	EC_SkillCheck.ResetTriggerCount(passive, OT_SkillTriggerCountType.BATTLE);
};

// 発動回数制限タイプがターンなら、自軍ターン開始時に発動回数をリセットする
var alias3 = TurnMarkFlowEntry.doMainAction;
TurnMarkFlowEntry.doMainAction = function(isMusic)
{
	alias3.call(this, isMusic);

	// Reset when your turn begins
	if (root.getCurrentSession().getTurnType() === TurnType.PLAYER) {
		OT_ResetComandSkill(PlayerList.getMainList());
		OT_ResetComandSkill(EnemyList.getMainList() );
		OT_ResetComandSkill(AllyList.getMainList()  );

		OT_ResetTriggerCountList(PlayerList.getMainList(), OT_SkillTriggerCountType.TURN);
		OT_ResetTriggerCountList(EnemyList.getMainList() , OT_SkillTriggerCountType.TURN);
		OT_ResetTriggerCountList(AllyList.getMainList()  , OT_SkillTriggerCountType.TURN);
		
		// Countdown if there is a skill duration
		OT_ComandSkillCountDown(PlayerList.getMainList());
		OT_ComandSkillCountDown(EnemyList.getMainList());
		OT_ComandSkillCountDown(AllyList.getMainList());
	}
};

// Reset the skill activation count of all units when clearing the map
var alias4 = MapVictoryFlowEntry._completeMemberData;
MapVictoryFlowEntry._completeMemberData = function(battleResultScreen)
{
	OT_ResetComandSkill(PlayerList.getMainList());
	OT_ResetComandSkill(EnemyList.getMainList() );
	OT_ResetComandSkill(AllyList.getMainList()  );

	OT_ResetTriggerCountList(PlayerList.getMainList(), OT_SkillTriggerCountType.ALL);
	OT_ResetTriggerCountList(EnemyList.getMainList(), OT_SkillTriggerCountType.ALL);
	OT_ResetTriggerCountList(AllyList.getMainList(), OT_SkillTriggerCountType.ALL);
	
	//Skill duration reset
	OT_ComandSkillReset(PlayerList.getMainList());
	OT_ComandSkillReset(EnemyList.getMainList());
	OT_ComandSkillReset(AllyList.getMainList());

	return alias4.call(this, battleResultScreen);
};

// Reset the number of times the character is activated
OT_ResetTriggerCountList = function(list, type)
{
	var count = list.getCount();
	var unit;

	for ( var i=0 ; i<count ; i++ )
	{
		unit = list.getData(i);
		EC_SkillCheck.ResetTriggerCount(unit, type);
	}
};

//Reset command skills
OT_ResetComandSkill = function(list)
{
	var count = list.getCount();
	var unit;

	for ( var i=0 ; i<count ; i++ )
	{
		unit = list.getData(i);
		
		EC_SkillCheck.TriggerCountUpCommand(unit, unit.custom.tmpCommandSkillID);
		
		delete unit.custom.tmpCommandSkillID;
	}
	//root.log('reset');
};

// Reduced skill duration and cool time
OT_ComandSkillCountDown = function(list)
{
	var count = list.getCount();
	var unit;

	for ( var i=0 ; i<count ; i++ ) {
		unit = list.getData(i);
		EC_SkillCheck.countDuration(unit, 1);
		EC_SkillCheck.countCoolTime(unit, 1);
	}
};

// Reset skill duration and cool time
OT_ComandSkillReset = function(list)
{
	var count = list.getCount();
	var unit;

	for ( var i=0 ; i<count ; i++ ) {
		unit = list.getData(i);
		EC_SkillCheck.resetDuration(unit);
		EC_SkillCheck.resetCoolTime(unit);
	}
};

// Acquire all skills, including unequipped weapons you currently have
OT_getDirectSkillArrayAll = function(unit, skilltype, keyword) {
	// Acquire skills other than weapons
	var arr = SkillControl.getSkillMixArray(unit, null, skilltype, keyword);

	// Acquire the skills of weapons that can be equipped
	var objectFlag = ObjectFlag.UNIT | ObjectFlag.CLASS | ObjectFlag.WEAPON | ObjectFlag.ITEM | ObjectFlag.STATE | ObjectFlag.FUSION;
	if (objectFlag & ObjectFlag.WEAPON) {
		var count = UnitItemControl.getPossessionItemCount(unit);
		for (i = 0; i < count; i++) {
			item = UnitItemControl.getItem(unit, i);
			if (item !== null && ItemControl.isWeaponAvailable(unit, item)) {
				// Add skills if items are available
				SkillControl._pushSkillValue(item, ObjectType.WEAPON, arr, skilltype, keyword);
			}
		}
	}

	return SkillControl._getValidSkillArray(arr);
};

// Acquire all command skills including the currently unequipped weapons.
OT_getCommandSkillArrayAll = function(unit, skilltype, keyword) {
	var arrBefore = OT_getDirectSkillArrayAll(unit, skilltype, keyword);
	var count = arrBefore.length;
	var arr = new Array();

	// Make sure you have command type skills
	for( var i=0 ; i<count ; i++ ) {
		// Is it a command-driven type?
		if( OT_isCommandSkill(arrBefore[i].skill) ) {
			arr.push(arrBefore[i]);
		}
	}
	
	return arr;
}

// Get the setting value of Ec add trigger rate
OT_GetECAddTriggerRate = function(unit, skill) {
	var now = skill.custom.EC_AddTriggerRate;
	var result = 0;
	if( now != null && unit != null ) {
		for( var key in now ) {
			result += OT_GetECAddTriggerRateValue(unit, skill, key, now[key]);
		}
	}
	return result;
};

OT_GetECAddTriggerRateValue = function(unit, skill, type, value) {
	// parameter not declared
	if(UnitParameter[type] == 'undefined') {
		root.log(type + 'Is an undeclared parameter.');
		return 0;
	}
	
	if(typeof value === 'string') {
		value = parseFloat(value);
		//root.log('Convert string numbers to numbers:' + value);
	}
	
	var now = 0;
	var max = 0;
	var paramName = type;
	
	switch(type) {
		// HP, EP, FP get the current value and the maximum value respectively
		case 'HP':
			now = unit.getHp();
			break;

		case 'EP':
			now = OT_GetNowEP(unit) - unit.custom.tmpUseEP;
			break;

		case 'FP':
			now = OT_GetNowFP(unit) - unit.custom.tmpUseFP;
			break;

		// For parameters other than HP, EP, and FP, the maximum value is set as the growth limit value.
		case 'LV':
			now = unit.getLv();
			break;

		default:
			now = EC_GetParamBonusPercent(unit, type, skill);
			break;
	}
	var result = Math.floor(now * value);
	EC_Putlog('Additional activation rate:' + paramName + '(' + now + ')x' + value + '=' + result, skill);
	return result;
};

//Measures to avoid unnecessary checks with parameter bonus skills
//If this is not done, unnecessary checks will be performed for the total number of statuses.
//
//getUnitTotalParamBonus has been significantly modified in the getUnitTotalParamBonus function.
//The third argument of SkillControl.getSkillObjectArray is SkillType.PARAMBONUS
//The process can be performed without any problem unless it is executed twice.
//(There is no problem as long as getUnitTotalParamBonus is called within SkillControl.getSkillObjectArray)
var tmpECParameterType = new Array();
var alias99 = BaseUnitParameter.getUnitTotalParamBonus;
BaseUnitParameter.getUnitTotalParamBonus = function(unit, weapon) {
	tmpECParameterType.push(this.getParameterType());
	var val = alias99.call(this, unit, weapon);
	tmpECParameterType.pop();
	return val;
};

//If it is a support skill, check the activation check at the skill retention confirmation section.
var alias100 = SkillControl.getSkillObjectArray;
SkillControl.getSkillObjectArray = function(unit, weapon, skilltype, keyword, objectFlag) {
	var tmpType = -1;
	if(skilltype == SkillType.PARAMBONUS && tmpECParameterType.length > 0 && EC_GetSkillCustomCheckPerformance) {
		tmpType = tmpECParameterType[tmpECParameterType.length - 1];
		//tmpType = tmpECParameterType.pop();
	}
	
	var arr = alias100.call(this, unit, weapon, skilltype, keyword, objectFlag);
	if(skilltype == SkillType.SUPPORT || skilltype == SkillType.PARAMBONUS) {
		var i, skill;
		var count = arr.length;
		var returnArr = [];
		var targetUnit = null;
		if(typeof unit.custom.tmpNowVirtualAttack != 'undefined') {
			targetUnit = unit.custom.tmpNowVirtualAttack.tmpECTargetUnit;
		} else if(unit.custom.tmpECTarget) {
			targetUnit = unit.custom.tmpECTarget;
		}

		for (i = 0; i < count; i++) {
			skill = arr[i].skill;
			if(skilltype == SkillType.PARAMBONUS) {
				if(tmpType != -1) {
					// Exclude if there is no increase or decrease in parameters
					var val = skill.getParameterBonus().getAssistValue(tmpType);
					if(val == 0) {
						//root.log('Status check:' + tmpType);
						continue;
					}
					//root.log('plus:' + val);
				}
			}
			
			// Check whether command skills can be read or not
			if(typeof OT_isCommandSkill != 'undefined') {
				if(OT_isCommandSkill(skill)) {
					// If it is a command skill, check whether it is activated by command.
					if(!EC_SkillCheck.SkillCheckCommand(unit, skill, false)) {
						continue;
					}
				}
			}
			
			// Check activation conditions
			if(targetUnit) {
				//root.log('getSkillObjectArray:1');
				if(!EC_SkillCheck.isSkillCheckEnableTypeAttack(unit, targetUnit, skill, true)) {
					continue;
				}
			} else {
				//root.log('getSkillObjectArray:2');
				if(!EC_SkillCheck.isSkillCheckEnable(unit, skill, true)) {
					continue;
				}
			}
			
			returnArr.push(arr[i]);
		}
		
		return returnArr;
	}
	
	return arr;
};

//When you have a parameter bonus skill that increases or decreases the maximum HP with activation conditions set
//If the conditions are not met when the unit appears, the current HP will exceed the maximum HP, so make corrections.
var cacheMhp = 0;
var aliasGetMHP = ParamBonus.getMhp;
ParamBonus.getMhp = function(unit) {
	var val = aliasGetMHP.call(this, unit);
	cacheMhp = val;
	return val;
};

var aliasUpdateHP = MapHpControl.updateHp;
MapHpControl.updateHp = function(unit) {
	aliasUpdateHP.call(this, unit);
	if(unit.getHp() > cacheMhp) {
		//root.log(unit.getName() + '：HP correction');
		//root.log(unit.getHp() + ' => ' + cacheMhp);
		unit.setHp(cacheMhp);
	}
};

// If there is a prohibition on pursuit or cancellation of counterattack when activated, it will be suspended.
var aliasRound = VirtualAttackControl.isRound;
VirtualAttackControl.isRound = function(virtualAttackUnit)
{
	//If the setting is to prohibit follow-up when the skill is activated,
	//Forcibly terminate when skill is activated
	if(!virtualAttackUnit.unitSelf.custom.EC_TmpRoundCheckBefore) {
		//Exclude if you have not attacked even once
		if(virtualAttackUnit.unitSelf.custom.EC_TmpRoundOneAttack) {
			virtualAttackUnit.roundCount = 0;
			return false;
		}
	}
	delete virtualAttackUnit.unitSelf.custom.EC_TmpRoundCheckBefore;

	//This force closes even if you are not attacking.
	if(virtualAttackUnit.unitSelf.custom.EC_TmpRoundNoAttack) {
		virtualAttackUnit.roundCount = 0;
		return false;
	}
	
	return aliasRound.call(this, virtualAttackUnit);
};

})();

