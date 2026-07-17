const blockClass = (name, modifier = '') => (
  modifier ? `markdown-${name} markdown-${name}--${modifier}` : `markdown-${name}`
);

const textNode = (text) => ({
  type: 'text',
  text,
});

const elementNode = (name, className, children = []) => ({
  name,
  attrs: { class: className },
  children,
});

const appendText = (nodes, text) => {
  if (!text) return;

  const previousNode = nodes[nodes.length - 1];
  if (previousNode?.type === 'text') {
    previousNode.text += text;
    return;
  }

  nodes.push(textNode(text));
};

const findSingleAsterisk = (text, startIndex) => {
  for (let index = startIndex; index < text.length; index += 1) {
    if (text[index] !== '*') continue;
    if (text[index - 1] === '*' || text[index + 1] === '*') continue;

    return index;
  }

  return -1;
};

const findNextMarker = (text, startIndex) => {
  const markerIndexes = [
    { type: 'code', index: text.indexOf('`', startIndex) },
    { type: 'strong', index: text.indexOf('**', startIndex) },
    { type: 'em', index: findSingleAsterisk(text, startIndex) },
  ].filter((marker) => marker.index >= 0);

  if (markerIndexes.length === 0) return null;

  return markerIndexes.sort((first, second) => first.index - second.index)[0];
};

export function renderInlineMarkdown(text = '') {
  const source = String(text);
  const nodes = [];
  let cursor = 0;

  while (cursor < source.length) {
    const marker = findNextMarker(source, cursor);

    if (!marker) {
      appendText(nodes, source.slice(cursor));
      break;
    }

    appendText(nodes, source.slice(cursor, marker.index));

    if (marker.type === 'code') {
      const closeIndex = source.indexOf('`', marker.index + 1);

      if (closeIndex < 0) {
        appendText(nodes, source.slice(marker.index));
        break;
      }

      nodes.push(elementNode('code', 'markdown-code', [
        textNode(source.slice(marker.index + 1, closeIndex)),
      ]));
      cursor = closeIndex + 1;
      continue;
    }

    if (marker.type === 'strong') {
      const closeIndex = source.indexOf('**', marker.index + 2);

      if (closeIndex < 0) {
        appendText(nodes, source.slice(marker.index));
        break;
      }

      nodes.push(elementNode('strong', 'markdown-strong', renderInlineMarkdown(
        source.slice(marker.index + 2, closeIndex),
      )));
      cursor = closeIndex + 2;
      continue;
    }

    const closeIndex = findSingleAsterisk(source, marker.index + 1);

    if (closeIndex < 0) {
      appendText(nodes, source.slice(marker.index));
      break;
    }

    nodes.push(elementNode('em', 'markdown-emphasis', renderInlineMarkdown(
      source.slice(marker.index + 1, closeIndex),
    )));
    cursor = closeIndex + 1;
  }

  return nodes;
}

const renderInlineLines = (lines) => (
  lines.flatMap((line, index) => [
    ...(index > 0 ? [{ name: 'br' }] : []),
    ...renderInlineMarkdown(line),
  ])
);

const createParagraph = (lines) => (
  elementNode('p', 'markdown-paragraph', renderInlineLines(lines))
);

const createHeading = (level, text) => (
  elementNode(`h${level}`, blockClass('heading', level), renderInlineMarkdown(text))
);

const createList = (tagName, items) => (
  elementNode(tagName, blockClass('list', tagName), items.map((item) => (
    elementNode('li', 'markdown-list-item', renderInlineMarkdown(item))
  )))
);

export function renderMarkdownNodes(markdown = '') {
  const source = String(markdown || '').replace(/\r\n?/g, '\n').trim();

  if (!source) return [];

  const lines = source.split('\n');
  const nodes = [];
  let paragraphLines = [];
  let index = 0;

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return;

    nodes.push(createParagraph(paragraphLines));
    paragraphLines = [];
  };

  while (index < lines.length) {
    const rawLine = lines[index];
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      index += 1;
      continue;
    }

    const headingMatch = /^(#{1,3})\s+(.+)$/.exec(line);
    if (headingMatch) {
      flushParagraph();
      nodes.push(createHeading(headingMatch[1].length, headingMatch[2].trim()));
      index += 1;
      continue;
    }

    const unorderedMatch = /^[-*]\s+(.+)$/.exec(line);
    const orderedMatch = /^(\d+)[.)]\s+(.+)$/.exec(line);
    if (unorderedMatch || orderedMatch) {
      flushParagraph();

      const isOrdered = Boolean(orderedMatch);
      const items = [];

      while (index < lines.length) {
        const currentLine = lines[index].trim();
        const currentMatch = isOrdered
          ? /^(\d+)[.)]\s+(.+)$/.exec(currentLine)
          : /^[-*]\s+(.+)$/.exec(currentLine);

        if (!currentMatch) break;

        items.push(currentMatch[isOrdered ? 2 : 1].trim());
        index += 1;
      }

      nodes.push(createList(isOrdered ? 'ol' : 'ul', items));
      continue;
    }

    paragraphLines.push(line);
    index += 1;
  }

  flushParagraph();
  return nodes;
}
