
/*--------------------------------------------------------------------------
  
  This is a script for activating a skill from a command.
  It generates a list of skills from the "Command Skills" window.

  How to use:
  Set the skill's custom parameter to {EC_Command:'ATTACK'}.
  
  Created by :
  o-to
  
  Update history:
  2015/12/06: Newly created
  2017/05/15:
  When selecting a command skill, the command skill attached to a non-equipped weapon will now be displayed.
  After selecting a command skill, the weapon selection screen will now only show the weapon with that skill.
  Fixed a bug where the number of times you used a command skill was not counted correctly when re-activating.

  30/05/2018.
  When a weapon with a command skill is not selectable
  Fixed a bug that allowed players to select the command skill of a weapon when the weapon was not selectable.
  Fixed a bug that when selecting the target of an offensive command skill after selecting the weapon, you can't select an opponent that the skill doesn't activate (only in some conditions).

  19/11/2019:
  Minor fixes

	2023/10/29:
	There was a part where almost the same process was performed twice, so I fixed it.
	If you can use command skills by equipping the weapon you own, even if you don't have it equipped.
	Fixed so that it is displayed in the command skill list.
  
--------------------------------------------------------------------------*/

var OT_SkillSelectMenu = defineObject(BaseWindowManager,
{
	_unit: null,
	_skillListWindow: null,
	_skillInfoWindow: null,
_CommandSkillArray: null,
	
	setMenuTarget: function(unit) {
		this._unit = unit;
		this._skillListWindow = createWindowObject(OT_SkillListWindow, this);
		this._skillInfoWindow = createWindowObject(SkillInfoWindow, this); 

		this.initCommandSkillArray();
		
		this._skillListWindow.setSkillFormation(this.getSkillCount());
		this._setSkillbar(unit);
		this._skillListWindow.setActive(true);
	},
	
	moveWindowManager: function() {
		var result = this._skillListWindow.moveWindow();
		var skillEntry = this._skillListWindow.getCurrentSkill();
		
		this._skillInfoWindow.setSkillInfoData(skillEntry.skill, skillEntry.objecttype);
		
		return result;
	},
	
	drawWindowManager: function() {
		var x = this.getPositionWindowX();
		var y = this.getPositionWindowY();
		var width  = this._skillListWindow.getWindowWidth();
		var height = this._skillListWindow.getWindowHeight();
		
		this._skillListWindow.drawWindow(x, y);
		this._skillInfoWindow.drawWindow(x + width, y);
	},
	
	getTotalWindowWidth: function() {
		return this._skillListWindow.getWindowWidth() + this._skillInfoWindow.getWindowWidth();
	},
	
	getTotalWindowHeight: function() {
		return this._skillListWindow.getWindowHeight() + this._getWindowInterval() + this._skillInfoWindow.getWindowHeight();
	},
	
	getPositionWindowX: function() {
		var width = this.getTotalWindowWidth();
		return LayoutControl.getUnitBaseX(this._unit, width);
	},
	
	getPositionWindowY: function() {
		return LayoutControl.getCenterY(-1, 340);
	},

	initCommandSkillArray: function() {
		var unit = this._unit;
		var arr = OT_getCommandSkillArrayAll(unit, -1, '');
		var count = arr.length;
		var skillCount = 0;

		this._CommandSkillArray = new Array();
		
		// Make sure you have a command-type skill
		for( var i=0 ; i<count ; i++ ) {
				if(arr[i].skill.custom.EC_Command == OT_SkillCommandType.ATTACK ) {
					if( !AttackChecker.isUnitAttackable(unit) ) continue;
					
					// Check that you can attack with the relevant weapon
					if( !EC_SkillCheck.isCommandSkillAttackable(unit, arr[i].skill, arr[i].objecttype) ) continue;
				} else {
					if( !EC_SkillCheck.isSkillCheckEnableALLWeapon(unit, arr[i].skill) ) continue;
					if( !EC_SkillCheck.isCommandSkillEnableWeaponCheck(unit, arr[i].skill) ) continue;
				}
				
				this._CommandSkillArray.push(arr[i]);
		}
	},
	
	getSkillCount: function() {
		var unit = this._unit;
		var count = this._CommandSkillArray.length;
		var skillCount = 0;

		// Make sure you have command type skills
		for( var i=0 ; i<count ; i++ ) {
			skillCount++;
					}
		
		return skillCount;
	},
	
	getSelectSkill: function() {
		return this._skillListWindow.getCurrentSkill().skill;
	},

	getSelectSkillEntry: function() {
		return this._skillListWindow.getCurrentSkill();
	},
	
	_getWindowInterval: function() {
		return 10;
	},
	
	_setSkillbar: function(unit) {
		var count = this._CommandSkillArray.length;

		var scrollbar = this._skillListWindow.getSkillScrollbar();

		scrollbar.resetScrollData();

		//Check that you have the command type skill
		for( var i=0 ; i<count ; i++ ) {
			scrollbar.objectSet(this._CommandSkillArray[i]);
		}
		
		scrollbar.objectSetEnd();
		scrollbar.setUnitSkillFormation(unit);
	},
	
	_isAttackAllowed: function(unit, item) {
		return AttackChecker.isUnitAttackableInternal(unit, item);
	}
}
);