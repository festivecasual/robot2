import Vue from 'vue/dist/vue.js';
import axios from 'axios';

import * as Blockly from 'blockly';
Blockly.Python = require('blockly/python');
import {addBlocks} from './blocks.js';
addBlocks(Blockly);

document.addEventListener('DOMContentLoaded', function(e) {
    Blockly.Python.INDENT = '    ';
    var blocklyArea = document.getElementById('blocklyArea');
    var blocklyDiv = document.getElementById('blocklyDiv');
    var workspace = Blockly.inject('blocklyDiv',
        {toolbox: document.getElementById('toolbox')});

    document.getElementById('run').addEventListener('click', function(e){
        axios.post('/api/program', {
            program: Blockly.Python.workspaceToCode(workspace),
        });
    }, false);

    document.getElementById('stop').addEventListener('click', function(e){
        axios.post('/api/program', {
            stop: true,
        });
    }, false);

    var blocklyResize = function(e) {
        // Compute the absolute coordinates and dimensions of blocklyArea.
        var element = blocklyArea;
        var x = 0;
        var y = 0;
        do {
            x += element.offsetLeft;
            y += element.offsetTop;
            element = element.offsetParent;
        } while (element);
        // Position blocklyDiv over blocklyArea.
        blocklyDiv.style.left = x + 'px';
        blocklyDiv.style.top = y + 'px';
        blocklyDiv.style.width = blocklyArea.offsetWidth + 'px';
        blocklyDiv.style.height = blocklyArea.offsetHeight + 'px';
        Blockly.svgResize(workspace);
    };
    window.addEventListener('resize', blocklyResize, false);
    blocklyResize();
    Blockly.svgResize(workspace);

    axios.get('/api/slots').then(function(response){
        var app = new Vue({
            el: '#slots',
            data: {
                slots: response.data,
                activeIndex: 0,
            },
            computed: {
                active() {
                    return this.slots[this.activeIndex];
                },
            },
            methods: {
                switchActive(slot) {
                    var index = this.slots.indexOf(slot);
                    if (index > -1) {
                        this.activeIndex = index;
                    } else {
                        this.activeIndex = 0;
                    }
                    this.updateWorkspace();
                },
                updateWorkspace() {
                    workspace.clear();
                    if (this.slots[this.activeIndex].data) {
                        var xml = Blockly.Xml.textToDom(this.slots[this.activeIndex].data);
                        Blockly.Xml.domToWorkspace(xml, workspace);
                    }
                },
                save() {
                    var xml = Blockly.Xml.workspaceToDom(workspace, true);
                    var data = Blockly.Xml.domToText(xml);
                    if (data != this.slots[this.activeIndex].data) {
                        this.slots[this.activeIndex].data = data;
                        axios.post('/api/slots', this.slots);
                    }
                },
            },
            watch: {
                slots(newSlots, oldSlots) {
                    if (newSlots[this.activeIndex].name != oldSlots[this.activeIndex].name) {
                        this.activeIndex = 0;
                    }
                    this.updateWorkspace();
                },
            },
            mounted() {
                this.updateWorkspace();
            },
        });

        workspace.addChangeListener(function(e){
            if (e.isUiEvent || e.type == Blockly.Events.FINISHED_LOADING) {
                return;
            } else {
                app.save();
            }
        });
    });
}, false);
