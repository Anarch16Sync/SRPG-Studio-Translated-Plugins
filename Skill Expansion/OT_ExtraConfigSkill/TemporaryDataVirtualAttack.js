/*--------------------------------------------------------------------------
  
During battle, the virtualAttackUnit is temporarily held in the unit's custom.tmpNowVirtualAttack.
  In functions such as SkillRandomizer._isSkillInvokedInternal where virtualAttackUnit cannot be passed.
  You can refer to virtualAttackUnit.

  how to use:
  virtualAttackUnit can be referenced in unit.custom.tmpNowVirtualAttack
  
  Author:
  o-to
  
  Change log:
  2015/05/30: Newly created
  2016/01/10:
  When the EP and FP system is introduced, by skill activation before determining the weapon's EP /FP consumption
  Corrected because there is a possibility that EP/FP will be consumed and you will not be able to attack.

  2023/10/29:
  Added temporary processing data for when adding activation conditions related to parameter bonus skills.
  If the temporary processing data was not deleted when there was a script conflict,
  Delete temporary processing data when saving.
  At this time, if you are in test play, you will now receive a warning that a script conflict is occurring.
  
--------------------------------------------------------------------------*/

(function() {

	// Does the skill activate before attacking?
	OT_BeforeAttackSkill = false;
	
	// Create temporary data when creating a virtual attack unit
	var alias1 = VirtualAttackControl.createVirtualAttackUnit;
	VirtualAttackControl.createVirtualAttackUnit = function(unitSelf, targetUnit, isSrc, attackInfo) {
		delete unitSelf.custom.EC_TmpRoundNoAttack;
		delete unitSelf.custom.EC_TmpRoundOneAttack;
		delete unitSelf.custom.tmpNowVirtualAttack;
		
		var virtualAttackUnit = alias1.call(this, unitSelf, targetUnit, isSrc, attackInfo);
		virtualAttackUnit.tmpECTargetUnit = targetUnit;
		
		virtualAttackUnit.unitSelf.custom.tmpNowVirtualAttack = virtualAttackUnit;
		virtualAttackUnit.unitSelf.custom.EC_TmpRoundCheckBefore = true;
		//root.log('Temporary creation');
	
		//May be triggered by command skill
		var arr = OT_getCommandSkillArrayAll(unitSelf, -1, '');
		var count = arr.length;
		
		// Make sure you have command type skills
		for( var i=0 ; i<count ; i++ ) {
			var skill = arr[i].skill;
			
			// Command skill activated
			if(EC_SkillCheck.SkillCheckCommand(unitSelf, skill, false)) {
				// If you set prohibition on follow-up when activated
				if(EC_isRoundNoAttack(skill)) {
					virtualAttackUnit.unitSelf.custom.EC_TmpRoundNoAttack = true;
				}
				//If you set prohibition of follow-up (attack once) when activated
				if(EC_isRoundOneAttack(skill)) {
					virtualAttackUnit.unitSelf.custom.EC_TmpRoundOneAttack = true;
				}
			}
		}
	
		OT_BeforeAttackSkill = true;
		return virtualAttackUnit;
	};
	
	// Delete temporary data after battle (if not deleted, an error will occur when saving)
	var alias2 = NormalAttackOrderBuilder._endVirtualAttack;
	NormalAttackOrderBuilder._endVirtualAttack = function(virtualActive, virtualPassive)
	{
		alias2.call(this, virtualActive, virtualPassive);
		delete virtualActive.unitSelf.custom.tmpNowVirtualAttack;
		delete virtualPassive.unitSelf.custom.tmpNowVirtualAttack;
	
		delete virtualActive.unitSelf.custom.EC_TmpRoundNoAttack;
		delete virtualPassive.unitSelf.custom.EC_TmpRoundNoAttack;
	
		delete virtualActive.unitSelf.custom.EC_TmpRoundOneAttack;
		delete virtualPassive.unitSelf.custom.EC_TmpRoundOneAttack;
		
		delete virtualActive.unitSelf.custom.EC_TmpRoundCheckBefore;
		delete virtualPassive.unitSelf.custom.EC_TmpRoundCheckBefore;
		
		OT_BeforeAttackSkill = false;
		//root.log('temporary delete');
	};
	
	// Check this because there is a possibility that the skill will be activated before the attack starts.
	var alias3 = VirtualAttackControl.isRound;
	VirtualAttackControl.isRound = function(virtualAttackUnit)
	{
		OT_BeforeAttackSkill = true;
		return alias3.call(this, virtualAttackUnit);
	};
	
	//When determining whether it is possible to attack, remove the check as there is a possibility that the skill will be activated after the attack starts.
	var alias4 = VirtualAttackControl.isAttackContinue;
	VirtualAttackControl.isAttackContinue = function(virtualAttackUnit)
	{
		OT_BeforeAttackSkill = false;
		return alias4.call(this, virtualAttackUnit);
	};
	
	//When setting activation conditions for parameter bonus skills such as opponent's HP being below 〇〇%
    //To be able to refer to the opponent when checking skill activation conditions during damage calculation
    //Temporarily store the information of the other unit in the unit's Caspara
	var alias5 = DamageCalculator.calculateAttackPower;
	DamageCalculator.calculateAttackPower = function(active, passive, weapon, isCritical, totalStatus, trueHitValue) {
		active.custom.tmpECTarget  = passive;
		passive.custom.tmpECTarget = active;
		var val = alias5.call(this, active, passive, weapon, isCritical, totalStatus, trueHitValue);
		delete active.custom.tmpECTarget;
		delete passive.custom.tmpECTarget;
		return val;
	};
	
	var alias6 = DamageCalculator.calculateDefense;
	DamageCalculator.calculateDefense = function(active, passive, weapon, isCritical, totalStatus, trueHitValue) {
		active.custom.tmpECTarget  = passive;
		passive.custom.tmpECTarget = active;
		var val = alias6.call(this, active, passive, weapon, isCritical, totalStatus, trueHitValue);
		delete active.custom.tmpECTarget;
		delete passive.custom.tmpECTarget;
		return val;
	};
	
	//About the values ​​displayed in the information window during battle (damage value, hit rate, critical rate)
	//When you have a parameter bonus skill that requires EP and FP to be above a certain value, etc.
	//The EP and FP used to determine whether the parameter bonus skill works
	//Because the value after the battle was referenced
	//Temporarily restore the value before the end of the battle so that the damage value is displayed correctly
	var alias7 = AttackChecker.getAttackStatusInternal;
	AttackChecker.getAttackStatusInternal = function(unit, weapon, targetUnit) {
		var tmpEP = unit.custom.tmpUseEP;
		var tmpFP = unit.custom.tmpUseFP;
		var tmpTargetEP = targetUnit.custom.tmpUseEP;
		var tmpTargetFP = targetUnit.custom.tmpUseFP;
		unit.custom.tmpUseEP = 0;
		unit.custom.tmpUseFP = 0;
		targetUnit.custom.tmpUseEP = 0;
		targetUnit.custom.tmpUseFP = 0;
		
		var arr = alias7.call(this, unit, weapon, targetUnit);
		
		unit.custom.tmpUseEP = tmpEP;
		unit.custom.tmpUseFP = tmpFP;
		targetUnit.custom.tmpUseEP = tmpTargetEP;
		targetUnit.custom.tmpUseFP = tmpTargetFP;
		return arr;
	}
	
	//Safety when temporary processing data is not deleted
	//Delete temporary data before saving
	var aliasSave = LoadSaveScreen._executeSave;
	LoadSaveScreen._executeSave = function() {
		var NoDeleteTmpVirtualAttackData = false;
		var NoDeleteTmpECTargetData = false;
		var i, j, count, list, targetUnit;
		var listArray = [];
		listArray.push(PlayerList.getMainList());
		listArray.push(EnemyList.getMainList());
		listArray.push(AllyList.getMainList());
		
		var listCount = listArray.length;
		
		for (i = 0; i < listCount; i++) {
			list = listArray[i];
			count = list.getCount();
			for (j = 0; j < count; j++) {
				targetUnit = list.getData(j);
				
				if(targetUnit) {
					if(typeof targetUnit.custom.tmpNowVirtualAttack !== 'undefined') {
						NoDeleteTmpVirtualAttackData = true;
						delete targetUnit.custom.tmpNowVirtualAttack;
					}
		
					if(typeof targetUnit.custom.EC_TmpRoundNoAttack !== 'undefined') {
						// This is not a fatal error, so exclude it from error warnings.
						delete targetUnit.custom.EC_TmpRoundNoAttack;
					}
	
					if(typeof targetUnit.custom.EC_TmpRoundOneAttack !== 'undefined') {
						// This is not a fatal error, so exclude it from error warnings.
						delete targetUnit.custom.EC_TmpRoundOneAttack;
					}
	
					if(typeof targetUnit.custom.EC_TmpRoundCheckBefore !== 'undefined') {
						// This is not a fatal error, so exclude it from error warnings.
						delete targetUnit.custom.EC_TmpRoundCheckBefore;
					}
					
					if(typeof targetUnit.custom.tmpECTarget !== 'undefined') {
						NoDeleteTmpECTargetData = true;
						delete targetUnit.custom.tmpECTarget;
					}
				}
			}
		}
		
		aliasSave.call(this);
	
		if(root.isTestPlay()) {
			// This may occur depending on script conflicts.
			if(NoDeleteTmpVirtualAttackData) {
				root.msg('The temporary processing data for adding skill activation conditions was not deleted, so it was deleted before the save process.\nThis error occurs if there is a script conflict problem, such as not calling the call function when inheriting normal attack order builder. end virtual attack in another plugin.');
			}
			
			// It probably won't happen, but just in case
			if(NoDeleteTmpECTargetData) {
				root.msg('The temporary processing data for adding skill activation conditions was not deleted, so it was deleted before the save process.\nThere is a problem with script conflict when inheriting damage calculator.calculate attack power and damage calculator.calculate defense from another plugin.');
			}
		}
	};
	
	})();
	
	