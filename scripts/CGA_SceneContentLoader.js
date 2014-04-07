/**************************************************************************
    Class - CGA_SceneContentLoader

    Handles a collection of Scene Object Loaders to provide parallel loading of scene object mesh files

    Events generated:
    - loadFinished - all models have been loaded
      * no attributes
    - objectLoadFinished - a single model file has been loaded
      * loaderId: ID of loader (range 0 to loaderCount - 1)
      * descriptor: descriptor of scene object just loaded
      * mesh: mesh data just loaded
      * loaded: # of scene objects loaded
      * total: # of scene objects to load
    - objectLoadStarted
      * loaderId: ID of loader (range 0 to loaderCount - 1)
      * descriptor: descriptor of scene object just started
    - objectLoadProgress
      * loaderId: ID of loader (range 0 to loaderCount - 1)
      * loaded: # bytes loaded
      * total: # bytes to load


    Configurable variables:
      * CGA_SceneContentLoader.LOADER_COUNT - the number of simultaneous load engines to employ

**************************************************************************/


// Note that the mesh manager is configured on instantiation, and cannot be reused. This is by design.
// Applications should create a new CGA_SceneContentLoader each time Scene Contents need to be loaded
var CGA_SceneContentLoader = function(descriptors)
{
    THREE.EventDispatcher.call( this );

    // Initialize
    this.active = false;

    // Initialize loaders
    this.loaders = new Array(CGA_SceneContentLoader.LOADER_COUNT);
    var that = this;
    for (var i = 0 ; i < this.loaders.length ; i++)
    {
        this.loaders[i] = new SceneObjectLoader(i);
        this.loaders[i].addEventListener('sceneObjectLoaded', function (e)
        {
            that.dispatchEvent(
            {
                type: 'objectLoadFinished',
                loaderId: e.id,
                descriptor: e.descriptor,
                mesh: e.mesh,
                loaded: that.getNumberMeshesLoaded(),
                total: descriptors.length,
            });

            that.startOrContinueLoading();
        });

        this.loaders[i].addEventListener('sceneObjectProgress', function (e)
        {
            that.dispatchEvent(
            {
                type: 'objectLoadProgress',
                loaderId: e.id,
                loaded: e.loaded,
                total: e.total
            });
        });

    }

    // Initialize scene objects
    this.descriptors = descriptors;
    for (var i = 0 ; i < this.descriptors.length ; i ++)
    {
        this.descriptors[i].loadStatus = CGA_SceneContentLoader.MESH_NOT_YET_LOADED;
        this.descriptors[i].loadIndex = i;
    }
};
CGA_SceneContentLoader.prototype = Object.create(THREE.EventDispatcher.prototype);

CGA_SceneContentLoader.MESH_NOT_YET_LOADED = 1;
CGA_SceneContentLoader.MESH_LOADING = 2;
CGA_SceneContentLoader.MESH_LOADED = 3;

// Configurable value
CGA_SceneContentLoader.LOADER_COUNT = 4;


// Count the number of meshes with MESH_LOADED status
CGA_SceneContentLoader.prototype.getNumberMeshesLoaded = function()
{
    var count = 0;
    for (var j = 0 ; j < this.descriptors.length ; j ++)
    {
        if (this.descriptors[j].loadStatus == CGA_SceneContentLoader.MESH_LOADED)
            count ++;
    }

    return count;
};


CGA_SceneContentLoader.prototype.startOrContinueLoading = function ()
{
    // Flag that scene content loader is running
    this.active = true;

    // Find the next inactive loader, and start it loading the next file not yet loaded
    for (var i = 0 ; i < this.loaders.length ; i++)
    {
        if (!this.loaders[i].active)
        {
            for (var j = 0 ; j < this.descriptors.length ; j ++)
            {
                if (this.descriptors[j].loadStatus == CGA_SceneContentLoader.MESH_NOT_YET_LOADED)
                {
                    console.log("Loader " + i + " - loading  " + this.descriptors[j].name);

                    // Load the next scene object
                    this.loaders[i].loadSceneObject(this.descriptors[j]);

                    // Report this event
                    this.dispatchEvent( {
                        type: 'objectLoadStarted',
                        loaderId: this.loaders[i].id,
                        descriptor: this.descriptors[j]
                    });

                    break;
                }
            }
        }
    }

    // If all files are loaded, fire the 'finished' event.
    if (this.descriptors.length == this.getNumberMeshesLoaded())
    {
        this.active = false;
        this.dispatchEvent( { type: 'loadFinished'} );
    }
};


/**************************************************************************
    Class - Scene ObjectLoader

    Reusable OBJ loader class. Used by SceneContent Loader

    Events generated:
    - sceneObjectProgress
      * id - id of loader
      * loaded - number of bytes loaded as of this progress report
      * total - number of bytes to be loaded
    - sceneObjectLoaded
      * id - id of loader
      * descriptor - descriptor of scene object being loaded
      * mesh - fully loaded mesh of scene object being loaded
*/
var SceneObjectLoader = function(id)
{
    THREE.OBJLoader.call(this);

    this.active = false;
    this.descriptor = null;
    this.id = id;

    this.addEventListener( 'load', function(e)
    {
        console.log("Loader " + id + " - finished " + this.descriptor.name);

        this.descriptor.loadStatus = CGA_SceneContentLoader.MESH_LOADED;
        this.active = false;

        // Notify CGA_SceneContentLoader that the scene object is done loading
        this.dispatchEvent({
            type: 'sceneObjectLoaded',
            id: this.id,
            descriptor: this.descriptor,
            mesh: e.content,
        });
    });

    this.addEventListener( 'error', function(e)
    {
        console.log("Error occurred: " + e.message);
    });

    this.addEventListener( 'progress', function(e)
    {
        if (this.meshIndex >= 0)
        {
            this.dispatchEvent( {
                type: 'sceneObjectProgress',
                id: this.id,
                loaded: e.loaded,
                total: e.total
            } );
        }
    });
};
SceneObjectLoader.prototype = Object.create(THREE.OBJLoader.prototype);


SceneObjectLoader.prototype.loadSceneObject = function (descriptor)
{
    this.descriptor = descriptor;
    this.descriptor.loadStatus = CGA_SceneContentLoader.MESH_LOADING;
    this.active = true;
    this.load(this.descriptor.file);
};
