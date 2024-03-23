/*--------------------------------------------------------------------
GGR472 LAB 4: Incorporating GIS Analysis into web maps using Turf.js 
--------------------------------------------------------------------*/

/*--------------------------------------------------------------------
INITIALIZE MAP
--------------------------------------------------------------------*/
// Define access token
mapboxgl.accessToken = 'pk.eyJ1Ijoicmx3YW5nZ2ciLCJhIjoiY2xzbXJrdDh4MHFhbTJpbGZtN2U2dzR0ciJ9.U_Ub-r562iDi82ImPZACXQ'; //****ADD YOUR PUBLIC ACCESS TOKEN*****

// Initialize map and edit to your preference
const map = new mapboxgl.Map({
    container: 'map', // container id in HTML
    style: 'mapbox://styles/mapbox/streets-v12',  // ****ADD MAP STYLE HERE *****
    center: [-79.39, 43.65],  // starting point, longitude/latitude
    zoom: 12 // starting zoom level
});

// Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl());

/*--------------------------------------------------------------------
VIEW GEOJSON POINT DATA ON MAP
--------------------------------------------------------------------*/

let pedestrianjson;

// fetch the geojson file and store the response in the console
fetch('https://raw.githubusercontent.com/rwangg/GGR472-Lab-4/main/pedcyc_collision_06-21.geojson')
    .then(response => response.json())
    .then(response => {
        console.log(response);
        pedestrianjson = response;
    });

map.on('load', () => {

    //Add datasource using GeoJSON variable
    map.addSource('pedestrianjson', {
        type: 'geojson',
        data: pedestrianjson
    });

    // add a layer consisting of all collision points
    map.addLayer({ 
        'id': 'pedestrianjson-pnts',
        'type': 'circle',
        'source': 'pedestrianjson',
        'paint': {
            'circle-radius': 5,
            'circle-color': 'blue'
        }
    });
});


/*--------------------------------------------------------------------
CREATE BOUNDING BOX AND HEXGRID
--------------------------------------------------------------------*/

let envresult;
let bboxcoords;
let collectresult;

document.getElementById('bboxbutton').addEventListener('click', () => {

    let enveloped = turf.envelope(pedestrianjson);
    
    // collect envelope polygon features
    envresult = { 
    "type": "FeatureCollection",
    "features": [enveloped]
    };

    let cellslide = 0.5;

    let options = {units: 'kilometers'};

    bboxcoords = [envresult.features[0].geometry.coordinates[0][0][0],
                    envresult.features[0].geometry.coordinates[0][0][1],
                    envresult.features[0].geometry.coordinates[0][2][0],
                    envresult.features[0].geometry.coordinates[0][2][1]];

    let hexgrid = turf.hexGrid(bboxcoords, cellslide, options);

    let collishex = turf.collect(hexgrid, pedestrianjson, '_id', 'values');
    
    // collect the hexgrid values in a feature collection
    collectresult = { 
        "type": "FeatureCollection",
        "features": [collishex]
    };

    let maxcollis = 0 // stores max collision count

    collishex.features.forEach((feature) => {
        feature.properties.COUNT = feature.properties.values.length // keep track of collision count for each feature
        if (feature.properties.COUNT > maxcollis) { // if collision count > current max collision count:
            maxcollis = feature.properties.COUNT  // change max collision count to current feature collision count
        }
    });
    console.log(maxcollis);

    map.addSource('envelopeJSON', {
        "type": "geojson",
        "data": envresult
    });

    // visualize bounding box
    map.addLayer({
        "id": "pedestrianenvelope",
        "type": "fill",
        "source": "envelopeJSON",
        "paint": {
            'fill-color': "orange",
            'fill-opacity': 0.5,
            'fill-outline-color': "red"
        }
    });

    map.addSource("hex", {
        "type": "geojson",
        "data": hexgrid
    });

    // visualize hex grid
    map.addLayer({
        "id":"hexid",
        "type": "fill",
        "source": "hex",
        'layout': {},
        "paint": {
            'fill-color': [
                'interpolate', // The code for change in colours is partially generated from ChatGPT
                ['linear'],
                ['get', 'COUNT'],
                0, 'rgba(255,255,255,0)', // No color for count 0
                maxcollis / 2, 'rgba(255, 0, 175, 1)', // Pink color for areas with half the maximum count (not generated)
                maxcollis, 'rgba(255,0,0,1)' // Red color for areas with maximum count
            ],
            'fill-opacity': 0.8,
            'fill-outline-color': "black",
            'fill-outline-width': 2
        }
});

// set legend variable
const legend = document.getElementById('legend');

//For each layer create a block to put the colour and label in
legendlabels.forEach((label, i) => {
    const colour = legendcolours[i];

    const item = document.createElement('div'); //each layer gets a 'row' - this isn't in the legend yet, we do this later
    const key = document.createElement('span'); //add a 'key' to the row. A key will be the colour circle

    key.className = 'legend-key'; //the key will take on the shape and style properties defined in css
    key.style.backgroundColor = colour; // the background color is retreived from teh layers array

    const value = document.createElement('span'); //add a value variable to the 'row' in the legend
    value.innerHTML = `${label}`; //give the value variable text based on the label

    item.appendChild(key); //add the key (colour cirlce) to the legend row
    item.appendChild(value); //add the value to the legend row

    legend.appendChild(item); //add row to the legend

    // only allow one click
    document.getElementById('bboxbutton').disabled = true;

});

    })


document.getElementById('colbutton').addEventListener('click', () => {
    window.open('https://www.toronto.ca/services-payments/streets-parking-transportation/road-safety/vision-zero/vision-zero-dashboard/fatalities-vision-zero/');
})









