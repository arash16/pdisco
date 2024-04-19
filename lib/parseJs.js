const { parse } = require("acorn");
const { simple } = require("acorn-walk");
const wellknown = require("./wellknown");

const pathRe = /(https?:\/\/?)?[\w_:.-]*(\/[\w_:.-]{2,}){2,}/;

module.exports = (jsCode, path, inline) => {
  if (!jsCode) return [];
  console.error("parse js", path);
  try {
    const results = [];
    const ast = parse(jsCode, { ecmaVersion: "latest" });
    simple(ast, {
      VariableDeclarator(node) {
        const value = node?.id?.name;
        if (
          value &&
          node?.init?.type &&
          /Literal|TemplateLiteral/.test(node.init.type)
        ) {
          results.push({
            where: "variable",
            value,
            inline,
          });
        }
      },
      Property(node) {
        const value = node?.key?.name || node?.key?.value;
        if (value && !wellknown.dom(value)) {
          results.push({
            where: "property",
            value,
            inline,
          });
        }
      },
      MemberExpression(node) {
        const value = node?.property?.name || node?.property?.value;
        if (value && !wellknown.dom(value)) {
          results.push({
            where: "member",
            value,
            inline,
          });
        }
      },
      // Literal(node) {
      //   if (pathRe.test(node.value)) {
      //     results.push({
      //       where: "path",
      //       value: node.value,
      //       inline,
      //     });
      //   }
      // },
      // TemplateElement(node) {
      //   if (node?.value?.cooked && pathRe.test(node.value.cooked)) {
      //     results.push({
      //       where: "path",
      //       value: node.value.cooked,
      //       inline,
      //     });
      //   }
      // }
    });
    return results;
  } catch (err) {
    console.error("Error parsing js", path);
    console.error(err);
    return [];
  }
};
