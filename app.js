// Enable strict mode
"use strict";

const initLoc = {
    lat: 47.210601,
    lng: -1.553621
};

const initZoom = 15.2;

const pointsMarginTop = 60;

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
            /*locations.map(async (location) => new google.maps.Marker({
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
            center: new google.maps.LatLng(initLoc.lat, initLoc.lng),
            zoom: initZoom,
            disableDefaultUI: true
        }
    );

    let locations = await getLocations();

    /* ============= DÉGUEULASSE À REFAIRE ============== */
    for (let i = 0; i < locations.length; i ++)
        if (! locations[i].latLng) {
            locations.splice(i, 1);
            i --;
        }        
    /* ================================================== */


    let pictures = [];
    let markers = [];

    for (let i = 0; i < locations.length; i ++) {
        let marker = await (
            new google.maps.Marker({
                map: gmaps, // Attach to the background map
                position: locations[i].latLng,
                title: locations[i].place,
                // label: location.place
            })
        );

        // marker.addListener('click', () => { /* ... */ });

        markers.push(marker);

        let img = new Image();
        img.setAttribute('src', locations[i].image);
        img.setAttribute('width', 320);
        img.setAttribute('height', 240);
        pictures.push(img);
    }

    /*let markers = locations
        .filter((location) => location.latLng) // Only places which got latLng attribute
        .map((location) => await (new google.maps.Marker({
            map: gmaps, // Attach to the background map
            position: location.latLng,
            title: location.place,
            // label: location.place
        })));*/

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
    greenLine.style.height = (80 * markers.length) + '%';

    // Placement des points importants sur la ligne verte
    let points = markers
        .map((marker, i) => {
            let point = document.createElement('div');
            point.classList.add('point');
            point.style.top = (pointsMarginTop + 80 * i) + "%";
            greenLine.appendChild(point);

            return point;
        });

    let distances = points.map(point => $(point).offset().top);

    let last = -1;

    function updateLocation () {
        const scrollTop = $('#topOverlay').scrollTop();
        let last_bak = last;
        last = -1;

        for (let i = 0; i < points.length; i++) {
            if (scrollTop >= distances[i] - 300) {
                points[i].classList.add('active');
                last = i;
            } else
                points[i].classList.remove('active');
        }

        if (last_bak !== -1 && last_bak !== last)
            markers[last_bak].setIcon('img/marker.png');

        if (last === -1) {
            $('#youreHereName').text('Début du parcours');
            gmaps.setZoom(initZoom);
            gmaps.panTo(initLoc);

            $('#sidePanel .name').text('La Ligne Verte');

            $('#sidePanel .image').html('');

            $('#sidePanel .location').text('Dans toute la ville de Nantes');

            $('#sidePanel .website').html('<a href="https://www.levoyageanantes.fr/parcours-images/">https://www.levoyageanantes.fr/parcours-images/</a>');

            $('#sidePanel .description').text('Retrouvez tous les itinéraires et parcours en images proposés par Le Voyage de Nantes pour découvrir les nombreuses œuvres et expositions au gré de vos envies : Parcours en ville, hors-centre, Estuaire...');
        } else {
            let here = locations[last];

            $('#youreHereName').text(here.name);
            gmaps.setZoom(initZoom + 1.5);
            gmaps.panTo(markers[last].position);

            $('#sidePanel .name').text(here.name);
            
            $('#sidePanel .image').html('');
            $('#sidePanel .image').append(pictures[last]);
            
            $('#sidePanel .location').text(here.place);

            $('#sidePanel .website').html(here.website ? '<a href="' + here.website + '">' + here.website + '</a>' : '<em>Pas de site web disponible</em>');

            $('#sidePanel .description').text(here.description);

            setTimeout(() => {
                markers[last].setIcon('img/marker.active.png');
            }, 500);
        }
    }

    $('#topOverlay').scroll(updateLocation);
    updateLocation();

    $('#scrollSpacer').css('height', ($(window).height() - 200) + 'px');

    window.gmaps = gmaps;
    window.marker = locations[0].latLng;
})();
