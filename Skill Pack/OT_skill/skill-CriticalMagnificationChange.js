
/*--------------------------------------------------------------------------
  
Skill “Critical magnification change”
  Changes critical multiplier when skill is activated.
  
  how to use:
  Select Custom in Skill and set [OT_CriticalMagnificationChange] in Keyword.
  
  custom parameters
  {
        CRMC_DamageRate: (number) //Critical multiplier, default is 3.0 if not specified
  }
  
  When a critical hit occurs, a skill activation judgment will be made, and the critical multiplier will be as follows.
  Skill not activated: Value set on SRPG Studio side [default value 3]
  Skill activation: CRMC_DamageRate value
  
  *
  The “Critical Attack” skill from another plugin is activated,
  When Caspara CRTA_DamageRate of "Critical Attack" is set
  If the "Critical Multiplier Change" skill is also activated,
  Damage corrected by critical *CRTA_DamageRate is the final damage.
Author:
  o-to
  
  Change log:
  2023/07/17:
  Create New
  
--------------------------------------------------------------------------*/


(function() {

// Get damage multiplier
function fGetDamageRate(skill) {
	var val = skill.custom.CRMC_DamageRate;
	
	if (typeof val !== 'number') {
		val = 3.00;
	}
	return val;
};

var alias1 = SkillRandomizer.isCustomSkillInvokedInternal;
SkillRandomizer.isCustomSkillInvokedInternal = function(active, passive, skill, keyword) {
	
	// Critical multiplier change
	if (keyword === 'OT_CriticalMagnificationChange') {
		// If it is not a triggered type, simply return true.
		return this._isSkillInvokedInternal(active, passive, skill);
	}

	return alias1.call(this, active, passive, skill, keyword);
};

// Activation check when critical occurs
// Check in the function after the critical judgment function completes
var OT_CriticalMagnificationChangeSkill = null;
var alias2 = AttackEvaluator.HitCritical.calculateDamage;
AttackEvaluator.HitCritical.calculateDamage = function(virtualActive, virtualPassive, attackEntry) {
	OT_CriticalMagnificationChangeSkill = null;
	if(attackEntry.isCritical) {
		OT_CriticalMagnificationChangeSkill = SkillControl.checkAndPushCustomSkill(virtualActive.unitSelf, virtualPassive.unitSelf, attackEntry, true, 'OT_CriticalMagnificationChange');
	}
	return alias2.call(this, virtualActive, virtualPassive, attackEntry);
};

//  critical damage setting
var alias3 = DamageCalculator.getCriticalFactor;
DamageCalculator.getCriticalFactor = function() {
	if (OT_CriticalMagnificationChangeSkill !== null) {
		return fGetDamageRate(OT_CriticalMagnificationChangeSkill);
	}
	return alias3.call();
};

// Before attack calculation formula
var alias4 = AttackEvaluator.HitCritical.evaluateAttackEntry;
AttackEvaluator.HitCritical.evaluateAttackEntry = function(virtualActive, virtualPassive, attackEntry) {
	OT_CriticalMagnificationChangeSkill = null;
	return alias4.call(this, virtualActive, virtualPassive, attackEntry);
};


})();

