-----------------------------------------------------------------------------------------
【Change log】
  2016/01/06: Prototype creation of MP & special gauge

  2016/01/11：
  Fixed a bug that caused an error when exchanging items with a unit that did not have full inventory.
  Fixed an issue where the motion would go awry during real-time battles when EP/FP was interrupted mid-attack.
  Fixed drawing of EP and FP so that it does not conflict with Mr. CB's class explanation script.
  A simple window that appears when you hover over a unit on the map
  Fixed so that the current EP/FP is displayed.

  2016/04/26:
  Fixed EP and FP constants
  
  2016/06/13：
  Corrected a bug where EP and FP were not consumed when making weapons infinite in the tool user expansion.

  2016/07/31：
  Compatible with 1.086, fixed because initial EP and FP were in the state of 0
  Implemented automatic EP recovery value in unit, class, and item settings.
  Fixed an error in the natural EP recovery value.
  Added processing when you want to implement only EP or FP
(If you only have EP, you can use UnitFP.js. If you only have FP, you can implement only one of them by excluding UnitEP.js.)

  2016/08/22:
  Fixed a bug where the EP and FP of units that became friends through information gathering were set to 0.
  Corrected the class settings so that it can be set to grant a state or die when EP and FP reach a specific range.

  2016/09/18:
  EP consumption and FP consumption can now be set according to movement cost (movement power required to move to that point)
  Images are not cached when drawing windows or gauges,
  Fixed an issue where memory was rapidly accumulating while launching the app.

  2016/10/03:
  Fixed an issue that would occur if the EP and FP were lower than the EP and FP usage of the weapon used after a pursuit.

  2016/10/17:
  Corrected an error caused by a variable error regarding whether or not items can be used.

  *If you have used both MP & special gauge addition and skill activation conditions before 2016/04/26, please be sure to update both when updating.

  2017/05/17:
Fixed an issue where EP and FP were not displayed in the simple window in Ver1.127 or later.
  Corrected the display when specifying negative EP and FP consumption.
  Fixed an issue where FP was not consumed when the EP was lower than the used EP during an attack.
  *Added a description to the readme about when the use of weapons and items is specified as negative.

  2017/05/18:
  Fixed the display of FP consumption and FP recovery as EP~

  2017/06/25:
  Implementation of EP/FP recovery items (revised the one sent for reference in the inquiry on 2016/12/05)

  2018/03/18:
  Added a function to recover EP/FP by actions in battle (attack hit, attack miss, hit, evasion)
  Fixed a bug where FP movement cost was not working properly.

  2019/06/16:
  In the event command "Run Script"
  Changing the maximum value and current value of EP and FP, changing the amount of EP and FP recovered each turn,
  Added a method to get the maximum value and current value of EP and FP

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

  2023/10/29:
  Do not cache maximum EP and maximum FP, EP and FP recovery values ??when displaying the unit menu.
  Fixed a performance problem where each frame was acquired.
  (Because of this, in combination with the addition of skill activation conditions, under certain conditions, the unit menu display became extremely slow.)
  
  Declare constants for maximum EP upper limit and maximum FP upper limit.
  It is declared at the top of UnitEP.js and UnitFP.js to make it easier to change the maximum value.

-----------------------------------------------------------------------------------------
[Instalation method]
Please overwrite the "plugin" and "material" in the folder to the project's "plugin" and "material".

-----------------------------------------------------------------------------------------
【overview】
By introducing this, ep (mp) and fp (special gauge) will be added to the unit's parameters.
 Additionally, it is now possible to set the remaining amount of EP and FP to be added to the
conditions for determining the use of weapons and items. 
EP is intended to be used in the same way as MP in regular games,
and FP is intended to be used with the premise of charging every turn.

If the installation is successful, ep and fp will be displayed as shown in "Installation screen.jpg".

*Please set the maximum ep and maximum fp parameter limits using global parameters,
 or modify max ep default max in unit ep.js and max fp default max in unit fp.js.
(If a parameter upper limit is set in the class's Custom Parameter, the class's parameter upper limit will take precedence.)
*The maximum value of ep is 30 by default.
*The maximum fp value is 100 by default.

-Caution -
Since the part that is being manipulated is a part,
please be careful when introducing it because if you use it together with a script other than o-to's,
it will easily conflict with the status part script.

-Materials used -
“Gauge.png” and “Gauge2.png” in “Material\OT_AddStatus” are
This is a processed version of SRPG Studio's runtime material.
"window.png" and "window2.png" were created for samples.
--When implementing only one side--
If you do not want to implement Fp, please delete unit fp.js.
If you do not want to implement ep, please delete unit ep.js 
or add $ at the beginning of the file name.

--About changing the current and maximum values ??of ep and fp using event commands--
See "How to use event commands.txt".

-----------------------------------------------------------------------------------------
【Instructions】
Set custom parameters for units and classes.
(If you can specify a percentage, you can specify the percentage by setting it as '10%' in addition to the numerical value.)

■Settings related to ep
＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝
?Character
{
    OT_EP : { Value:5, Growth:80, Recovery:5 }
}
Value: Parameter
Growth: growth rate
Recovery: Charge amount after turn (percentage can be specified)
(Initial value is 5, growth value is 80%, 5 recovery every turn)
*If each value is omitted, it will be the same as specifying 0.

example:
OT_EP : { Value:10, Growth:80 }
Maximum unit EP 10, growth rate 80%

＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝
?class
{
    OT_EP : { Value:5, Growth:100, Max:100, Recovery:5, MoveCost:1.0,
              AddState:[ { Range:'0-10', State:[1], Dispel:true } ],
              BattleBonus:{ Hit:5, NoHit:1, Damage:4 , Avoid:5}
            }
}
Value     : parameter bonus
Growth    : growth value bonus
Max       : class upper limit
Recovery  : Charge amount after turn (percentage can be specified)
MoveCost  : EP consumption according to movement cost (movement power required to move to that point)
            When moving, EP is consumed equal to the movement cost x MoveCost (EP consumption is rounded down to the nearest whole number)
AddState  : Set the state that will be added when EP reaches a specific area (multiple conditions and states can be set, and the timing will be before the start of the turn)
            Range ⇒ EP range that is the activation condition (percentage can be specified)
            State ⇒ Specify state ID (multiple possible), if you specify 'DEAD', it will be death instead of state grant.
            If you set Dispel⇒true, the state will be canceled when you leave the FP area that is the activation condition.
BattleBonus: Set the ep obtained for attack hit (hit), attack miss (no hit), hit (damage), and avoidance (percentage can be specified)

*If each value is omitted, Max is the value of global parameter OT_EP:MAX,
  AddState is not set, otherwise it is the same as specifying 0.

example:
OT_EP : { Value:5, Growth:100, Max:100 }
Class bonus: EP +5, growth rate bonus +100%, maximum class EP cap is 100


OT_EP : {~ (omitted),  AddState:[ { Range:'0-10', State:[0] }, { Range:'0-0', State:[2], Dispel:true } ]}
When Ep becomes 10 or less, a state with state ID 0 is given. 
When Ep becomes 0, a state with state ID 2 is given.
When Ep becomes 1 or more, a state with state ID 2 is released.


OT_EP : { Value:5, Max:100, MoveCost:0.5 }
Class bonus: EP+5, maximum class EP cap is 100, consumes 1 EP for every 2 movement costs.


OT_EP : { Value:5, BattleBonus:{ Hit:'10%', NoHit:1, Damage:4 , Avoid:5} }
Class bonus: EP+5 Recovers 10% EP when an attack hits, 
Recovers 1 EP if the attack is evaded,
Recovers 4 EP if the attack cannot be evaded,
Recovers 5 EP if the attack is evaded.

＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝
・Weapons
{
    OT_EP : { Use:5, Value:100, Growth:100, Recovery:5,
              BattleBonus:{ Hit:5, NoHit:1, Damage:4 , Avoid:5}
            }
}
Use       :Consumed ep when used (percentage can be specified, negative specification allows recovery when using)
Value     : Parameter bonus when equipped
Growth    : Growth value bonus when equipped
Recovery  : Charge amount after turn (percentage can be specified)
BattleBonus: When equipped, set the ep obtained when attacking (hit), attacking miss (no hit), being hit (damage), and avoiding (avoid) (percentage can be specified)
*If each value is omitted, it will be the same as specifying 0.
  Additionally, if ep falls below the consumed ep during a battle, you will not be able to attack in that battle.

example：
OT_EP : { Use:'5%' }
When attacking, fp is required to be 5% of the maximum fp value.

OT_EP : { Use:10, Value:100 }
Requires FP 10 when attacking, EP bonus +100 when equipped

＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝
・item
{
    OT_EP : { Use:5, Value:100, Growth:100, Doping:5, Recovery:5, UseRecovery:10,
              BattleBonus:{ Hit:5, NoHit:1, Damage:4 , Avoid:5}
            }
}
Use         : Consumed ep when used (percentage can be specified, negative specification allows recovery when using)
Value       : Parameter bonus when in possession
Growth      : Growth value bonus when possessed
Doping      : Increased value when doping (doping items only)
Recovery    : Charge amount after turn (percentage can be specified)
UseRecovery : You can only specify the item type as "hp recovery", and set the amount of EP recovery to the target when using the item.
BattleBonus : Set the ep obtained when attacking (hit), attacking miss (no hit), being hit (damage), and avoiding (avoid) while holding an item (percentage can be specified) 
*If each value is omitted, it is assumed that 0 is specified. It will be the same.

example：
OT_EP : { Use:'10%' }
EP needs 10% of maximum fp value when used

OT_EP : { Use:5, Value:100 }
Requires 5 ep to use, ep bonus +100 when possessed.

＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝
・state
{
    OT_EP : { Doping:5, Recovery:5,
              BattleBonus:{ Hit:5, NoHit:1, Damage:4 , Avoid:5}
            }
}
Doping   : Parameter bonus when granting state
Recovery : Recovery amount when state is granted (percentage can be specified)
BattleBonus: Set the ep obtained when an attack hits, misses, damages, or avoids while applying a state (percentage can be specified)
*If each value is omitted, it will be the same as specifying 0.

example：
OT_EP : { Doping:5 }
EP bonus +5 when granting state

OT_EP : { Recovery:10 }
Recovers 10 ep every turn when applying state

＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝
・global parameters
{
    OT_EP: { Max:9999 }
}
Max:Parameter maximum value limit
*If omitted, it will be 30.


ーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーー
■Settings related to fp
＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝
・キャラ
{
    OT_FP : { Value:5, Growth:100, Recovery:5 }
}
Value     : Parameter (maximum value)
Growth    : Growth rate (probability of maximum increase in level up)
Recovery  : Amount of charge after a turn (percentage can be specified, in which case it should be specified by enclosing it in ', e.g. Recovery:'10%')
            The start of the first turn is also included in the turn progress.
            (By setting FirstTurnRecovery in UnitFP.js to false, turn recovery can be done from the second turn)
Default   : Initial value when starting the map (percentage can be specified)
*If each value is omitted, it will be the same as specifying 0.
  If the initial value of FP is not set on the class side, the current value of FP starts from 0.

example：
OT_FP : { Value:5, Growth:80, Recovery:5 }
Unit's maximum FP is 5, growth rate is 80%, FP is charged by 5 every turn

＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝
・class
{
    OT_FP : { Value:5, Growth:100, Max:100, Recovery:5, Default:10, MoveCost:1.0,
              AddState:[ { Range:'0-10', State:[1], Dispel:true } ],
              BattleBonus:{ Hit:5, NoHit:1, Damage:4 , Avoid:5}
            }
}
Value     : Parameter bonus (plus unit's maximum fp value)
Growth    : growth value bonus
Max       : Class upper limit value (maximum limit value for unit growth and item bonus)
Recovery  : Charge amount after turn (percentage can be specified)
Default   : It is added to the initial value at the start of the map (percentage can be specified) and the default value of the unit.
MoveCost  : FP consumption according to movement cost (movement power required to move to that point)
            When moving, FP will be consumed equal to the movement cost x MoveCost (FP consumption is rounded down to the nearest whole number)
AddState  : Set the state that will be added when FP reaches a specific area (multiple conditions and states can be set, and the timing will be before the start of the turn)
            Range ⇒ FP range that is the activation condition (percentage can be specified)
            State ⇒ Specify state ID (multiple possible), if you specify 'DEAD', it will be death instead of state grant.
            If you set Dispel⇒true, the state will be canceled when you leave the FP area that is the activation condition.
BattleBonus: Set the fp obtained when attacking (hit), attacking miss (no hit), being hit (damage), and avoiding (avoid) (percentage can be specified)

*If each value is omitted, Max is the value of global parameter OT_FP:MAX,
  AddState is not set, otherwise it is the same as specifying 0.


example：
OT_FP : { Value:5, Growth:100, Max:100, Recovery:'5%', Default:'10%' }
Class bonus: FP +5, growth rate bonus: +100%, maximum class FP limit is 100, 5% of maximum FP is charged every turn,
FP at the start of battle is 10% of maximum FP (+ every turn charge amount)

OT_FP : { ~ (omitted),  AddState:[ { Range:'0-10', State:[1], Dispel:true } ]}
When Fp becomes 10 or less, the state with state ID 1 is given.
When fp becomes 11 or more, the state with state ID 1 is canceled.

OT_FP : { ~ (omitted),  AddState:[ { Range:'0-10', State:[1,2] }, { Range:'0-0', State:'DEAD' } ] }
When Fp becomes 10 or less, states with state IDs 1 and 2 are given, and when fp becomes 0, the unit dies.

OT_EP : { Value:5, Max:100, MoveCost:1.5 }
FP+5 with class bonus, class maximum fp limit is 100, 1 movement cost consumes 1 fp, 2 movement costs consumes 3 fp, 4 movement costs consumes 4 fp,


OT_FP : { Value:5, BattleBonus:{ Hit:'10%', NoHit:1, Damage:4 , Avoid:5} }
Class bonus: FP+5 Recovers 10% FP when an attack hits, recovers 1 FP if the attack is evaded,
recovers 4 FP if the attack cannot be evaded, recovers 5 FP if the attack is evaded.


＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝
・Weapons
{
    OT_FP : { Use:5, CheckOnly:true, Value:100, Growth:100, Recovery:5,
              BattleBonus:{ Hit:5, NoHit:1, Damage:4 , Avoid:5}
            }
}
Use       : FP consumed when using (percentage can be specified, if check only is false, specify a negative value to recover when using)
CheckOnly : If True, you will need fp equivalent to the consumed fp to use it, but there will be no fp consumption when using it.
Value     : Parameter bonus when equipped
Growth    : Growth value bonus when equipped
Recovery  : Charge amount after turn (percentage can be specified)
BattleBonus: When equipped, set the fp gained when attacking (hit), attacking miss (no hit), being hit (damage), and avoiding (avoid) (percentage can be specified)
*If each value is omitted, it will be the same as specifying 0.
  CheckOnly is the same as specifying false.
  Additionally, if FP falls below the consumed FP during a battle, you will not be able to attack in that battle.

example：
OT_FP : { Use:'5%' }
When attacking, fp is required to be 5% of the maximum fp value.

OT_FP : { Use:10, CheckOnly:true }
Requires 10 fp when attacking, no fp consumption when using

OT_FP : { Use:10, Recovery:'-5%' }
Requires 10 fp when attacking, consumes 5% of maximum fp when equipped

＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝
・item
{
    OT_FP : { Use:5, CheckOnly:true, Value:100, Growth:100, Doping:5, Recovery:5, UseRecovery:10,
              BattleBonus:{ Hit:5, NoHit:1, Damage:4 , Avoid:5}
            }
}
Use       : FP consumed when using (percentage can be specified, if check only is false, specify a negative value to recover when using)
CheckOnly : If True, you will need fp equivalent to the consumed fp to use it, but there will be no fp consumption when using it.
Value     : Parameter bonus when in possession
Growth    : Growth value bonus when possessed
Doping    : Increased value when doping (doping items only)
Recovery  : Charge amount after turn (percentage can be specified)
UseRecovery : You can only specify the item type as "hp recovery", and set the amount of EP recovery to the target when using the item.
BattleBonus: Set the fp gained when attacking (hit), attacking miss (no hit), being hit (damage), and avoiding (avoid) while holding an item (percentage can be specified)
*If each value is omitted, it will be the same as specifying 0.
  CheckOnly is the same as specifying false.

example：
OT_FP : { Use:'10%' }
When used, fp needs to be 10% of maximum fp value

OT_FP : { Use:5, CheckOnly:true }
Requires 5 fp when used, no fp consumed when used
*The training sword in "Introduction screen.jpg" has check only set to true. 
The iaigiri in "Introduction screen.jpg" will display the required fp when check only is set to false.

＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝
・state
{
    OT_FP : { Doping:5, Recovery:5,
              BattleBonus:{ Hit:5, NoHit:1, Damage:4 , Avoid:5}
            }
}
Doping   : Parameter bonus when granting state
Recovery : Recovery amount when state is granted (percentage can be specified)
BattleBonus: Set the fp obtained when attacking (hit), attacking miss (no hit), being hit (damage), and avoiding (avoid) while applying the state (percentage can be specified)
*If each value is omitted, it will be the same as specifying 0.

example：
OT_FP : { Doping:5 }
FP bonus +5 when granting state

OT_FP : { Recovery:10 }
Recovers 10 fp every turn when applying state

＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝
・Global parameters
{
    OT_FP:{ Max:200 }
}
Max:Parameter maximum value limit
*If omitted, it will be 100.

Note：
Fp charge amount is unit + class + weapon, item + state recovery amount.

ーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーー
・If you want to use Ep and fp settings together, please write as below.

{
    OT_EP : { ～Omitted~ }
  , OT_FP : { ~Omitted~ }
}


ーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーー
■When changing the window or gauge material, display name, or gauge position

If you want to change the in-game notation or shift the position of the window or gauge,
 change the values ??of ot ep frame setting, ot fp frame setting, and ot energy frame setting in 
 "plugin\ot add status\add status window.js" You can make some adjustments by doing this.

