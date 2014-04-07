/**************************************************************************
    Class - Anatomy Viewer App Controller

    Handles basic interaction functionality
    - Hover & Selection info panel
    - Object Contents Panel

**************************************************************************/

var AVA_Controller = function(mainApp)
{
    // Store for later calls
    this.mainApp = mainApp;

    // Create state variables
    this.hoveredObj = null;
    this.selectedObj = null;

    // Create UI Elements
    this.htmlElements =
    {
        pickingPanel: document.getElementById("ava_picking"),
        contentsPanel: document.getElementById("ava_contents"),
    };
    this.uiElements = {};
    this.uiElements.pickingPanel = new AVA_PickingPanel(this.htmlElements.pickingPanel);
    this.uiElements.contentsPanel = new AVA_ContentsPanel(this.htmlElements.contentsPanel, this);
    this.mainApp.gfxEngine.addLoadListener(this);
};




// Constant
// Colors for hover and selection highlight
AVA_Controller.HOVERED_EMISSIVE = new THREE.Color(0xffff00);
AVA_Controller.SELECTED_EMISSIVE = new THREE.Color(0xff6000);




// Help Item configuration
AVA_Controller.prototype.helpConfig =
{
    name: "Viewer Controls",
    groups: [{
        items:
        [{
            control: "V",
            description: "Toggle visibility of selected structure",
        },{
            control: "C",
            description: "Toggle visibility of scene contents panel",
        }],
    }],
};



// Handle keyboard down events
AVA_Controller.prototype.handleKeyDown = function (e, state)
{
    // V - Toggle visibility of selected object
    if (e.keyCode == CGA_KeyCodes.KEY_V)
    {
        if (this.selectedObj)
        {
            this.selectedObj.toggleVisibility();
            this.uiElements.contentsPanel.setVisibilityIndicationForObject(this.selectedObj, this.selectedObj.getVisibility());
        }
    }

    // C - Toggle visibility of contents panel
    if (e.keyCode == CGA_KeyCodes.KEY_C)
        this.uiElements.contentsPanel.toggleVisibility();
};




// Mouse has been clicked while hovering over an object
AVA_Controller.prototype.handleObjectClicked = function(obj)
{
    // If changed, clear old selected object
    if (this.selectedObj && this.selectedObj != obj)
    {
        this.selectedObj.resetMaterial();
        this.uiElements.pickingPanel.clearSelectedLink();
    }

    // Set new selected object
    this.selectedObj = obj;

    // Display object selection highlight / label
    if (this.selectedObj)
    {
        this.selectedObj.mtl.emissive = AVA_Controller.SELECTED_EMISSIVE;
        this.uiElements.pickingPanel.setSelectedLink(obj.descriptor.link, obj.descriptor.name);
        this.uiElements.contentsPanel.highlightRowWithObject(obj);
    }
};




// Mouse has stopped hovering over an object
AVA_Controller.prototype.handleObjectHovered = function(obj)
{
    // If changed, clear old hovered object
    if (this.hoveredObj && this.hoveredObj != obj)
    {
        if (this.hoveredObj == this.selectedObj)
            this.hoveredObj.mtl.emissive = AVA_Controller.SELECTED_EMISSIVE;
        else
            this.hoveredObj.resetMaterial();

        this.uiElements.pickingPanel.clearHoveredLink();
    }

    // Set new hovered object
    this.hoveredObj = obj;

    // Display object hover highlight / label
    if (this.hoveredObj)
    {
        this.hoveredObj.mtl.emissive = AVA_Controller.HOVERED_EMISSIVE;
        this.uiElements.pickingPanel.setHoveredLink(obj.descriptor.link, obj.descriptor.name);
    }
};




// Interface - LoadListener
// Called when graphics engine has finished loading a scene
AVA_Controller.prototype.loadFinished = function ()
{
    this.mainApp.gfxEngine.computeViewpoint();
    this.mainApp.gfxEngine.resetViewpoint();
    this.uiElements.contentsPanel.buildUI(this.mainApp.gfxEngine.scene.getObjects());
};

