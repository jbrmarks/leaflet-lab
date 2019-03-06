// Authored by Joe Marks, 2019
/*eslint-env browser*/

/* Map of GeoJSON data from City_temps.geojson */

// Array to store layers for each point (city)
var pointLayers = [];

// Function to instantiate the Leaflet map
function createMap(){
    // Create the base map
    var map = L.map('map', {
        center: [32.24, -95.85],
        zoom: 5
    });

    // Add OSM base tilelayer
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);

    // Call the getData function to get and add data to the map
    getData(map);
};

// A function to calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //scale factor to adjust symbol size evenly
    var scaleFactor = 25;
    //area based on attribute value and scale factor
    var area = attValue * scaleFactor;
    //radius calculated based on area
    var radius = Math.sqrt(area/Math.PI);

    return radius;
};

// A function to create the popups for each city
function createPopup(properties, attribute, layer){
    
            // Update each feature's radius based on new attribute values
            var radius = calcPropRadius(properties[attribute]);
            layer.setRadius(radius);

            // Add city and state to popup content string
            var popupContent = "<p><b>City:</b> " + properties.City + "</p><p><b>State:</b> " + properties.State + "</p>";

            // Add formatted attribute to panel content string
            var year = attribute.split("_")[1];
            popupContent += "<p><b>Temperature in " + year + ":</b> " + properties[attribute] + " degrees</p>";

            // Replace the layer popup offset
            layer.bindPopup(popupContent, {
                offset: new L.Point(0,-radius)
            });
}

function pointToLayer(feature, latlng, attributes){
    
    // Determine which attribute to visualize with proportional symbols
    var attribute = attributes[0];
    
    // Create marker options
    var options = {
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };
            
    // For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);
    
    // Create circle marker layer
    var layer = L.circleMarker(latlng, options);
    
    // Create popups
    createPopup(feature.properties, attribute, layer);
    
    // Add event listeners to open the popup on hover
    layer.on({
        mouseover: function(){
            this.openPopup();
        },
        mouseout: function(){
            this.closePopup();
        },
        //click: function(){
        //    $("#panel").html(panelContent);
        //}
    });
    
    // Save point layers (cities) for future reference
    pointLayers[feature.properties["City"]] = layer
    
    return layer;
        

} // End of pointToLayer

// A function to create proportional symbols based on point attribute data
// then place symbols on the map
function createPropSymbols(data, map, attributes){

    // Create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};

// A function to update proportional symbols
function updatePropSymbols(map, attribute){
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            // Access feature properties
            var props = layer.feature.properties;
            
            // Create popups
            createPopup(layer.feature.properties, attribute, layer);
            
            // Update legend
            updateLegend(map, attribute);
        };
    });
};

// A function to update the filter
function updateFilterLayer(map, attribute, lowerLimit, upperLimit){
    
    // Look at each point layer in pointLayers
    for (layerName in pointLayers){
        // Make sure layer has feature and properties for the attribute
        if (pointLayers[layerName].feature && pointLayers[layerName].feature.properties[attribute]){
            // If this pointLayer is above the lowerLimit
            if (pointLayers[layerName].feature.properties[attribute] >= lowerLimit && pointLayers[layerName].feature.properties[attribute] <= upperLimit){
                // Add pointLayers above the lowerLimit to the map
                map.addLayer(pointLayers[layerName]);
            }else{
                // Remove pointLayers below the lowerLimit to the map
                map.removeLayer(pointLayers[layerName]);
            }
        }
    }
}

// Calculate the max, mean, and min values for a given attribute
function getCircleValues(map, attribute){
    //start with min at highest possible and max at lowest possible number
    var min = Infinity,
        max = -Infinity;

    map.eachLayer(function(layer){
        //get the attribute value
        if (layer.feature){
            var attributeValue = Number(layer.feature.properties[attribute]);

            //test for min
            if (attributeValue < min){
                min = attributeValue;
            };

            //test for max
            if (attributeValue > max){
                max = attributeValue;
            };
        };
    });

    //set mean
    var mean = (max + min) / 2;

    //return values as an object
    return {
        max: max,
        mean: mean,
        min: min
    };
};

// Function to update the legend with new attribute
function updateLegend(map, attribute){
    
    // Create content for the legend
    var year = attribute.split("_")[1];
    var content = "Temperature in " + year;
    
    // Replace legend content
    $('#temporal-legend').html(content);
    
    // Get the max, mean, and min values as an object
    var circleValues = getCircleValues(map, attribute);
    
    for (var key in circleValues){
        // Get the radius
        var radius = calcPropRadius(circleValues[key]);
        
        // Assign the cy and r attributes
        $('#'+key).attr({
            cy: 59 - radius,
            r: radius
        })
    }
}

function createLegend(map, attributes){
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },

        onAdd: function (map) {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'legend-control-container');

            $(container).append('<div id = "temporal-legend">');
            
            // SVG variable
            var svg = '<svg id="attribute-legend" width="160px" height="60px">';
            
            // Array of circle names to base loop on
            var circles = ["max", "mean", "min"];
            
            // Loop to add each circle and text to svg string
            for (var i=0; i<circles.length; i++){
                //circle string
                svg += '<circle class="legend-circle" id="' + circles[i] + 
                '" fill="#F47821" fill-opacity="0.8" stroke="#000000" cx="80"/>';
            };
            
            // Close the svg string
            svg += "</svg>";
            
            //add attribute legend svg to container
            $(container).append(svg);

            return container;
        }
        

    });

    map.addControl(new LegendControl());
    
    updateLegend(map, attributes[0]);
};

function createControls(map, attributes){
    
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },
        
        onAdd: function (map) {
            // Create the control container div with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container');
            
            // Create range input element (slider)
            $(container).append('<input class = "range-slider" type = "range">');

            
            // Add skip buttons
            $(container).append('<button class="skip" id="reverse" title="Reverse">Reverse</button>');
            $(container).append('<button class="skip" id="forward" title="Forward">Skip</button>');
            
            // Create lower limit input element (slider) for filter
            $(container).append('<input class="lowerLimit-slider" type="range">');
            
            // Create display for lower limit value
            $(container).append('<span id = lowerLimit-display>');
            
            // Create upper limit input element (slider) for filter
            $(container).append('<input class="upperLimit-slider" type="range">');
            
            // Create display for upper limit value
            $(container).append('<span id = upperLimit-display>');
            
            
            // Disable any map mouse event listeners for the container
            L.DomEvent.disableClickPropagation(container);
            
            return container;
        }
    });
    
     map.addControl(new SequenceControl());
    
    // Replace button content with icons
    $('#reverse').html('<img src="img/back.png">');
    $('#forward').html('<img src="img/next.png">');
    
    
    // Set slider attributes
    $('.range-slider').attr({
        max: 48,
        min: 0,
        value: 0,
        step: 1
    });
    
     // Add event listeners for buttons
    $('.skip').click(function(){
        // Get the old index value from the slider
        var index = $('.range-slider').val();

        // Increment or decrement depending on button clicked
        if ($(this).attr('id') == 'forward'){
            index++;
            // If past the last attribute, wrap around to first attribute
            index = index > 48 ? 0 : index;
            
        } else if ($(this).attr('id') == 'reverse'){
            index--;
            // If past the first attribute, wrap around to last attribute
            index = index < 0 ? 48 : index;
        };

        // Update the slider with the new value
        $('.range-slider').val(index);
        
        // Call the filter function with the new attribute
        updateFilterLayer(map, attributes[index], $('.lowerLimit-slider').val(), $('.upperLimit-slider').val());
        
        // Update the proportional symbols with the new attribute value
        updatePropSymbols(map, attributes[index]);
        
    });
    
    // Add an event listener for the slider
    $('.range-slider').on('input', function(){
        
        // Call the filter function with the new attribute
        updateFilterLayer(map, attributes[$('.range-slider').val()], $('.lowerLimit-slider').val(), $('.upperLimit-slider').val());
        
        // Update the proportional symbols with the new attribute value
        updatePropSymbols(map, attributes[$('.range-slider').val()]);
        
    });
    
    
    // Set slider attributes
    $('.lowerLimit-slider').attr({
        max: 80,
        min: 50,
        value: 50,
        step: 1
    });
    
    // Add text to display current value
    $('#lowerLimit-display').html($('.lowerLimit-slider').val() + " degrees");
    
    // Add an event listener for the slider
    $('.lowerLimit-slider').on('input', function(){
        // Update visible cities
        updateFilterLayer(map, attributes[$('.range-slider').val()], $('.lowerLimit-slider').val(), $('.upperLimit-slider').val());
        $('#lowerLimit-display').html($('.lowerLimit-slider').val() + " degrees");
    });
    
    
    // Set slider attributes
    $('.upperLimit-slider').attr({
        max: 80,
        min: 50,
        value: 80,
        step: 1
    });
    
    // Add text to display current value
    $('#upperLimit-display').html($('.upperLimit-slider').val() + " degrees");
    
    // Add an event listener for the slider
    $('.upperLimit-slider').on('input', function(){
        // Update visible cities
        updateFilterLayer(map, attributes[$('.range-slider').val()], $('.lowerLimit-slider').val(), $('.upperLimit-slider').val());
        $('#upperLimit-display').html($('.upperLimit-slider').val() + " degrees");
    });
    
    /*//Create range input element (slider)
    $('#yearSlider').append('<input class="range-slider" type="range">');
    
    // Set slider attributes
    $('.range-slider').attr({
        max: 48,
        min: 0,
        value: 0,
        step: 1
    });
    
    // Add skip buttons
    $('#yearSlider').append('<button class="skip" id="reverse">Reverse</button>');
    $('#yearSlider').append('<button class="skip" id="forward">Skip</button>');
    
    // Replace button content with icons
    $('#reverse').html('<img src="img/back.png">');
    $('#forward').html('<img src="img/next.png">');
    
    // Add event listeners for buttons
    $('.skip').click(function(){
        // Get the old index value from the slider
        var index = $('.range-slider').val();

        // Increment or decrement depending on button clicked
        if ($(this).attr('id') == 'forward'){
            index++;
            // If past the last attribute, wrap around to first attribute
            index = index > 48 ? 0 : index;
            // Update year display
            $('#selectedYear').html(1970+index);
            
        } else if ($(this).attr('id') == 'reverse'){
            index--;
            // If past the first attribute, wrap around to last attribute
            index = index < 0 ? 48 : index;
            // Update year display
            $('#selectedYear').html(1970+index);
        };

        // Update the slider with the new value
        $('.range-slider').val(index);
        
        // Call the filter function with the new attribute
        updateFilterLayer(map, attributes[index], $('.lowerLimit-slider').val(), $('.upperLimit-slider').val());
        
        // Update the proportional symbols with the new attribute value
        updatePropSymbols(map, attributes[index]);
        
    });
    
    // Add an event listener for the slider
    $('.range-slider').on('input', function(){
        
        // Call the filter function with the new attribute
        updateFilterLayer(map, attributes[$('.range-slider').val()], $('.lowerLimit-slider').val(), $('.upperLimit-slider').val());
        
        // Update the proportional symbols with the new attribute value
        updatePropSymbols(map, attributes[$('.range-slider').val()]);
        
        // Update year display
        var index = $('.range-slider').val();
        index++;
        index--;
        $('#selectedYear').html(1970+index);
    });
    
    
    //Create range input element (slider)
    $('#lowerLimitSlider').append('<input class="lowerLimit-slider" type="range">');
    
    // Set slider attributes
    $('.lowerLimit-slider').attr({
        max: 80,
        min: 50,
        value: 50,
        step: 1
    });
    
    // Add text to display current value
    $('#lowerLimit').html($('.lowerLimit-slider').val() + " degrees");
    
    // Add an event listener for the slider
    $('.lowerLimit-slider').on('input', function(){
        // Update visible cities
        updateFilterLayer(map, attributes[$('.range-slider').val()], $('.lowerLimit-slider').val(), $('.upperLimit-slider').val());
        $('#lowerLimit').html($('.lowerLimit-slider').val() + " degrees");
    });
    
     //Create range input element (slider)
    $('#upperLimitSlider').append('<input class="upperLimit-slider" type="range">');
    
    // Set slider attributes
    $('.upperLimit-slider').attr({
        max: 80,
        min: 50,
        value: 80,
        step: 1
    });
    
    // Add text to display current value
    $('#upperLimit').html($('.upperLimit-slider').val() + " degrees");
    
    // Add an event listener for the slider
    $('.upperLimit-slider').on('input', function(){
        // Update visible cities
        updateFilterLayer(map, attributes[$('.range-slider').val()], $('.lowerLimit-slider').val(), $('.upperLimit-slider').val());
        $('#upperLimit').html($('.upperLimit-slider').val() + " degrees");
    });*/
    
};



// Function to build an attributes array from the data
function processData(data){
    
    // Empty array to hold attributes
    var attributes = [];
    
    // Properties of the first feature in the dataset
    var properties = data.features[0].properties;
    
    // Push each attribute name into the attributes array
    for (attribute in properties){
        // Only take attributes with temperatures values
        // Aka, if the attribute name contains the sequence "TEMP"
        // (does not return -1), add it to the array
        if(attribute.indexOf("TEMP") > -1){
            attributes.push(attribute);
        }
    }

    // Return the filled array
    return attributes
}

// A function to retrieve the data and place it on the map
function getData(map){
    
        //Example 2.3 line 22...load the data
    $.ajax("data/City_temps.geojson", {
        dataType: "json",
        success: function(response){
            
            // An array to hold attributes
            var attributes = processData(response);
            
            // Create proportional symbols and place on map
            createPropSymbols(response, map, attributes);
            // Create sequence controls
            createControls(map, attributes);
            // Create legend
            createLegend(map, attributes);

        
        }
    });
};

$(document).ready(createMap);