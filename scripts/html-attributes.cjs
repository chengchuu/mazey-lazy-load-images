function attributeValue(tag, name) {
  const match = tag.match(
    new RegExp(
      `(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
      "i",
    ),
  );
  return match ? (match[1] ?? match[2] ?? match[3]) : null;
}

function openingTags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))].map(
    (match) => match[0],
  );
}

function localReferences(html) {
  return [
    ...html.matchAll(
      /\b(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi,
    ),
  ].map((match) => match[1] ?? match[2] ?? match[3]);
}

module.exports = { attributeValue, openingTags, localReferences };
