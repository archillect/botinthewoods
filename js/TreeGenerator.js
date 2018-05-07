function TreeGenerator(){
      /*
      
      
    n o d e    v e r s i o n
           of threejs tree generator

    I got the starter code for setting up the camera and trackball controls from some tutorial. 
    I've just started learning threejs!
    The stuff that actually creates the tree is all mine, and I've messed with the rest to make it do what I want.
    pretty ascii header in 'nvscript' c/o http://www.kammerl.de/ascii/AsciiSignature.php
    */

    /*
    module.exports['@require'] = [
      'util/colorHelper.js'
    ]
    */
    var _this = this;


    var fs = require('fs');
    var path = require('path');
    PNG = require('pngjs').PNG;
    var THREE = require('three');
    var omggif = require('omggif');
    //import { Colors } from 'Colors';
    var Colors = require('./Colors.js');
    var SoftwareRenderer = require('three-software-renderer');

    config = require(path.join(__dirname, '../config.js'));

    var colorHelper = new Colors();

    var _tree;

    //////////////////////////////////////////////////////////////////
    // Some parameters that can be tweakedcls from the browser (we hope)
    //////////////////////////////////////////////////////////////////

    var BRANCH_LENGTH = 5;
    var LENGTH_MULT = 0.85;
    var MAX_BRANCHES_PER_NODE = 9;
    var BASE_BRANCH_CHANCE = 0.75;
    var CHANCE_DECAY = 0.05;
    var BASE_TREE_COLOR = "silvergreen";
    var MAX_DEPTH = 10;
    var ANGLE_MIN = 30;
    var ANGLE_MAX = 120;


    MAX_BRANCHES_PER_NODE = parseInt(getParameterByName("maxbranches")) || MAX_BRANCHES_PER_NODE;
    BASE_BRANCH_CHANCE = parseFloat(getParameterByName("branchp")) || BASE_BRANCH_CHANCE;
    CHANCE_DECAY = parseFloat(getParameterByName("pdecay")) || CHANCE_DECAY;
    MAX_DEPTH = parseInt(getParameterByName("maxdepth")) || MAX_DEPTH;
    ANGLE_MIN = parseInt(getParameterByName("anglemin")) || ANGLE_MIN;
    ANGLE_MAX = parseInt(getParameterByName("anglemax")) || ANGLE_MAX;
    BASE_TREE_COLOR = getParameterByName("treecolor") || BASE_TREE_COLOR;
    BRANCH_LENGTH = parseInt(getParameterByName("branchl")) || BRANCH_LENGTH;
    LENGTH_MULT = parseFloat(getParameterByName("lengthmult")) || LENGTH_MULT;

    var colorIndex;
    if (BASE_TREE_COLOR == "silvergreen"){
      colorIndex = 0;
    } else if (BASE_TREE_COLOR == "silverblack"){
      colorIndex = 1;
    } else if (BASE_TREE_COLOR == "blacksilver"){
      colorIndex = 2;
    } else if (BASE_TREE_COLOR == "blackgreen"){
      colorIndex = 3;
    }

    if (typeof document != 'undefined') {
      document.getElementById("maxbranchinput").value = MAX_BRANCHES_PER_NODE;
      document.getElementById("branchpinput").value = BASE_BRANCH_CHANCE;
      document.getElementById("pdecayinput").value = CHANCE_DECAY;
      document.getElementById("maxdepthinput").value = MAX_DEPTH;
      document.getElementById("anglemininput").value = ANGLE_MIN;
      document.getElementById("anglemaxinput").value = ANGLE_MAX;
      document.getElementById("branchlinput").value = BRANCH_LENGTH;
      document.getElementById("lengthmultinput").value = LENGTH_MULT;
      document.getElementById("treecolorinput").selectedIndex = colorIndex;

    }


    console.log("selected color is "+BASE_TREE_COLOR);

    var treeDepth = 0;



    /////////////////////////////////////////
    // Scene Setup
    /////////////////////////////////////////

    var scene,
        camera,
        renderer,
        controls;

    scene = new THREE.Scene();

    var _data = randomTreeData();
    while(_data.length == 0){
      _data = randomTreeData();
    }

    var sceneWidth, sceneHeight, pixelRatio;

    if(typeof window == 'undefined'){
      sceneWidth = 800;
      sceneHeight = 600;
      pixelRatio = 1;
    } else {
      sceneWidth = window.innerWidth;
      sceneHeight = window.innerHeight;
      pixelRatio = window.devicePixelRatio;
    }


    camera = new THREE.PerspectiveCamera( 40, sceneWidth / sceneHeight, 1, 1000 );
    camera.position.x = 0;
    camera.position.y = 0;
    camera.position.z = -50;

    var aLittleHigherPos = scene.position;
    aLittleHigherPos.y -= 0;
    camera.lookAt( aLittleHigherPos );

    if(typeof windwow == 'undefined'){
       renderer = new SoftwareRenderer({
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true
      });
    } else {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true
      });
    }



    renderer.setPixelRatio( pixelRatio );
    renderer.setSize( sceneWidth, sceneHeight );

    if(typeof document != 'undefined'){
        document.getElementById("theTree").appendChild( renderer.domElement );  
    }



    /////////////////////////////////////////
    // Trackball Controller
    /////////////////////////////////////////
    /*
    controls = new TrackballControls( camera, renderer.domElement  );
    controls.rotateSpeed = 2.0;
    controls.zoomSpeed = 0.2;
    controls.noZoom = false;
    controls.noPan = true;
    controls.dynamicDampingFactor = 0.5;
    */

    /////////////////////////////////////////
    // Lighting
    /////////////////////////////////////////

    var ambientLight  = new THREE.AmbientLight( '#8888FF' );

    scene.add( ambientLight );


    /////////////////////////////////////////
    // Utilities
    /////////////////////////////////////////

    var branches = [];
    var tipPositions = [];

    //var b = buildBranch(5);
    //scene.add(b);
    //

    /**
     * Thank you to https://stackoverflow.com/users/1045296/jolly-exe for this function
     */
    function getParameterByName(name, url) {

        if(typeof window == 'undefined') {
          return undefined;
        }


        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

     function makePaletteFromScene(pal){

      var firstsnap = renderer.render(scene, camera);
      var eightbitbuffer = convertRGBAto8bit(firstsnap.data,pal);

     console.log("generated palette, length "+pal.length);
      for(var p=0; p<pal.length; p++) {
        //console.log(pal[p]);
      }

      while(!isPowerOfTwo(pal.length)){
        pal.push(0x000000);
      }
    }

    /**
     * h/t https://stackoverflow.com/users/3674420/joseph-palermo
     * @param  {int} n  -   The number that MAY or MAY NOT be a power of two
     * @return {bool}   -   Is it though.
     */
    function isPowerOfTwo(n){
        // Compute log base 2 of n using a quotient of natural logs
        var log_n = Math.log(n)/Math.log(2);
        // Round off any decimal component
        var log_n_floor = Math.floor(log_n);
        // The function returns true if and only if log_n is a whole number
        return log_n - log_n_floor == 0; 
    }

    var _palette = [];

    //var _palette = colorHelper.palette8bit;


    function makeGIF(){

     
      makePaletteFromScene(_palette);

      var NUM_FRAMES = 100;

      var gifBuffer = new Buffer(sceneWidth * sceneHeight * NUM_FRAMES); // holds the entire GIF output
      var gif = new omggif.GifWriter(gifBuffer, sceneWidth, sceneHeight, {palette: _palette, loop: 0});
      var y_axis = new THREE.Vector3(0,1,0);

      for(var i=0; i<NUM_FRAMES; i++){
        //controls.exposedRotate(300+i,0);
        
        _tree.rotateOnAxis(y_axis,Math.PI/(NUM_FRAMES/2));


        var pixels = renderer.render(scene, camera);

        //console.log("pixels: "+pixels.data);
        gif.addFrame(0, 0, pixels.width, pixels.height, convertRGBAto8bit(pixels.data, _palette));

      }
      var id = randomId();

      // making a png just to check the colours
      var png = new PNG({
        width: sceneWidth,
        height: sceneHeight,
        filterType: -1
      });

        for(var i=0;i<pixels.data.length;i++) {
        png.data[i] = pixels.data[i];
      }
      png.pack().pipe(fs.createWriteStream('./test'+id+'.png'));

      fs.writeFileSync('./test'+id+'.gif', gifBuffer.slice(0, gif.end()));

    }

    function randomId(){
      return Math.floor(Math.random()*99999);
    }


    function convertRGBAto8bit(rgbaBuffer, palette) {

      var BG_COL = 0xFFFFFF;

      var outputBuffer = new Uint8Array(rgbaBuffer.length / 4);   
      //for(var i=0; i<rgbaBuffer.length; i+=4) {
      for(var i=0; i<rgbaBuffer.length; i+=4) {
          var colour = (rgbaBuffer[i] << 16) + (rgbaBuffer[i+1] << 8) + rgbaBuffer[i+2];
          if(rgbaBuffer[i+3] == 0){
            colour = BG_COL;
          }
          
          var foundCol = false;
          for(var p=0; p<palette.length; p++) {     
              if(colour == palette[p]) {
                //console.log("EXISTING colour "+palette[p]);
                foundCol = true;
                outputBuffer[i/4] = p;  
                break;
              } 
          }   

          if(!foundCol && (palette.length < 256)){
                palette.push(colour);
                //console.log("NEW colour "+palette[p]);
                outputBuffer[i/4] = palette.length-1;  

          } else if (!foundCol){

            //console.log("not existing, palette.length "+palette.length);
            var lowestDiff = 999999999999999999;
            var closestCol = 0xFFFFFF;
            var closestIndex = -1;  

            for(var pp=0; pp<palette.length; pp++) {    
              var paletteInt = palette[pp];
              var colourInt = colour;
              var colourDiff = Math.abs( colourInt - paletteInt );
              if(colourDiff < lowestDiff){
                lowestDiff = colourDiff;
                closestCol = palette[pp];
                closestIndex = pp;  
                //console.log("CLOSEST colour "+palette[p]);
              }
            }
             outputBuffer[i/4] = closestIndex;  
          }
          
         
        }

        return outputBuffer;
    }


    function randomTreeData(startingStructure, startingDepth){

      var structure = startingStructure || [];
      var depth = startingDepth || 0;

      if(depth < MAX_DEPTH){
        var branchChance = (BASE_BRANCH_CHANCE - Math.min(BASE_BRANCH_CHANCE,CHANCE_DECAY*depth));
        //var branchChance = BASE_BRANCH_CHANCE;
      
        while(structure.length < MAX_BRANCHES_PER_NODE && Math.random() < branchChance){
          //console.log("at depth "+depth+", chance "+branchChance+", branches so far: "+structure.length);
          var newBranch = randomTreeData([],depth+1); 
          structure.push(newBranch);
        } 
      }

      return structure;
    }


    function depthOfArray(arr) {
      var i;
      var level = 1;
      var subdepths = [];
      for (i=0; i<arr.length; i++){
        subdepths.push(depthOfArray(arr[i]));
      }

      var deepest = 0;
      for (i=0; i<subdepths.length; i++){
        if (subdepths[i] > deepest){
          deepest = subdepths[i];
        }
      }
      level += deepest;

      return level;
    }


    function checkDistance(){

      var tipPositions = [];
      for (var i=0; i<branches.length; i++){

        //branches[i].matrixAutoUpdate && branches[i].updateMatrix();
        //branches[i].tip.matrixAutoUpdate && branches[i].tip.updateMatrix();
        
        var unitVector = new THREE.Vector3();

        console.log(branches[i].tip);
        console.log(branches[i].tip.matrixWorld);
        var tipPos = unitVector.setFromMatrixPosition( branches[i].tip.matrixWorld );
        console.log(tipPos);

        tipPositions.push(tipPos);
      }

    }

    function buildComplexShape(){

    }

    function de2ra(degree){
      return degree*(Math.PI/180);
    }

    function buildBranch(baseLength, distanceFromTip){
        var length = baseLength*(1 + Math.random()*0.4);

        var referenceLength = Math.min(length, BRANCH_LENGTH);

        var radiusTop =  (distanceFromTip == treeDepth)? 0.45 :(distanceFromTip <= 1) ? 0.07 : (referenceLength/20);
        var radiusBottom = (distanceFromTip == treeDepth)? 0.75 : (distanceFromTip == treeDepth-1 && (distanceFromTip > 1)) ? 0.45 : (referenceLength/17);
        
        var cylGeom = new THREE.CylinderGeometry( radiusTop, radiusBottom, length, 8 );
        var sphGeom = new THREE.SphereGeometry(radiusTop, 2, 2);
        var hex;

        var i, cylinderColorFunc, nodeColorFunc;

        //console.log("building branch of color "+BASE_TREE_COLOR);

        if(BASE_TREE_COLOR == "silvergreen" || BASE_TREE_COLOR == "silverblack"){
          cylinderColorFunc = colorHelper.randomGrey;
        } else if (BASE_TREE_COLOR == "blackgreen" || BASE_TREE_COLOR == "blacksilver"){
          cylinderColorFunc = colorHelper.randomDark;
        }
        if(BASE_TREE_COLOR == "silvergreen" || BASE_TREE_COLOR == "blackgreen"){
          nodeColorFunc = colorHelper.randomGreen;
        } else if (BASE_TREE_COLOR == "blacksilver"){
          nodeColorFunc = colorHelper.randomGrey;
        } else if (BASE_TREE_COLOR == "silverblack"){
          nodeColorFunc = colorHelper.randomBlack;
        }

        for ( i = 0; i < cylGeom.faces.length; i += 2 ) {    
          hex = colorHelper.parseHex(cylinderColorFunc.apply());
          cylGeom.faces[ i ].color.setHex( hex );
          cylGeom.faces[ i + 1 ].color.setHex( hex );
        }

        for ( i = 0; i < sphGeom.faces.length; i += 2 ) {   
          hex = colorHelper.parseHex(nodeColorFunc.apply());
          sphGeom.faces[ i ].color.setHex( hex );
          sphGeom.faces[ i + 1 ].color.setHex( hex );
        }

        var material = new THREE.MeshBasicMaterial( { vertexColors: THREE.FaceColors, overdraw: 0.5 } );
        //var material = new THREE.MeshBasicMaterial( {color: 0x0000ff} );

        var cylinder = new THREE.Mesh( cylGeom, material );
        cylinder.position.y = length/2;
      

        
        var sphere = new THREE.Mesh(sphGeom, material);


        var tip = new THREE.Object3D();
        tip.position.y = length;
        tip.add(sphere);

        var branch = new THREE.Object3D();
        branch.add( cylinder );
        branch.add(tip);
        branch.tip = tip;
        branch.length = length;

        return( branch );
    }

    function spreadBranches(){
      /*
      for(var i=0; i<branches.length; i++){
        for(var j=i+1; j<branches.length; j++){
          if(branches[j].)
      }
    */
    }

    function buildTree(treeData,branchLength,depth){

      //console.log("building tree with "+treeData.length+" branches.");
      var fanRads = de2ra(ANGLE_MIN + Math.random()*(ANGLE_MAX - ANGLE_MIN));

      var root = buildBranch(branchLength, depth);

      for(var i=0; i<treeData.length; i++){
        var newBranch = buildTree(treeData[i], branchLength*LENGTH_MULT, depthOfArray(treeData[i]));
        newBranch.rotation.x = root.rotation.x + (Math.random()*fanRads) - fanRads/2;
        newBranch.rotation.z = root.rotation.z + (Math.random()*fanRads) - fanRads/2;
        newBranch.position.y = -0.05;

        root.tip.add(newBranch);
      }

      return root;
      
    }

    function buildScene(){
      scene.remove(_tree);
      _data = [];

      while(_data.length == 0) {
        _data = randomTreeData();
      }

      treeDepth = depthOfArray(_data);


      _tree = buildTree(_data,BRANCH_LENGTH,treeDepth); 
      _tree.position.y -= 15;
      scene.add(_tree);

      makeGIF();
    }

    console.log("this? "+this);
    console.log("_this? "+_this);

    _this.makeNewTree = function(){
        buildScene();
        renderScene();
    };
    
    _this.makeGIF = makeGIF;


    /////////////////////////////////////////
    // Render Loop
    /////////////////////////////////////////

    function renderScene() {
      renderer.render( scene, camera );
    }


    /////////////////////////////////////////
    // Window Resizing
    /////////////////////////////////////////
    if(typeof window != 'undefined'){

      window.addEventListener( 'resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
          //controls.handleResize();
          renderScene();
      }, false );

    }



    /*
    /////////////////////////////////////////
    // Object Loader
    /////////////////////////////////////////

    var dae,
        loader = new THREE.ColladaLoader();

    function loadCollada( collada ) {
      dae = collada.scene;
      dae.position.set(0.4, 0, 0.8);
      //scene.add(dae);
      renderPhone();
    }

    loader.options.convertUpAxis = true;
    loader.load( 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/392/iphone6.dae', loadCollada);

    */


}

module.exports = TreeGenerator;