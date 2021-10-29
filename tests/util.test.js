const util = require('../src/util');

test('generates a color where r, g, and b are between 0 and 255', () =>
{
    const color = util.randomColor();
    const r     = parseInt(color.substring(0, 2), 16),
          g     = parseInt(color.substring(2, 4), 16),
          b     = parseInt(color.substring(4, 6), 16);

    expect(r).toBeLessThan(255)
    expect(r).toBeGreaterThanOrEqual(0);

    expect(g).toBeLessThan(255)
    expect(g).toBeGreaterThanOrEqual(0);

    expect(b).toBeLessThan(255)
    expect(b).toBeGreaterThanOrEqual(0);
});