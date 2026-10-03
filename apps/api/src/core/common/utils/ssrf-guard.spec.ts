import { BadRequestException } from '@nestjs/common';
import { assertUrlSafe } from './ssrf-guard';

describe('assertUrlSafe', () => {
  it('rejects non-http schemes', async () => {
    await expect(assertUrlSafe('file:///etc/passwd')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects localhost hostnames', async () => {
    await expect(assertUrlSafe('http://localhost/hook')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects private IP literals', async () => {
    await expect(assertUrlSafe('http://127.0.0.1/hook')).rejects.toThrow(
      BadRequestException,
    );
    await expect(assertUrlSafe('http://10.0.0.1/hook')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects URLs with embedded credentials', async () => {
    await expect(
      assertUrlSafe('http://user:pass@example.com/hook'),
    ).rejects.toThrow(BadRequestException);
  });

  it('allows public https URLs', async () => {
    await expect(
      assertUrlSafe('https://example.com/webhook'),
    ).resolves.toBeUndefined();
  });
});
