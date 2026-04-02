let berlin = "https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current=temperature_2m,wind_speed_10m&hourly=temperature_2m ";

async function getWeatherData(lat, lon){
    try{
        const response = await fetch(berlin);
        const data = await response.json();

        console.log('data recieved',data)

        let temp = data.current.temperature_2m;
        console.log(`Temperature in Berlin is ${temp}`)
    }catch(error){
        console.error("Ooops couldn't fetch data", error)
    }

};

getWeatherData();

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

        console.log(data, 'city')
    }catch(error){
        console.error("Oops couldn't fetch City data", error)
    }
}
getCoards('London');