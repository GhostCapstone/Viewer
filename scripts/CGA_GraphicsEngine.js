/**************************************************************************
    Class - Configurable Graphics Application - Graphics Engine

    - Handles Rendering
    - Manages Scene Graph

    Uses Interface LoadListener
    Class
      - method loadFinished()
      - method loadStarted(loaderCount, objectCount)
      - method objectLoadFinished(loaderId, descriptor)
      - method objectLoadProgress(loaderId, loaded, total)
      - method objectLoadStarted(loaderId, descriptor)

**************************************************************************/

var CGA_GraphicsEngine = function(config)
{
    // Create and configure container
    this.container = document.getElementById("cga_gfx_container");
	this.container.setAttribute("tabindex", 1);

    // Check that WebGL is supported
    if (! this.testWebGLSupport(this.container))
        return;

    // Create the Three.js renderer, add it to our div
    this.renderer = new THREE.WebGLRenderer( { antialias: true, canvas: undefined } );
    this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
    this.container.appendChild(this.renderer.domElement);
    this.renderer.domElement.setAttribute("tabindex", 1);

    // Disable right mouse click on canvas
    this.renderer.domElement.oncontextmenu = function () { return false; };

    // Create Scene
    this.scene = new CGA_Scene();

    // Create camera and place in default location
    this.camera = new THREE.PerspectiveCamera( 45, this.container.offsetWidth / this.container.offsetHeight, 1, 10000 );
    this.camera.position.set( 0, 0, 1 );
    this.scene.add(this.camera);

    // Set up viewpoint
    this.viewpoint =
    {
        origin: { x : 0, y: 0, z: 0},
        distance: 0,
        distance_default: 0,
        distance_max: 10,
        distance_min: 0.1,
    };
    if (config.viewpoint)
        this.viewpoint.preset = config.viewpoint;
    this.computeViewpoint();
    this.resetViewpoint();

    // Create storage for listeners
    this.loadListeners = [];

    // Create a projector to handle picking
    this.projector = new THREE.Projector();
};



// Add a listener for load events
CGA_GraphicsEngine.prototype.addLoadListener = function (listener)
{
    this.loadListeners.push(listener);
};




CGA_GraphicsEngine.prototype.addSceneObjects = function (sceneObjectDescriptors, callback)
{
    var that = this;

    // If scene loader is active, re-call addSceneObjects after a delay
    if (this.scLoader && this.scLoader.active)
    {
        window.setTimeout(function () { that.addSceneObjects(sceneObjectDescriptors, callback); }, 200);
    }

    // Add the scene objects
    else
    {
        // Find objects in new scene that need to be loaded
        var filteredObjectDescriptors = [];
        for (var i = 0 ; i < sceneObjectDescriptors.length ; i ++)
        {
            var descriptor = sceneObjectDescriptors[i];

            if (!descriptor.id)
                throw "Cannot add scene object with descriptor missing ID";

            if (! this.scene.hasObjectWithId(sceneObjectDescriptors[i].id))
                filteredObjectDescriptors.push(sceneObjectDescriptors[i]);
        }

        // Debug
        for (var i = 0 ; i < filteredObjectDescriptors.length ; i ++)
            console.log("GFXEngine - Adding " + filteredObjectDescriptors[i].name);

        // Add new objects
        this.loadSceneObjects(filteredObjectDescriptors, callback);
    }
};




// Apply camera commands (derived from interaction)
//
// Called by main loop
CGA_GraphicsEngine.prototype.applyCameraUpdate = function(update)
{
    // Rotate
    this.scene.mainRotationGroup.object3D.rotation.y += update.rotate.x;
    this.scene.mainRotationGroup.object3D.rotation.x += update.rotate.y;

    // Pan
    if (update.pan.x || update.pan.y)
    {
        // Extract current rotation from mainRotationGroup matrix
        var tr_rotated = new THREE.Vector3();
        tr_rotated.setEulerFromRotationMatrix(this.scene.mainRotationGroup.object3D.matrix);

        // Reverse rotation
        tr_rotated.x = -tr_rotated.x;
        tr_rotated.y = -tr_rotated.y;
        tr_rotated.z = -tr_rotated.z;

        // Apply reversed rotation to screen translation to put it into rotated model space
        var m = new THREE.Matrix4();
        m.setRotationFromEuler(tr_rotated);
        var tr_screen = new THREE.Vector3(update.pan.x * this.viewpoint.distance, update.pan.y * this.viewpoint.distance, 0);
        tr_screen.applyMatrix4(m);

        // Apply translation
        this.scene.mainTranslationGroup.object3D.position.add(tr_screen);
    }

    // Zoom - Adjust camera distance
    if (update.zoom)
    {
        this.viewpoint.distance -= update.zoom * this.viewpoint.distance;

        // Clamp distance to min / max range
        if (this.viewpoint.distance < this.viewpoint.distance_min)
            this.viewpoint.distance = this.viewpoint.distance_min;
        if (this.viewpoint.distance > this.viewpoint.distance_max)
            this.viewpoint.distance = this.viewpoint.distance_max;

        // Set new camera position (adjust for zoom)
        var newPos = new THREE.Vector3(0,0,this.viewpoint.distance);
        this.camera.position.copy(newPos);
    }
};




CGA_GraphicsEngine.prototype.computeViewpoint = function ()
{
    console.log("computing viewpoint");

    // Get objects from scene
    var objectCount = this.scene.getObjectCount();
    var objects = this.scene.getObjects();

    // Recalculate geometric parameters from the full list of scene objects
    if (this.scene.getObjectCount() > 0)
    {
        // Initialize
        var centroid = {x: 0, y: 0, z: 0};
        var max =
        {
            x: Number.NEGATIVE_INFINITY,
            y: Number.NEGATIVE_INFINITY,
            z: Number.NEGATIVE_INFINITY,
        };
        var min =
        {
            x: Number.POSITIVE_INFINITY,
            y: Number.POSITIVE_INFINITY,
            z: Number.POSITIVE_INFINITY,
        };

        // Gather data from objects
        for (var i = 0 ; i < objects.length ; i++)
        {
            var obj = objects[i];
            centroid.x += obj.descriptor.centroid.x;
            centroid.y += obj.descriptor.centroid.y;
            centroid.z += obj.descriptor.centroid.z;

            if (obj.descriptor.max.x > max.x) max.x = obj.descriptor.max.x;
            if (obj.descriptor.max.y > max.y) max.y = obj.descriptor.max.y;
            if (obj.descriptor.max.z > max.z) max.z = obj.descriptor.max.z;

            if (obj.descriptor.min.x < min.x) min.x = obj.descriptor.min.x;
            if (obj.descriptor.min.y < min.y) min.y = obj.descriptor.min.y;
            if (obj.descriptor.min.z < min.z) min.z = obj.descriptor.min.z;
        }

        // Calculate centroid (average sum)
        centroid.x = centroid.x / objectCount;
        centroid.y = centroid.y / objectCount;
        centroid.z = centroid.z / objectCount;

        // Recalculate max / min as distance from centroid
        max.x = max.x - centroid.x;
        max.y = max.y - centroid.y;
        max.z = max.z - centroid.z;
        min.x = centroid.x - min.x;
        min.y = centroid.y - min.y;
        min.z = centroid.z - min.z;

        // Calculate extent
        var extent = max.x;
        if (max.y > extent) extent = max.y;
        if (max.z > extent) extent = max.z;
        if (min.x > extent) extent = min.x;
        if (min.y > extent) extent = min.y;
        if (min.z > extent) extent = min.z;
        if (extent < 1)
            extent = 1;


        // Set Viewpoint parameters
        this.viewpoint.origin             = { x : -centroid.x, y: -centroid.y, z: -centroid.z};
        this.viewpoint.distance_default   = extent * 3;
        this.viewpoint.distance_max       = extent * 120;
        this.viewpoint.distance_min       = extent * 0.001;
    }
};




CGA_GraphicsEngine.prototype.getSceneObjectById = function (id)
{
    return this.scene.getObjectById(id);
};




CGA_GraphicsEngine.prototype.getViewpoint = function ()
{
    var viewpoint =
    {
        rotation: { x: 0, y:0, z: 0 },
        cameraPos: { x: 0, y:0, z: 0 },
        translation: { x: 0, y:0, z: 0 },
    };

    viewpoint.rotation.x = this.scene.mainRotationGroup.object3D.rotation.x;
    viewpoint.rotation.y = this.scene.mainRotationGroup.object3D.rotation.y;
    viewpoint.rotation.z = this.scene.mainRotationGroup.object3D.rotation.z;

    viewpoint.translation.x = this.scene.mainTranslationGroup.object3D.position.x;
    viewpoint.translation.y = this.scene.mainTranslationGroup.object3D.position.y;
    viewpoint.translation.z = this.scene.mainTranslationGroup.object3D.position.z;

    viewpoint.cameraPos.x = this.camera.position.x;
    viewpoint.cameraPos.y = this.camera.position.y;
    viewpoint.cameraPos.z = this.camera.position.z;

    return viewpoint;
};




// Load a set of scene objects from a set of scene object descriptors.
// When finished, add these to the scene.
CGA_GraphicsEngine.prototype.loadSceneObjects = function (sceneObjectDescriptors, callback)
{
    // Create Scene Content Loader
    this.scLoader = new CGA_SceneContentLoader(sceneObjectDescriptors);

    // Register event to occur when meshes are fully loaded
    var that = this;

    // Create Load Listener events
    this.scLoader.addEventListener( 'loadFinished', function ( event )
    {
        // Notify caller of completion of load
        if (callback)
            callback();

        // Notify listeners
        for (var i = 0 ; i < that.loadListeners.length ; i ++)
            if (that.loadListeners[i].loadFinished)
                that.loadListeners[i].loadFinished();
    });
    this.scLoader.addEventListener( 'objectLoadFinished', function ( event )
    {
        that.scene.addObject(new CGA_GeometryObject(event.descriptor, event.mesh.children[0].geometry));

        for (var i = 0 ; i < that.loadListeners.length ; i ++)
            if (that.loadListeners[i].objectLoadFinished)
                that.loadListeners[i].objectLoadFinished(event.loaderId, event.descriptor);
    });
    this.scLoader.addEventListener( 'objectLoadProgress', function ( event )
    {
        for (var i = 0 ; i < that.loadListeners.length ; i ++)
            if (that.loadListeners[i].objectLoadProgress)
                that.loadListeners[i].objectLoadProgress(event.loaderId, event.loaded, event.total);
    });
    this.scLoader.addEventListener( 'objectLoadStarted', function ( event )
    {
        for (var i = 0 ; i < that.loadListeners.length ; i ++)
            if (that.loadListeners[i].objectLoadStarted)
                that.loadListeners[i].objectLoadStarted(event.loaderId, event.descriptor);
    });

    // Initialize load listeners
    for (var i = 0 ; i < this.loadListeners.length ; i ++)
        if (this.loadListeners[i].loadStarted)
            this.loadListeners[i].loadStarted(this.scLoader.loaders.length, sceneObjectDescriptors.length);

    // Initialize and load meshes
    this.scLoader.startOrContinueLoading();
};




// Pick the first object under coordinates given
CGA_GraphicsEngine.prototype.objectAtPoint = function(x,y)
{
	// Translate page coords to element coords
	var offset = $(this.renderer.domElement).offset();
	var eltx = x - offset.left;
	var elty = y - offset.top;

	// Translate client coords into viewport x,y
    var vpx = ( eltx / this.container.offsetWidth ) * 2 - 1;
    var vpy = - ( elty / this.container.offsetHeight ) * 2 + 1;

    // Calculate vector pick vector
    var vector = new THREE.Vector3( vpx, vpy, 1.0 );
    this.projector.unprojectVector( vector, this.camera , 0, Infinity);
    vector.sub( this.camera.position );
    vector.normalize();

    // Cast ray to find intersects
    var raycaster = new THREE.Raycaster( this.camera.position, vector );
    var targets = this.scene.mainRotationGroup.object3D.children;
    var intersects = raycaster.intersectObjects( targets, true );

    // Find first visible object
    for (var i = 0 ; i < intersects.length ; i ++)
    {
        if (intersects[i].object != null && intersects[i].object.visible)
        {
            var mat = new THREE.Matrix4().getInverse(intersects[i].object.matrixWorld);
            var point = intersects[i].point;
            point.applyMatrix4(mat);
            return ({"obj":intersects[i].object, "point":point});
        }
    }

    // If none found, return empty pick
    return {"obj":null, "point":null};
};




// Remove a listener for load events
CGA_GraphicsEngine.prototype.removeLoadListener = function (listener)
{
    var index = this.loadListeners.indexOf(listener);
	if (index != -1)
		this.loadListeners.splice(listener, 1);
};




// Render a single frame
//
// Called by main loop
CGA_GraphicsEngine.prototype.render = function()
{
    this.renderer.render( this.scene, this.camera );
};




// Load a set of scene objects from a set of scene object descriptors.
// When finished, add these to the scene.
CGA_GraphicsEngine.prototype.replaceSceneObjects = function (sceneObjectDescriptors, callback)
{
    throw "Use of deprecated method - look at revision 434 of webgl app to find old code";
}




// Reset the camera and scene transformations to their standard settings
//
// Reset uses viewpoint parameters computed from objects in the scene when
// computeViewpoint was last invoked.
CGA_GraphicsEngine.prototype.resetViewpoint = function ()
{
    if (!this.viewpoint.preset)
    {
        this.viewpoint.distance = this.viewpoint.distance_default;

        this.scene.mainRotationGroup.object3D.rotation.x = 0;
        this.scene.mainRotationGroup.object3D.rotation.y = 0;
        this.scene.mainRotationGroup.object3D.rotation.z = 0;

        this.scene.mainTranslationGroup.object3D.position.x = this.viewpoint.origin.x;
        this.scene.mainTranslationGroup.object3D.position.y = this.viewpoint.origin.y;
        this.scene.mainTranslationGroup.object3D.position.z = this.viewpoint.origin.z;

        this.scene.lightSource.position.set(this.viewpoint.distance * 0.5, this.viewpoint.distance * 0.5, this.viewpoint.distance * 0.8);

        // Set new camera position
        this.camera.position.set(0, 0, this.viewpoint.distance);
    }
    else
    {
        this.scene.mainRotationGroup.object3D.rotation.x = this.viewpoint.preset.rotation.x;
        this.scene.mainRotationGroup.object3D.rotation.y = this.viewpoint.preset.rotation.y;
        this.scene.mainRotationGroup.object3D.rotation.z = this.viewpoint.preset.rotation.z;

        this.scene.mainTranslationGroup.object3D.position.x = this.viewpoint.preset.translation.x;
        this.scene.mainTranslationGroup.object3D.position.y = this.viewpoint.preset.translation.y;
        this.scene.mainTranslationGroup.object3D.position.z = this.viewpoint.preset.translation.z;

        this.camera.position.x = this.viewpoint.preset.cameraPos.x;
        this.camera.position.y = this.viewpoint.preset.cameraPos.y;
        this.camera.position.z = this.viewpoint.preset.cameraPos.z;

        this.viewpoint.distance = this.viewpoint.preset.cameraPos.z;
        this.scene.lightSource.position.set(this.viewpoint.distance * 0.5, this.viewpoint.distance * 0.5, this.viewpoint.distance * 0.8);
    }
};




// Resize the renderer and camera frustum according to current container size
CGA_GraphicsEngine.prototype.resize = function()
{
    this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
	this.camera.aspect = this.container.offsetWidth / this.container.offsetHeight;
	this.camera.updateProjectionMatrix();
};




// Test whether WebGL is supported in this browser
//
// If not supported, display an appropriate error message and return false
// If supported, return true
CGA_GraphicsEngine.prototype.testWebGLSupport = function(container)
{

    // Test to see if browser understands Web GL.
    if (!window.WebGLRenderingContext)
    {
        container.style.padding = "8px";
        container.innerHTML = '<h1>Your browser does not support 3D graphics</h1>';
        container.innerHTML += '<p>Unfortunately, your browser does not support Web GL. We suggest you try a recent version of Chrome, Firefox, or Safari.</p>';
        container.innerHTML += '<p>Internet Explorer does not support 3D graphics in any form, and Opera supports it only partially.</p>';
        return false;
    }
    else
    {
        // Attempt to create a Web GL environment
        var canvas = document.createElement("canvas");
        gl = canvas.getContext("webgl");

        // If that failed, try an experimental web GL environment
        if (!gl)
            gl = canvas.getContext("experimental-webgl");

        // If that failed, show fail message
        if (!gl)
        {
            container.style.padding = "8px";
            container.innerHTML = "<h1>Your browser is having problems starting 3D graphics</h1>";
            container.innerHTML += "<p>Most likely, this is because Web GL support is disabled, as this is the default for some browsers. It is also possible that your computer is running old video drivers that do not support browser-based 3D graphics.</p>";
            container.innerHTML += "<p>To solve this problem, try the following:</p>";
            container.innerHTML += "<ul>";
            container.innerHTML += "<li>Visit <a href=\"http://get.webgl.org\">http://get.webgl.org</a>. They link to help files for a number of browsers.</li>";
            container.innerHTML += "<li>Google \"enable webgl [browser]\" to find instructions on how to enable WebGL in your browser</li>";
            container.innerHTML += "<li>If you're confident that Web GL is enabled and you're still unable to see 3D graphics, try updating your graphics card drivers.</li>";
            container.innerHTML += "</ul>";

            return false;
        }
        else
            return true;
    }
};

