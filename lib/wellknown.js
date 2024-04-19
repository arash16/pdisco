const paramList = require('fs')
  .readFileSync(__dirname + '/list-param.txt', 'utf8')
  .trim().split(/\n/)
  .flatMap(p => p.split(/_/g).join('[_.-]?'));

const reStatic = /^(q|l|to|.*id)$/i;
const reList3 = new RegExp('^(' + paramList.join('|') + ')$', 'i');
// const reList = new RegExp(list.filter(s => s.length > 3).join('|'), 'i');

const domList = require('fs')
  .readFileSync(__dirname + '/list-dom.txt', 'utf8')
  .trim().split(/\n/);
const reDom = new RegExp('^(' + domList.join('|') + ')$');

module.exports = {
  param: key => reStatic.test(key) || reList3.test(key),// || reList.test(key),
  dom: key => reDom.test(key),
};
