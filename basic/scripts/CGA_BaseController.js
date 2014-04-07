/**************************************************************************
    Class - CGA Base Controller

    Handles basic interaction functionality
    - Hover & selection of objects
    - Basic camera control
    - Help dialog

**************************************************************************/

var CGA_BaseController = function(mainApp)
{
    var that = this;

    // Store objects for later calls
    this.mainApp = mainApp;

    // Set initial change variables
    this.scrollChange = 0;
    this.rotating = false;
    this.panning = false;
    this.mouseAtLastUpdate = { x : null, y: null };
    this.mouseCurrent = { x : null, y: null };

    // Create UI Elements
    this.htmlElements =
    {
        loadProgressPanel: document.getElementById("cga_lpp"),
        helpPanel: document.getElementById("cga_help"),
        helpButton: document.getElementById("cga_help_button"),
    };
    this.uiElements = {};

    // Create Load Progress Panel
    this.uiElements.loadProgressPanel = new CGA_UI_LoadProgressPanel(this.htmlElements.loadProgressPanel);
    this.mainApp.gfxEngine.addLoadListener(this.uiElements.loadProgressPanel);

    // Create Help Panel & Button
    this.uiElements.helpPanel = new CGA_UI_HelpPanel(this.htmlElements.helpPanel);
    this.htmlElements.helpButton.onclick = function ()
    {
        // Re-build help before showing
        if (!that.uiElements.helpPanel.isVisible())
        {
            var helpConfigs = that.mainApp.getControllerHelpConfigs();
            var url = that.mainApp.generateURL();
            that.uiElements.helpPanel.buildUI(helpConfigs, url);
        }

        that.uiElements.helpPanel.toggleVisibility();
    };
};




// Help Item configuration
CGA_BaseController.prototype.helpConfig =
{
    name: "Basic Controls",
    groups: [{
        items:
        [{
            control: "?",
            description: "Show / hide this help dialog",
        },{
            control: "R",
            description: "Reset viewpoint",
        },{
            control: "Left mouse button",
            description: "Click to select structures",
        },{
            control: "Left mouse button + Shift",
            description: "Click and drag to pan scene",
        },{
            control: "Right mouse button",
            description: "Click and drag to rotate scene",
        }],
    }],
};




// Perform any necessary computation for the next frame
//
// Apply updates to camera
CGA_BaseController.prototype.frame = function ()
{
    // Calculate mouse motion since last update
    var dx = this.mouseCurrent.x - this.mouseAtLastUpdate.x;
    var dy = this.mouseCurrent.y - this.mouseAtLastUpdate.y;
    this.mouseAtLastUpdate.x = this.mouseCurrent.x;
    this.mouseAtLastUpdate.y = this.mouseCurrent.y;

    // Create camera command object
    var update =
    {
        rotate: { x: 0, y: 0 },
        pan: { x: 0, y:0 },
        zoom: 0,
    };

    // Handle rotation
    if ((dx || dy) && this.rotating)
    {
        update.rotate.x = 0.01 * dx;
        update.rotate.y = 0.01 * dy;
    }

    // Handle translation
    if ((dx || dy) && this.panning)
    {
        update.pan.x =  0.002 * dx;
        update.pan.y = -0.002 * dy;
    }

    // Handle zoom
    if (this.scrollChange != NaN && this.scrollChange != undefined && this.scrollChange != 0)
    {
        update.zoom = this.scrollChange * 0.03;
        this.scrollChange = 0;
    }

    // Apply update to camera
    this.mainApp.gfxEngine.applyCameraUpdate(update);
};




// Handle keyboard down events
CGA_BaseController.prototype.handleKeyDown = function (e, state)
{
    // R - Reset scene
    if (e.keyCode == CGA_KeyCodes.KEY_R)
        this.mainApp.gfxEngine.resetViewpoint();

    if (e.keyCode == CGA_KeyCodes.KEY_QUESTION_MARK)
    {
        if (!this.uiElements.helpPanel.isVisible())
        {
            var helpConfigs = this.mainApp.getControllerHelpConfigs();
            var url = this.mainApp.generateURL();
            this.uiElements.helpPanel.buildUI(helpConfigs, url);
        }

        this.uiElements.helpPanel.toggleVisibility();
    }
};




// Handle keyboard up events
CGA_BaseController.prototype.handleKeyUp = function (e, state)
{
    // Shift - Clear panning (left click + shift)
    if (e.keyCode == CGA_KeyCodes.KEY_SHIFT)
        this.panning = false;
};




// Handle mouse down event
CGA_BaseController.prototype.handleMouseDown = function (state)
{
    // Start panning
    if (   state.mouse.left == CGA_InteractionState.MOUSE_DOWN
        && state.key_shift == CGA_InteractionState.KEY_DOWN)
    {
        this.panning = true;
        this.rotating = false;
        this.mouseAtLastUpdate.x = state.mouse.x;
        this.mouseAtLastUpdate.y = state.mouse.y;
        this.mouseCurrent.x = state.mouse.x;
        this.mouseCurrent.y = state.mouse.y;
    }

    // Start rotating
    if (state.mouse.right == CGA_InteractionState.MOUSE_DOWN)
    {
        this.panning = false;
        this.rotating = true;
        this.mouseAtLastUpdate.x = state.mouse.x;
        this.mouseAtLastUpdate.y = state.mouse.y;
        this.mouseCurrent.x = state.mouse.x;
        this.mouseCurrent.y = state.mouse.y;
    }
};




// Handle mouse leaving canvas - stop panning and rotating
CGA_BaseController.prototype.handleMouseLeave = function ()
{
    this.panning = false;
    this.rotating = false;
};




// Handle mouse motion - rotate if right
CGA_BaseController.prototype.handleMouseMove = function (state)
{
    this.mouseCurrent.x = state.mouse.x;
    this.mouseCurrent.y = state.mouse.y;
};




// Handle mouse wheel - zoom
CGA_BaseController.prototype.handleMouseScroll = function (delta)
{
    this.scrollChange += delta;
};




// Handle mouse release - check if we should stop panning and rotating
CGA_BaseController.prototype.handleMouseUp = function (state)
{
    if      (state.mouse.left == CGA_InteractionState.MOUSE_UP)
        this.panning = false;

    if (state.mouse.right == CGA_InteractionState.MOUSE_UP)
        this.rotating = false;
};
