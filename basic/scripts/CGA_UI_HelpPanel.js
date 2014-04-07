/**************************************************************************
    Class - CGA_UI_HelpPanel

    Provides help information in a popup panel. Used by CGA_BaseController

    Builds content from .helpItems on controllers attached CGA_Main.
*/
var CGA_UI_HelpPanel = function(container)
{
    // Initialize member fields
    this.container = container;

    // Validate
    if (this.container == null)
        alert("Cannot create CGA_UI_HelpPanel - missing div");
};




// Create user interface elements for this load progress panel.
// Called at the beginning of any load sequence to create the panel
CGA_UI_HelpPanel.prototype.buildUI = function (configs, url)
{
    // Clear out DIV
    this.container.innerHTML = "";

    this.container.appendChild(DOMUtils.header(1, "Help"));

    for (var i = 0 ; i < configs.length ; i ++)
    {
        if (configs[i].name)
            this.container.appendChild(DOMUtils.header(2, configs[i].name));
        else
            this.container.appendChild(DOMUtils.header(2, "Un-named controller"));

        if (configs[i].description)
        {
            this.container.appendChild(DOMUtils.text(configs[i].description, false, false));
            this.container.appendChild(DOMUtils.br());
            this.container.appendChild(DOMUtils.br());
        }

        for (var j = 0 ; j < configs[i].groups.length ; j ++)
        {
            if (configs[i].groups[j].name)
            {
                this.container.appendChild(DOMUtils.text(configs[i].groups[j].name, true, true));
            }

            var ul = document.createElement("ul");
            for (var k = 0 ; k < configs[i].groups[j].items.length ; k++)
            {
                var li = document.createElement("li");
                li.appendChild(DOMUtils.text(configs[i].groups[j].items[k].control, true, false));
                li.appendChild(DOMUtils.text(" - " + configs[i].groups[j].items[k].description, false, false));
                ul.appendChild(li);
            }
            this.container.appendChild(ul);
        }
    }

    this.container.appendChild(DOMUtils.link(url, "View Scene in full screen", "viewer"));
};




// Hide the UI
// Called at the end of any load sequence
CGA_UI_HelpPanel.prototype.hide = function ()
{
    $(this.container).fadeOut("slow");
};




// Test whether this panel is currently visible
CGA_UI_HelpPanel.prototype.isVisible = function ()
{
    return $(this.container).is(":visible");
};




// Show the UI
CGA_UI_HelpPanel.prototype.show = function ()
{
    $(this.container).fadeIn("slow");
};




// Toggle the contents panel's visibility
CGA_UI_HelpPanel.prototype.toggleVisibility = function ()
{
    $(this.container).fadeToggle( "slow" );
};



