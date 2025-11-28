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

// UPDATED MAP FUNCTION (With Popup)
function updateMap(lon, lat, cityName, temp, description) {
    // 1. Fly to the new location
    map.flyTo({
        center: [lon, lat],
        zoom: 10,
        essential: true
    });

    // 2. Remove the old marker if it exists
    if (currentMarker) {
        currentMarker.remove();
    }

    // 3. Create a custom popup with Weather Info
    const popupHTML = `
        <div style="text-align: center; color: #333;">
            <h3>${cityName}</h3>
            <p><strong>${temp.toFixed(1)}°C</strong></p>
            <p style="text-transform: capitalize;">${description}</p>
        </div>
    `;

    const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(popupHTML);

    // 4. Add the new marker with the popup
    currentMarker = new mapboxgl.Marker({ color: "#007bff" }) 
        .setLngLat([lon, lat])
        .setPopup(popup) 
        .addTo(map);
}

function updateLocation(name, country) {
    locationDisplay.innerHTML = `<h3>Displaying: ${name}, ${country}</h3>`;
}

// --- Global News Logic (With Smart Backup Links) ---
function updateNews(query) {
    showLoading(newsWidget);

    // Search for news about the City Name (Global Scope)
    const newsApiUrl = `https://gnews.io/api/v4/search?q=${query}&lang=en&sortby=publishedAt&token=${config.GNEWS_KEY}&max=5`;

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
            console.error('Error fetching news:', error);
            console.log("Loading backup news data...");
            
            // FALLBACK DATA with SMART LINKS
            const backupNews = [
                {
                    title: `Breaking News: ${query} Tech Scene Booms`,
                    // LINK 1: Google Search for Tech news in that city
                    url: `https://www.google.com/search?q=${query}+technology+news`,
                    source: { name: "Global Lens Daily" },
                    image: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=150&q=80",
                    publishedAt: new Date().toISOString()
                },
                {
                    title: `Weather Update: Sunny skies expected in ${query}`,
                    // LINK 2: Google Search for Weather in that city
                    url: `https://www.google.com/search?q=${query}+weather`,
                    source: { name: "Weather Channel" },
                    image: "https://images.unsplash.com/photo-1561484930-998b6a7b22e8?auto=format&fit=crop&w=150&q=80",
                    publishedAt: new Date().toISOString()
                },
                {
                    title: `Local tourism hits record highs in ${query}`,
                    // LINK 3: Google Search for Tourism in that city
                    url: `https://www.google.com/search?q=${query}+tourism`,
                    source: { name: "Travel Weekly" },
                    image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=150&q=80",
                    publishedAt: new Date().toISOString()
                }
            ];
            
            newsWidget.innerHTML = ""; // Clear spinner
            
            // Render the backup articles
            backupNews.forEach(article => {
                const date = new Date(article.publishedAt).toLocaleDateString();
                const articleHTML = `
                    <div class="news-article">
                        <div class="news-image" style="background-image: url('${article.image}')"></div>
                        <div class="news-text">
                            <h3><a href="${article.url}" target="_blank">${article.title}</a></h3>
                            <p>${article.source.name} • ${date}</p>
                        </div>
                    </div>
                `;
                newsWidget.innerHTML += articleHTML;
            });
            
            // Add the "Demo Data" disclaimer
            newsWidget.innerHTML += `<p style="font-size: 0.8rem; color: #888; text-align: center; margin-top: 10px;">(API Limit Reached: Showing Demo Data)</p>`;
        });
}

// Helper function to render the HTML (reused for real and backup data)
function renderArticles(articles) {
    articles.forEach(article => {
        const image = article.image || 'https://via.placeholder.com/150?text=News';
        const date = new Date(article.publishedAt).toLocaleDateString();
        
        const articleHTML = `
            <div class="news-article">
                <div class="news-image" style="background-image: url('${image}')"></div>
                <div class="news-text">
                    <h3><a href="${article.url}" target="_blank">${article.title}</a></h3>
                    <p>${article.source.name} • ${date}</p>
                </div>
            </div>
        `;
        newsWidget.innerHTML += articleHTML;
    });
}

// --- Forecast Logic (v6 - Hourly + Daily) ---
function updateForecast(lat, lon) {
    showLoading(forecastWidget);
    // Note: We also clear the hourly widget
    document.getElementById('hourly-content').innerHTML = '<div class="spinner"></div>';

    const forecastApiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${config.OPENWEATHER_KEY}&units=metric`;

    fetch(forecastApiUrl)
        .then(response => {
            if (!response.ok) throw new Error('Forecast API error');
            return response.json();
        })
        .then(data => {
            // 1. Get Elements
            const hourlyContainer = document.getElementById('hourly-content');
            const dailyContainer = document.getElementById('forecast-content');
            
            // 2. Clear Spinners
            hourlyContainer.innerHTML = "";
            dailyContainer.innerHTML = "";

            // --- PART A: HOURLY FORECAST (Next 24 Hours) ---
            // Take the first 8 items from the list (8 * 3 hours = 24 hours)
            const hourlyData = data.list.slice(0, 8);
            
            hourlyData.forEach(item => {
                const date = new Date(item.dt * 1000);
                // Format time like "3 PM", "6 PM"
                const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
                const icon = item.weather[0].icon;
                const temp = item.main.temp;

                const hourlyHTML = `
                    <div class="hourly-item">
                        <span>${timeStr}</span>
                        <img src="https://openweathermap.org/img/wn/${icon}.png" alt="icon">
                        <strong>${temp.toFixed(0)}°C</strong>
                    </div>
                `;
                hourlyContainer.innerHTML += hourlyHTML;
            });

            // --- PART B: DAILY FORECAST (Next 5 Days) ---
            // Filter to get roughly one item per day (skip every 8 items)
            const dailyData = [];
            // Start from index 7 (approx 24h from now) to get the "next day" feel
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
                        <img src="https://openweathermap.org/img/wn/${icon}.png" alt="${day.weather[0].description}">
                        <p class="temp">${temp.toFixed(0)}°C</p>
                    </div>
                `;
                dailyContainer.innerHTML += dayHTML;
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