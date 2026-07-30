import { describe, expect, it } from 'vitest';
import { findTool, groupToolsByCategory, TOOL_CATEGORIES, tools } from './tools';

describe('the tool registry', () => {
  it('gives every tool a unique slug', () => {
    const slugs = tools.map((tool) => tool.slug);

    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('keeps slugs safe to drop straight into a route', () => {
    for (const tool of tools) {
      expect(tool.slug).toMatch(/^[a-z][a-z0-9-]*$/);
    }
  });

  it('describes every tool in one finished sentence', () => {
    for (const tool of tools) {
      expect(tool.name.length).toBeGreaterThan(0);
      expect(tool.description).toMatch(/^[A-Z].*\.$/);
    }
  });

  it('files every tool under a known category', () => {
    for (const tool of tools) {
      expect(TOOL_CATEGORIES).toContain(tool.category);
    }
  });

  it('lists each tool exactly once when grouped for the nav', () => {
    const grouped = groupToolsByCategory().flatMap((group) => group.tools);

    expect(grouped).toHaveLength(tools.length);
    expect(new Set(grouped)).toEqual(new Set(tools));
  });

  it('leaves no category empty in the nav', () => {
    for (const group of groupToolsByCategory()) {
      expect(group.tools.length).toBeGreaterThan(0);
    }
  });

  it('looks a tool up by slug', () => {
    expect(findTool('pdf')?.name).toBe('PDF Toolbox');
    expect(findTool('nope')).toBeUndefined();
  });
});
