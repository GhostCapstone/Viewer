// Ghost's Anatomy
// Leap Motion Script
// Pinch, Rotation, and Point gestures


var Ghost_LeapController = function(gfxEngine, canvas)
{
    this.gfxEngine = gfxEngine;
    this.canvas = canvas;
    this.canvas2d = canvas.getContext('2d');
    
    // Making sure we have the proper aspect ratio for our canvas
    this.width  = canvas.clientWidth;
    this.height = canvas.clientHeight;
    
    this.frame = null;
    this.frame_previous = null;
    
    this.screenTaps = [];
};

Ghost_LeapController.SCREENTAP_LIFETIME = 1;
Ghost_LeapController.SCREENTAP_START_SIZE = 30;
Ghost_LeapController.X_AXIS = new THREE.Vector3(1,0,0);
Ghost_LeapController.Y_AXIS = new THREE.Vector3(0,1,0);
Ghost_LeapController.Z_AXIS = new THREE.Vector3(0,0,1);
Ghost_LeapController.SCALE_FACTOR_ROTATION = 0.02;


Ghost_LeapController.prototype.initialize = function ()
{
    // Define self reference
    var that = this;
    
    // Setting up the Leap Controller
    this.leapController = new Leap.Controller({
        enableGestures: true
    });
    
    // Define frame event. Fired every new frame by Leap architecture
    this.leapController.on('frame', function (data) 
    { 
        that.handleFrame(data); 
    });
    
    this.leapController.connect();
};

Ghost_LeapController.prototype.handleFrame = function (data)
{
    this.lastFrame = this.frame;
    this.frame = data;

    // Dtaw UI
    this.canvas2d.fillStyle = "#FF0000";
    this.canvas2d.fillRect(0,0,150,75);
    
    // Clears the window
    this.canvas2d.clearRect(0, 0, this.width, this.height);
    
    // Loops through each hand
    for (var i = 0; i < this.frame.hands.length; i++) 
    {
        // Setting up the hand
        var hand = this.frame.hands[i]; // The current hand
        var scaleFactor = hand.scaleFactor(this.lastFrame, this.frame);
        var translation = this.lastFrame.translation(this.frame);
    
        // Loops through each finger
        for (var j = 0; j < hand.fingers.length; j++) {
            var finger = hand.fingers[j]; // Current finger
            var fingerPos = this.applyLeapToScreenTransform(finger.tipPosition); // Finger position

            // Drawing the finger
            this.canvas2d.strokeStyle = "#FF5A40";
            this.canvas2d.lineWidth = 6;
            this.canvas2d.beginPath();
            this.canvas2d.arc(fingerPos[0], fingerPos[1], 6, 0, Math.PI * 2);
            this.canvas2d.closePath();
            this.canvas2d.stroke();
        }

        /* GESTURES */
    
        // ZOOM OUT - If there are two fingers and they're separating
        if (this.frame.fingers.length == 2 & scaleFactor < 1) 
        {
            // camera.position.z += (1 - scaleFactor) * 2.5;
            var update =
            {
                rotate: { x: 0, y: 0 },
                pan: { x: 0, y: 0 },
                zoom: - (1 - scaleFactor) * 2.5,
            };
            
            // Apply update to camera
            this.gfxEngine.applyCameraUpdate(update);
        }
        
        // ZOOM IN - If there are two fingers and they're closing in
        else if (this.frame.fingers.length == 2 & scaleFactor > 1) 
        {
            // camera.position.z -= (scaleFactor - 1) * 2.5;
            var update =
            {
                rotate: { x: 0, y: 0 },
                pan: { x: 0, y:0 },
                zoom: (scaleFactor - 1) * 2.5,
            };
            
            // Apply update to camera
            this.gfxEngine.applyCameraUpdate(update);
        }
    
        // ROTATION GESTURE - Movement With Five Fingers
        // If there are five fingers in the screen
        if (this.frame.fingers.length == 5) 
        {
            var tX = translation[1] * Ghost_LeapController.SCALE_FACTOR_ROTATION;
            var tY = translation[0] * Ghost_LeapController.SCALE_FACTOR_ROTATION;
            var tZ = translation[2] * Ghost_LeapController.SCALE_FACTOR_ROTATION;
            
            console.log("Rotation " + tX + ", " + tY + ", " + tZ);
            
            var update =
            {
                rotate: { x: tX, y: tY },
                pan: { x: 0, y:0 },
                zoom: 0,
            };
            
            // Apply update to camera
            this.gfxEngine.applyCameraUpdate(update);
        }
    
    }
    
    
    // BUILT-IN GESTURES - Switch case
    for (var k = 0; k < this.frame.gestures.length; k++) 
    {
        var gesture = this.frame.gestures[k];
        var type = gesture.type;
    
        switch (type) {
        case "screenTap":
            // this.onScreenTap(gesture);
            break;
        }
    }
    
    // this.updateScreenTaps();
    // this.drawScreenTaps();
}


// Create a rotation matrix for the DAE model (For Rotation Gesture)
// http://stackoverflow.com/questions/11060734/how-to-rotate-a-3d-object-on-axis-three-js
Ghost_LeapController.prototype.rotateAroundObjectAxis = function(object, axis, radians) 
{
    var rotObjectMatrix = new THREE.Matrix4();
    rotObjectMatrix.makeRotationAxis(axis.normalize(), radians);

    // old code for Three.JS pre r54:
    // object.matrix.multiplySelf(rotObjectMatrix);      // post-multiply
    // new code for Three.JS r55+:
    object.matrix.multiply(rotObjectMatrix);

    // old code for Three.js pre r49:
    // object.rotation.getRotationFromMatrix(object.matrix, object.scale);
    // new code for Three.js r50+:
    object.rotation.setFromRotationMatrix(object.matrix);
}


// Transfrom leap coordinates into screen coordinates
Ghost_LeapController.prototype.applyLeapToScreenTransform = function(leapPos) 
{
    var iBox = this.frame.interactionBox;

    // Left coordinate = Center X - Interaction Box Size / 2
    // Top coordinate = Center Y + Interaction Box Size / 2
    var left = iBox.center[0] - iBox.size[0] / 2;
    var top = iBox.center[1] + iBox.size[1] / 2;

    // X Poisition = Current
    var x = leapPos[0];
    var y = leapPos[1] - top;

    x /= iBox.size[0];
    y /= iBox.size[1];

    x *= this.width;        //  * (iBox.size[1]/iBox.size[0])
    y *= this.height;

    var returnCoordinates = this.polarCoordinateConversion(x, -y);

    return returnCoordinates;
}

Ghost_LeapController.prototype.polarCoordinateConversion = function(xin, yin) {
    var xinVal = parseInt(xin);
    var yinVal = parseInt(yin);
    var rinVal = Math.sqrt(xinVal*xinVal + yinVal*yinVal);
    var thetaIn = Math.atan2(yinVal, xinVal);
    // console.log(thetaIn);

    var thetaOffset = Math.PI / 4;
    var xoutVal = rinVal * Math.cos(thetaIn - thetaOffset);
    var youtVal = rinVal * Math.sin(thetaIn - thetaOffset);

    return [xoutVal, youtVal];
}


Ghost_LeapController.prototype.onScreenTap = function(gesture)
{
    var pos = leapToScene(gesture.position);

    var time = this.frame.timestamp;

    screenTaps.push([pos[0], pos[1], time]);
};


Ghost_LeapController.prototype.updateScreenTaps = function() 
{

    for (var i = 0; i < screenTaps.length; i++) {

        var screenTap = screenTaps[i];
        var age = this.frame.timestamp - screenTaps[i][2];
        age /= 1000000;

        if (age >= SCREENTAP_LIFETIME) {
            screenTaps.splice(i, 1);
        }
    }
};


Ghost_LeapController.prototype.drawScreenTaps = function() 
{
    for (var i = 0; i < screenTaps.length; i++) {

        var screenTap = screenTaps[i];

        var x = screenTap[0];
        var y = screenTap[1];

        var age = this.frame.timestamp - screenTap[2];
        age /= 1000000;

        var completion = age / SCREENTAP_LIFETIME;
        var timeLeft = 1 - completion;

        /*
        
        Drawing the static ring

        */
        this.canvas2d.strokeStyle = "#FFB300";
        this.canvas2d.lineWidth = 3;

        // Save the canvas context, so that we can restore it
        // and have it un affected
        this.canvas2d.save();

        // Translate the contex and rotate around the
        // center of the  square
        this.canvas2d.translate(x, y);

        //Starting x and y ( compared to the pivot point )
        var left = -SCREENTAP_START_SIZE / 2;
        var top = -SCREENTAP_START_SIZE / 2;
        var width = SCREENTAP_START_SIZE;
        var height = SCREENTAP_START_SIZE;

        // Draw the rectangle
        this.canvas2d.strokeRect(left, top, width, height);

        // Restore the context, so we don't draw everything rotated
        this.canvas2d.restore();


        // Drawing the non-static part

        var size = SCREENTAP_START_SIZE * timeLeft;
        var opacity = timeLeft;
        var rotation = timeLeft * Math.PI;

        this.canvas2d.fillStyle = "rgba( 255 , 179 , 0 , " + opacity + ")";

        this.canvas2d.save();

        this.canvas2d.translate(x, y);
        this.canvas2d.rotate(rotation);

        var left = -size / 2;
        var top = -size / 2;
        var width = size;
        var height = size;

        this.canvas2d.fillRect(left, top, width, height);

        this.canvas2d.restore();
    }
};
