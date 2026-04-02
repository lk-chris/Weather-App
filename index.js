async function getWeatherData(lat, lon, name){
    let cityCoords = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m&hourly=temperature_2m `;

    try{
        const response = await fetch(cityCoords);
        const data = await response.json();

        console.log('data recieved',data)
        let temp = data.current.temperature_2m;
        let tempUnit = data.current_units.temperature_2m;

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
            lon: firstResult.longitude
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
        await getWeatherData(coords.lat, coords.lon, cityName)

    }catch(error){
        console.error("Oops couldn't fetch city weather")
    }
}
console.log(fetchCityWeather("Accra"));