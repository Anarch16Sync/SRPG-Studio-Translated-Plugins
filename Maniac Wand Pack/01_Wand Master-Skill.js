
/*----------------------------------------------------------------------
  
　01 Skill: Wand Master
　*The file name has been changed due to conflict measures.

■Overview
　Skill: You can create a wand master.
　Friendly units with this skill can choose to attack, exchange, stock, etc. after using a staff.
　(This is a cane version of unit command.js that does not wait after execution)


■ Preparation
　With this script in your plugin, you need to do the following:

　1. Create a custom skill and put 'wand_master' in the keyword.
　2. Give your the skill to a unit

　I want to be able to use the staff more than once at a time
　If you put {useMax:XX} (XX is a number greater than 1) in the custom parameter of 1 custom skill, you can use the staff command multiple times.
　(Example)
 {useMax:2}
 you can use the staff command twice without finishing your turn

■ Customization
　1. I want to change the custom skill keyword
　　　Please rewrite "wand_master" in var SKILL_WAND_MASTER_NAME = 'wand_master'; in the settings.
　　　(If you change the keyword, you need to replace the keyword on the custom skill side as well.)

　2. I want to change the item that does not wait /the item that waits
　　　Please rewrite true or false for each type of staff in var item_master_item_type_arr = in the settings.
　　　If it is true, it will not wait, and if it is false, it will wait.
　　　Item type: Custom is targeted by changing false to true in var wand_master_CustomItemEnable = false;


16/06/06 New
16/06/07 Fixed a bug where wand master effects were not applied when wands were used as items
16/06/07b Fixed a bug where staff commands would not appear in unit commands opened after one person used a staff if two or more people possessed the staff master.
16/06/07c Skill: Fixed a bug where units without wand masters would consume wands used twice
17/12/01 Can be used with .js on the used cane
18/12/01 Compatible with "00_Weapon type: Increase staff.js"
22/03/20 Changed to be able to set how many times the wand master can be used at once. Fixed a bug that teleportation items do not work properly
22/03/21 Changed some defined values ​​to external declarations for other plugins
22/09/18 Due to an omission in the fix on 22/03/21, fixed a bug that caused an error when using a staff as an item.
23/02/04 Fixed a bug that caused an error when using a cane due to an omission in the correction made on 22/09/18.


■ Compatible version
　SRPG Studio Version:1.276


■ Terms
・Use is limited to games using SRPG Studio.
・Commercial or non-commercial. Free.
・There is no problem with processing. Please keep remodeling.
・ No credits OK
・ Redistribution, reprint OK
・Please comply with the SRPG Studio Terms of Use.
  
----------------------------------------------------------------------*/
//-------------------------------
// Settings (external)
//-------------------------------
var SKILL_WAND_MASTER_NAME = 'wand_master';		// skill name




(function() {

//-------------------------------
// setting
//-------------------------------

//Change true to false in the array below to wait after using the wand.
//Change false to true in the array below to no longer wait after using the wand.
//However, even if teleportation, rescue, resuscitation, total recovery, lock picking, and behavior recovery are set to true, if the experience value is 0 at the time of use, it seems to be on standby.
//(There may be other conditions, but this has not been verified)
var wand_master_item_type_arr = [
		//  Unusable   HP recovery  Full recovery   Damage    Stat Boosting
			false,         true,        false,       true,     true, 
		//  Class Change Learn Skill   Unlock       Again
			true,          true,        false,       false,
		//  Teleportation Rescue      Resurrection  Repair
			false,         true,       false,       true,
		//  Steal    Inflict State   Cure State     Switch
			true,          true,        true,        true,
		//  Fusion 		Transform
			true,          true
		];
	
	// Item type: Is the custom cane targeted by the cane master effect?
	var wand_master_CustomItemEnable = false;		// true: Cane Master's effect target false: Not the effect target
	
	
	
	
	//----------------------------------------------
	// Unit command class
	//----------------------------------------------
	
	var alias01 = UnitCommand.openListCommandManager;
	UnitCommand.openListCommandManager= function() {
			this.initWandUsed();
			this.initWandUsedMax();
			this._wandTempCommand = null;
	
			alias01.call(this);
	}
	
	
	var alias02 = UnitCommand.getExitCommand
	UnitCommand.getExitCommand= function() {
			var command = alias02.call(this);
			
			if( command !== null ) {
				return command;
			}
			
			if( this._wandTempCommand !== null ) {
				return this._wandTempCommand;
			}
			
			return command;
	}
	
	
	// Initialize the number of cane uses
	UnitCommand.initWandUsed= function() {
			this._wandUseCnt = 0;
	}
	
	
	//Cane use count +1
	UnitCommand.incWandUsed= function() {
			this._wandUseCnt++;
	}
	
	
	// Setting the maximum number of cane uses
	UnitCommand.initWandUsedMax= function() {
			this._wandUseMax = 1;
			
			var unit = this.getListCommandUnit();
			var skill = SkillControl.getPossessionCustomSkill(unit, SKILL_WAND_MASTER_NAME);
			if( skill ){
				var useMax = skill.custom.useMax;
				if( typeof useMax === 'number' && useMax > 1 ) {
					this._wandUseMax = useMax;
				}
			}
	}
	
	
	//Returns the status of the cane used flag (true: cane used false: cane not used)
	UnitCommand.isWandUsed= function() {
			return this._wandUseCnt >= this._wandUseMax;
	}
	
	
	//save wand command
	UnitCommand.setWandTempCommand= function(command) {
			this._wandTempCommand = command;
	}
	
	
	
	
	//----------------------------------------------
	// Unit list command class
	//----------------------------------------------
	// Cane use count +1 (used by lower classes)
	UnitListCommand.incWandUsed= function() {
			this._listCommandManager.incWandUsed();
	}
	
	
	//Returns the status of the cane used flag (used by descendant classes)
	UnitListCommand.isWandUsed= function() {
			return this._listCommandManager.isWandUsed();
	}
	
	
	//Evacuate cane command (used by lower classes)
	UnitListCommand.setWandTempCommand= function(command) {
			this._listCommandManager.setWandTempCommand(command);
	}
	
	
	
	
	//----------------------------------------------
	// Unit command.wand class
	//----------------------------------------------
	
	// use of cane
	var alias10 = UnitCommand.Wand._moveUse;
	UnitCommand.Wand._moveUse= function() {
			var skill;
			var skill_enable = false;
			var item = this._itemSelectMenu.getSelectWand();
			var type = item.getItemType();
			
			// Item type: Other than custom
			if (type != ItemType.CUSTOM) {
				skill_enable = wand_master_item_type_arr[type];
			}
			// Item type: Custom
			else {
				skill_enable = wand_master_CustomItemEnable;
			}
			
			// Skill: If you have Staff Master, you can only finish executing commands.
			skill = this._wandMasterSkill;
			if( skill && skill_enable ){
				if (this._itemUse.moveUseCycleNoDecreaseWand() !== MoveResult.CONTINUE) {
					// Since we called move use cycle no decrease wand, which does not consume the wand, we explicitly consume the wand.
					this._itemUse.decreaseItem();
					
					// Cane use count +1
					this.incWandUsed();
					this.setWandTempCommand(this);
					
					if( this.isWandUsed() === true ) {
						// It does not immediately go into standby, but it does mark that some operation has been performed.
						this.setExitCommand(this);
					}
					
					// It is possible that the number of executable commands has increased, so rebuild it.
					this.rebuildCommand();
					
					// If used in conjunction with a script that puts the used cane on top, performs the replacement process.
					if( typeof UnitCommand.Wand._exchangeWandIndex != 'undefined' ) {
						// change the position of the cane
						this._exchangeWandIndex();
					}
					
					return MoveResult.END;
				}
				
				return MoveResult.CONTINUE;
			}
			
			// If you do not have a wand master, use the conventional process.
			return alias10.call(this);
	}
	
	
	// Command display judgment
	var alias11 = UnitCommand.Wand.isCommandDisplayable;
	UnitCommand.Wand.isCommandDisplayable= function() {
			// Cannot be displayed if the cane has been used
			if( this.isWandUsed() ) {
				return false;
			}
	
			// If the cane is not used, normal processing
			return alias11.call(this);
	}
	
	
	var alias13 = UnitCommand.Wand._completeCommandMemberData;
	UnitCommand.Wand._completeCommandMemberData= function() {
			alias13.call(this);
			
			// Skill: Obtain Cane Master in advance.
			this._wandMasterSkill = SkillControl.getPossessionCustomSkill(this.getCommandTarget(), SKILL_WAND_MASTER_NAME);
	}
	
	
	
	
	//----------------------------------------------
	// Item use parent class
	//----------------------------------------------
	// move use cycle that does not consume the cane
	ItemUseParent.moveUseCycleNoDecreaseWand= function() {
			if (InputControl.isStartAction()) {
				this.setItemSkipMode(true);
			}
			
			if (this._straightFlow.moveStraightFlow() !== MoveResult.CONTINUE) {
				if (this._itemTargetInfo.isPlayerSideCall) {
					//Via commands through items and staffs on your side,
					//By disabling the skip unconditionally here, the skip will not affect subsequent operations (attacks, etc.).
					this.setItemSkipMode(false);
				}
				return MoveResult.END;
			}
			
			return MoveResult.CONTINUE;
	}
	
	
	})();