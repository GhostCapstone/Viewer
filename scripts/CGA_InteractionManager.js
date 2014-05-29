/**************************************************************************
    Class - CGA_InteractionManager

    - Listens for and propogates all mouse and keyboard events
**************************************************************************/
// Constructor
CGA_InteractionManager = function (gfxEngine, interactionConfig)
{
    this.gfxEngine = gfxEngine;
    this.state = new CGA_InteractionState();

    // Enable picking by default
    this.flag_pickingOnHoverEnabled = interactionConfig.pickingOnHoverEnabled ? interactionConfig.pickingOnHoverEnabled : true;
    this.flag_pickingOnClickEnabled = interactionConfig.pickingOnClickEnabled ? interactionConfig.pickingOnClickEnabled : true;

    this.listeners = [];

    // Register for interaction events
    var that = this;
    this.gfxEngine.renderer.domElement.addEventListener( 'mousemove',  function(e)  { that.onMouseMove(e); }, false );
    this.gfxEngine.renderer.domElement.addEventListener( 'mousedown',  function(e)  { that.onMouseDown(e); }, false );
    this.gfxEngine.renderer.domElement.addEventListener( 'mouseup',  function(e)    { that.onMouseUp(e); }, false );
    this.gfxEngine.renderer.domElement.addEventListener( 'mouseleave', function (e) { that.onMouseLeaveCanvas(e); },  false );
    $(document).keydown(function (e) { that.onKeyDown(e); } );
    $(document).keyup(function (e) { that.onKeyUp(e); } );

    // Register listener for mouse wheel over 3D canvas
    $(this.gfxEngine.renderer.domElement).mousewheel(
        function(e, delta) {
            that.onMouseScroll(e, delta);
        }
    );

    // Register listener for hierarchy events (keyboard in outer frames)
    document.receiveHierarchyEvent = function (e)
    {
        if (e.type == 'keydown')
            that.interactionManager.onKeyDown(e);
    };

    window.addEventListener( 'resize', function(e) { that.onWindowResize(e); }, false );
};


// Add a listener
CGA_InteractionManager.prototype.addListener = function (listener)
{
    this.listeners.push(listener);
};


// Remove all instances of this listener
CGA_InteractionManager.prototype.removeListener = function (listener)
{
    for (var i = 0 ; i < this.listeners.length ; i++)
    {
        if (this.listeners[i] == listener)
            this.listeners[i] = null;
	}
};


// Event - Key has been pressed while web browser has focus
CGA_InteractionManager.prototype.onKeyDown = function (e)
{
    // Update state
    if (e.keyCode == CGA_KeyCodes.KEY_SHIFT)
        this.state.key_shift = CGA_InteractionState.KEY_DOWN;

    // Notify listeners
    for (var i = 0 ; i < this.listeners.length ; i++)
        if (this.listeners[i].handleKeyDown)
            this.listeners[i].handleKeyDown(e, this.state);
};


// Event - Key has been released while web browser has focus
CGA_InteractionManager.prototype.onKeyUp = function (e)
{
    // Update state
    if (e.keyCode == CGA_KeyCodes.KEY_SHIFT)
        this.state.key_shift = CGA_InteractionState.KEY_UP;

    // Notify listeners
    for (var i = 0 ; i < this.listeners.length ; i++)
        if (this.listeners[i].handleKeyUp)
            this.listeners[i].handleKeyUp(e, this.state);
};


// Event - mouse has been clicked within webGL canvas
CGA_InteractionManager.prototype.onMouseDown = function(event)
{
    event.preventDefault();
    this.gfxEngine.renderer.domElement.focus();

    // Update state
    this.state.mouse.x = event.pageX;
    this.state.mouse.y = event.pageY;

    if (event.button == 0)
        this.state.mouse.left = CGA_InteractionState.MOUSE_DOWN;

    if (event.button == 1)
        this.state.mouse.middle = CGA_InteractionState.MOUSE_DOWN;

    if (event.button == 2)
        this.state.mouse.right = CGA_InteractionState.MOUSE_DOWN;

    // Handle picking
    if (this.flag_pickingOnClickEnabled && event.button == 0)
    {
        // Pick
        var pickResult = this.gfxEngine.objectAtPoint(event.pageX, event.pageY);

        // Call controller
        if (pickResult.obj)
        {
            for (var i = 0 ; i < this.listeners.length ; i++)
                if (this.listeners[i].handleObjectClicked)
                    this.listeners[i].handleObjectClicked(pickResult.obj.cgaObj);
        }
        else
        {
            for (var i = 0 ; i < this.listeners.length ; i++)
                if (this.listeners[i].handleObjectClicked)
                    this.listeners[i].handleObjectClicked(null);
        }
    }

    for (var i = 0 ; i < this.listeners.length ; i++)
        if (this.listeners[i].handleMouseDown)
            this.listeners[i].handleMouseDown(this.state);
};


// Event - mouse has left webGL canvas
CGA_InteractionManager.prototype.onMouseLeaveCanvas = function(event)
{
    this.state.mouse.left = CGA_InteractionState.MOUSE_UP;
    this.state.mouse.middle = CGA_InteractionState.MOUSE_UP;
    this.state.mouse.right = CGA_InteractionState.MOUSE_UP;

    for (var i = 0 ; i < this.listeners.length ; i++)
        if (this.listeners[i].handleMouseLeave)
            this.listeners[i].handleMouseLeave();
};


// Event - mouse has moved within webGL canvas
CGA_InteractionManager.prototype.onMouseMove = function(event)
{
    event.preventDefault();

    // Update state
    this.state.mouse.x = event.pageX;
    this.state.mouse.y = event.pageY;

    // Handle picking (if enabled)
    if (this.flag_pickingOnHoverEnabled)
    {
        var canvas = document.getElementsByTagName("canvas")[1];
        var pickResult = this.gfxEngine.objectAtPoint(event.pageX - canvas.offsetLeft, event.pageY);
        this.highlightObjects(pickResult);
    }

    // Notify listeners of mouse motion
    for (var i = 0 ; i < this.listeners.length ; i++)
        if (this.listeners[i].handleMouseMove)
            this.listeners[i].handleMouseMove(this.state);
};

CGA_InteractionManager.prototype.highlightObjects = function(pickResult){
   // Call controller
    if (pickResult.obj)
    {
        for (var i = 0 ; i < this.listeners.length ; i++)
            if (this.listeners[i].handleObjectHovered)
                this.listeners[i].handleObjectHovered(pickResult.obj.cgaObj);
    }
    else
    {
        for (var i = 0 ; i < this.listeners.length ; i++)
            if (this.listeners[i].handleObjectHovered)
                this.listeners[i].handleObjectHovered(null);
    }
}

// Event - mouse wheel has been scrolled within webGL canvas
CGA_InteractionManager.prototype.onMouseScroll = function(event, delta)
{
    event.preventDefault();

    // Notify listeners
    for (var i = 0 ; i < this.listeners.length ; i++)
        if (this.listeners[i].handleMouseScroll)
    	   this.listeners[i].handleMouseScroll(delta);
};


// Event - mouse has been released within webGL canvas
CGA_InteractionManager.prototype.onMouseUp = function(event)
{
    event.preventDefault();

    if (event.button == 0)
        this.state.mouse.left = CGA_InteractionState.MOUSE_UP;

    if (event.button == 1)
        this.state.mouse.middle = CGA_InteractionState.MOUSE_UP;

    if (event.button == 2)
        this.state.mouse.right = CGA_InteractionState.MOUSE_UP;

    for (var i = 0 ; i < this.listeners.length ; i++)
        if (this.listeners[i].handleMouseUp)
            this.listeners[i].handleMouseUp(this.state);
};


CGA_InteractionManager.prototype.onWindowResize = function(event)
{
    this.gfxEngine.resize();
};




/**************************************************************************
    Class - CGA_InteractionState

    - Listens for and propogates all mouse and keyboard events
**************************************************************************/
// Constructor
CGA_InteractionState = function ()
{
    // Set initial mouse states
    this.mouse =
    {
        x: 0,
        y: 0,
        left: CGA_InteractionState.MOUSE_UP,
        middle: CGA_InteractionState.MOUSE_UP,
        right: CGA_InteractionState.MOUSE_UP
    };

    // Set persistent key states
    this.key_shift = CGA_InteractionState.KEY_UP;
};


// Constants
CGA_InteractionState.KEY_DOWN   = 201;
CGA_InteractionState.KEY_UP     = 202;
CGA_InteractionState.MOUSE_DOWN = 101;
CGA_InteractionState.MOUSE_UP   = 102;

CGA_KeyCodes = {};
CGA_KeyCodes.KEY_SHIFT          = 16;
CGA_KeyCodes.KEY_ALT            = 18;
CGA_KeyCodes.KEY_LEFT           = 37;
CGA_KeyCodes.KEY_UP             = 38;
CGA_KeyCodes.KEY_RIGHT          = 39;
CGA_KeyCodes.KEY_DOWN           = 40;
CGA_KeyCodes.KEY_A              = 65;
CGA_KeyCodes.KEY_B              = 66;
CGA_KeyCodes.KEY_C              = 67;
CGA_KeyCodes.KEY_D              = 68;
CGA_KeyCodes.KEY_E              = 69;
CGA_KeyCodes.KEY_F              = 70;
CGA_KeyCodes.KEY_G              = 71;
CGA_KeyCodes.KEY_H              = 72;
CGA_KeyCodes.KEY_I              = 73;
CGA_KeyCodes.KEY_J              = 74;
CGA_KeyCodes.KEY_K              = 75;
CGA_KeyCodes.KEY_L              = 76;
CGA_KeyCodes.KEY_M              = 77;
CGA_KeyCodes.KEY_N              = 78;
CGA_KeyCodes.KEY_O              = 79;
CGA_KeyCodes.KEY_P              = 80;
CGA_KeyCodes.KEY_Q              = 81;
CGA_KeyCodes.KEY_R              = 82;
CGA_KeyCodes.KEY_S              = 83;
CGA_KeyCodes.KEY_T              = 84;
CGA_KeyCodes.KEY_U              = 85;
CGA_KeyCodes.KEY_V              = 86;
CGA_KeyCodes.KEY_W              = 87;
CGA_KeyCodes.KEY_X              = 88;
CGA_KeyCodes.KEY_Y              = 89;
CGA_KeyCodes.KEY_Z              = 90;
CGA_KeyCodes.KEY_QUESTION_MARK  = 191;
