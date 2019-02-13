// Authored by Joe Marks, 2019
/*eslint-env browser*/

/* Map of GeoJSON data from MegaCities.geojson */

//function to instantiate the Leaflet map
function createMap(){
    //create the map
    var map = L.map('map', {
        center: [20, 0],
        zoom: 2
    });

    //add OSM base tilelayer
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);

    //call getData function
    getData(map);
};

//function to retrieve the data and place it on the map
function getData(map){
    
    // Tutorial start!
       
    
    // Create two line json features
    var myLines = [{
        "type": "LineString",
        "coordinates": [[-100, 40], [-105, 45], [-110, 55]]
    }, {
        "type": "LineString",
        "coordinates": [[-105, 40], [-110, 45], [-115, 55]]
    }];
    
    // Create style
    var myStyle = {
        "color": "#ff7800",
        "weight": 5,
        "opacity": 0.65
    };
    
    // Add lines to map using style
    L.geoJSON(myLines, {
        style: myStyle
    }).addTo(map);
    
    // Create state features to add to map
    var states = [{
        "type": "Feature",
        "properties": {"party": "Republican"},
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [-104.05, 48.99],
                [-97.22,  48.98],
                [-96.58,  45.94],
                [-104.03, 45.94],
                [-104.05, 48.99]
            ]]
        }
    }, {
        "type": "Feature",
        "properties": {"party": "Democrat"},
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [-109.05, 41.00],
                [-102.06, 40.99],
                [-102.03, 36.99],
                [-109.04, 36.99],
                [-109.05, 41.00]
            ]]
        }
    }];

    // Fill state features with color based on party property of feature, and add to map
    L.geoJSON(states, {
        style: function(feature) {
            switch (feature.properties.party) {
                case 'Republican': return {color: "#ff0000"};
                case 'Democrat':   return {color: "#0000ff"};
            }
        }
    }).addTo(map);
    
    // Configure variable to display orange circle
    var geojsonMarkerOptions = {
        radius: 8,
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };
    
    // Define the onEachFeature function
    function onEachFeature(feature, layer) {
        // does this feature have a property named popupContent?
        // if it does, bind popup to display popupContent
        if (feature.properties && feature.properties.popupContent) {
            layer.bindPopup(feature.properties.popupContent);
        }
    }

    // Create some geoJson features to display
    var geojsonFeatures = [{
        "type": "Feature",
        "properties": {
            "name": "Coors Field",
            "amenity": "Baseball Stadium",
            "popupContent": "This is where the Rockies play!",
            "show_on_map": true
        },
        "geometry": {
            "type": "Point",
            "coordinates": [-104.99404, 39.75621]
        }
    }, {
        "type": "Feature",
        "properties":{
            "name": "Busch Field",
            "show_on_map": false
        },
        "geometry": {
            "type": "Point",
            "coordinates": [-104.98404, 39.74621]
        }
    }];
    
    
    // Add geoJson features to map
    L.geoJSON(geojsonFeatures, {
        // Only display features with property show_on_map equal to true
        filter: function(feature, layer) {
            return feature.properties.show_on_map;
        },
        // Display features as an orange circle as defined above
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, geojsonMarkerOptions);
        },
        // Run onEachFeature for each feature
        onEachFeature: onEachFeature
    }).addTo(map);


    

};

$(document).ready(createMap);