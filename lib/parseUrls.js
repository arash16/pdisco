
const qsRe = /[?&]([\w\[\]$_.-]+)=/g;
module.exports = (code, path) => {
  if (!code) return [];

  console.error('parse urls', path);
  const decodedBrackets = code.replaceAll(/%5b/g, '[').replaceAll(/%5d/g, ']');
  return [...decodedBrackets.matchAll(qsRe)].map(x => ({
    where: 'qs',
    value: x[1],
  }));
};
