const Mustache = require('mustache');
const fs = require('fs');
const MUSTACHE_MAIN_DIR = './main.mustache';

const DATA = {
  name: 'Sam',
  date: new Date().toLocaleDateString('en-us', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZoneName: 'short',
    timeZone: 'America/Toronto',
  }),
};

function generateReadme() {
  fs.readFile(MUSTACHE_MAIN_DIR, (error, data) => {
    if (error) throw error;

    const output = Mustache.render(data.toString(), DATA)
    fs.writeFileSync('README.md', output);
  });
}

generateReadme();
