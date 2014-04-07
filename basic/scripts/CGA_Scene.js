/**************************************************************************
    Class - Configurable Graphics Application - Main Class


**************************************************************************/

var CGA_Scene = function()
{
    THREE.Scene.call(this);

    // Create storage for objects
    this.objectMap = [];

    // Create a new Three.js scene
    this.add( new THREE.AmbientLight( 0x505050 ) );

    // Create main groups (for rotation and centroid)
    this.mainRotationGroup = new CGA_GroupObject();
    this.add(this.mainRotationGroup.object3D);
    this.mainTranslationGroup = new CGA_GroupObject();
    this.mainRotationGroup.addChild(this.mainTranslationGroup);

    // Create light source
    this.lightSource = new THREE.PointLight (0xffffff, 0.5, 0);
    this.lightSource.position.set(0, 0, 0);
    this.add(this.lightSource);
};
CGA_Scene.prototype = new THREE.Scene();




// Add an object to the scene
CGA_Scene.prototype.addObject = function(object)
{
    // Add object to map
    this.objectMap[object.id] = object;

    // Add object to scene graph
    this.mainTranslationGroup.addChild(object);
};




// Add a set of objects to the scene
CGA_Scene.prototype.addObjects = function (objects)
{
    for (var i = 0 ; i < objects.length ; i ++)
    {
        // Add object to map
        this.objectMap[objects[i].id] = objects[i];

        // Add object to scene graph
        this.mainTranslationGroup.addChild(objects[i]);
    }
};




// Retrieve the object with the given ID.
// Return null if no such object found
CGA_Scene.prototype.getObjectById = function (id)
{
    return this.objectMap[id];
}




// Get count of objects in scene
CGA_Scene.prototype.getObjectCount = function ()
{
    return Object.size(this.objectMap);
}




// Get array of all objects in scene
CGA_Scene.prototype.getObjects = function ()
{
    var objects = [];

    for (var key in this.objectMap)
        objects.push(this.objectMap[key]);

    return objects;
}




// Determine whether an object with the given ID exists in this scene
CGA_Scene.prototype.hasObjectWithId = function (id)
{
    if (this.objectMap[id])
        return true;
    else
        return false;
}




// Remove an object from the scene
CGA_Scene.prototype.removeObject = function(object)
{
    // Remove object from map
    delete this.objectMap[object.id];

    // Remove object from scene graph
    this.mainTranslationGroup.removeChild(object);
};
