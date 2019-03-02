var fs = require('fs'),
    path = require('path'),
    Colors = require(path.join(__dirname, 'js/Colors.js'));
    Randoms = require(path.join(__dirname, 'js/Randoms.js'));
    ForestGenerator = require(path.join(__dirname, 'js/ForestGenerator.js'));
    const {execFile} = require('child_process');
	const gifsicle = require('gifsicle');

var _r = new Randoms();
var colorHelper = new Colors();
var numFrames = 100;
//var treeType = "coniferous"; 
var treeType = "deciduous"; 
var forestOptions = {
        RAINBOW: false,
        NUM_TREES: _r.randomInt(30,50),
        TREE_TYPE: treeType,
        GRASS_DENSITY: 0,
        //NIGHT_MODE: true,
        EFFECT: false
    };


    var minAngle = (treeType == "deciduous") ? _r.random(10,40) : _r.random(45,90);

    var topColor = colorHelper.brightenByAmt(colorHelper.randomHex(),-40);

    var treeOptions = {
        BRANCH_R_MAX: _r.random(2,2.6),
        BRANCH_L: _r.random(7,10),
        MAX_DEPTH: 8,
        BRANCH_P: _r.random(0.73,0.78),
        CHANCE_DECAY: _r.random(0.001, 0.015),
        LEAF_DENSITY: _r.randomInt(3,10),

        //BRANCH_R_MAX: (treeType == "deciduous") ? _r.random(1,3) : _r.random(1,3),
        //BRANCH_R_MIN: 0.1,
        //BRANCH_L: _r.random(4,10), 
        //BRANCH_P: (treeType=="deciduous") ? _r.random(0.72, 0.77) : _r.random(0.64, 0.72),
        //CHANCE_DECAY: _r.random(0.001, 0.03),
        //LENGTH_MULT: _r.random(0.7, 0.9),
        //ANGLE_MIN: minAngle, 
        //ANGLE_MAX: minAngle*_r.random(4,8), 
        //RAINBOW: true,
        //COLOR_TOP: topColor, 
        //COLOR_BTM: colorHelper.brightenByAmt(colorHelper.variationsOn(topColor,30),-60), 
        ////LEAF_COLS: ["#FFCC00","#EEEE44","#FF0055","#EE9922","#EE0505","#DD4400","#FF9977","#BEB344"], 
        ////LEAF_COLS: ["#2A141D","#1B0005","#2A2B05","#161102","#231313","#0F0F1B","#181D11","#4E430F"], 
        //LEAF_SIZE: _r.random(0.2,2),
        //LEAF_DENSITY: _r.randomInt(10,20),
        //LEAF_W: _r.random(1.25,3),
        //MAX_DEPTH:  (treeType == "deciduous") ? 10 : 8, 
        //// MAX_BRANCHES_TOTAL: 999, 
        //MAX_BRANCHES_PER_NODE:   (treeType == "deciduous") ? 3 : 2
    };

function _newForest(numFrames){    

    var gen = new ForestGenerator(forestOptions,treeOptions);

    // Make the GIF
    var filename = 'test'+Math.floor(Math.random()*999999);
    console.log("plz generate "+filename);
    var gen = new ForestGenerator(forestOptions,treeOptions);
	return(gen.generateSceneGIF(numFrames, filename));

}

function _optimize(filename) {
    _filename = filename;
    const sizeLimit = 1048576*5;
    var fileSizeInBytes = fs.statSync(filename).size;
    var nextStepDown = Math.floor(paletteSize*0.9);
    if(fileSizeInBytes > sizeLimit){
        execFile(gifsicle, ['-o', _filename+'.gif', _filename+'.gif'], err => {
		    console.log("optimized "+_filename+", "+fileSizeInBytes+" bytes.");
		});
    } else {
        console.log("wrote "+_filename+", "+fileSizeInBytes+" bytes.");
    }
    
    return filename;
}

/**
 * usage: node test 50 100
 * first param:  number of trees
 * second param: number of frames
 * 
 */
process.argv.forEach((val, index) => {
    console.log("val "+index+": "+val);
    if(index==2 && !isNaN(val)){
        forestOptions.NUM_TREES = eval(val);
        console.log("NUM_TREES: "+forestOptions.NUM_TREES);
    } else if (index==3 && !isNaN(val)){
        numFrames = eval(val);
        console.log("numFrames: "+numFrames);
    }
});

_newForest(numFrames);

