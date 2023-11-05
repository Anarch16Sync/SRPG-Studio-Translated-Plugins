-----------------------------------------------------------------------------------------
[Change log]
  2015/06/6: Alpha version released
  2015/06/17: Beta version released
  2015/06/20: Added attack-like skills,
              Separate the scripts for adding skill activation conditions and the scripts for additional skills.
  2015/09/06: Charge skill modified due to deletion of official function
  2015/09/13: "Ranbu" corresponds to 1-239's integrated CalA noreattack
  2015/10/31: Corrected due to official function name change in “Ranbu” and “Assault”
  2016/06/13: Remade the cancellation posted in a certain thread
  2017/04/23: Fixed the issue where the option to ignore defense for hit skills was not working when skill-BreakAttack.js was used.
  2019/05/25:
  -skill-Assault.js (continue battle)
  If you find yourself in a situation where you have to fight endlessly because your opponent is invincible, your attacks don't hit, you absorb each other's HP, etc.
  Unless you set a limit on the number of times a skill can be used in conjunction with a skill activation condition addition script,
Since there was a freeze issue, the standard script for this skill has been modified to limit the number of times it can be activated.
  
  Modified so that it can be set in Custom Parameter so that it does not activate in situations where it can be attacked unilaterally.
  
  If the event is set against a character who has become immortal, the user will be at a disadvantage.
  Add Custom parameter to alleviate it.
  
  The activation display of the skill will be the same as when re-battling with the skill after both battles have ended.
  Corrected so that it is displayed during the first attack and defense.
  
  2020/01/01：
  -skill-StatusAttack.js (Status-dependent attack)
  Create New.
  The skill owner's attack power and attack target's defense power were specified with custom parameters.
  It will be status dependent.

  2020/01/07:
  Fixed an issue where the keywords for custom skills were not specified for some skills.
  Corrected the skill name of "Damage Absorption" to "Damage Absorption" (because it overlaps with the official name)

  2023/07/17:
  Added damage multiplier adjustment function to the skill "Critical Attack" when activated.
  Also, it used to ignore critical invalidity when activated, but it can now be set so that it does not ignore it with Custom Parameter.
  Created a new skill "Critical multiplier change".
  Activation is determined when a critical occurs, and when activated
  The critical multiplier of the critical hit at that time will be changed to the value specified by Custom Parameter.
  
-----------------------------------------------------------------------------------------
[Introduction method]
*If you installed this script before June 20, 2015, please delete the "ot skill" folder.
Please put "ot_skill" in the plugin folder.

Recommended for use with additional skill activation conditions.
(Especially for status-dependent attacks, it is assumed that the order of activation of similar skills is checked (duplicate skill.js))

Because armor break (skill break attack.js) and status-dependent attack (skill status attack.js) tend to conflict with other custom scripts (such as general cal),
when using them together with other custom scripts, Either change the folder name of "skill" to "0_ot_skill" and load it first, or merge the description into another script,
or remove the script if it is not used.

-----------------------------------------------------------------------------------------
[Overview] 
By installing it, you will be able to use the following skills.

-When activated, always performs a critical attack 
-Attack that ignores defense power 
-Randomly attacks multiple times 
-Absorbs damage taken 
-Continues the battle 
-Reduces the number of rounds for the opponent when the attack hits 
-Changes the attack power of the skill owner and the defense power of the attack target to a specific status make dependent

-----------------------------------------------------------------------------------------
[Instructions]
-File name: skill critical magnification change.js
-Skill [Critical multiplier change]
How to use: Custom skill keyword [OT_CriticalMagnificationChange].
When activated, the critical multiplier at that time will be changed to the value specified by Custom Parameter.

Normally, when a critical hit occurs, the damage compensation value will be the value
set in "Critical Coefficient" in "Data Settings" → "Config 2", but when a skill is activated,
the critical compensation value will be the value specified in the skill's Custom parameter. It becomes.

-Custom parameters that can be passed
{
  CRMC_DamageRate:(Number) //Critical multiplier, default is 3.0 if not specified
}

*The following example assumes that the critical coefficient is 300 (default value).

example:
CRMC_DamageRate:5.0
If set, the critical damage will be 3x when the skill is not activated, but the critical damage will be 5x when the skill is activated.

For example, if normal damage is 5, normal critical damage is 15. When the skill is activated, critical damage will be 25.

ーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーー
-file name：skill-BreakAttack.js
-Skill [Armor Break] (Luna-like)
Instructions: Custom skill keyword [OT_BreakAttack]

When this skill is activated, the attack ignores the enemy's defense power.
If you want to set the percentage of defense power to ignore, set a custom parameter.
If you do not set a parameter, the opponent's defense power will be completely ignored.

-Custom parameters that can be passed
{
  BreakPercent:(Numeric value) //Set what percentage of the opponent's defense power to ignore
}

example：
BreakPercent:60
If set, 60% of the opponent's defense power will be ignored.。


ーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーー
-file name：skill-Critical.js
-Skill [Critical Attack]
How to use: Custom skill keyword [OT_Critical]
When this skill is activated, the attack becomes critical.

「OT_ExtraConfigSkill」
Put it together with the folder and set the activation rate to 100% with custom parameters.

{
  EC_NowHP:'0-50%'
}
If you specify , you can reproduce fe's skill "Rage" (critical attack when h p50% or less).

-Custom parameters that can be passed
{
    CRTA_DamageRate  : (Numeric value) //Adjustment of damage multiplier when skill is activated, default is 1.0 when not specified (note that it is not critical multiplier)
  , CRTA_IgnoreCriticalGuard  :(Boolean value) //Ignore the opponent's critical invalidation skill, or default to true if not specified
}

If CRTA_DamageRate is set, the final damage from "Critical Attack" is
corrected by (Critical Damage)*CRTA_DamageRate.

*The following example assumes that the critical coefficient is 300 (default value).

example：
CRTA_DamageRate:2.0
If normal damage is 6, normal critical damage is 18. When the "Critical Attack" skill is activated, the critical damage will be 36.

*
When Custom parameter CRTA_DamageRate of "Critical Attack" is set
If both "Critical Attack" and "Critical Multiplier Change" skills are activated,
Damage value *CRMC_DamageRate (Custom parameter of critical multiplier change) *CRTA_DamageRate is the final damage.

for example
If you set the Custom parameter CRMC_DamageRate of "Critical multiplier change" to 5.0,
If you set the Custom parameter CRTA_DamageRate of "Critical Attack" to 3.0,
If normal damage is 4, critical damage when both skills are not activated is 12.
The critical damage when only the "Critical Attack" skill is activated is 36.
When only the "Critical Multiplier Change" skill is activated, the damage caused by a critical hit is 20.

If both skills are activated
4 * 5.0(CRMC_DamageRate) * 3.0(CRTA_DamageRate) = This will cause 60 damage.

ーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーー
-file name：skill-BoisterousDance.js
-Skill [Ranbu]
How to use: Custom skill keyword [OT_BoisterousDance]

When the skill is activated, it will cause multiple random attacks.
When possessing this skill, damage inflicted will be reduced.
(It is also possible to reduce the damage only when activated with a custom parameter)

-Custom parameters that can be passed
{
    DamageRate     :(Numeric value) //Set what percentage of damage
  , MaxAttackCount :(number) //You can set the maximum number of attacks
  , MinAttackCount :(Numeric value) //When the skill is activated, at least this set value will be used as an attack.
  , isRateChange   :(Numeric value) //With 0, the damage rate will change just by possessing the skill, and with 1, the damage rate will change only when the skill is activated.
  , isNoReattack   :(Numeric value) //1 Set whether to be affected by Mr. 239's integrated cal a's noreattack, 1 to be affected, 0 to not be affected.
}

example:
{
DamageRate       : 30
,MinAttackCount   : 3
,MinAttackCount   : 6
,isRateChange     : 1
}

After activating the skill, it will attack at least 3 times and up to 6 times.
Also, the damage dealt will be reduced to 30% only when the skill is activated.

If DamageRate is not set, it will be 50.
If MaxAttackCount is not set, it will be 5.
If MinAttackCount is not set, it will be 2.
If isRateChange is not set, it will be 0.
If isNoReattack is not set, it will be 1.


ーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーー
-file name：skill-AbsorptionDamage.js
-Skill “Damage Absorption”
How to use: Custom skill keyword [OT_AbsorptionDamage]

HP is recovered by absorbing damage received from the opponent when the skill is activated.

-Custom parameters that can be passed
{
  AbsorptionPercent:(numeric value) //Set what percentage of damage is absorbed
}

If Absorption percent is not set, it will be 100.


ーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーー
-file name：skill-Assault.js
-Skill “Continue Battle”
How to use: Custom skill keyword [OT_Assault] 

Once the skill is activated, the battle will continue.
However, it will not be activated in situations where the skill owner is attacked one-sidedly.
(Can be activated in a situation where the skill owner can attack unilaterally, but can be set to not be activated with Custom Parameter)

-Custom parameters that can be passed
{
    AS_Max: (Number) //Maximum number of activations (50 if not specified)
  , AS_OneSide: (Boolean value) //Is it activated in a situation where a unilateral attack is possible (true if not specified)
  , AS_AbortCheck: (Logical value) //If the opponent is an immortal unit, suppress activation when the immortal unit is on the verge of death (false if not specified)
}

AS_Max The default value when not specified is defined by as max activate in skill assault.js.

AS_AbortCheck If you set this to true, when performing a forced evasion that occurs when a skill
or critical hit attacks a character who has become invulnerable due to the event settings 
and its HP becomes 0, the damage amount of the normal attack will exceed the HP.
It will no longer be activated when Alleviates situations where the user is at a disadvantage due to being attacked one-sidedly.

ーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーー
-file name：skill-Cancel.js
-Skill “Cancel+”
How to use: Custom skill keyword [OT_Cancel]
Reduces the opponent's number of rounds when the skill is activated.

custom parameters
{
  CancelCount:(number) //Set how many rounds to reduce
}

CancelCount If is not set, all rounds will be reduced.


ーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーー
-file name：skill-StatusAttack.js
-skill"Status dependent attack"
How to use: Custom skill keyword [OT_StatusAttack]

The attack power of the skill owner and the defense power of the attack target will depend on the status specified by the custom parameter.

Basically, it is recommended to set skills on weapons, and if you want to give them to a unit, it is recommended to make them command skills.
You can also use (strength/2 + skill/2) as attack power like Disgaea's bow.

It is also possible to turn it into a command skill when adding skill activation conditions.
If you have both a non-command skill and a command skill, the non-command skill will normally be activated, and when a command skill is activated, the command skill will be activated.

Custom parameters (each value can be omitted)
{
    SA_AttackValue :
    {   
        LV:(Numeric value, decimal point/minus can be specified)
      , HP:(Numeric value, decimal point/minus can be specified) // Current value x Custom parameter value
      , EP:(Numeric value, decimal point/minus can be specified) // Current value x Custom parameter value, only when installing MP (EP) & Special Gauge (FP) additional plugins
      , FP:(Numeric value, decimal point/minus can be specified) // Current value x Custom parameter value, only when installing MP (EP) & Special Gauge (FP) additional plugins
      , POW:(Numeric value, decimal point/minus can be specified)
      , MAG:(Numeric value, decimal point/minus can be specified)
      , SKI:(Numeric value, decimal point/minus can be specified)
      , SPD:(Numeric value, decimal point/minus can be specified)
      , LUK:(Numeric value, decimal point/minus can be specified)
      , DEF:(Numeric value, decimal point/minus can be specified)
      , MDF:(Numeric value, decimal point/minus can be specified)
      , MOV:(Numeric value, decimal point/minus can be specified)
      , WLV:(Numeric value, decimal point/minus can be specified)
      , BLD:(Numeric value, decimal point/minus can be specified)
      , WPN:(Numeric value, decimal point/minus can be specified) //Corrects weapon attack power, defaults to 1.0 when not specified.
    }
    ,
    SA_DefenceValue :
    {   
        LV:(Numeric value, decimal point/minus can be specified)
      , HP:(Numeric value, decimal point/minus can be specified) // Current value x Custom parameter value
      , EP:(Numeric value, decimal point/minus can be specified) // Current value x Custom parameter value, only when installing MP (EP) & Special Gauge (FP) additional plugins
      , FP:(Numeric value, decimal point/minus can be specified) // Current value x Custom parameter value, only when installing MP (EP) & Special Gauge (FP) additional plugins
      , POW:(Numeric value, decimal point/minus can be specified)
      , MAG:(Numeric value, decimal point/minus can be specified)
      , SKI:(Numeric value, decimal point/minus can be specified)
      , SPD:(Numeric value, decimal point/minus can be specified)
      , LUK:(Numeric value, decimal point/minus can be specified)
      , DEF:(Numeric value, decimal point/minus can be specified)
      , MDF:(Numeric value, decimal point/minus can be specified)
      , MOV:(Numeric value, decimal point/minus can be specified)
      , WLV:(Numeric value, decimal point/minus can be specified)
      , BLD:(Numeric value, decimal point/minus can be specified)
    }
}

SA_AttackValue If omitted, the attacker's attack power is as usual, weapon + (power if the weapon is physical, magic power if the weapon is magic).
SA_DefenceValue If omitted, the attack target's defense power will be the same as usual;
if the attacker's weapon is physical, it will be the defense power, and if the weapon is magic, it will be the magic defense power.

Example 1：
{
    SA_AttackValue :{ POW:0.5, SKI:0.5 }
}

When attacking, the attack power is (strength*0.5)+(technique*0.5)+weapon power.

Example 2：
{
     EC_Command           : 'ATTACK'
   , EC_CommandDuration   : 0
   , SA_AttackValue       : { POW:1.5, WPN:1.5 }
   , SA_DefenceValue      : { LUK:2.0 }
}

Offensive command skill. When attacking with a command skill, the attack power is (strength *1.5) + (weapon power *1.5). The defense power of the skill holder's attack target will be Luck*2.0.

Example 3:
{
     EC_Command           : 'WAIT'
   , EC_CommandDuration   : 3
   , SA_AttackValue       : { MAG:3.0, WPN:0.0 }
   , SA_DefenceValue      : { MAG:1.0 }
}

Standby command skill After executing the command skill, the caster's (Magic Power*3.0) becomes the attack power for 3 turns.
While active, the attack target's defense power becomes magic power*1.0.


Example 4：
{
     SA_AttackValue  : { DEF:1.0, WPN:0.0 }
   , SA_DefenceValue : { POW:-1.0, DEF:1.0 }
}

When attacking, (defense power *1.0) becomes attack power. The defense power of the skill holder's attack target is (defense power *1.0) power.

