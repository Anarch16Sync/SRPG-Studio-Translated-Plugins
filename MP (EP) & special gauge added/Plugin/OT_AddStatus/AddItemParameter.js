/*-----------------------------------------------------------------------------------------------
  
Recovery items for EP and FP.
    
  how to use:
  ■Items that recover EP and FP when used.
  Please set the item type to "HP recovery" and set the following parameters.
  {
       OT_EP : { UseRecovery:5 }
     , OT_FP : { UseRecovery:5 }
  }
  If the value is negative, the target's EP and FP will decrease.

  Author:
  o-to

  Change log:
  2017/06/25:
  Revised and published version of the one sent for reference on 2016/12/05
  
--------------------------------------------------------------------------*/

(function() {

function getChildParameter(customP, child)
{
	if( customP == null )
	{
		return null;
	}
	
	if( customP[child] == null )
	{
		return null;
	}
	
	return customP[child];
};

var alias1 = RecoveryItemAvailability.isItemAllowed;
RecoveryItemAvailability.isItemAllowed = function(unit, targetUnit, item)
{
	var result = alias1.call(this, unit, targetUnit, item);
	var recoveryEP = getChildParameter(item.custom.OT_EP, 'UseRecovery');
	var recoveryFP = getChildParameter(item.custom.OT_FP, 'UseRecovery');

	if(recoveryEP === null && recoveryFP === null)
	{
		return result;
	}

	var nowEP = OT_GetNowEP(targetUnit);
	var nowFP = OT_GetNowEP(targetUnit);
	var maxEP = OT_GetMaxEP(targetUnit);
	var maxFP = OT_GetMaxFP(targetUnit);
	
	if(nowEP == maxEP && nowFP == maxFP)
	{
		return result;
	}
	
	return true;
};

var alias2 = RecoveryItemUse.enterMainUseCycle;
RecoveryItemUse.enterMainUseCycle = function(itemUseParent)
{
	var result = alias2.call(this, itemUseParent);
	
	var itemTargetInfo = itemUseParent.getItemTargetInfo();
	var item = itemTargetInfo.item;
	var unit = itemTargetInfo.unit;
	var targetUnit = itemTargetInfo.targetUnit;
	var value = 0;
	var recoveryEP = getChildParameter(item.custom.OT_EP, 'UseRecovery');
	var recoveryFP = getChildParameter(item.custom.OT_FP, 'UseRecovery');

	if(recoveryEP !== null)
	{
		recoveryEP += Calculator.calculateRecoveryItemPlus(unit, targetUnit, item);
		OT_RecoveryNowEP(itemTargetInfo.targetUnit, recoveryEP);
	}
	
	if(recoveryFP !== null)
	{
		recoveryFP += Calculator.calculateRecoveryItemPlus(unit, targetUnit, item);
		OT_RecoveryNowFP(itemTargetInfo.targetUnit, recoveryFP);
	}

	return result;
};

// For enemy AI (recovery required)
var alias3 = RecoveryItemAI._getScore;
RecoveryItemAI._getScore = function(unit, combination)
{
	var score = alias3.call(this, unit, combination);
	var item = combination.item;
	var targetUnit = combination.targetUnit;
	var recoveryEP = getChildParameter(item.custom.OT_EP, 'UseRecovery');
	var recoveryFP = getChildParameter(item.custom.OT_FP, 'UseRecovery');
	
	var basePoint;
	var nowEP = OT_GetNowEP(targetUnit);
	var nowFP = OT_GetNowEP(targetUnit);
	var maxEP = OT_GetMaxEP(targetUnit);
	var maxFP = OT_GetMaxFP(targetUnit);
	
	if(recoveryEP !== null)
	{
		// Units whose HP decreases more rapidly are given priority.
		basePoint = Math.floor(maxEP * 0.25);
		if (nowEP < basePoint) {
			score += 10;
		}
		
		basePoint = Math.floor(maxEP * 0.5);
		if (nowEP < basePoint) {
			score += 5;
		}
		
		basePoint = Math.floor(maxEP * 0.75);
		if (nowEP < basePoint) {
			score += 5;
		}
	}

	if(recoveryFP !== null)
	{
		// Units whose HP decreases more rapidly are given priority.
		basePoint = Math.floor(maxFP * 0.25);
		if (nowFP < basePoint) {
			score += 10;
		}
		
		basePoint = Math.floor(maxFP * 0.5);
		if (nowFP < basePoint) {
			score += 5;
		}
		
		basePoint = Math.floor(maxFP * 0.75);
		if (nowFP < basePoint) {
			score += 5;
		}
	}
	
	return score;
};

// enemy AI
var alias4 = RecoveryItemAI._getValue;
RecoveryItemAI._getValue = function(unit, combination)
{
	var value = alias4.call(this, unit, combination);
	var n = 0;
	var targetUnit = combination.targetUnit;
	var item = combination.item;
	var plus = Calculator.calculateRecoveryItemPlus(unit, combination.targetUnit, combination.item);
	var recoveryEP = getChildParameter(item.custom.OT_EP, 'UseRecovery');
	var recoveryFP = getChildParameter(item.custom.OT_FP, 'UseRecovery');
	var maxEP = OT_GetMaxEP(targetUnit);
	var maxFP = OT_GetMaxFP(targetUnit);

	if(recoveryEP !== null)
	{
		n = recoveryEP + plus;
		if (n > maxEP) {
			n = maxEP;
		}
		value += n;
	}

	if(recoveryFP !== null)
	{
		n = recoveryFP + plus;
		if (n > maxFP) {
			n = maxFP;
		}
		value += n;
	}
		
	return value;
};

})();