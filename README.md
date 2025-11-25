# Global Lens Dashboard 👁️🌍

**Global Lens** is an interactive, API-driven dashboard designed to provide an instant, hyper-local snapshot of any location on Earth. By aggregating real-time weather data, interactive mapping, and localized news headlines into a single interface, Global Lens creates a seamless "command center" for global awareness.

In a world where information is fragmented across weather apps, map services, and news portals, Global Lens unifies these streams. Whether you are a traveler planning a trip to Tokyo, a commuter checking the rain in Singapore, or a digital nomad scouting a new city, this application delivers the essential context you need in seconds.

---

## 🎨 UX (User Experience)

### **Target Audience**
This application is designed for travelers, daily commuters, and geography enthusiasts who value speed and convenience. The user wants to avoid switching tabs between Google Maps, a weather site, and a news outlet. They want immediate visual confirmation of a location's status.

### **User Stories**
* **As a traveler**, I want to **search for a specific city** so that **I can see the current weather and forecast before I pack.**
* **As a commuter**, I want to **click a "Use My Location" button**, so that **I can instantly see the weather and news for my exact current position.**
* **As a user prone to typos**, I want **autocomplete suggestions when I type**, so that **I don't accidentally search for a city that doesn't exist.**
* **As a night-owl**, I want to **toggle a Dark Mode**, so that **the interface is comfortable to read at night.**
* **As a visual learner**, I want to **see an interactive map with a marker**, so that **I can understand exactly where the city is located.**

### **Design Process**
The interface was designed with a "Mobile-First" approach, ensuring that the widgets stack cleanly on smartphones (iPhone/Android) while expanding to a grid layout on desktop screens. Visual cues, such as loading spinners and error messages, were prioritized to ensure the user is never left guessing if the app is working.

---

## 🚀 Features

This project utilizes a "Mashup" architecture, combining three distinct third-party APIs to generate dynamic content.

### **Existing Features**
* **Global Location Search & Autocomplete:** Allows users to type any city name. As they type (3+ characters), a dropdown list fetches real-time suggestions via the OpenWeather Geocoding API to prevent typos.
* **Geolocation Support:** A "Use My Location" button (📍) utilizes the HTML5 Geolocation API to detect the user's coordinates and instantly load data for their physical location.
* **Real-Time Weather & Forecast:** Displays the current temperature, weather condition icons, and a 5-day forecast carousel using the OpenWeatherMap API.
* **Interactive Vector Map:** Embeds a Mapbox GL JS map that flies to the searched location. A custom marker with a popup displays the city name and temperature directly on the map.
* **Localized News Feed:** Fetches the latest news articles specifically *about* the searched city using the GNews API, displayed with thumbnails and source attribution.
* **Persistent Dark Mode:** A toggle switch allows users to switch between Light and Dark themes. The preference is saved in the browser's `localStorage`, so the app remembers the setting on the next visit.
* **Responsive Design:** The layout adapts using CSS Flexbox and Media Queries to ensure usability on devices of all sizes.

### **Features Left to Implement**
* **Favorite Locations:** A feature to allow users to "pin" or save frequently visited cities to a quick-access list using LocalStorage.
* **Unit Conversion:** A toggle to switch between Celsius (Metric) and Fahrenheit (Imperial).

---

## 🛠️ Technologies Used

* **[HTML5](https://developer.mozilla.org/en-US/docs/Web/HTML):** Used for the semantic structure of the application.
* **[CSS3](https://developer.mozilla.org/en-US/docs/Web/CSS):** Used for styling, CSS Grid/Flexbox layouts, and animations (blinking logo, spinners).
* **[JavaScript (ES6)](https://developer.mozilla.org/en-US/docs/Web/JavaScript):** Used for DOM manipulation, API fetch logic, and event handling.
* **[OpenWeatherMap API](https://openweathermap.org/api):** Used for current weather data, 5-day forecasts, and autocomplete geocoding.
* **[Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/api/):** Used to render the interactive 3D-enabled map.
* **[GNews API](https://gnews.io/):** Used to fetch news articles based on search queries. // Max 100 req per day :( sadge
* **[Git & GitHub](https://github.com/):** Used for version control and hosting the repository.

---

## 🧪 Testing

Testing was conducted manually via scenario-based testing to ensure all User Stories were fulfilled.

### **Testing Scenarios**

1.  **Search Functionality**
    * *Action:* Typed "Lond" into the search bar.
    * *Result:* Autocomplete dropdown appeared with "London, GB".
    * *Action:* Clicked "London, GB".
    * *Result:* Dashboard updated with UK news, London weather, and map flew to London.
    <br>1.1  **Not as expected** 
           * *Action:* Typed "Lond" into the search bar. // Autocomplete will recommend but not exactly what you want*.
           
    

2.  **Geolocation**
    * *Action:* Clicked the 📍 button.
    * *Result:* Browser asked for permission. Upon "Allow", the dashboard updated to my current physical location.

3.  **Error Handling**
    * *Action:* Searched for a nonsense string (e.g., "fsdfsdf").
    * *Result:* The loading spinners appeared briefly, followed by a red "⚠️ Location not found" error message in the widget. The app did not crash.

4.  **Responsiveness (Mobile)**
    * *Action:* Opened Developer Tools and toggled "iPhone 12 Pro" view.
    * *Result:* The header layout shifted to a column stack. The search button and pin button sat side-by-side on a new row, making them easy to tap. The Dark Mode switch centered itself.

5.  **Dark Mode Persistence**
    * *Action:* Toggled Dark Mode ON. Refreshed the browser.
    * *Result:* The site reloaded and immediately applied the Dark Mode theme without user input (validated `localStorage` logic).

### **Bugs & Issues**
* **API Limits:** The GNews API (Free Tier) is limited to 100 requests per day. During heavy testing, a `403 Forbidden` error may occur. This was handled by adding a specific error message in the UI ("Could not load news") rather than leaving the widget blank.

---

## 📦 Deployment

This project is deployed using **GitHub Pages**.

### **Deployment Process**
1.  The code was pushed to the `main` branch of the GitHub repository.
2.  In the repository Settings > Pages, the source was set to `main` branch / `root` folder.
3.  The live link was generated by GitHub.

### **How to Run Locally**
Because this project relies on API keys which are **not** included in the repository for security (they are ignored via `.gitignore`), you must create a configuration file to run it locally.

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/kaeuss/local-lens.git](https://github.com/kaeuss/local-lens.git)
    ```
2.  **Create the config file:**
    Create a file named `config.js` in the root folder.
3.  **Add your keys:**
    Paste the following code into `config.js` and insert your own free API keys:
    ```javascript
    const config = {
        OPENWEATHER_KEY: "YOUR_OPENWEATHER_KEY",
        MAPBOX_KEY: "YOUR_MAPBOX_KEY",
        GNEWS_KEY: "YOUR_GNEWS_KEY"
    };
    ```
4.  **Launch:** Open `index.html` in your browser (or use VS Code Live Server).

---

## 👏 Credits

### **Content**
* Weather data provided by [OpenWeatherMap](https://openweathermap.org/).
* Map data provided by [Mapbox](https://www.mapbox.com/).
* News headlines provided by [GNews.io](https://gnews.io/).

### **Acknowledgements**
* Thanks to my lecturer for the guidance on API integration best practices.
* Inspiration for the "Glassmorphism" dark mode style came from modern dashboard UI trends.
