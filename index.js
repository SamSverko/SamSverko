require('dotenv').config();
const fs = require('fs');
const Mustache = require('mustache');
const fetch = require('node-fetch')
const readline = require('readline');
const parseString = require('xml2js').parseString;

const MUSTACHE_MAIN_DIR = './main.mustache';

let DATA = {
  name: 'Sam',
  book: {
    title: false,
    author: false,
    image: false,
    url: false,
  },
  refresh_date: new Date().toLocaleDateString('en-us', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZoneName: 'short',
    timeZone: 'America/Toronto',
  }),
};

async function setWeatherData() {
  process.stdout.write('\033[36m ⛅ Fetching weather data...');

  await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${process.env.LOCATION_LAT}&lon=${process.env.LOCATION_LON}&appid=${process.env.OPEN_WEATHER_MAP_KEY}&units=metric`
  )
    .then(response => response.json())
    .then(response => {
      DATA.city_temperature = Math.round(response.main.temp);
      DATA.city_weather = response.weather[0].description;
      DATA.city_weather_icon = `https://openweathermap.org/img/wn/${response.weather[0].icon}@2x.png`;
      DATA.sun_rise = new Date(response.sys.sunrise * 1000).toLocaleString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Toronto',
      });
      DATA.sun_set = new Date(response.sys.sunset * 1000).toLocaleString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Toronto',
      });

      readline.clearLine(process.stdout);
      readline.cursorTo(process.stdout, 0);
      process.stdout.write('\033[36m ✅ Weather data saved!');
      process.stdout.write('\n');
    })
    .catch((error) => {
      throw new Error(error);
    });
}

async function setBookReadingData() {
  process.stdout.write('\033[36m 📖 Fetching book reading data...');

  await fetch(
    `https://www.goodreads.com/review/list/${process.env.GOODREADS_USER_ID}.xml?key=${process.env.GOODREADS_KEY}&v=2&shelf=currently-reading`
  )
    .then(response => response.text())
    .then(str => parseString(str, (error, result) => {
      if (error) throw new Error(error);

      const currentlyReading = result.GoodreadsResponse.reviews[0].review[0].book[0];
      DATA.book.title = currentlyReading.title_without_series[0];
      DATA.book.author = currentlyReading.authors[0].author[0].name[0]
      DATA.book.image = currentlyReading.image_url[0];
      DATA.book.url = currentlyReading.link[0];

      readline.clearLine(process.stdout);
      readline.cursorTo(process.stdout, 0);
      process.stdout.write('\033[36m ✅ Book reading data saved!');
      process.stdout.write('\n');
    }))
    .catch((error) => {
      throw new Error(error);
    });
}

async function generateReadMe() {
  process.stdout.write('\033[36m 🖊️  Generating README...');

  await fs.readFile(MUSTACHE_MAIN_DIR, (error, data) => {
    if (error) throw new Error(error);

    const output = Mustache.render(data.toString(), DATA);
    fs.writeFileSync('README.md', output);
  });
}

async function action() {
  await setWeatherData();

  await setBookReadingData();

  await generateReadMe();

  readline.clearLine(process.stdout);
  readline.cursorTo(process.stdout, 0);
  process.stdout.write('\033[36m ✅ README successfully generated!');
  process.stdout.write('\n');
}

action();
