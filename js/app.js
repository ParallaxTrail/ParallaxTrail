// Enable strict mode
"use strict";

// [TODO] Remove the "TO REMOVE" part when all places in "places.json"
//         have a provided position.
// [TODO] Improve browser compatibilities (Internet Explorer, older versions of Firefox/Chrome/...)

/**
 * Throw an error
 * @param {string} message The error message
 * @param {*} [data] A data related to the error
 * @returns {void}
 */
function error (message, data) {
  // Show the error message to the user
  alert(message);

  // Display the error message
  console.error(message);

  // If some additional data was provided...
  if (data)
    // Display it
    console.error(data);

  // Throw an error
  throw new Error('Error (please read the message above)');
}

// Wrap the code inside an asynchronous function
// * Load the function only when the JSON file is ready
// * Improve script performances
// * Avoid polluating the global environment (`window`)
// * Enable usage of the `await` keyword

/**
 * Script's main function
 * @param {Object} locations An object describing the green line's places
 * @returns {void}
 */
async function main (locations) {
  // -> Set up some constants

  // Set some initial data
  const initial = {
    // The map's initial position
    position: {
      lat: 47.210601,
      lng: -1.553621
    },

    // The map's initial zoom level
    zoom: 15.2
  };

  // Get the green line's DOM element
  let greenLine = document.getElementById('greenLine');

  // Make a maps with the Google Maps API
  let gmaps = new google.maps.Map(
    // The map's container
    document.getElementById('map'),
    // Options
    {
      // Center on the initial position
      center: new google.maps.LatLng(initial.position.lat, initial.position.lng),
      // Level of zoom
      zoom: initial.zoom,
      // Disable the default User Interface
      disableDefaultUI: true
    }
  );

  /* ================= TO REMOVE ================= */
  // For each place...
  for (let i = 0; i < locations.length; i ++)
    // If it has no position...
    if (! locations[i].latLng) {
      // Remove it
      locations.splice(i, 1);
      // Adapt the iterator
      i --;
    }    
  /* ================= */

  // List of pictures (one per place)
  let pictures = [];

  // List of Google Maps markers (one per place)
  let markers = [];

  // For each place...
  for (let i = 0; i < locations.length; i ++) {
    // Create a new marker
    let marker =
      // Wait for the following promise...
      await (
        // Create a new marker asynchronously
        new google.maps.Marker({
          // Attach it to the background map
          map: gmaps,
          // Set its position on the map
          position: locations[i].latLng,
          // Give it a title (NOTE: Is it required or could it be removed?)
          title: locations[i].place
        })
      );

    // Push the marker to the list of markers
    markers.push(marker);

    // -> Pre-load the pictures to make the browsing more fluid

    // Create a new Image object
    let img = new Image();

    // Set its source
    // NOTE: The image will start loading the specified URL right now
    img.setAttribute('src', locations[i].image);

    // Push the picture to the list of pictures
    pictures.push(img);
  }

  // Create lines that link all points  
  let line = new google.maps.Polyline({
    // Get the position of all markers
    path: locations.map(l => l.latLng),
    geodesic: true,
    // Set the line's color
    strokeColor: '#51fc4e',
    // Set its opacity
    strokeOpacity: 1.0,
    // Set its weight
    strokeWeight: 2,
    // Specify the map it must be attached to
    map: gmaps
  });

  // Set the green line's height depending on the number of markers
  greenLine.style.height = (80 * markers.length) + '%';

  // Place every marker on the green line
  let points = markers
    // For each of them...
    .map((marker, i) => {
      // Create a new point element
      let point = document.createElement('div');
      // Give it a class
      point.classList.add('point');
      // Set its position on the green line
      point.style.top = (60 + 80 * i) + "%";
      // Append it to the green line
      greenLine.appendChild(point);

      // Return the made point
      return point;
    });

  // Get the position of every point on the page, in pixels
  let distances = points.map(point => $(point).offset().top);

  // The last active point in the green line
  let last = -1;

  /**
   * Update the active point
   * NOTE: This function is not optimized at all, but works very well and fast anyway.
   * NOTE: It could be improved, but that's not an absolute requirement.
   * @returns {void}
   */
  function updateActivePlace () {
    // Get the current scroll amount
    const scrollTop = $('#topOverlay').scrollTop();

    // Backup the last active point's identifier
    let last_bak = last;

    // For now, consider there is no active point
    last = -1;

    // For each point...
    for (let i = 0; i < points.length; i++) {
      // If one is at the minimum position to be set active...
      if (scrollTop >= distances[i] - 300) {
        // Give it the "active" class
        points[i].classList.add('active');
        // Indicate it as the last active point
        last = i;
      } else
        // Else, the point is not active
        // Remove its "active" class (if it has one)
        points[i].classList.remove('active');
    }

    // If the active marker changed...
    if (last_bak !== -1 && last_bak !== last)
      // Give the last one the standard marker image
      markers[last_bak].setIcon('img/marker.png');

    // If no point is active...
    if (last === -1) {
      // Unzoom
      gmaps.setZoom(initial.zoom);
      // Focus on the initial position
      gmaps.panTo(initial.position);

      // Display some informations about the green line
      $('#youreHereName').text('Début du parcours');
      $('#sidePanel .name').text('La line Verte');
      $('#sidePanel .image').html('');
      $('#sidePanel .location').text('Dans toute la ville de Nantes');
      $('#sidePanel .website').html('<a href="https://www.levoyageanantes.fr/parcours-images/">https://www.levoyageanantes.fr/parcours-images/</a>');
      $('#sidePanel .description').text('Retrouvez tous les itinéraires et parcours en images proposés par Le Voyage de Nantes pour découvrir les nombreuses œuvres et expositions au gré de vos envies : Parcours en ville, hors-centre, Estuaire...');
    } else {
      // Else, get the place related to the active point
      let here = locations[last];

      // Zoom
      gmaps.setZoom(initial.zoom + 1.5);
      // Focus on it
      gmaps.panTo(markers[last].position);

      // Display some informations about this specific place
      $('#youreHereName').text(here.name);
      $('#sidePanel .name').html(here.name.split('\n').join('<br/>'));
      $('#sidePanel .image').html('');
      $('#sidePanel .image').append(pictures[last]);
      $('#sidePanel .location').text(here.place);
      $('#sidePanel .website').html(here.website ? '<a href="' + here.website + '">' + here.website + '</a>' : '<em>Pas de site web disponible</em>');
      $('#sidePanel .description').text(here.description);

      // After a delay...
      setTimeout(() =>
        // Update the marker's icon as "active"
        // This delay is needed to attract user's attention on the new point
        //  by changing its color AFTER the focus and zoom (which takes a bit of time)
        //  both end.
        markers[last].setIcon('img/marker.active.png')
      , 500);
    }
  }

  // Add an element to make the user able to scroll a little after the green line ends
  $('#scrollSpacer').css('height', ($(window).height() - 200) + 'px');

  // When the page is scrolled, update the active point
  $('#topOverlay').scroll(updateActivePlace);

  // Determine the current active place
  updateActivePlace();
};

// Initialize a new HTTP request
let xhr = new XMLHttpRequest();

// Load the application's JSON file, asynchronously
xhr.open('GET', 'data/places.json', true);

// When the request progresses...
xhr.addEventListener('load', e => {
  // If the request ended...
  if (xhr.readyState === 4) {
    // If it ended well...
    if (xhr.status === 200) {
      // Prepare a variable
      let locations = null;

      // Try to parse the reponse as a JSON string
      try {
        locations = JSON.parse(xhr.responseText);
      } catch (e) {
        // ERRROR
        error('Impossible de charger les différents lieux du Voyage à Nantes', e);
      }

      // If it was parsed well...
      if (locations)
        // Run the main function
        main(locations);
    } else
      // ERROR
      error('Une erreur s\'est produite durant le chargement du Voyage à Nantes', xhr);
  }
});

// If an error occurs during the request...
xhr.onerror = e =>
  // ERROR
  error('Une erreur réseau s\'est produite', xhr);

// Launch the request
xhr.send(null);