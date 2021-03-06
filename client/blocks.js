function addBlocks(Blockly) {
    var sayBlock = {
        "type": "say",
        "message0": "say \"%1\"",
        "args0": [
            {
                "type": "field_input",
                "name": "dialogue",
                "text": "something",
            },
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": 210,
        "tooltip": "Speak something out loud.",
    };
    Blockly.Blocks['say'] = { init: function() { this.jsonInit(sayBlock); } };
    Blockly.Python['say'] = function(block) {
        return 'robot.say("' + block.getFieldValue('dialogue') + '")\n';
    };
    
    var syncBlock = {
        "type": "sync",
        "message0": "in sync %1",
        "args0": [
            {
                "type": "input_statement",
                "name": "commands",
            },
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": 60,
        "tooltip": "Do multiple actions at the same time.",
    };
    Blockly.Blocks['sync'] = { init: function() { this.jsonInit(syncBlock); } };
    Blockly.Python['sync'] = function(block) {
        var commands = Blockly.Python.statementToCode(block, 'commands');
        return 'with robot.in_sync():\n' + (commands.length > 0 ? commands : Blockly.Python.INDENT + 'pass\n');
    };
    
    var lightSetBlock = {
        "type": "light_set",
        "message0": "set %1 %2 to %3",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "which_side",
                "options": [ ["left", "left"], ["right", "right"], ["each", "both"] ],
            },
            {
                "type": "field_dropdown",
                "name": "which_part",
                "options": [ ["antenna", "antenna"], ["eye", "eye"] ],
            },
            {
                "type": "field_dropdown",
                "name": "state",
                "options": [ ["on", "on"], ["off", "off"] ],
            },
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": 300,
        "tooltip": "Set the state of a light to on or off.",
    };
    Blockly.Blocks['light_set'] = { init: function() { this.jsonInit(lightSetBlock); } };
    Blockly.Python['light_set'] = function(block) {
        var which_side = block.getFieldValue('which_side');
        function set_expression(which_side) {
            return `robot.set_${block.getFieldValue('which_part')}_state('${which_side}', '${block.getFieldValue('state')}')\n`;
        }
        return set_expression(which_side);
    };
    
    var rollBlock = {
        "type": "roll",
        "message0": "roll %1 for %2 second(s)",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "which_direction",
                "options": [ ["forward", "forward"], ["backward", "backward"] ],
            },
            {
                "type": "field_number",
                "name": "seconds",
                "check": "Number",
                "value": 2,
                "min": 0,
                "max": 20,
            },
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": 300,
        "tooltip": "Move straight forward or backward.",
    };
    Blockly.Blocks['roll'] = { init: function() { this.jsonInit(rollBlock); } };
    Blockly.Python['roll'] = function(block) {
        var which_direction = block.getFieldValue('which_direction');
        function set_expression(which_direction) {
            return `robot.roll('${which_direction}', ${block.getFieldValue('seconds')})\n`;
        }
        return set_expression(which_direction);
    };
    
    var turnBlock = {
        "type": "turn",
        "message0": "turn %1 for %2 second(s)",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "which_direction",
                "options": [ ["clockwise", "clockwise"], ["counterclockwise", "counterclockwise"] ],
            },
            {
                "type": "field_number",
                "name": "seconds",
                "check": "Number",
                "value": 2,
                "min": 0,
                "max": 20,
            },
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": 300,
        "tooltip": "Rotate in a clockwise or counterclockwise direction.",
    };
    Blockly.Blocks['turn'] = { init: function() { this.jsonInit(turnBlock); } };
    Blockly.Python['turn'] = function(block) {
        var which_direction = block.getFieldValue('which_direction');
        function set_expression(which_direction) {
            return `robot.turn('${which_direction}', ${block.getFieldValue('seconds')})\n`;
        }
        return set_expression(which_direction);
    };
    
    var armMoveBlock = {
        "type": "move_arm",
        "message0": "move %1 %2",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "arm",
                "options": [ ["left arm", "left"], ["right arm", "right"], ["both arms", "both"] ],
            },
            {
                "type": "input_value",
                "name": "angle",
                "check": "Degree",
            },
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": 230,
        "tooltip": "Move one or both arms to a certain angle (from -90 to 90 degrees).",
    };
    Blockly.Blocks['move_arm'] = { init: function() { this.jsonInit(armMoveBlock); } };
    Blockly.Python['move_arm'] = function(block) {
        var arm = block.getFieldValue('arm');
        function move_expression(arm) {
            return `robot.move_arm('${arm}', ${Blockly.Python.valueToCode(block, 'angle', Blockly.Python.ORDER_ATOMIC)})\n`;
        }
        return move_expression(arm);
    };
    
    var angleBlock = {
        "type": "angle_input",
        "message0": "to %1",
        "args0": [
            {
                "type": "field_angle",
                "name": "angle",
                "angle": 0,
            },
        ],
        "output": "Degree",
        "colour": 230,
        "tooltip": "Select an angle for arm movement.",
    };
    Blockly.Blocks['angle_input'] = { init: function() { this.jsonInit(angleBlock); } };
    Blockly.FieldAngle.WRAP = 180;
    Blockly.Python['angle_input'] = function(block) {
        return [block.getFieldValue('angle'), Blockly.Python.ORDER_ATOMIC];
    }
    
    var fixedAngleBlock = {
        "type": "fixed_angle_input",
        "message0": "%1",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "angle",
                "options": [ ["up", '90'], ["out", '0'], ["down", '-90'] ],
            },
        ],
        "output": "Degree",
        "colour": 230,
        "tooltip": "Select a preset angle for arm movement.",
    };
    Blockly.Blocks['fixed_angle_input'] = { init: function() { this.jsonInit(fixedAngleBlock); } };
    Blockly.Python['fixed_angle_input'] = Blockly.Python['angle_input'];
    
    var waitBlock = {
        "type": "wait",
        "message0": "wait %1 second(s)",
        "args0": [
            {
                "type": "field_number",
                "name": "seconds",
                "check": "Number",
                "value": 2,
                "min": 0,
                "max": 60,
            },
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": 190,
        "tooltip": "Pause for a specified number of seconds.",
    };
    Blockly.Blocks['wait'] = { init: function() { this.jsonInit(waitBlock); } };
    Blockly.Python['wait'] = function(block) {
        return 'robot.wait(' + block.getFieldValue('seconds') + ')\n';
    };
    
    var eventStartedBlock = {
        "type": "event_started",
        "message0": "When the program is started: %1",
        "args0": [
            {
                "type": "input_statement",
                "name": "commands",
            },
        ],
        "colour": 10,
        "tooltip": "Fires when the program is first run.",
    };
    Blockly.Blocks['event_started'] = { init: function() { this.jsonInit(eventStartedBlock); } };
    Blockly.Python['event_started'] = function(block) {
        var commands = Blockly.Python.statementToCode(block, 'commands');
        return '@robot.when_started\ndef started():\n' + (commands.length > 0 ? commands : Blockly.Python.INDENT + 'pass\n');
    };
    
    var eventButtonBlock = {
        "type": "event_button",
        "message0": "When the %1 button is pressed: %2",
        "args0": [
            {
                "type": "field_number",
                "name": "button_number",
                "check": "Number",
                "value": 1,
                "min": 1,
                "max": 4,
            },
            {
                "type": "input_statement",
                "name": "commands",
            },
        ],
        "colour": 10,
        "tooltip": "Fires when a button is pressed on the controller.",
    };
    Blockly.Blocks['event_button'] = { init: function() { this.jsonInit(eventButtonBlock); } };
    Blockly.Python['event_button'] = function(block) {
        var commands = Blockly.Python.statementToCode(block, 'commands');
        return '@robot.when_button_pressed(' + block.getFieldValue('button_number') + ')\ndef button():\n' + (commands.length > 0 ? commands : Blockly.Python.INDENT + 'pass\n');
    };    
}

export {addBlocks};
