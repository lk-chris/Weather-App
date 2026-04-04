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
    precipitation: document.querySelector('.precipitation')
}



async function getWeatherData(lat, lon, name, country){
   let cityCoords = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,relative_humidity_2m,apparent_temperature,precipitation&hourly=temperature_2m`;

    try{
        const response = await fetch(cityCoords);
        const data = await response.json();

        console.log('data recieved',data)
        let temp = data.current.temperature_2m;
        let tempUnit = data.current_units.temperature_2m;


        ui.temp.textContent = `${temp} ${tempUnit}`;
        ui.humidity.textContent = `${data.current.relative_humidity_2m}`;
        ui.windSpeed.textContent = `${data.current.wind_speed_10m}`;
        ui.city.textContent =`${name}`
        ui.country.textContent = `${country}`

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
        await getWeatherData(coords.lat, coords.lon, cityName, coords.country)

    }catch(error){
        console.error("Oops couldn't fetch city weather")
    }
}

ui.searchBtnEnter.addEventListener('submit', (e) => {
    e.preventDefault()
    let cityName = ui.search.value.trim()
    fetchCityWeather(cityName);
    ui.search.value = "";
})