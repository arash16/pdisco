#!/usr/bin/env node

const { readFileSync } = require("fs");
const { program } = require("commander");
const { table } = require("table");
const parseHtml = require("./parseHtml");
const parseJs = require("./parseJs");
const parseUrls = require("./parseUrls");
const sort = require("./sort");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const { help, full, short } = program
  .option("-h, --help", 'print this help text')
  .option("-f, --full", 'print full table with all scores')
  .option("-s, --short", 'print short table, each param with it\'s total score')
  .parse()
  .opts();

if (help) {
  program.addHelpText('afterAll', `
Provide input as Standard I/O

Example calls:
  $ echo example.com | pdisco
  $ cat url-list.txt | pdisco
  $ cat file.html | pdisco`);
  program.help();
}

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

const objToStr = (obj) =>
  Object.entries(obj)
    .map((x) => x.join(": "))
    .join("\n");

!(async function () {
  const stdIn = readFileSync(0, "utf-8").trim();
  const results = await parse(stdIn);
  const sorted = sort(results);

  if (full) {
    console.log(
      table(
        sorted.map(({ name, weights, total, ...rest }, i) => [
          i + 1,
          name,
          total,
          objToStr(weights),
          objToStr(rest),
        ])
      )
    );
  } else if (short) {
    console.log(
      table(
        sorted.map(({ name, weights, total, ...rest }, i) => [
          i + 1,
          name,
          total,
        ])
      )
    );
  } else {
    console.log(sorted.map((x) => x.name).join("\n"));
  }
})();
