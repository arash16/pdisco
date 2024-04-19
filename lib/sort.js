const wellknown = require("./wellknown");

// variable
// member
// property
// nameAttr
// idAttr
// qs

module.exports = (results) => {
  const params = Object.create(null);
  Object.defineProperty(params, "__proto__", {
    value: undefined,
    writable: true,
    enumerable: true,
  });
  for (const { where, value, inline } of results) {
    if (!params[value]) {
      params[value] = {
        inline: false,
        variable: 0,
        member: 0,
        property: 0,
        nameAttr: 0,
        idAttr: 0,
        path: 0,
        qs: 0,
      };
    }
    params[value][where]++;
    params[value].inline ||= inline;
  }

  const score = weights => {
    const diversity =
      Boolean(weights.variable) +
      Boolean(weights.member || weights.property) +
      Boolean(weights.nameAttr) +
      Boolean(weights.idAttr) +
      Boolean(weights.qs);

    const occurrence =
      weights.member +
      weights.property +
      weights.nameAttr +
      weights.qs;

    return { occurrence, diversity };
  };

  const weighted = Object.entries(params).filter(x=>x[1]).map(([name, weights]) => ({
    name,
    weights,
    scores: score(weights),
  }));

  const occS = weighted.map(a => a.scores.occurrence).sort((a,b)=>a-b);
  const maxOcc = occS.at(-1)+1;
  const jendeh = occS.at(Math.ceil(occS.length*0.80));
  const scored = weighted.map(({name, weights, scores}) => {
    const occ = scores.occurrence / maxOcc;
    const div = scores.diversity / 5;
    const isWellknown = wellknown.param(name);
    const isInlineVar = !!weights.inline && Boolean(weights.variable)

    let total = 100000*weights.qs + 10*occ + div;
    if (isWellknown) total *= 100;
    if (isInlineVar) total *= 10;

    return {
      name,
      weights,
      ...scores,
      occ,
      div,
      isWellknown,
      isInlineVar,
      qss: Math.ceil(Math.log10(weights.qs+1)),
      total: Math.log10(10+total),
    };
  });

  const maxTotal = Math.max(...scored.map(x => x.total));
  return scored
    .map(x => ({ ...x, total: 100 * x.total / maxTotal }))
    .filter(x => 
      x.weights.qs || 
      x.weights.nameAttr || 
      x.isInlineVar ||
      x.path ||
      (x.occurrence <= jendeh && x.isWellknown)
    )
    .sort((a, b) => b.total - a.total);
};
