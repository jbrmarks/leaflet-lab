// Authored by Joe Marks, 2019
/*eslint-env browser*/

/* Map of GeoJSON data from City_temps.geojson */

// Array to store layers for each point (city)
var pointLayers = [];

// Function to instantiate the Leaflet map
function createMap(){
    // Create the base map
    var map = L.map('map', {
        center: [39.8283, -98.5795],
        zoom: 4
    });

    // Add OSM base tilelayer
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> | Data: <a href="https://www.ncdc.noaa.gov/cag/city/time-series">NOAA</a>'
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

            // Add formatted attribute to popup content string
            var year = attribute.split("_")[1];
            popupContent += "<p><b>Temperature in " + year + ":</b> " + properties[attribute] + " degrees</p>";

            // Replace the layer popup offset
            layer.bindPopup(popupContent, {
                offset: new L.Point(0,-radius)
            });
}

// A function to translate the point data to layers for the map
function pointToLayer(feature, latlng, attributes){
    
    // Determine which attribute to visualize with proportional symbols
    var attribute = attributes[0];
    
    // Create marker options
    var options = {
        fillColor: "#dd6611",
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
    });
    
    // Save point layers (cities) for future reference
    pointLayers[feature.properties["City"]+","+feature.properties["State"]] = layer
    
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
                // Add pointLayers within the range to the map
                map.addLayer(pointLayers[layerName]);
                // Update the popup content for visible layers (cities)
                createPopup(pointLayers[layerName].feature.properties, attribute, pointLayers[layerName]);
            }else{
                // Remove pointLayers outside the range the map
                map.removeLayer(pointLayers[layerName]);
            }
        }
    }
    
    // Update the legend to match our filtered results
    updateLegend(map, attribute);
    
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

    // If no min or max is found, assume there are no cities visible on the map
    // Return 0 for all
    if (min == Infinity || max == -Infinity){
        return{
            max: 0,
            mean: 0,
            min: 0
        }
    }
    
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
    var content = "<b>Temperature in " + year+"</b>";
    
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
        });
        
        // Add legend text
        $('#'+key+'-text').text(Math.round(circleValues[key]*100)/100 + " degrees");
    }
}

// Function to create the dynamic legend
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
            var circles = {
                max: 15,
                mean: 35,
                min: 55
            };
            
            // Loop to add each circle and text to svg string
            for (var circle in circles){
                //circle string
                svg += '<circle class="legend-circle" id="' + circle + 
                '" fill="#dd6611" fill-opacity="0.8" stroke="#000000" cx="40"/>';
            
                // Text string
                svg += '<text id="' + circle + '-text" x="75" y="' + circles[circle] + '"></text>';;
            
            };
            
            // Close the svg string
            svg += "</svg>";
            
            //add attribute legend svg to container
            $(container).append(svg);

            return container;
        }
        

    });

    // Add the legend to our map
    map.addControl(new LegendControl());
    // Update the legend with the current attribute values
    updateLegend(map, attributes[0]);
};

// Function to create the interactive controls on the map
// including year sequencing and filtering
function createControls(map, attributes){
    
    // Create control extension for the bottom left of the map
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },
        
        onAdd: function (map) {
            // Create the control container div with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container');
            
            // Create display for selected year
            $(container).append('<span id = yearTitle></span>');
            
            $(container).append('<br>');
            
            // Create span for sequence controls
            $(container).append('<span id = sequenceControls></span>');
            
            $(container).append('<br>');
            
            // Create display for filter title
            $(container).append('<span id = filterTitle></span>');
            
            $(container).append('<br>');
            
            // Create display for filter labels
            $(container).append('<span id = filterLabels></span>');
            
            $(container).append('<br>');
            
            // Create span for filter controls
            $(container).append('<span id = filterControls></span>');
            
            
            // Disable any map mouse event listeners for the container
            L.DomEvent.disableClickPropagation(container);
            
            return container;
        }
    });
    
    // Add control layout to map
     map.addControl(new SequenceControl());
    
    // Add controls to layout
    
    // Create a span to hold the year title content
    $('#yearTitle').html('<spand id = yearTitleContent></span>');
    $('#yearTitleContent').html("<b>Selected Year: </b>");
    
    // Append a span to display the selected year
    $('#yearTitleContent').append('<spand id = selectedYear></span>');
    $('#selectedYear').html("1970");
    
    // Create range input element (slider)
    $('#sequenceControls').html('<input class = "range-slider" type = "range">');

    // Add skip buttons
    $('#sequenceControls').append('<button class="skip" id="reverse" title="Reverse">Reverse</button>');
    $('#sequenceControls').append('<button class="skip" id="forward" title="Forward">Skip</button>');
    
    // Replace button content with icons
    $('#reverse').html('<img src="img/back.png">');
    $('#forward').html('<img src="img/next.png">');
    
    
    // Add content to filter title
    $('#filterTitle').html("<b>Temperature Filter</b>");
    
    // Add content to filter labels
    $('#filterLabels').html('<span id = lowerLimitLabel></span><span id = upperLimitLabel></span>');
    $('#lowerLimitLabel').html('<b>Lower Limit</b>');
    $('#upperLimitLabel').html('<b>Upper Limit</b>');

    // Create display for lower limit value
    $('#filterControls').html('<span id = lowerLimit-display></span>');
            
    // Create lower limit input element (slider) for filter
    $('#filterControls').append('<input class="lowerLimit-slider" type="range">');
            
    // Create upper limit input element (slider) for filter
    $('#filterControls').append('<input class="upperLimit-slider" type="range">');
            
    // Create display for upper limit value
    $('#filterControls').append('<span id = upperLimit-display></span>');
    
    
    // Set slider attributes for year sequence slider
    $('.range-slider').attr({
        max: 48,
        min: 0,
        value: 0,
        step: 1
    });
    
    // Add event listeners for year sequencing
    
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
    
    // Add an event listener for the year sequence slider
    $('.range-slider').on('input', function(){
        
        // Call the filter function with the new attribute
        updateFilterLayer(map, attributes[$('.range-slider').val()], $('.lowerLimit-slider').val(), $('.upperLimit-slider').val());
        
        // Update the proportional symbols with the new attribute value
        updatePropSymbols(map, attributes[$('.range-slider').val()]);
        
        // Update display for selected year
        $('#selectedYear').html(1970+Number($('.range-slider').val()));
    });
    
    
    // Set slider attributes for lower temperature limit
    $('.lowerLimit-slider').attr({
        max: 90,
        min: 30,
        value: 30,
        step: 1
    });
    
    // Add text to display current value
    $('#lowerLimit-display').html($('.lowerLimit-slider').val() + " degrees");
    
    // Add an event listener for the lower temperature limit slider
    $('.lowerLimit-slider').on('input', function(){
        // Update visible cities
        updateFilterLayer(map, attributes[$('.range-slider').val()], $('.lowerLimit-slider').val(), $('.upperLimit-slider').val());
        $('#lowerLimit-display').html($('.lowerLimit-slider').val() + " degrees");
    });
    
    
    // Set slider attributes for upper temperature limit
    $('.upperLimit-slider').attr({
        max: 90,
        min: 30,
        value: 90,
        step: 1
    });
    
    // Add text to display current value
    $('#upperLimit-display').html($('.upperLimit-slider').val() + " degrees");
    
    // Add an event listener for the upper temperature limit slider
    $('.upperLimit-slider').on('input', function(){
        // Update visible cities
        updateFilterLayer(map, attributes[$('.range-slider').val()], $('.lowerLimit-slider').val(), $('.upperLimit-slider').val());
        $('#upperLimit-display').html($('.upperLimit-slider').val() + " degrees");
    });
    
};

// A function to create and place a title on the map
function createMapTitle(map){
    
    // Create new control position to place title in top center of map
    var corners = map._controlCorners;
    container = map._controlContainer;
    var className = 'leaflet-top leaflet-center';
    corners['topcenter'] = L.DomUtil.create('div', className, container);
    
    // Create control extension for the top right of the map
    var TitleControl = L.Control.extend({
        options: {
            position: 'topcenter'
        },
        
        onAdd: function (map) {
            // Container will go in the top center
            var container = L.DomUtil.create('div', 'title-container');
            
            $(container).append('<div id = "title">');

            
            return container;
        }
    });
    
    // Add control layout to map
    map.addControl(new TitleControl());
    
    $('#title').html("<b>Temperatures Across the United States</b>");
}



// A function to build an attributes array from the data
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
    $.ajax("data/More_city_temps.geojson", {
        dataType: "json",
        success: function(response){
            
            // An array to hold attributes
            var attributes = processData(response);
            
            // Create proportional symbols and place on map
            createPropSymbols(response, map, attributes);
            // Create map title
            createMapTitle(map);
            // Create sequence controls
            createControls(map, attributes);
            // Create legend
            createLegend(map, attributes);
        }
    });
};

// Call create map once the document is loaded/ready
$(document).ready(createMap);