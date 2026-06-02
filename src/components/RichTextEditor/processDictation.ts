/**
 * Converts spoken punctuation words (e.g. "period", "comma") into the
 * corresponding characters, using lightweight context heuristics so that words
 * like "time period" or "the colon" are left intact. Pure and side-effect free
 * so it can be unit tested independently of the editor.
 */
export function processDictation(text: string): string {
  let result = text;

  // "period" as a word vs. as punctuation.
  result = result.replace(
    /\b(the|a|this|that|each|every|same|time|grace|trial|waiting|probationary|pay|billing|accounting)\s+period\b/gi,
    '$1 period'
  );
  result = result.replace(
    /\bperiod\s+(of|in|for|from|to|during|between|after|before|when|where|is|was|will|has|had)\b/gi,
    'period $1'
  );
  result = result.replace(/\s+period(\s*$)/gi, '.$1');
  result = result.replace(/\s+period\s+(?=[A-Z])/g, '. ');

  // "comma"
  result = result.replace(/\bcomma\s+(separated|delimited)/gi, 'comma $1');
  result = result.replace(/\s+comma\b/gi, ',');

  // "colon"
  result = result.replace(
    /\b(the|a|my|your|his|her|their|semicolon|ascending|descending|transverse|sigmoid)\s+colon\b/gi,
    '$1 colon'
  );
  result = result.replace(
    /\bcolon\s+(cancer|surgery|health|polyp|scope|oscopy)/gi,
    'colon $1'
  );
  result = result.replace(/\s+colon\b/gi, ':');

  // "dash"
  result = result.replace(
    /\b(yard|meter|hundred|mad|quick|wild)\s+dash\b/gi,
    '$1 dash'
  );
  result = result.replace(/\bdash\s+(to|for|of)\b/gi, 'dash $1');
  result = result.replace(/\s+dash\b/gi, ' -');

  const simplePunctuation: Record<string, string> = {
    ' full stop': '.',
    ' question mark': '?',
    ' exclamation point': '!',
    ' exclamation mark': '!',
    ' semicolon': ';',
    ' semi colon': ';',
    ' hyphen': '-',
    ' open parenthesis': ' (',
    ' close parenthesis': ')',
    ' open bracket': ' [',
    ' close bracket': ']',
    ' open quote': ' "',
    ' close quote': '"',
    ' quote': '"',
    ' apostrophe': "'",
    ' new line': '\n',
    ' newline': '\n',
    ' new paragraph': '\n\n',
    ' tab': '\t',
  };

  for (const [spoken, punctuation] of Object.entries(simplePunctuation)) {
    const regex = new RegExp(spoken, 'gi');
    result = result.replace(regex, punctuation);
  }

  // Capitalize after sentence-ending punctuation.
  result = result.replace(
    /([.!?])\s+([a-z])/g,
    (_match, punct: string, letter: string) =>
      `${punct} ${letter.toUpperCase()}`
  );

  return result;
}

/**
 * Converts `<<field>>` (and the HTML-encoded `&lt;&lt;field&gt;&gt;`) syntax
 * into mustache `{{field}}` syntax. Pure helper operating on an HTML string.
 */
export function convertAngleBracketsToMustache(html: string): string {
  return html
    .replace(
      /&lt;&lt;([^&]*)&gt;&gt;/g,
      (_m, field: string) => `{{${field.trim()}}}`
    )
    .replace(/<<([^>]*)>>/g, (_m, field: string) => `{{${field.trim()}}}`);
}

/**
 * Returns true when an HTML string has no visible text content.
 * Note: This is a visibility check, not a sanitizer. It strips tags to inspect
 * remaining text — do NOT use this for XSS prevention.
 */
export function isHtmlEmpty(html: string): boolean {
  const text = html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
  return text.length === 0;
}
