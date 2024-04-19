const parseUrls = require("./parseUrls");
const parseHtml = require("./parseHtml");
const parseJs = require("./parseJs");
const sort = require("./sort");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";


const isUrlRe = /^https?:\/\//;
const seenUrl = {};
async function parse(input, path, root = true) {
  input = input.trim();
  const result = parseUrls(input);

  if (input.startsWith("<")) {
    result.push(...parseHtml(input, path));
  } else if (root && isUrlRe.test(input)) {
    const lines = [
      ...new Set(
        input
          .split(/\n+/)
          .map((ln) => ln.trim())
          .filter((ln) => isUrlRe.test(ln))
      ),
    ];

    while (lines.length) {
      const batch = lines.splice(0, 10);
      await Promise.all(
        batch.map(async (ln) => {
          const u = new URL(ln);
          const key = u.origin + u.pathname;
          if (seenUrl[key]) return;
          seenUrl[key] = true;

          try {
            const content = await fetch(ln).then((x) => x.text());
            console.error("fetched", ln);
            if (/\.js(\?.*)?$/.test(ln)) {
              result.push(...(await parseJs(content, ln)));
            } else {
              result.push(...(await parse(content, ln)));
            }
          } catch (err) {
            console.error("Error in url: " + ln, err);
          }
        })
      );
    }
    return result;
  } else {
    result.push(...parseJs(input, path));
  }

  return result;
}

module.exports = async (content) => {
  const results = await parse(content);
  return sort(results);
};
