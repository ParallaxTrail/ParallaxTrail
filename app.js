// Enable strict mode
"use strict";

async function getLocations() {
    return new Promise((resolve, reject) => {
        try {
            let request = new XMLHttpRequest();
            request.onload = () => {
                resolve(JSON.parse(request.responseText));
            };
            request.open('get', '/data.json', true);
            request.send();   
        } catch (error) {
            reject(error);
        }
    });
}

async function addressToLatLng(address) {
    return new Promise((resolve, reject) => new google.maps.Geocoder()
        .geocode({ address }, (result, status) => {
            if (status === google.maps.GeocoderStatus.OK) {
                resolve(result[0].geometry.location);
            } else {
                reject('Geocode wasn\'t successful');
            }
        })
    );
}

/**
 * Génère toute les latLng depuis les adresses des lieux
 */
async function generateLatLng() {
    let locations = await getLocations();

    let i = 0;

    let interval = setInterval(async () => {

        try {
            let latLng = await addressToLatLng(locations[i].place);
            locations[i].latLng = { lat: latLng.lat(), lng: latLng.lng() };
 /*           locations.map(async (location) => new google.maps.Marker({
                map: gmaps,
                position: locations[i].latLng,
                title: location.place
            }));*/
        } catch (error) {
            console.log(error);
            
            console.log(locations[i].place);
            // console.log('ERROR: ' + locations[i].place);
        }
        i++;
        if (i === locations.length) {
            clearInterval(interval);
            console.log(locations);
            console.log(JSON.stringify(locations, null, 4));
        }
    }, 1000);
};

(async function main() {

    let greenLine = document.getElementById('greenLine');

    let gmaps = new google.maps.Map(
        document.getElementById('map'),
        {
            center: new google.maps.LatLng(47.218371, -1.553621),
            zoom: 14,
            disableDefaultUI: true
        }
    );

    let locations = await getLocations();

    console.log(locations);

    /*
    locations.forEach(async (location) => {
        try {
            await addressToLatLng(location.place);
        } catch (error) {
            console.log(location.place);
        }
    });*/

    let markers = locations
        .filter((location) => location.latLng) // Only places which got latLng attribute
        .map(async (location) => new google.maps.Marker({
            map: gmaps, // Attach to the background map
            position: location.latLng,
            title: location.place,
            // label: location.place
        }));

    let ligne = new google.maps.Polyline({
        path: locations
            .filter((location) => location.latLng)
            .map((location) => location.latLng),
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2,
        map: gmaps
    });

    // Hauteur de la ligne verte en fonction du nombre de markers
    greenLine.style.height = 100 * markers.length - 50 + "%";

    // Placement des points importants sur la ligne verte
    let points = markers
        .map((marker, i) => {
            let point = document.createElement('div');
            point.classList.add('point');
            point.style.top = 50 + 100*i + "%";
            greenLine.appendChild(point);
            return point;
        });

    document.getElementById('topOverlay').addEventListener('scroll', (element, event) => {
        console.log('scroll');
    });

})();
