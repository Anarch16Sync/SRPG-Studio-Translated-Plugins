
/*--------------------------------------------------------------------------
  
Skill "Critical Attack"
  A critical hit will occur when the skill is activated.

  how to use:
  Select Custom in Skill and set [OT_Critical] in Keyword.
  *Use with ExtraConfigSkill.js to increase activation rate to 100%,
    If you set {EC_NowHP:'0-50%'} in the custom parameter
    You can reproduce FE's "anger" (always critical when HP is below 50%).
  
  custom parameters
  {
      CRTA_DamageRate: (number) //Adjust the damage multiplier when the skill is activated, default is 1.0 if not specified (note that it is not a critical multiplier)
    , CRTA_IgnoreCriticalGuard :(Boolean value) //Ignore the opponent's critical invalidation skill, or default to true if not specified
  }
  
  If CRTA_DamageRate is set, the final damage from "Critical Attack" is
Damage corrected by critical *CRTA_DamageRate.
  
  Author:
  o-to
  
  Change log:
  2015/05/31:New creation
  2023/07/17:
  It is now possible to specify the adjustment of critical power when activating a skill using Kaspara.
  You can now specify not to activate if Kaspara has a critical nullification skill.
  (Before the update, skill activation ignored the opponent's critical nullification skills)
  
--------------------------------------------------------------------------*/


(function() {

  //Get damage multiplier
  function fGetDamageRate(skill) {
    var val = skill.custom.CRTA_DamageRate;
    
    if (typeof val !== 'number') {
      val = 1.00;
    }
    return val;
  };
  //Is it critical invalid penetration?
  function bGetIgnoreCriticalGuard(skill) {
    var val = skill.custom.CRTA_IgnoreCriticalGuard;
    
    if (typeof val !== 'boolean') {
      val = true;
    }
    return val;
  };
  
  var alias1 = SkillRandomizer.isCustomSkillInvokedInternal;
  SkillRandomizer.isCustomSkillInvokedInternal = function(active, passive, skill, keyword) {
    
    //critical attack
    if (keyword === 'OT_Critical') {
      // If it is not a triggered type, simply return true.
      return this._isSkillInvokedInternal(active, passive, skill);
    }
  
    return alias1.call(this, active, passive, skill, keyword);
  };
  
  //critical
  var OT_CriticalAttackSkill = null;
  var alias2 = AttackEvaluator.HitCritical.isCritical;
  AttackEvaluator.HitCritical.isCritical = function(virtualActive, virtualPassive, attackEntry) {
    OT_CriticalAttackSkill = SkillControl.checkAndPushCustomSkill(virtualActive.unitSelf, virtualPassive.unitSelf, attackEntry, true, 'OT_Critical');
    if (OT_CriticalAttackSkill !== null) {
      // If the opponent does not have the "Crit Immunity" skill, critical
      if (SkillControl.getBattleSkillFromFlag(virtualPassive.unitSelf, virtualActive.unitSelf, SkillType.INVALID, InvalidFlag.CRITICAL) === null) {
        return true;
      }
      
      //If you have it, check whether it is set to ignore critical invalidity.
      if(bGetIgnoreCriticalGuard(OT_CriticalAttackSkill)) {
        return true;
      }
      
      //Delete the data placed in the array when skill activation display is ON.
      if (OT_CriticalAttackSkill.isSkillDisplayable()) {
        var i = 0;
        for(i = 0 ; i < attackEntry.skillArrayActive.length ; i++) {
          if(attackEntry.skillArrayActive[i].getID() == OT_CriticalAttackSkill.getID()) {
            attackEntry.skillArrayActive.splice(i, 1);
            break;
          }
        }
      }
      
      //root.log('Opponent has critical immunity:' + OT_CriticalAttackSkill.getID());
      OT_CriticalAttackSkill = null;
    }
    return alias2.call(this, virtualActive, virtualPassive, attackEntry);
  };
  
  // Damage settings
  var alias3 = AttackEvaluator.HitCritical.calculateDamage;
  AttackEvaluator.HitCritical.calculateDamage = function(virtualActive, virtualPassive, attackEntry) {
    var active = virtualActive.unitSelf;
    var passive = virtualPassive.unitSelf;
    var damage = alias3.call(this, virtualActive, virtualPassive, attackEntry);
    var skill = OT_CriticalAttackSkill;
    
    if(skill != null && attackEntry.isCritical) {
      var percent = fGetDamageRate(skill);
      if( percent == 1.00 ) {
        return damage;
      }
      
      
      //root.log('percent:' + percent);
      var damage2 = Math.floor(damage * percent);
      
      //If the original damage is other than 0 and the damage becomes 0 when the skill is activated, the damage will be set to 1.
      if( damage != 0 && damage2 == 0 ) {
        if(damage >= 0) {
          damage = 1;
        } else {
          damage = -1;
        }
      } else {
        damage = damage2;
      }
    }
  
    return damage;
  };
  
  // Before attack calculation formula
  var alias4 = AttackEvaluator.HitCritical.evaluateAttackEntry;
  AttackEvaluator.HitCritical.evaluateAttackEntry = function(virtualActive, virtualPassive, attackEntry) {
    OT_CriticalAttackSkill = null;
    return alias4.call(this, virtualActive, virtualPassive, attackEntry);
  };
  
  
  })();
  
  