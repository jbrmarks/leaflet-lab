// Authored by Joe Marks, 2019
/*eslint-env browser*/


function createMap(){
    // Create map variable
    var mymap = L.map('map').setView([51.505, -0.09], 13);

    // Add tile layer
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery &copy; <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox.streets',
        accessToken: 'pk.eyJ1IjoiamJybWFya3MiLCJhIjoiY2pzM2xza3l1MmgxdDN5b2RtNzYzMnl5MSJ9.1t72ymHuwksLyS7U758WXw'
    }).addTo(mymap);
    
    // Add a marker
    var marker = L.marker([51.5, -0.09]).addTo(mymap);
    
    // Add a circle
    var circle = L.circle([51.508, -0.11], {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.5,
        radius: 500
    }).addTo(mymap);
    
    // Add a polygon
    var polygon = L.polygon([
        [51.509, -0.08],
        [51.503, -0.06],
        [51.51, -0.047]
    ]).addTo(mymap);
    
    // Bind a popup to the marker and open the popup
    marker.bindPopup("<b>Hello world!</b><br>I am a popup.").openPopup();
    // Add a popup to the circle and polygon
    circle.bindPopup("I am a circle.");
    polygon.bindPopup("I am a polygon.");
    
    // Add a standalone popup
    var popup = L.popup()
        .setLatLng([51.5, -0.09])
        .setContent("I am a standalone popup.")
        .openOn(mymap);
    
    // Create a variable for a popup
    var popup = L.popup();

    // On a map click, have the popup display the latitude and longitude
    function onMapClick(e) {
        popup
            .setLatLng(e.latlng)
            .setContent("You clicked the map at " + e.latlng.toString())
            .openOn(mymap);
    }

    // Add listener for 'click' and call onMapClick
    mymap.on('click', onMapClick);
}
    
$(document).ready(createMap);