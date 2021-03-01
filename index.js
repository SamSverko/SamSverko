require('dotenv').config()
const fs = require('fs')
const Mustache = require('mustache')
const fetch = require('node-fetch')

const FETCH_URL_WEATHER =
  'https://api.openweathermap.org/data/2.5/weather' +
  `?appid=${process.env.OPEN_WEATHER_MAP_KEY}` +
  `&lat=${process.env.LOCATION_LAT}` +
  `&lon=${process.env.LOCATION_LON}` +
  '&units=metric'

async function fetchData(name, fetchUrl, dataFormat) {
  console.log('\033[36m 🚚 [' + name + '] Fetching data...')

  const RESPONSE = await fetch(fetchUrl)

  if (RESPONSE.status === 200) {
    console.log('\033[32m 📦 [' + name + '] Fetching complete!')

    let data =
      (dataFormat === 'json') ? await RESPONSE.json() : await RESPONSE.text()
    return data
  }

  throw new Error(`Could not fetch ${name} data.`)
}

async function generateREADME(WEATHER_DATA) {
  console.log('\033[36m 📄 [README] Generating README...')

  const README_DATA = {
    refresh_date: new Date().toLocaleDateString('en-us', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      timeZoneName: 'short',
      timeZone: 'America/Toronto',
    }),
    weather: { ...WEATHER_DATA },
  }

  await fs.readFile('./main.mustache', (error, data) => {
    if (error) {
      throw new Error(error)
    }

    const OUTPUT = Mustache.render(data.toString(), README_DATA)
    fs.writeFileSync('README.md', OUTPUT)

    console.log('\033[32m ✅ [README] Generating complete!\033[0m')
  })
}

async function init() {
  console.log('\033[36m 🟢 Initialize...')

  try {
    const WEATHER_DATA = await fetchData('weather', FETCH_URL_WEATHER, 'json')
      .then((response) => {
        console.log('\033[36m 🔍 [weather] Parsing data...')

        return {
          description: response.weather[0].description,
          icon: 'https://openweathermap.org/img/wn/' +
            response.weather[0].icon + '@2x.png',
          temperature: Math.round(response.main.temp),
        }
      })
    console.log('\033[32m 🎁 [weather] Parsing complete!')

    generateREADME(WEATHER_DATA)
  } catch (error) {
    throw new Error(error)
  }
}

init()
