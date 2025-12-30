/**
 * Advanced Prolog term parser for handling complex values including commas
 * 
 * Handles:
 * - Simple atoms: alice, bob, manager
 * - Quoted strings: "Alice Smith", 'New York, NY'
 * - Numbers: 42, 3.14, -100
 * - Lists: [a, b, c], ["item 1", "item 2"]
 * - Compound terms: role(alice, manager), address("123 Main St", "New York", "NY")
 * - Nested structures: company(name("TechCorp"), employees([alice, bob, charlie]))
 */

export type PrologValue = 
  | string 
  | number 
  | boolean
  | PrologValue[]
  | PrologCompound
  | null;

export interface PrologCompound {
  functor: string;
  args: PrologValue[];
}

export interface ParseResult {
  success: boolean;
  value?: PrologValue;
  error?: string;
  remainder?: string;
}

export class PrologParser {
  private pos: number = 0;
  private input: string = '';
  
  /**
   * Parse a Prolog term from string
   */
  parse(input: string): ParseResult {
    this.input = input.trim();
    this.pos = 0;
    
    try {
      const value = this.parseTerm();
      this.skipWhitespace();
      
      if (this.pos < this.input.length) {
        return {
          success: false,
          error: `Unexpected characters after term: ${this.input.slice(this.pos)}`,
          remainder: this.input.slice(this.pos)
        };
      }
      
      return {
        success: true,
        value
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Parse a term (atom, number, string, list, or compound)
   */
  private parseTerm(): PrologValue {
    this.skipWhitespace();
    
    if (this.pos >= this.input.length) {
      throw new Error('Unexpected end of input');
    }
    
    const ch = this.input[this.pos];
    
    // String (quoted)
    if (ch === '"' || ch === "'") {
      return this.parseString();
    }
    
    // List
    if (ch === '[') {
      return this.parseList();
    }
    
    // Number (including negative)
    if (ch === '-' || this.isDigit(ch)) {
      const num = this.parseNumber();
      if (num !== null) return num;
      // If not a valid number, treat as atom
      if (ch === '-') {
        this.pos++; // Consume the '-'
        return '-' + this.parseAtom();
      }
    }
    
    // Variable (starts with uppercase or _)
    if (this.isUppercase(ch) || ch === '_') {
      return this.parseVariable();
    }
    
    // Atom or compound term
    const atom = this.parseAtom();
    this.skipWhitespace();
    
    // Check if it's a compound term
    if (this.pos < this.input.length && this.input[this.pos] === '(') {
      return this.parseCompound(atom);
    }
    
    return atom;
  }
  
  /**
   * Parse a quoted string
   */
  private parseString(): string {
    const quote = this.input[this.pos];
    this.pos++; // Skip opening quote
    
    let result = '';
    let escaped = false;
    
    while (this.pos < this.input.length) {
      const ch = this.input[this.pos];
      
      if (escaped) {
        // Handle escape sequences
        switch (ch) {
          case 'n': result += '\n'; break;
          case 't': result += '\t'; break;
          case 'r': result += '\r'; break;
          case '\\': result += '\\'; break;
          case '"': result += '"'; break;
          case "'": result += "'"; break;
          default: result += ch;
        }
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === quote) {
        this.pos++; // Skip closing quote
        return result;
      } else {
        result += ch;
      }
      
      this.pos++;
    }
    
    throw new Error(`Unterminated string starting at position ${this.pos - result.length - 1}`);
  }
  
  /**
   * Parse a list [a, b, c]
   */
  private parseList(): PrologValue[] {
    this.pos++; // Skip '['
    this.skipWhitespace();
    
    const elements: PrologValue[] = [];
    
    // Empty list
    if (this.pos < this.input.length && this.input[this.pos] === ']') {
      this.pos++; // Skip ']'
      return elements;
    }
    
    while (true) {
      elements.push(this.parseTerm());
      this.skipWhitespace();
      
      if (this.pos >= this.input.length) {
        throw new Error('Unexpected end of list');
      }
      
      const ch = this.input[this.pos];
      
      if (ch === ']') {
        this.pos++; // Skip ']'
        return elements;
      }
      
      if (ch === ',') {
        this.pos++; // Skip ','
        this.skipWhitespace();
      } else if (ch === '|') {
        // List with tail notation [H|T]
        throw new Error('List tail notation not yet supported');
      } else {
        throw new Error(`Expected ',' or ']' in list, found '${ch}'`);
      }
    }
  }
  
  /**
   * Parse an atom (unquoted identifier)
   */
  private parseAtom(): string {
    let atom = '';
    
    while (this.pos < this.input.length) {
      const ch = this.input[this.pos];
      
      if (this.isAlphanumeric(ch) || ch === '_') {
        atom += ch;
        this.pos++;
      } else {
        break;
      }
    }
    
    if (atom.length === 0) {
      throw new Error(`Expected atom at position ${this.pos}`);
    }
    
    return atom;
  }
  
  /**
   * Parse a variable (starts with uppercase or _)
   */
  private parseVariable(): string {
    return '_' + this.parseAtom(); // Prefix with _ to indicate variable
  }
  
  /**
   * Parse a compound term like functor(arg1, arg2, ...)
   */
  private parseCompound(functor: string): PrologCompound {
    this.pos++; // Skip '('
    this.skipWhitespace();
    
    const args: PrologValue[] = [];
    
    // Empty arguments
    if (this.pos < this.input.length && this.input[this.pos] === ')') {
      this.pos++; // Skip ')'
      return { functor, args };
    }
    
    while (true) {
      args.push(this.parseTerm());
      this.skipWhitespace();
      
      if (this.pos >= this.input.length) {
        throw new Error('Unexpected end of compound term');
      }
      
      const ch = this.input[this.pos];
      
      if (ch === ')') {
        this.pos++; // Skip ')'
        return { functor, args };
      }
      
      if (ch === ',') {
        this.pos++; // Skip ','
        this.skipWhitespace();
      } else {
        throw new Error(`Expected ',' or ')' in compound term, found '${ch}'`);
      }
    }
  }
  
  /**
   * Parse a number (integer or float)
   */
  private parseNumber(): number | null {
    const start = this.pos;
    
    // Handle negative sign
    if (this.pos < this.input.length && this.input[this.pos] === '-') {
      this.pos++;
    }
    
    // Parse integer part
    if (!this.parseDigits()) {
      this.pos = start; // Reset
      return null;
    }
    
    // Check for decimal point
    if (this.pos < this.input.length && this.input[this.pos] === '.') {
      this.pos++;
      
      // Parse fractional part
      if (!this.parseDigits()) {
        this.pos = start; // Reset if no digits after decimal
        return null;
      }
    }
    
    // Check for scientific notation
    if (this.pos < this.input.length && (this.input[this.pos] === 'e' || this.input[this.pos] === 'E')) {
      this.pos++;
      
      // Optional sign
      if (this.pos < this.input.length && (this.input[this.pos] === '+' || this.input[this.pos] === '-')) {
        this.pos++;
      }
      
      // Exponent digits
      if (!this.parseDigits()) {
        this.pos = start; // Reset if no digits in exponent
        return null;
      }
    }
    
    const numStr = this.input.slice(start, this.pos);
    const num = Number(numStr);
    
    if (isNaN(num)) {
      this.pos = start;
      return null;
    }
    
    return num;
  }
  
  /**
   * Parse one or more digits
   */
  private parseDigits(): boolean {
    let found = false;
    
    while (this.pos < this.input.length && this.isDigit(this.input[this.pos])) {
      this.pos++;
      found = true;
    }
    
    return found;
  }
  
  /**
   * Skip whitespace
   */
  private skipWhitespace(): void {
    while (this.pos < this.input.length && this.isWhitespace(this.input[this.pos])) {
      this.pos++;
    }
  }
  
  // Character classification helpers
  
  private isWhitespace(ch: string): boolean {
    return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';
  }
  
  private isDigit(ch: string): boolean {
    return ch >= '0' && ch <= '9';
  }
  
  private isLowercase(ch: string): boolean {
    return ch >= 'a' && ch <= 'z';
  }
  
  private isUppercase(ch: string): boolean {
    return ch >= 'A' && ch <= 'Z';
  }
  
  private isAlpha(ch: string): boolean {
    return this.isLowercase(ch) || this.isUppercase(ch);
  }
  
  private isAlphanumeric(ch: string): boolean {
    return this.isAlpha(ch) || this.isDigit(ch);
  }
}

/**
 * Format a PrologValue back to string
 */
export function formatPrologValue(value: PrologValue): string {
  if (value === null) {
    return 'null';
  }
  
  if (typeof value === 'string') {
    // Check if needs quoting
    if (/^[a-z][a-zA-Z0-9_]*$/.test(value)) {
      return value; // Simple atom, no quotes needed
    }
    // Quote the string, escaping special characters
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  
  if (typeof value === 'number') {
    return String(value);
  }
  
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  
  if (Array.isArray(value)) {
    return `[${value.map(formatPrologValue).join(', ')}]`;
  }
  
  // Compound term
  const compound = value as PrologCompound;
  if (compound.args.length === 0) {
    return compound.functor;
  }
  return `${compound.functor}(${compound.args.map(formatPrologValue).join(', ')})`;
}

/**
 * Extract specific arguments from a compound term
 */
export function extractArgs(term: PrologValue, functor: string): PrologValue[] | null {
  if (typeof term !== 'object' || term === null || Array.isArray(term)) {
    return null;
  }
  
  const compound = term as PrologCompound;
  if (compound.functor !== functor) {
    return null;
  }
  
  return compound.args;
}