import { inlineDataUriImages } from './mail-inline-images.util';

describe('inlineDataUriImages', () => {
  it('rewrites data-uri images to cid references', () => {
    const b64 = Buffer.from('hello').toString('base64');
    const html = `<p>Hi</p><img src="data:image/png;base64,${b64}" alt="x" />`;
    const result = inlineDataUriImages(html);

    expect(result.inlineParts).toHaveLength(1);
    expect(result.html).toContain('cid:rukny-img-1@inline');
    expect(result.html).not.toContain('data:image');
    expect(result.inlineParts[0]?.content.toString()).toBe('hello');
  });
});
