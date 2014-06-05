// This script controls the layer selecting and shifting
// for the ghosts anatomy app

var Ghost_LayerSelector = function (scene) {
    'use strict';
    this.LAYER_LIST = ['nervous', 'digestive', 'respiratory', 'circulatory', 'skeletal', 'muscular'];
    this.LAYER_SWITCHES = {'nervous': true, 'digestive': true, 'respiratory': true,
        'circulatory': true, 'skeletal': true, 'muscular': true};
    this.currentLayerIndex = this.LAYER_LIST.length - 1; // Init the starting layer to all parts on
    this.scene = scene;
};


// Turn on the next enabled layer going to the right, if there are layers to the right to still enable
Ghost_LayerSelector.prototype.enableNextLayer = function () {
    // find another layer to enable to the right if there are still more ON layers to the right
    if (this.numberOfSwitchedOnLayersRight(this.currentLayerIndex + 1) >= 1) {
        var curr = this.currentLayerIndex + 1;
        while (this.layerIsSwitchedOff(this.LAYER_LIST[curr])) {
            curr++;
        }
        this.enableLayer(this.LAYER_LIST[curr]);
        this.currentLayerIndex = curr;
        return true;
    } else {
        return false;
    }
};

Ghost_LayerSelector.prototype.disableNextLayer = function () {
    // disable the current index's layer if there are still more ON layers to the left
    if (this.numberOfSwitchedOnLayersLeft(this.currentLayerIndex - 1) >= 1) {
        this.disableLayer(this.LAYER_LIST[this.currentLayerIndex]);
        // set current index = to the next switched on layer
        var curr = this.currentLayerIndex - 1;
        while (this.layerIsSwitchedOff(this.LAYER_LIST[curr])) {
            curr--;
        }
        // curr should now be the next available index
        this.currentLayerIndex = curr;
        return true;
    } else {
        return false;

    }
};

Ghost_LayerSelector.prototype.layerIsInBounds = function (layerIndex) {
    'use strict';
    return layerIndex >= 0 && layerIndex <= this.LAYER_LIST.length - 1;
};

Ghost_LayerSelector.prototype.layerIsSwitchedOn = function (layer) {
    'use strict';
    return this.LAYER_SWITCHES[layer];
};

Ghost_LayerSelector.prototype.layerIsSwitchedOff = function (layer) {
    'use strict';
    return !this.layerIsSwitchedOn(layer);
};

Ghost_LayerSelector.prototype.switchLayerOn = function (layer) {
    this.enableLayer(layer);
    this.LAYER_SWITCHES[layer] = true;
};

Ghost_LayerSelector.prototype.switchLayerOff = function (layer) {
    this.disableLayer(layer);
    this.LAYER_SWITCHES[layer] = false;
};


Ghost_LayerSelector.prototype.enableLayer = function (layer) {
    'use strict';
    this.scene.enableObjectsOnLayer(layer);
};

Ghost_LayerSelector.prototype.disableLayer = function (layer) {
    'use strict';
    this.scene.disableObjectsOnLayer(layer);
};

//TODO: Make this return the next left index or -1
Ghost_LayerSelector.prototype.numberOfSwitchedOnLayersLeft = function (startingIndex) {
    var totalOn = 0;
    for (var i = startingIndex; i >= 0; i--) {
        if (this.LAYER_SWITCHES[this.LAYER_LIST[i]]) {
            totalOn++;
        }
    }
    return totalOn;
};

//TODO: Make this return the next right index or -1
Ghost_LayerSelector.prototype.numberOfSwitchedOnLayersRight = function (startingIndex) {
    var totalOn = 0;
    for (var i = startingIndex; i < this.LAYER_LIST.length; i++) {
        if (this.LAYER_SWITCHES[this.LAYER_LIST[i]]) {
            totalOn++;
        }
    }
    return totalOn;
};