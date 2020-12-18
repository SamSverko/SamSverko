require('dotenv').config()
const fs = require('fs')
const Mustache = require('mustache')
const fetch = require('node-fetch')
const xml2js = require('xml2js')

const FETCH_URL_BOOK =
  'https://www.goodreads.com/review/list/' +
  `${process.env.GOODREADS_USER_ID}.xml` +
  `?key=${process.env.GOODREADS_KEY}` +
  '&v=2' +
  '&shelf=currently-reading'

const FETCH_URL_GAME =
  'http://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/' +
  `?key=${process.env.STEAM_KEY}` +
  `&steamid=${process.env.STEAM_ID}` +
  '&format=json'

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
  } else {
    console.log(RESPONSE)
  }

  throw new Error(`Could not fetch ${name} data.`)
}

async function generateREADME(BOOK_DATA, GAME_DATA, WEATHER_DATA) {
  console.log('\033[36m 📄 [README] Generating README...')

  const README_DATA = {
    book: { ...BOOK_DATA },
    game: { ...GAME_DATA },
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
    const BOOK_DATA = await fetchData('book', FETCH_URL_BOOK, 'xml')
      .then((response) => {
        console.log('\033[36m 🔍 [book] Parsing data...')
        return xml2js.parseStringPromise(response).then((result) => {
          const CURRENTLY_READING =
            result.GoodreadsResponse.reviews[0].review[0].book[0]

          return {
            author: CURRENTLY_READING.authors[0].author[0].name[0],
            image: CURRENTLY_READING.image_url[0],
            title: CURRENTLY_READING.title_without_series[0],
            url: CURRENTLY_READING.link[0],
          }
        })
      })
    console.log('\033[32m 🎁 [book] Parsing complete!')

    const GAME_DATA = await fetchData('game', FETCH_URL_GAME, 'json')
      .then((response) => {
        console.log('\033[36m 🔍 [game] Parsing data...')

        const DATA_SORTED =
          response.response.games
            .sort((a, b) => (a.last_nom > b.last_nom) ?
              1 :
              ((b.last_nom > a.last_nom) ? -1 : 0))

        return {
          image:
            'http://media.steampowered.com/steamcommunity/public/images/apps/' +
            `${DATA_SORTED[0].appid}/` +
            `${DATA_SORTED[0].img_logo_url}.jpg`,
          name: DATA_SORTED[0].name,
          url: `https://store.steampowered.com/app/${DATA_SORTED[0].appid}`,
        }
      })
    console.log('\033[32m 🎁 [game] Parsing complete!')

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

    generateREADME(BOOK_DATA, GAME_DATA, WEATHER_DATA)
  } catch (error) {
    throw new Error(error)
  }
}

init()
