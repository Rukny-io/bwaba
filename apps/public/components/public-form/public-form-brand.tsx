import Image from 'next/image';
import Link from 'next/link';
import { siteUrls } from '@/lib/site-urls';

export function PublicFormBrand() {
  return (
    <div className="public-form-brand" aria-label="صُنع بواسطة Rukny">
      <Link href={siteUrls.home} target="_blank" rel="noopener noreferrer">
        <span className="public-form-brand__dot" aria-hidden />
        <Image
          src="/rukny-logo.svg"
          alt=""
          width={16}
          height={16}
          className="size-4 shrink-0"
        />
        <span>صُنع بواسطة Rukny</span>
      </Link>
    </div>
  );
}
