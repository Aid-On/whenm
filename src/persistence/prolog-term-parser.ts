/**
 * Prolog Term Parser
 *
 * Parses and serializes Prolog term structures
 */

/**
 * Prolog term representation
 */
export interface PrologTerm {
  functor: string;
  args: Array<string | number | PrologTerm>;
}

/**
 * Parse Prolog term string into structured format
 */
export function parsePrologTerm(rawTerm: string): PrologTerm | string {
  const term = rawTerm.trim();

  if (!term.includes('(')) {
    return term;
  }

  const match = term.match(/^([a-z_][a-zA-Z0-9_]*)\((.*)\)$/);
  if (!match) {
    return term;
  }

  const [, functor, argsStr] = match;
  const args: Array<string | number | PrologTerm> = [];

  let current = '';
  let depth = 0;

  for (let i = 0; i < argsStr.length; i++) {
    const char = argsStr[i];

    if (char === '(') depth++;
    else if (char === ')') depth--;

    if (char === ',' && depth === 0) {
      args.push(parseSingleArg(current.trim()));
      current = '';
    } else {
      current += char;
    }
  }

  if (current) {
    args.push(parseSingleArg(current.trim()));
  }

  return { functor, args };
}

function parseSingleArg(arg: string): string | number | PrologTerm {
  if (/^-?\d+(\.\d+)?$/.test(arg)) {
    return parseFloat(arg);
  }

  if (arg.startsWith('"') && arg.endsWith('"')) {
    return arg.slice(1, -1);
  }

  if (arg.includes('(')) {
    return parsePrologTerm(arg);
  }

  return arg;
}

/**
 * Convert structured term back to Prolog string
 */
export function termToString(term: PrologTerm | string | number): string {
  if (typeof term === 'string') {
    return /^[a-z][a-zA-Z0-9_]*$/.test(term) ? term : `"${term}"`;
  }

  if (typeof term === 'number') {
    return term.toString();
  }

  if (typeof term === 'object' && 'functor' in term) {
    const args = term.args.map(arg => termToString(arg)).join(', ');
    return `${term.functor}(${args})`;
  }

  return String(term);
}
