/**************************************************************************
    Class - Anatomy Object
**************************************************************************/

// Declare object
var CGA_GeometryObject = function(descriptor, geometry)
{
    // Validate - descriptor must have ID and material
    if (! descriptor.id)
        throw "Cannot create CGA_GeometryObject - Descriptor missing ID";
    if (! descriptor.material)
        throw "Cannot create CGA_GeometryObject - Descriptor missing material";

    // Store object data
    this.descriptor = descriptor;
    this.id = descriptor.id;

    // Compute vertex normals to enable smooth shading
    geometry.computeVertexNormals();

    // Create mesh and material for this CGA_GeometryObject
    this.initialMtl =
    {
        ambient: new THREE.Color(descriptor.material.ambient),
        diffuse: new THREE.Color(descriptor.material.diffuse),
        specular: new THREE.Color(descriptor.material.specular),
        emissive: new THREE.Color(descriptor.material.emissive),
        shininess: descriptor.material.shininess,
    };

    this.mtl = new THREE.MeshPhongMaterial(
    {
        ambient: this.initialMtl.ambient,
        color: this.initialMtl.diffuse,
        specular: this.initialMtl.specular,
        emissive: this.initialMtl.emissive,
        shininess: this.initialMtl.shininess,
    });

    // Create object 3D to wrap mesh
    this.object3D = new THREE.Mesh(geometry, this.mtl);
    this.object3D.cgaObj = this;
};




CGA_GeometryObject.prototype.getVisibility = function()
{
    if (this.object3D)
		return this.object3D.visible;

	return false;
};




CGA_GeometryObject.prototype.resetMaterial = function()
{
    this.mtl.ambient = this.initialMtl.ambient;
    this.mtl.color = this.initialMtl.diffuse;
    this.mtl.specular = this.initialMtl.specular;
    this.mtl.emissive = this.initialMtl.emissive;
    this.mtl.shininess = this.initialMtl.shininess;
};




CGA_GeometryObject.prototype.setMaterial = function(mtl)
{
    this.mtl.ambient = new THREE.Color(mtl.ambient);
    this.mtl.color = new THREE.Color(mtl.diffuse);
    this.mtl.emissive = new THREE.Color(mtl.emissive);
    this.mtl.specular = new THREE.Color(mtl.specular);
    this.mtl.shininess = mtl.shininess;
};




CGA_GeometryObject.prototype.setOpacity = function(opacity)
{
    if (opacity == 1)
        this.mtl.transparent = false;
    else
        this.mtl.transparent = true;

    this.mtl.opacity = opacity;
};




CGA_GeometryObject.prototype.setPosition = function(x, y, z)
{
	if (this.object3D)
	{
		this.object3D.position.set(x, y, z);
	}
};




CGA_GeometryObject.prototype.setScale = function(x, y, z)
{
	if (this.object3D)
	{
		this.object3D.scale.set(x, y, z);
	}
};




CGA_GeometryObject.prototype.setVisibility = function(visible)
{
	if (this.object3D)
		this.object3D.visible = visible;
};




CGA_GeometryObject.prototype.toggleVisibility = function ()
{
    if (this.object3D)
		this.object3D.visible = ! this.object3D.visible;
};

