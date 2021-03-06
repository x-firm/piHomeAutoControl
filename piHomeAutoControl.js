var tdtool = require('tdtool-js').tdtool();

// Get configuration files for this piHomeAuto server
var units = require('piHomeAutoConfig').piHomeAutoConfig().controll.units;
var controll = require('piHomeAutoConfig').piHomeAutoConfig().controll;


function control () {
	if (arguments.callee._singletonInstance){
 		return arguments.callee._singletonInstance;
	}
 	arguments.callee._singletonInstance = this;

 	this.units = units;

 	this.groups = controll.groups;

 	this.setGroup = function(callback, data){
 		// Go true all device and change there value
	    eachUnitInGroup(function(){
	      callback(true);
	    }, data.units, data.value, units, data.units.length, 0);
 	}



	function eachUnitInGroup(callback, group, value, units, length, i){
	  var units = units;
	  var length = length;
	  var i = i;
	  var value = value;

	  if( i < length ) {
	    getArrayIndexFromElementId(function(id){
	      var unit = units[id];
	      var id = id;

	      // Check if an tellstick device
	      if (unit.type == 1) {
	        
	        // Set the device to the new value
	        tdtool.setTellstickUnitValue(function(){
	          
	          // Update the collection with the new value
	          units[id].currentValue = value;

	          // Change the next one
	          eachUnitInGroup(callback, group, value, units, length, i + 1 );
	        }, unit.unitId, value); 
	        
	      }else{
	        eachUnitInGroup(callback, group, value, units, length, i + 1 );
	      }
	    }, units, group[i]);
	  }else{
	    callback();
	  }

	}

	// Update and response with all tellstick devices 
	this.updatedList = function(callback){
	  updateAllUnitsValue(function(){
	    callback(units); 
	  }, -1, units);
	}

	// Set an control device to new value and 
	// response with the new state of the devices
	this.setUnit = function(callback, data){
	
	    if(data != "undefined"){
	      // Get the array index from id
	      getArrayIndexFromElementId(function(id){
	        var unit = units[id];
	        // Check if an tellstick device
	        if (unit.type == 1) {
	          // Check if value changed
	          if(!data.isDimmed)
	          {
	            // Set the device to the new value
	            tdtool.setTellstickUnitValue(function(){
	              
	              // Update collection with the new value
	              units[id].currentValue = data.newValue;
	              units[id].currentDimValue = 255;

	              // Response with the new state of the devices
	              callback(units);
	            }, unit.unitId, data.newValue); 
	          // Check if is an dimmer
	          }else{ 
	            // Check that the unit is possible to dim
	            if(unit.dimmer)
	            {
	              // Dim the device to the new value
	              tdtool.setTellstickUnitDimValue(function(){
	                
	                // Update collection with the new value
	                units[id].currentValue = true;
	                units[id].currentDimValue = data.newDimValue;

	                // Response with the new state of the devices
	                callback(units);
	              }, unit.unitId, data.newDimValue); 
	            }else{
	              console.log("No dimmer");
	              res.json(JSON.stringify(units));
	            }
	          }
	           
	        }else{
	          console.log("Unit type was not req.");
	          res.json(JSON.stringify(units));
	        }
	      }, units, data.id);
	    }
	  
	};

	// Get array if from unit id
	function getArrayIndexFromElementId(callback, array, id){
	  readArrayElement(function(id){
	    callback(id);
	  }, array, id, array.length, 0);
	}

	function readArrayElement(callback, array, id, length, i){
	  var callback = callback;
	  var array = array;
	  var id = id;
	  var length = length;

	  if( i < length ) {
	    if(id == array[i].id){
	      callback(i);
	    }else{
	      readArrayElement(callback, array, id, length, i + 1 );
	    }
	  }else{
	    callback(-1);
	  }
	}

	// Updates all values for unit in units
	function updateAllUnitsValue(callback, type, units){
	  var units = units;

	    // Read all values for all units of type tellstick
	  tdtool.readUnitsValue(function(tellstickValues){
	    readUnits(function(){
	      callback();
	    },[tellstickValues], units, units.length, 0);
	  });
	}

	// Loops true all unit in units and reads the curren value
	// for value and dimmeValue if its a dimmer
	function readUnits(callback, typesValues, units, length, i){
	  var callback = callback;
	  var units = units;
	  var length = length;
	  var typesValues = typesValues;

	  if( i < length ) {
	    readUnitValues(function(){
	      readUnits(callback, typesValues, units, length, i + 1 );
	    }, typesValues, units, i);
	  }else{
	    callback();
	  }
	}

	// Reads an unit 
	function readUnitValues(callback, typesValues, units, i){
	  var unit = units[i];
	  if(unit.type == 1){
	    var typeValue = typesValues[0];
	    // Check that typesValue is not null or undefine
	    if(typeValue !== null && typeValue !== 'undefined'){
	        unit.currentValue = typeValue[unit.unitId-1].currentValue;
	        unit.currentDimValue = typeValue[unit.unitId-1].currentDimValue;
	    }else{
	        unit.currentValue = false;
	        unit.currentDimValue = 255;
	    }
	    callback();
	  }else{
	    unit.currentValue = false;
	    unit.currentDimValue = 255;
	    callback();
	  }
	}

	// Update all unit values on startup
	updateAllUnitsValue(function(){
	  console.log("All control units values has bean updated...");
	}, -1, units); 

}

 
control();
exports.control = control;
