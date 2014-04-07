var DOMUtils = function ()
{};




DOMUtils.br = function(clear)
{
    var br = document.createElement("br");
    if (clear)
        br.clear = "all";

    return br;
};




DOMUtils.button = function(className, id, text, onclick)
{
    var button = document.createElement("button");

    if (className)
        button.className = className;

    if (id)
        button.id = id;

    if (text)
        button.innerHTML = text;

    if (onclick)
        button.onclick = onclick;

    return button;
};




DOMUtils.div = function(className, id, text)
{
    var div = document.createElement("div");

    if (className)
        div.className = className;

    if (id)
        div.id = id;

    if (text)
        div.innerHTML = text;

    return div;
};




DOMUtils.header = function(level, text)
{
    var elem = document.createElement("h" + level);
    elem.innerHTML = text;

    return elem;
};




DOMUtils.label = function(text, _for)
{
    var label = document.createElement("label");
    label.innerHTML = text;

    if (_for)
        label.htmlFor = _for;

    return label;
};




DOMUtils.link = function(href, text, target, onclick)
{
    // Create element
    var a = document.createElement("a");
    a.href = href;
    a.appendChild(document.createTextNode(text));

    // Set target, if provided
    if (target)
        a.target = target;

    // Set onclick event, if provided
    if (onclick)
        a.onclick = onclick;

    return a;
};




DOMUtils.option = function (value, text)
{
    var option = document.createElement("option");

    option.value = value;

    if (text)
        option.innerHTML = text;
    else
    	option.innerHTML = "No label";

    return option;
};




DOMUtils.radio = function (name, checked, id)
{
	var radio = document.createElement("input");

	radio.type = "radio";
	radio.name = name;
	if (checked)
	    radio.checked = true;
	if (id)
	    radio.id = id;

	return radio;
};




DOMUtils.span = function(className, id, text)
{
    var span = document.createElement("span");

    if (className)
        span.className = className;

    if (id)
        span.id = id;

    if (text)
        span.innerHTML = text;

    return span;
};




DOMUtils.text = function(text, bold, italic)
{
    var span = document.createElement("span");
    if (italic)
        span.style.fontStyle = "italic";
    if (bold)
        span.style.fontWeight = "bold";

    span.appendChild(document.createTextNode(text));
    span.className = "text";

    return span;
};




DOMUtils.table_row = function(contents)
{
    var tr = document.createElement("tr");

    var cells = [];
    for (var i = 0 ; i < contents.length; i++)
    {
        cells[i] = document.createElement("td");
        cells[i].appendChild(contents[i]);
        tr.appendChild(cells[i]);
    }

    return tr;

}

