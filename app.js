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