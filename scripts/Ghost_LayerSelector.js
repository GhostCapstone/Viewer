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
    'use strict';
    var nextLayerIndex = this.currentLayerIndex + 1;
    var enabled = false; // have we finished enabling a layer
    do {
        if (this.layerEnabled(this.LAYER_LIST[nextLayerIndex])) {
            this.scene.enableObjectsOnLayer(this.LAYER_LIST[nextLayerIndex]);
        } else {
            nextLayerIndex++;
        }
    } while (this.layerIsInBounds(nextLayerIndex) && !enabled);

    // If we went out of bounds, all the layers must be on

};

Ghost_LayerSelector.prototype.disableNextLayer = function () {
    'use strict';
    var nextLayerIndex = this.currentLayerIndex - 1;
    var enabled = false; // have we finished enabling a layer
    do {
        if (this.layerEnabled(this.LAYER_LIST[nextLayerIndex])) {
            this.scene.disableObjectsOnLayer(this.LAYER_LIST[nextLayerIndex]);
        } else {
            nextLayerIndex--;
        }
    } while (this.layerIsInBounds(nextLayerIndex) && !enabled);

    // If we went out of bounds, all the layers must be off
};

Ghost_LayerSelector.prototype.layerIsInBounds = function (layerIndex) {
    'use strict';
    return layerIndex >= 0 && layerIndex <= this.LAYER_LIST.length - 1;
};

Ghost_LayerSelector.prototype.layerEnabled = function (layer) {
    'use strict';
    return this.LAYER_SWITCHES[layer];
};

Ghost_LayerSelector.prototype.layerDisabled = function (layer) {
    'use strict';
    return !this.layerEnabled();
};

Ghost_LayerSelector.prototype.enableLayer = function (layer) {
    'use strict';
    this.scene.enableObjectsOnLayer(layer);
};

Ghost_LayerSelector.prototype.disableLayer = function (layer) {
    'use strict';
    this.scene.disableObjectsOnLayer(layer);
};