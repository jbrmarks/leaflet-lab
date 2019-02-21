// Authored by Joe Marks, 2019
/*eslint-env browser*/

/* Map of GeoJSON data from MegaCities.geojson */

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
            
    // Give each feature's circle marker a radius based on its atribute value
    options.radius = calcPropRadius(attValue);
    
    // Create circle marker layer
    var layer = L.circleMarker(latlng, options);
    
    // Build panel content string
    //var panelContent = "<p><b>City:</b> " + feature.properties.City + "</p><p><b>State:</b> " + feature.properties.State + "</p><p><b>" + attribute + ":</b> " + feature.properties[attribute] + "</p>";
    
    
    // Build popup content string
    var popupContent = "<p><b>City:</b> " + feature.properties.City + "</p><p><b>State:</b> " + feature.properties.State + "</p>";
    
    // Add formatted attribute to panel content string
    var year = attribute.split("_")[1];
    popupContent += "<p><b>Temperature in " + year + ":</b> " + feature.properties[attribute] + " degrees</p>";
    
    // Bind the popup to the circle marker
    layer.bindPopup(popupContent, {
        offset: new L.Point(0,-options.radius) 
    });
    
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

            // Update each feature's radius based on new attribute values
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);

            // Add city and state to popup content string
            var popupContent = "<p><b>City:</b> " + props.City + "</p><p><b>State:</b> " + props.State + "</p>";

            // Add formatted attribute to panel content string
            var year = attribute.split("_")[1];
            popupContent += "<p><b>Temperature in " + year + ":</b> " + props[attribute] + " degrees</p>";

            // Replace the layer popup offset
            layer.bindPopup(popupContent, {
                offset: new L.Point(0,-radius)
            });
        };
    });
};

function createSequenceControls(map, attributes){
    //Create range input element (slider)
    $('#panel').append('<input class="range-slider" type="range">');
    
    // Set slider attributes
    $('.range-slider').attr({
        max: 48,
        min: 0,
        value: 0,
        step: 1
    });
    
    // Add skip buttons
    $('#panel').append('<button class="skip" id="reverse">Reverse</button>');
    $('#panel').append('<button class="skip" id="forward">Skip</button>');
    
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
        } else if ($(this).attr('id') == 'reverse'){
            index--;
            // If past the first attribute, wrap around to last attribute
            index = index < 0 ? 48 : index;
        };

        // Update the slider with the new value
        $('.range-slider').val(index);
        
        // Update the proportional symbols with the new attribute value
        updatePropSymbols(map, attributes[index]);
    });
    
    // Add an event listener for the slider
    $('.range-slider').on('input', function(){
        // Update the proportional symbols with the new attribute value
        updatePropSymbols(map, attributes[$('.range-slider').val()]);
    });
    
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
            createSequenceControls(map, attributes);
        
        }
    });
};

$(document).ready(createMap);