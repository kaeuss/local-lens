// --- Get references to all our HTML elements ---
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const locationDisplay = document.getElementById('search-location');
const weatherWidget = document.getElementById('weather-content');
const mapContainer = 'map';

// --- Initialize the Map ---
mapboxgl.accessToken = config.MAPBOX_KEY;
const map = new mapboxgl.Map({
    container: mapContainer,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [103.8198, 1.3521], // Start in Singapore
    zoom: 10
});
map.addControl(new mapboxgl.NavigationControl());

// --- Load initial data for Singapore ---
updateDashboard("Singapore");

// --- Set up the search button click listener ---
searchButton.addEventListener('click', () => {
    const query = searchInput.value;
    if (query) {
        updateDashboard(query);
    }
});

// --- Main Function to Update Everything ---
function updateDashboard(query) {
    // 1. Create the API URL for OpenWeatherMap
    const weatherApiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${query}&appid=${config.OPENWEATHER_KEY}&units=metric`;

    // 2. Fetch the data
    fetch(weatherApiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Location not found');
            }
            return response.json();
        })
        .then(data => {
            // We have good data!
            console.log(data);
            const lat = data.coord.lat;
            const lon = data.coord.lon;

            // 3. Update Weather Widget
            updateWeather(data);

            // 4. Update Map Widget
            updateMap(lon, lat, data.name);

            // 5. Update Search Widget
            updateLocation(data.name, data.sys.country);
        })
        .catch(error => {
            // Handle errors (like "Location not found")
            console.error('Error fetching data:', error);
            locationDisplay.innerHTML = `<h3>Location not found.</h3>`;
            weatherWidget.innerHTML = `<p>Please try a new search.</p>`;
        });
}

// --- Helper Functions ---

function updateWeather(data) {
    const temperature = data.main.temp;
    const description = data.weather[0].description;
    const icon = data.weather[0].icon;

    const weatherHTML = `
        <div class="weather-info">
            <h3>${temperature.toFixed(1)}°C</h3>
            <p>${description}</p>
        </div>
        <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description} icon">
    `;
    weatherWidget.innerHTML = weatherHTML;
}

function updateMap(lon, lat) {
    // Use 'flyTo' to animate the map
    map.flyTo({
        center: [lon, lat],
        zoom: 12 // Zoom in a bit closer
    });

    // (Optional) Add a marker at the new location
    new mapboxgl.Marker()
        .setLngLat([lon, lat])
        .addTo(map);
}

function updateLocation(name, country) {
    locationDisplay.innerHTML = `<h3>Displaying: ${name}, ${country}</h3>`;
}