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
    //Stats grid
    feelsLike: document.querySelector('.feels-like'),
    humidity: document.querySelector('.humidity'),
    windSpeed: document.querySelector('.wind-speed'),
    precipitation: document.querySelector('.precipitation'),
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
    let cityCoords = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,relative_humidity_2m,apparent_temperature,precipitation,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&hourly=temperature_2m,weather_code&timezone=auto`;

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
        ui.temp.innerHTML = `${temp}<span class="unit">${tempUnit}</span>`;
        ui.humidity.textContent = `${data.current.relative_humidity_2m}`;
        ui.windSpeed.textContent = `${data.current.wind_speed_10m}`;
        ui.city.textContent =`${name}`
        ui.country.textContent = `${country}`

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

async function fetchCityWeather(cityName){

    const coords = await getCoards(cityName)

    if(!coords){
        console.log("Could not find that city");
        return
    }
    try{
        showLoading();
        await getWeatherData(coords.lat, coords.lon, cityName, coords.country)
        hideLoading();
    }catch(error){
        console.error("Oops couldn't fetch city weather")
        hideLoading();
    }
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

// skeleton Logic
function showLoading() {
    // Grab the main overview card, the 4 stat boxes, and all forecast items
    const cards = [
        document.querySelector('.overview-card'), // The big main one
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