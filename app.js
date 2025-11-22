// --- Get references to all our HTML elements ---
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const geoButton = document.getElementById('geo-button');
const locationDisplay = document.getElementById('search-location');
const weatherWidget = document.getElementById('weather-content');
const mapContainer = 'map';
const newsWidget = document.getElementById('news-content');
const forecastWidget = document.getElementById('forecast-content');


// --- Initialize the Map ---
mapboxgl.accessToken = config.MAPBOX_KEY;
const map = new mapboxgl.Map({
    container: mapContainer,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [103.8198, 1.3521], // Start in Singapore
    zoom: 10
});
map.addControl(new mapboxgl.NavigationControl());

// --- Initial Page Load ---
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Load Dashboard
    updateDashboard("Singapore");

    // 2. Set the Date
    const dateDisplay = document.getElementById('current-date');
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateDisplay.textContent = now.toLocaleDateString('en-US', options);

    // 3. Check for saved theme
    const savedTheme = localStorage.getItem('theme');
    const themeToggleInput = document.getElementById('theme-toggle-input'); // Find new checkbox
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggleInput.checked = true; // Set the switch to "on"
    }
});



// --- Set up the search button click listener ---
searchButton.addEventListener('click', () => {
    const query = searchInput.value;
    if (query) {
        updateDashboard(query);
    }
});

// --- Main Function to Update Everything ---
function updateDashboard(query) {
    // 1. Show loading spinner in the weather widget immediately
    showLoading(weatherWidget);
    
    // 2. Create the API URL for OpenWeatherMap
    const weatherApiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${query}&appid=${config.OPENWEATHER_KEY}&units=metric`;

    // 3. Fetch the data
    fetch(weatherApiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Location not found');
            }
            return response.json();
        })
        .then(data => {
            const lat = data.coord.lat;
            const lon = data.coord.lon;

            // Update Widgets
            updateWeather(data); // This removes the spinner and shows weather
            updateMap(lon, lat, data.name);
            updateLocation(data.name, data.sys.country);
            
            // Trigger other updates
            updateNews(data.sys.country);
            updateForecast(lat, lon);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            // Show a nice error message in the main widget
            showError(weatherWidget, "Location not found. Please try again.");
            locationDisplay.innerHTML = ""; // Clear location text
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

// --- News Widget Logic (With Spinner) ---
function updateNews(countryCode) {
    // 1. Show loading spinner
    showLoading(newsWidget);

    const country = countryCode.toLowerCase(); 
    const newsApiUrl = `https://gnews.io/api/v4/top-headlines?country=${country}&token=${config.GNEWS_KEY}&max=10`;

    fetch(newsApiUrl)
        .then(response => {
            if (!response.ok) throw new Error('News API error');
            return response.json();
        })
        .then(data => {
            // Clear spinner
            newsWidget.innerHTML = "";

            if (data.articles && data.articles.length > 0) {
                data.articles.slice(0, 5).forEach(article => {
                    const articleHTML = `
                        <div class="news-article">
                            <h3><a href="${article.url}" target="_blank">${article.title}</a></h3>
                            <p>${article.source.name}</p>
                        </div>
                    `;
                    newsWidget.innerHTML += articleHTML;
                });
            } else {
                showError(newsWidget, "No news found for this region.");
            }
        })
        .catch(error => {
            console.error('Error fetching news:', error);
            // This handles the 403 or 404 errors gracefully
            showError(newsWidget, "Could not load news (API Limit or Error).");
        });
}

// --- Forecast Logic (v5 - With Spinner) ---
function updateForecast(lat, lon) {
    // 1. Show loading spinner
    showLoading(forecastWidget);

    const forecastApiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${config.OPENWEATHER_KEY}&units=metric`;

    fetch(forecastApiUrl)
        .then(response => {
            if (!response.ok) throw new Error('Forecast API error');
            return response.json();
        })
        .then(data => {
            // Clear spinner
            forecastWidget.innerHTML = "";
            
            const dailyData = [];
            for (let i = 7; i < data.list.length; i += 8) {
                dailyData.push(data.list[i]);
            }
            
            dailyData.forEach(day => {
                const date = new Date(day.dt * 1000);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                const icon = day.weather[0].icon;
                const temp = day.main.temp;

                const dayHTML = `
                    <div class="forecast-day">
                        <p>${dayName}</p>
                        <img src="http://openweathermap.org/img/wn/${icon}.png" alt="${day.weather[0].description}">
                        <p class="temp">${temp.toFixed(0)}°C</p>
                    </div>
                `;
                forecastWidget.innerHTML += dayHTML;
            });
        })
        .catch(error => {
            console.error('Error fetching forecast:', error);
            showError(forecastWidget, "Could not load forecast.");
        });
}

// --- Theme Toggle Listener ---
const themeToggleInput = document.getElementById('theme-toggle-input');

themeToggleInput.addEventListener('change', () => {
    const body = document.body;

    if (themeToggleInput.checked) {
        // If the switch is "on" (checked)
        body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
    } else {
        // If the switch is "off" (unchecked)
        body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
    }
});

// --- Geolocation Logic ---

geoButton.addEventListener('click', () => {
    // Check if Geolocation is supported
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }

    // Ask for location
    navigator.geolocation.getCurrentPosition(
        (position) => {
            // Success! We have coordinates.
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            
            // Call our new function to handle coords
            updateDashboardByCoords(lat, lon);
        },
        (error) => {
            // Error (User denied permission, etc.)
            console.error("Error getting location:", error);
            alert("Unable to retrieve your location. Please allow location access.");
        }
    );
});

// Special function to fetch weather using Coordinates instead of City Name
function updateDashboardByCoords(lat, lon) {
    // URL uses lat/lon instead of q={city}
    const weatherApiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${config.OPENWEATHER_KEY}&units=metric`;

    fetch(weatherApiUrl)
        .then(response => {
            if (!response.ok) throw new Error('Location not found');
            return response.json();
        })
        .then(data => {
            console.log("Location Data:", data);
            
            // Update all the widgets using the data we got back
            // (We can reuse all your existing helper functions!)
            updateWeather(data);
            updateMap(lon, lat, data.name);
            updateLocation(data.name, data.sys.country);
            
            // Update News and Forecast
            // Note: Check if updateNews is enabled in your code
            // updateNews(data.sys.country); 
            updateForecast(lat, lon);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            alert("Could not load weather for your location.");
        });
}

// --- UI Helper Functions ---

function showLoading(element) {
    element.innerHTML = '<div class="spinner"></div>';
}

function showError(element, message) {
    element.innerHTML = `<div class="error-message">⚠️ ${message}</div>`;
}