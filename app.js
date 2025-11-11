// --- Weather Widget ---

// Set the location (e.g., Singapore)
const city = "Singapore";
const weatherApiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${config.OPENWEATHER_KEY}&units=metric`;

// Select the HTML element where we'll put the weather info
const weatherWidget = document.getElementById("weather-content");

// Use fetch() to get the data
fetch(weatherApiUrl)
    .then(response => {
        // First, check if the response from the server is "ok" (status 200)
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        // If it's ok, convert the response to JSON format
        return response.json();
    })
    .then(data => {
        // Now we have our data! Let's pull out what we need.
        console.log(data); // Good for testing, you can see all the data in the console
        
        const temperature = data.main.temp;
        const description = data.weather[0].description;
        const icon = data.weather[0].icon;

        // Create the HTML to display the weather
        const weatherHTML = `
            <div class="weather-info">
                <h3>${temperature.toFixed(1)}°C</h3>
                <p>${description}</p>
            </div>
            <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description} icon">
        `;

        // Put the new HTML inside our widget
        weatherWidget.innerHTML = weatherHTML;
    })
    .catch(error => {
        // This 'catch' block will run if anything went wrong (like a wrong API key)
        console.error('Error fetching weather data:', error);
        weatherWidget.innerHTML = "<p>Could not fetch weather data. Please check your API key or network.</p>";
    });

// --- Map Widget ---

// Set Mapbox access token (from config.js)
mapboxgl.accessToken = config.MAPBOX_KEY;

// Create a new map instance
const map = new mapboxgl.Map({
    container: 'map', // The ID of the div in index.html
    style: 'mapbox://styles/mapbox/streets-v12', // The style of the map
    center: [103.8198, 1.3521], // Center the map on Singapore [longitude, latitude]
    zoom: 10 // Set the initial zoom level
});

// Add navigation controls (zoom buttons, etc.)
map.addControl(new mapboxgl.NavigationControl());

// --- Places Widget ---

// 1. Get references to the new HTML elements
const searchInput = document.getElementById('places-search-input');
const searchButton = document.getElementById('places-search-button');
const placesContent = document.getElementById('places-content');

// 2. We'll store our markers here so we can clear them later
let placesMarkers = [];

// 3. Listen for a click on the search button
searchButton.addEventListener('click', () => {
    const query = searchInput.value; // Get the text from the search box
    if (!query) return; // Do nothing if the search is empty

    // Get the map's current center coordinates
    const mapCenter = map.getCenter();
    const longitude = mapCenter.lng;
    const latitude = mapCenter.lat;

    // Construct the API URL for Mapbox Geocoding
    const placesApiUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?proximity=${longitude},${latitude}&access_token=${config.MAPBOX_KEY}`;

    // 4. Fetch the data
    fetch(placesApiUrl)
        .then(response => response.json())
        .then(data => {
            // 5. Display the results
            displayPlaces(data.features);
        })
        .catch(error => {
            console.error('Error fetching places data:', error);
            placesContent.innerHTML = "<p>Could not find places.</p>";
        });
});

function displayPlaces(features) {
    // 1. Clear any old results and markers
    placesContent.innerHTML = "";
    placesMarkers.forEach(marker => marker.remove());
    placesMarkers = [];

    // Create a list for our results
    const placesList = document.createElement('ul');

    // 2. Loop through each place found
    features.forEach(feature => {
        // Create a list item
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <strong>${feature.text}</strong>
            ${feature.place_name}
        `;
        placesList.appendChild(listItem);

        // 3. Add a marker to the map for this place
        const coords = feature.geometry.coordinates;
        const marker = new mapboxgl.Marker()
            .setLngLat(coords)
            .setPopup(new mapboxgl.Popup().setHTML(`<strong>${feature.text}</strong>`)) // Add a popup
            .addTo(map);
        
        // 4. Save the marker so we can clear it later
        placesMarkers.push(marker);
    });

    // 5. Add the new list to our widget
    placesContent.appendChild(placesList);

    // (Optional) Fly to the first result
    if (features.length > 0) {
        map.flyTo({
            center: features[0].geometry.coordinates,
            zoom: 14
        });
    }
}