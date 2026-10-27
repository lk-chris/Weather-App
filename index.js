const ui = {
    search: document.querySelector('.search-input'),
    searchButton: document.querySelector('.search-btn'),
    searchBtnEnter: document.querySelector('#weather-form'),
    // Overview section
    city: document.querySelector('.wi-city-name'),
    country: document.querySelector('.wi-country'),
    date: document.querySelector('.wi-date'),
    temp: document.querySelector('.overview-temp'),
    weatherIcon: document.querySelector('.wi-img'),
    search: document.querySelector('.search-input'),
    suggestions: document.querySelector('.drop-down'),
    unitBtn: document.querySelector('.units-btn'),
    unitDropdown: document.querySelector('.units-dropdown'),
    dropDownOpt: document.querySelectorAll('.units-div .units-btn'),
    //Stats grid
    feelsLike: document.querySelector('.feels-like'),
    humidity: document.querySelector('.humidity'),
    windSpeed: document.querySelector('.wind-speed'),
    precipitation: document.querySelector('.precipitation'),
    suffix: document.querySelector('.ms-wind .suffix'),
    precipSuffix: document.querySelector('.ms-precipitation .suffix'),
    //Daily forecast
    forecastDays: document.querySelectorAll('.forecast-day'),
    //Hourly forecast
    hourlyItems: document.querySelectorAll('.hourly-forecast-info')
}

const weatherMap = {
    0: 'icon-sunny.webp',           // clear skies
    2: 'icon-partly-cloudy.webp',   // partly cloudy
    3: 'icon-overcast.webp',        // Overcast
    71: 'icon-snow.webp',            // snowing
    53: 'icon-drizzle.webp',         // light rain
    81: 'icon-rain.webp',           // light showers
    82: 'icon-storm.webp',           // heavy rain
    45: 'icon-fog.webp',             // foggy
}


async function getWeatherData(lat, lon, name, country){
    const tempUnit = document.querySelector('.units-btn.is-selected[data-type="temperature_unit"]').dataset.value;

    const windUnit = document.querySelector('.units-btn.is-selected[data-type="wind_unit"]').dataset.value;

    const precipUnit = document.querySelector('.units-btn.is-selected[data-type="precipitation_unit"]').dataset.value;

    let cityCoords = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,relative_humidity_2m,apparent_temperature,precipitation,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&hourly=temperature_2m,weather_code&timezone=auto&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}&precipitation_unit=${precipUnit}`;


    try{
        const response = await fetch(cityCoords);
        const data = await response.json();

        //Overview Images
        const code = data.current.weather_code;
        const iconFile = weatherMap[code] || 'icon-overcast.webp';
        console.log("API Weather Code:", code);
        console.log("Mapped File:", iconFile);

        if (iconFile) {
            ui.weatherIcon.src = `./assets/images/${iconFile}`;
        } else {
            console.warn("No icon found for code:", code);
            ui.weatherIcon.src = `./assets/images/icon-overcast.webp`; // Fallback
        }


        console.log('data recieved',data)

        // Overview Info & Stats Grid
        let temp = data.current.temperature_2m;
        let tempUnit = data.current_units.temperature_2m;
        ui.temp.innerHTML = `${temp}°`;
        ui.humidity.textContent = `${data.current.relative_humidity_2m}`;
        ui.windSpeed.textContent = `${data.current.wind_speed_10m}`;
        ui.city.textContent =`${name}`
        ui.country.textContent = `${country}`;
        ui.suffix.textContent = data.current_units.wind_speed_10m;
        ui.precipSuffix.textContent = data.current_units.precipitation;
    

        // Date
        ui.date.textContent = getFormattedDate(data.current.time)

        // Daily forecast
        const daily = data.daily;
        ui.forecastDays.forEach((dayCard, index) => {
        const weekdayLabel = dayCard.querySelector('.forecast-weekday');
        const dayIcon = dayCard.querySelector('.forecast-img');
        const highTemp = dayCard.querySelector('.forecast-temp-high') 
        const lowTemp = dayCard.querySelector('.forecast-temp-low')

        if (!weekdayLabel || !highTemp || !lowTemp) return;

        // 3. Injection
        weekdayLabel.textContent = getFormattedDate(daily.time[index], true);
        highTemp.textContent = `${Math.round(daily.temperature_2m_max[index])}°`;
        lowTemp.textContent = `${Math.round(daily.temperature_2m_min[index])}°`;

        const dayCode = daily.weather_code[index];
        dayIcon.src = `./assets/images/${weatherMap[dayCode] || 'icon-overcast.webp'}`;
        })

        // Hourly forecast
        // 1. Get the Hourly Data
        const hourly = data.hourly;
        const currentHourISO = data.current.time;

        // 2. Find where in the 168-hour array the current time starts
        const startIndex = hourly.time.findIndex(t => t === currentHourISO);

        // 3. Loop through your 8 HTML cards
        ui.hourlyItems.forEach((hourCard, index) => {
            // We add 'index' to 'startIndex' to get the next 8 hours in sequence
            const dataIndex = startIndex + index;

            // Elements inside the card
            const hourTime = hourCard.querySelector('.hfi-time');
            const hourTemp = hourCard.querySelector('.hfi-temp');
            const hourIcon = hourCard.querySelector('img');

            // Safety: If the API didn't return enough hours (rare) or indexing failed
            if (!hourly.time[dataIndex]) return;

            // Convert ISO string to "3 PM" format
            const date = new Date(hourly.time[dataIndex]);
            hourTime.textContent = date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                hour12: true
            });

    // Temperature (Rounding for cleanliness)
    hourTemp.textContent = `${Math.round(hourly.temperature_2m[dataIndex])}°`;

    // Icon Mapping
    const hourCode = hourly.weather_code[dataIndex];
    hourIcon.src = `./assets/images/${weatherMap[hourCode] || 'icon-overcast.webp'}`;
});

        console.log(`Temperature in ${name} is ${temp} ${tempUnit}`)
        return { name, country, temp: `${Math.round(temp)}°` };
    }catch(error){
        console.error("Ooops couldn't fetch data", error)
    }

};

async function getCoards(cityName){
    if(!cityName) return;

    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=1&language=en&format=json`

    try{
        const response = await fetch(url);
        const data = await response.json();

        const firstResult = data.results[0];

        console.log(`Found ${cityName} at:`, firstResult.latitude, firstResult.longitude);
        return{
            lat: firstResult.latitude,
            lon: firstResult.longitude,
            country: firstResult.country
        };

    }catch(error){
        console.error("Oops couldn't fetch City data", error)
    }
}

async function fetchCityWeather(cityName, isStackPush = true){

    const coords = await getCoards(cityName)

    if(!coords){
        console.log("Could not find that city");
        return null;
    }
    try{
        showLoading();
        const weatherInfo = await getWeatherData(coords.lat, coords.lon, cityName, coords.country);
        hideLoading();
        if (isStackPush && weatherInfo && typeof navStack !== 'undefined') {
            navStack.push({
                name: weatherInfo.name,
                country: weatherInfo.country,
                temp: weatherInfo.temp
            });
        }
        return weatherInfo;
    }catch(error){
        console.error("Oops couldn't fetch city weather", error);
        hideLoading();
        return null;
    }
}

// Search Suggestion
let debounceTimer;
ui.search.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    clearTimeout(debounceTimer);

    if (query.length < 2) {
        ui.suggestions.classList.add('hidden');
        return;
    }

    debounceTimer = setTimeout(() => fetchSuggestions(query), 200);
});

async function fetchSuggestions(query) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5&language=en&format=json`;
    try {
        const response = await fetch(url);
        const data = await response.json(); // CRITICAL: Added await
        
        if (data.results) {
            renderSuggestions(data.results);
        } else {
            ui.suggestions.classList.add('hidden');
        }
    } catch (err) { console.error(err); }
}

function renderSuggestions(cities) {
    ui.suggestions.innerHTML = '';
    ui.suggestions.classList.remove('hidden');

    cities.forEach(city => {
        const div = document.createElement('div');
        div.className = 'city-search';
        div.innerHTML = `<p>${city.name}, <span>${city.country || ''}</span></p>`;
        
        div.addEventListener('click', () => {
            ui.search.value = `${city.name}, ${city.country || ''}`;
            ui.suggestions.classList.add('hidden');
            fetchCityWeather(city.name); // Triggers the loading state flow
        });
        ui.suggestions.appendChild(div);
    });
}

// 3. Coordinate Loading States
function showLoading() {
    const cards = [
        document.querySelector('.overview'),
        ...document.querySelectorAll('.ms-info'),
        ...ui.forecastDays,
        ...ui.hourlyItems
    ];
    cards.forEach(card => card?.classList.add('is-loading'));
}

function hideLoading() {
    document.querySelectorAll('.is-loading').forEach(card => card.classList.remove('is-loading'));
}

ui.searchBtnEnter.addEventListener('submit', (e) => {
    e.preventDefault()
    let cityName = ui.search.value.trim()
    fetchCityWeather(cityName);
    ui.search.value = "";
})

function getFormattedDate(apiDateString, isShort = false){
    const dateObj = new Date(apiDateString)

    const options = isShort
    ? { weekday: 'short'}
    : {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    }

    return dateObj.toLocaleDateString('en-Us', options);
}

function showLoading() {
    // Grab the main overview card, the 4 stat boxes, and all forecast items
    const cards = [
        document.querySelector('.overview'), // The big main one
        ...document.querySelectorAll('.ms-info'),  // The 4 small stats
        ...ui.forecastDays,                       // The 7 day cards
        ...ui.hourlyItems                         // The hourly sidebar items
    ];

    cards.forEach(card => {
        if(card) card.classList.add('is-loading');
    });
}

function hideLoading() {
    const loadingCards = document.querySelectorAll('.is-loading');
    loadingCards.forEach(card => card.classList.remove('is-loading'));
}


// DROPDOWNS

ui.unitBtn.addEventListener('click', (event) => {
    let element = ui.unitDropdown;
    
    if (element.classList.contains('hidden')){
        element.classList.remove('hidden')
        element.classList.add('active')
    }else{
        element.classList.add('hidden')
        element.classList.remove('active')
    }
})

ui.dropDownOpt.forEach((option) => {
    option.addEventListener('click', (e)=> {
        const clickedType = e.currentTarget.dataset.type;
        const oldActiveBtn = document.querySelector(`.units-btn.is-selected[data-type = "${clickedType}"]`)

        if (oldActiveBtn){
            oldActiveBtn.classList.remove('is-selected')
        }

        e.currentTarget.classList.add('is-selected');
        let renewedCity = ui.city.textContent;
        fetchCityWeather(renewedCity);
    })
})

// Dropdown close
document.addEventListener('click', (event) => {
    const isClickInsideDropdown = event.target.closest('.units-dropdown');

    const isClickOnButton = event.target.closest('.units-btn')

    if(!isClickInsideDropdown && !isClickOnButton){
        ui.unitDropdown.classList.add('hidden');
        ui.unitDropdown.classList.remove('active');
    }
})

/* =========================================================
   NAVIGATION HISTORY STACK IMPLEMENTATION (LIFO)
   ========================================================= */

class NavigationHistoryStack {
    constructor(initialItem = null) {
        this.stack = [];
        this.forwardStack = [];
        this.lastAction = 'INIT(Berlin)';
        
        if (initialItem) {
            this.push(initialItem, false);
        }
    }

    push(item, shouldClearForward = true) {
        // Prevent duplicate consecutive top entries
        const currentTop = this.peek();
        if (currentTop && currentTop.name.toLowerCase() === item.name.toLowerCase()) {
            if (item.temp) currentTop.temp = item.temp;
            this.render();
            return;
        }

        const stackItem = {
            id: 'frame-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            name: item.name,
            country: item.country || '',
            temp: item.temp || '--',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };

        this.stack.push(stackItem);
        if (shouldClearForward) {
            this.forwardStack = [];
        }
        this.lastAction = 'PUSH(' + item.name + ')';
        this.render();
    }

    pop() {
        if (this.stack.length <= 1) {
            console.warn("Stack Underflow Guard: Cannot pop base location from navigation stack.");
            return null;
        }
        const popped = this.stack.pop();
        this.forwardStack.push(popped);
        this.lastAction = 'POP(' + popped.name + ')';
        this.render();
        return this.peek();
    }

    forward() {
        if (this.forwardStack.length === 0) {
            return null;
        }
        const item = this.forwardStack.pop();
        this.stack.push(item);
        this.lastAction = 'FORWARD(' + item.name + ')';
        this.render();
        return item;
    }

    popTo(targetId) {
        if (this.stack.length <= 1) return null;
        const targetIndex = this.stack.findIndex(frame => frame.id === targetId);
        if (targetIndex === -1 || targetIndex === this.stack.length - 1) return null;

        while (this.stack.length - 1 > targetIndex) {
            const popped = this.stack.pop();
            this.forwardStack.push(popped);
        }
        this.lastAction = 'POP_TO(' + this.peek().name + ')';
        this.render();
        return this.peek();
    }

    peek() {
        return this.stack.length > 0 ? this.stack[this.stack.length - 1] : null;
    }

    size() {
        return this.stack.length;
    }

    resetToBase() {
        if (this.stack.length <= 1) return null;
        const root = this.stack[0];
        while (this.stack.length > 1) {
            this.forwardStack.push(this.stack.pop());
        }
        this.lastAction = 'RESET(' + root.name + ')';
        this.render();
        return root;
    }

    render() {
        const depthLabel = document.getElementById('stack-depth-label');
        const lastActionEl = document.getElementById('stack-last-action');
        const backBtn = document.getElementById('stack-back-btn');
        const forwardBtn = document.getElementById('stack-forward-btn');
        const framesList = document.getElementById('stack-frames-list');

        if (depthLabel) depthLabel.textContent = 'Stack Depth: ' + this.stack.length;
        if (lastActionEl) lastActionEl.textContent = this.lastAction;

        if (backBtn) {
            backBtn.disabled = this.stack.length <= 1;
        }
        if (forwardBtn) {
            forwardBtn.disabled = this.forwardStack.length === 0;
        }

        if (framesList) {
            framesList.innerHTML = '';
            // Render from TOP (highest index) down to BASE (index 0)
            for (let i = this.stack.length - 1; i >= 0; i--) {
                const frame = this.stack[i];
                const isTop = (i === this.stack.length - 1);

                const itemDiv = document.createElement('div');
                itemDiv.className = 'stack-frame-item' + (isTop ? ' is-top' : '');
                
                const levelLabel = isTop ? 'TOP' : '#' + (i + 1);

                itemDiv.innerHTML = `
                    <div class="sfi-lhs">
                        <span class="sfi-level">${levelLabel}</span>
                        <div class="sfi-details">
                            <span class="sfi-city">${frame.name}${frame.country ? ', ' + frame.country : ''}</span>
                            <span class="sfi-time">Visited: ${frame.timestamp}</span>
                        </div>
                    </div>
                    <div class="sfi-rhs">
                        <span class="sfi-temp">${frame.temp}</span>
                        ${isTop ? '<span class="sfi-tag">Active View</span>' : '<button type="button" class="sfi-jump-btn" data-id="' + frame.id + '">Pop to Here</button>'}
                    </div>
                `;

                framesList.appendChild(itemDiv);
            }

            // Wire up "Pop to Here" buttons
            framesList.querySelectorAll('.sfi-jump-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.id;
                    const targetFrame = navStack.popTo(id);
                    if (targetFrame) {
                        fetchCityWeather(targetFrame.name, false);
                    }
                });
            });
        }
    }
}

// Initialize Stack with Default Location (Berlin)
const navStack = new NavigationHistoryStack({
    name: 'Berlin',
    country: 'Germany',
    temp: '25°'
});

// Attach Navigation Control Listeners
document.addEventListener('DOMContentLoaded', () => {
    navStack.render();
});

const stackBackBtn = document.getElementById('stack-back-btn');
if (stackBackBtn) {
    stackBackBtn.addEventListener('click', () => {
        const previous = navStack.pop();
        if (previous) {
            fetchCityWeather(previous.name, false);
        }
    });
}

const stackForwardBtn = document.getElementById('stack-forward-btn');
if (stackForwardBtn) {
    stackForwardBtn.addEventListener('click', () => {
        const next = navStack.forward();
        if (next) {
            fetchCityWeather(next.name, false);
        }
    });
}

const stackResetBtn = document.getElementById('stack-reset-btn');
if (stackResetBtn) {
    stackResetBtn.addEventListener('click', () => {
        const base = navStack.resetToBase();
        if (base) {
            fetchCityWeather(base.name, false);
        }
    });
}

const toggleInspectorBtn = document.getElementById('toggle-stack-inspector-btn');
const stackInspectorCard = document.getElementById('stack-inspector-card');
if (toggleInspectorBtn && stackInspectorCard) {
    toggleInspectorBtn.addEventListener('click', () => {
        const isCollapsed = stackInspectorCard.classList.toggle('collapsed');
        toggleInspectorBtn.classList.toggle('active', !isCollapsed);
    });
}

// Initial live fetch to hydrate initial stack frame with real temperature
fetchCityWeather('Berlin', false);
