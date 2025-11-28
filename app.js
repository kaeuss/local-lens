// --- Get references to all our HTML elements ---
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const geoButton = document.getElementById('geo-button');
const locationDisplay = document.getElementById('search-location');
const weatherWidget = document.getElementById('weather-content');
const mapContainer = 'map';
const newsWidget = document.getElementById('news-content');
const forecastWidget = document.getElementById('forecast-content');

// Global variable to track the map marker (so we can remove old ones)
let currentMarker = null;

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
    const themeToggleInput = document.getElementById('theme-toggle-input'); 
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggleInput.checked = true; 
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
    // 1. Show loading spinner
    showLoading(weatherWidget);
    
    // 2. API URL
    const weatherApiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${query}&appid=${config.OPENWEATHER_KEY}&units=metric`;

    // 3. Fetch
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
            updateWeather(data); 
            
            // UPDATED: Pass temp and description to the map for the popup
            updateMap(lon, lat, data.name, data.main.temp, data.weather[0].description);
            
            updateLocation(data.name, data.sys.country);
            
            // Trigger other updates
            updateNews(data.name); // Pass City Name for Global News
            updateForecast(lat, lon);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            showError(weatherWidget, "Location not found. Please try again.");
            locationDisplay.innerHTML = ""; 
        });
}

// --- Helper Functions ---

// 1. New Helper: Updates the Big Weather Display
// We extracted this so we can call it when clicking forecast items too!
function renderMainWeather(temp, description, icon, timeLabel = "") {
    const weatherHTML = `
        <div class="weather-info">
            <h3>${parseFloat(temp).toFixed(1)}°C</h3>
            <p>${description} <span style="font-size: 0.8rem; opacity: 0.8;">${timeLabel}</span></p>
        </div>
        <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description} icon">
    `;
    weatherWidget.innerHTML = weatherHTML;
}

// 2. Updated: Standard updateWeather just calls our new helper
function updateWeather(data) {
    renderMainWeather(data.main.temp, data.weather[0].description, data.weather[0].icon);
}

// 3. Updated: Map function
function updateMap(lon, lat, cityName, temp, description) {
    map.flyTo({ center: [lon, lat], zoom: 10, essential: true });

    if (currentMarker) currentMarker.remove();

    const popupHTML = `
        <div style="text-align: center; color: #333;">
            <h3>${cityName}</h3>
            <p><strong>${temp.toFixed(1)}°C</strong></p>
            <p style="text-transform: capitalize;">${description}</p>
        </div>
    `;

    const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(popupHTML);

    currentMarker = new mapboxgl.Marker({ color: "#007bff" })
        .setLngLat([lon, lat])
        .setPopup(popup)
        .addTo(map);
}

function updateLocation(name, country) {
    locationDisplay.innerHTML = `<h3>Displaying: ${name}, ${country}</h3>`;
}

// --- Global News Logic ---
function updateNews(query) {
    showLoading(newsWidget);
    const newsApiUrl = `https://gnews.io/api/v4/search?q=${query}&lang=en&sortby=publishedAt&token=${config.GNEWS_KEY}&max=8`; // Increased to 8 to fill space

    fetch(newsApiUrl)
        .then(response => {
            if (!response.ok) throw new Error('News API error');
            return response.json();
        })
        .then(data => {
            newsWidget.innerHTML = "";
            if (data.articles && data.articles.length > 0) {
                data.articles.forEach(article => {
                    const image = article.image || 'https://via.placeholder.com/150?text=News';
                    const articleHTML = `
                        <div class="news-article">
                            <div class="news-image" style="background-image: url('${image}')"></div>
                            <div class="news-text">
                                <h3><a href="${article.url}" target="_blank">${article.title}</a></h3>
                                <p>${article.source.name} • ${new Date(article.publishedAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    `;
                    newsWidget.innerHTML += articleHTML;
                });
            } else {
                showError(newsWidget, `No recent news found for ${query}.`);
            }
        })
        .catch(error => {
            // Backup code (Keep your existing backup logic here if you want)
            console.error('Error fetching news:', error);
            showError(newsWidget, "Could not load news.");
        });
}

// --- Forecast Logic (Interactive!) ---
function updateForecast(lat, lon) {
    showLoading(forecastWidget);
    document.getElementById('hourly-content').innerHTML = '<div class="spinner"></div>';

    const forecastApiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${config.OPENWEATHER_KEY}&units=metric`;

    fetch(forecastApiUrl)
        .then(response => response.json())
        .then(data => {
            const hourlyContainer = document.getElementById('hourly-content');
            const dailyContainer = document.getElementById('forecast-content');
            
            hourlyContainer.innerHTML = "";
            dailyContainer.innerHTML = "";

            // --- HOURLY (Next 24h) ---
            const hourlyData = data.list.slice(0, 8);
            hourlyData.forEach(item => {
                const date = new Date(item.dt * 1000);
                const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
                const icon = item.weather[0].icon;
                const temp = item.main.temp;
                const desc = item.weather[0].description;

                // Create Element
                const el = document.createElement('div');
                el.className = 'hourly-item';
                el.innerHTML = `
                    <span>${timeStr}</span>
                    <img src="https://openweathermap.org/img/wn/${icon}.png" alt="icon">
                    <strong>${temp.toFixed(0)}°C</strong>
                `;

                // Add Click Event
                el.addEventListener('click', () => {
                    // Remove 'selected' from all others
                    document.querySelectorAll('.hourly-item, .forecast-day').forEach(d => d.classList.remove('selected-weather'));
                    // Add 'selected' to this one
                    el.classList.add('selected-weather');
                    // Update Main Display
                    renderMainWeather(temp, desc, icon, `(Forecast: ${timeStr})`);
                });

                hourlyContainer.appendChild(el);
            });

            // --- DAILY (Next 5 Days) ---
            const dailyData = [];
            for (let i = 7; i < data.list.length; i += 8) {
                dailyData.push(data.list[i]);
            }
            
            dailyData.forEach(day => {
                const date = new Date(day.dt * 1000);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                const icon = day.weather[0].icon;
                const temp = day.main.temp;
                const desc = day.weather[0].description;

                const el = document.createElement('div');
                el.className = 'forecast-day';
                el.innerHTML = `
                    <p>${dayName}</p>
                    <img src="https://openweathermap.org/img/wn/${icon}.png" alt="${desc}">
                    <p class="temp">${temp.toFixed(0)}°C</p>
                `;

                // Add Click Event
                el.addEventListener('click', () => {
                    document.querySelectorAll('.hourly-item, .forecast-day').forEach(d => d.classList.remove('selected-weather'));
                    el.classList.add('selected-weather');
                    renderMainWeather(temp, desc, icon, `(Forecast: ${dayName})`);
                });

                dailyContainer.appendChild(el);
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
        body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
    } else {
        body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
    }
});

// --- Geolocation Logic ---

geoButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            // Call our special function to handle coords
            updateDashboardByCoords(lat, lon);
        },
        (error) => {
            console.error("Error getting location:", error);
            alert("Unable to retrieve your location. Please allow location access.");
        }
    );
});

// Special function to fetch weather using Coordinates
function updateDashboardByCoords(lat, lon) {
    const weatherApiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${config.OPENWEATHER_KEY}&units=metric`;

    fetch(weatherApiUrl)
        .then(response => {
            if (!response.ok) throw new Error('Location not found');
            return response.json();
        })
        .then(data => {
            console.log("Location Data:", data);
            
            updateWeather(data);
            
            // UPDATED: Pass temp/desc for Map Popup
            updateMap(lon, lat, data.name, data.main.temp, data.weather[0].description);
            
            updateLocation(data.name, data.sys.country);
            
            // UPDATED: Update News using the City Name we found
            updateNews(data.name); 
            
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

// --- Autocomplete Logic ---

const suggestionsList = document.getElementById('suggestions-list');

searchInput.addEventListener('input', async () => {
    const query = searchInput.value;

    if (query.length < 3) {
        suggestionsList.style.display = 'none';
        return;
    }

    const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${config.OPENWEATHER_KEY}`;

    try {
        const response = await fetch(geoUrl);
        const data = await response.json();

        suggestionsList.innerHTML = "";

        if (data.length > 0) {
            suggestionsList.style.display = 'block';
            
            data.forEach(place => {
                const li = document.createElement('li');
                const stateInfo = place.state ? `, ${place.state}` : '';
                li.textContent = `${place.name}${stateInfo}, ${place.country}`;
                
                li.addEventListener('click', () => {
                    searchInput.value = place.name; 
                    suggestionsList.style.display = 'none'; 
                    updateDashboardByCoords(place.lat, place.lon);
                });

                suggestionsList.appendChild(li);
            });
        } else {
            suggestionsList.style.display = 'none';
        }
    } catch (error) {
        console.error("Error fetching suggestions:", error);
    }
});

document.addEventListener('click', (e) => {
    if (e.target !== searchInput && e.target !== suggestionsList) {
        suggestionsList.style.display = 'none';
    }
});