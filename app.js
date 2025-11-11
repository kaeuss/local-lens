// --- Get references to all our HTML elements ---
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
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
            // updateMap(lon, lat, data.name); // Temporarily disabled

            // 5. Update Search Widget
            // updateLocation(data.name, data.sys.country); // Temporarily disabled
            //6. Update News Widget
            //updateNews(data.sys.country); //Temporarily disabled
            
            //7. Update Forecast Widget
            updateForecast(lat, lon);
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

// --- News Widget Logic ---

function updateNews(countryCode) {
    // GNews uses lowercase country codes (e.g., 'sg')
    const country = countryCode.toLowerCase(); 
    
    // Construct the GNews API URL
    const newsApiUrl = `https://gnews.io/api/v4/top-headlines?country=${country}&token=${config.GNEWS_KEY}&max=10`;

    // Fetch the news data
    fetch(newsApiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('News API response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Clear old news
            newsWidget.innerHTML = "";

            if (data.articles && data.articles.length > 0) {
                // Loop through the first 5 articles
                data.articles.slice(0, 5).forEach(article => {
                    
                    // Create the HTML for each article
                    const articleHTML = `
                        <div class="news-article">
                            <h3><a href="${article.url}" target="_blank">${article.title}</a></h3>
                            <p>${article.source.name}</p>
                        </div>
                    `;
                    
                    // Add the new article to the widget
                    newsWidget.innerHTML += articleHTML;
                });
            } else {
                newsWidget.innerHTML = "<p>No recent news found.</p>";
            }
        })
        .catch(error => {
            console.error('Error fetching news data:', error);
            newsWidget.innerHTML = "<p>Could not load news feed.</p>";
        });
}

// --- Forecast Logic (v4 - Simplest & Most Robust) ---
function updateForecast(lat, lon) {
    // This API gives a forecast for 5 days in 3-hour intervals
    const forecastApiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${config.OPENWEATHER_KEY}&units=metric`;

    fetch(forecastApiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Forecast API response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // This is the console.log you are seeing
            console.log("Forecast Data Received:", data); 

            // Debug: Log the forecastWidget element
            console.log("Forecast widget element:", forecastWidget);

            // Clear old forecast
            forecastWidget.innerHTML = "";

            // A much simpler way to get 5 days:
            // We filter the list to get only one entry per day.
            // We'll take the 8th item (index 7), 16th (index 15), etc.
            const dailyData = [];
            for (let i = 7; i < data.list.length; i += 8) {
                dailyData.push(data.list[i]);
            }
            
            // Loop through our new 5-day list
            dailyData.forEach(day => {
                console.log("Processing forecast day:", day);
                // Get the day of the week
                const date = new Date(day.dt * 1000);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                
                const icon = day.weather[0].icon;
                const temp = day.main.temp;

                // Create the HTML for the day
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
            console.error('Error fetching forecast data:', error);
            forecastWidget.innerHTML = "<p>Could not load 5-day forecast.</p>";
        });
}