#!/usr/bin/env node

const { readFileSync } = require("fs");
const { program } = require("commander");
const { table } = require("table");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const { help, full, short } = program
  .option("-h, --help", "print this help text")
  .option("-f, --full", "print full table with all scores")
  .option("-s, --short", "print short table, each param with it's total score")
  .parse()
  .opts();

if (help) {
  program.addHelpText(
    "beforeAll",
    `pdisco ${require('./package.json').version}: Simple parameter discovery for bug bounties.\n`
  );

  program.addHelpText(
    "afterAll",
    `
Provide input as Standard I/O

Example calls:
  $ echo example.com | pdisco
  $ cat url-list.txt | pdisco
  $ cat file.html | pdisco`
  );
  program.help();
}

const objToStr = (obj) =>
  Object.entries(obj)
    .map((x) => x.join(": "))
    .join("\n");

!(async function () {
  const stdIn = readFileSync(0, "utf-8").trim();
  const results = run(stdIn);

  if (full) {
    console.log(
      table(
        results.map(({ name, weights, total, ...rest }, i) => [
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
        results.map(({ name, weights, total, ...rest }, i) => [
          i + 1,
          name,
          total,
        ])
      )
    );
  } else {
    console.log(results.map((x) => x.name).join("\n"));
  }
})();
