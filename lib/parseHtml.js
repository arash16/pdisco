const cheerio = require('cheerio');
const parseJs = require('./parseJs');

module.exports = (html, path) => {
  if (!html) return [];

  console.error('parse html', path);
  const $ = cheerio.load(html);
  const results = [];

  for (const el of [...$('[name],[id]')]) {
    if (el.attribs.name) {
      results.push({ where: 'nameAttr', value: el.attribs.name });
    }

    if (el.attribs.id) {
      results.push({ where: 'idAttr', value: el.attribs.id });
    }
  }

  for (const el of [...$('script')]) {
    if (el.children[0]?.data && (!el.attribs.type || /script/.test(el.attribs.type))) {
      results.push(...parseJs(el.children[0]?.data, path, true));
    }
  };

  return results;
};
