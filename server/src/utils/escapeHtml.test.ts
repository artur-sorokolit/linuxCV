import { describe, it, expect } from 'vitest';
import { escapeHtml } from './escapeHtml';

describe('escapeHtml', () => {
  it('neutralises an anchor tag so it renders as text', () => {
    const result = escapeHtml('<a href="https://phishing.example">Click me</a>');

    expect(result).toBe('&lt;a href=&quot;https://phishing.example&quot;&gt;Click me&lt;/a&gt;');
  });

  it('escapes ampersands before other entities', () => {
    const result = escapeHtml('Tom & Jerry <b>');

    expect(result).toBe('Tom &amp; Jerry &lt;b&gt;');
  });

  it('escapes single quotes that could break out of an attribute', () => {
    const result = escapeHtml("' onmouseover='alert(1)");

    expect(result).toBe('&#39; onmouseover=&#39;alert(1)');
  });

  it('leaves plain text untouched', () => {
    const result = escapeHtml('Ada Lovelace');

    expect(result).toBe('Ada Lovelace');
  });
});
