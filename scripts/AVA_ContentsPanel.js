var AVA_ContentsPanel = function (container, controller)
{
    this.container = container;
    this.controller = controller;
    this.buildUI([]);
};




// Generate the contents of this panel from the current set of scene objects
AVA_ContentsPanel.prototype.buildUI = function (sceneObjects)
{
    var that = this;

    // Sort scene objects into new array
    sceneObjects.sort(function (a, b) { return a.descriptor.name > b.descriptor.name ? 1 : -1; } );

    // Clear existing UI
	this.container.innerHTML = "";

    // Create show all button
    var elem_div_showAll = document.createElement("div");
    elem_div_showAll.innerHTML = "Show all";
    elem_div_showAll.className = "ava_contents_control_button";
    elem_div_showAll.onclick = function()
    {
        for (var i = 0 ; i < that.rows.length ; i++)
            that.rows[i].sceneObj.setVisibility(true);

        that.setAllVisibilityIndications(true);
    };
    this.container.appendChild(elem_div_showAll);

    // Create hide all button
    var elem_div_hideAll = document.createElement("div");
    elem_div_hideAll.innerHTML = "Hide all";
    elem_div_hideAll.className = "ava_contents_control_button";
    elem_div_hideAll.onclick = function()
    {
        for (var i = 0 ; i < that.rows.length ; i++)
            that.rows[i].sceneObj.setVisibility(false);

        that.setAllVisibilityIndications(false);
    };
    this.container.appendChild(elem_div_hideAll);

    // Create panel title
    var elem_title = document.createElement("h1");
    elem_title.appendChild(document.createTextNode("Contents"));
    this.container.appendChild(elem_title);

    // Add content rows
    this.rows = new Array();
    this.buttons = new Array();
    for (var i = 0 ; i < sceneObjects.length ; i++)
    {
        // Create row div
        var div_row = document.createElement("div");
        if (i % 2 == 0)
            div_row.className = "ava_contents_row_even";
        else
            div_row.className = "ava_contents_row_odd";


        // Create text label div
        var div_text = document.createElement("div");
        div_text.className = "ava_contents_label";
        div_text.appendChild(document.createTextNode(sceneObjects[i].descriptor.name));
        div_row.appendChild(div_text);
        div_row.div_text = div_text;

        // Create show / hide button
        var div_button = document.createElement("div");
        div_button.className = "ava_contents_hide_button";
        div_button.innerHTML = "Hide";
        div_button.onclick = function ()
        {
            // Toggle visiblity of object
            this.parentNode.sceneObj.toggleVisibility();

            // Toggle visiblity of button
            that.setVisibilityIndication(this, this.parentNode.sceneObj.getVisibility());
        };
        div_row.appendChild(div_button);
        div_row.div_button = div_button;

        // Create blocking div
        var div_blocker = document.createElement("div");
        div_blocker.style.clear = "both";
        div_row.appendChild(div_blocker);

        // Add 'selection' event
        div_text.onclick = function ()
        {
            console.log(this.parentNode.sceneObj);
            that.controller.handleObjectClicked(this.parentNode.sceneObj);
        };

        // Store row div
        div_row.sceneObj = sceneObjects[i];
        this.rows[i] = div_row;
        this.buttons[i] = div_button;
        this.container.appendChild(div_row);
    }
};




// Hide the contents panel
AVA_ContentsPanel.prototype.hide = function ()
{
    $(this.container).fadeOut( "slow" );
};




// Set the show / hide button for all rows
AVA_ContentsPanel.prototype.setAllVisibilityIndications = function(visibility)
{
    for (var i = 0 ; i < this.rows.length ; i ++)
    {
        if (visibility)
        {
            this.rows[i].div_button.innerHTML = "Hide";
            this.rows[i].div_button.className = "ava_contents_hide_button";
        }
        else
        {
            this.rows[i].div_button.innerHTML = "Show";
            this.rows[i].div_button.className = "ava_contents_show_button";
        }
    }
};




AVA_ContentsPanel.prototype.highlightRowWithObject = function (object)
{
    // Clear old highlighted row
    for (var i = 0 ; i < this.rows.length ; i ++)
        if (i % 2 == 0)
            this.rows[i].className = "ava_contents_row_even";
        else
            this.rows[i].className = "ava_contents_row_odd";

    // Highlight the row corresponding to this object.
    if (object != null)
        for (var i = 0 ; i < this.rows.length ; i ++)
            if (this.rows[i].sceneObj == object)
                this.rows[i].className = "ava_contents_row_highlight";
};



// Set the show / hide button state for a given row.
AVA_ContentsPanel.prototype.setVisibilityIndication = function(button, visibility)
{
    // If a row was found, toggle visibility
    if (visibility)
    {
        button.innerHTML = "Hide";
        button.className = "ava_contents_hide_button";
    }
    else
    {
        button.innerHTML = "Show";
        button.className = "ava_contents_show_button";
    }
};




// Given an object, find the relevant row and set the visibility indicator
AVA_ContentsPanel.prototype.setVisibilityIndicationForObject = function (sceneObj, visibility)
{
    // Find the row corresponding to this object.
    for (var i = 0 ; i < this.rows.length ; i ++)
    {
        if (this.rows[i].sceneObj == sceneObj)
        {
            if (visibility)
            {
                this.rows[i].div_button.innerHTML = "Hide";
                this.rows[i].div_button.className = "ava_contents_hide_button";
            }
            else
            {
                this.rows[i].div_button.innerHTML = "Show";
                this.rows[i].div_button.className = "ava_contents_show_button";
            }
        }
    }
};





// Show the contents panel
AVA_ContentsPanel.prototype.show = function ()
{
    $(this.container).fadeIn( "slow" );
};




// Toggle the contents panel's visibility
AVA_ContentsPanel.prototype.toggleVisibility = function ()
{
    $(this.container).fadeToggle( "slow" );
};

