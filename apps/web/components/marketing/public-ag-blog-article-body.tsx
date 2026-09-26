'use client';

import type { BlogBodyBlock } from '@/lib/blog-posts';

type PublicAgBlogArticleBodyProps = {
  blocks: BlogBodyBlock[];
};

export function PublicAgBlogArticleBody({ blocks }: PublicAgBlogArticleBodyProps) {
  return (
    <div className="mt-10 space-y-8 text-start sm:mt-12">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'heading':
            return (
              <h2
                key={`heading-${index}`}
                className="text-balance text-[1.35rem] font-medium leading-[1.35] tracking-[-0.02em] text-[#1D1D1D] sm:text-[1.5rem]"
              >
                {block.text}
              </h2>
            );
          case 'quote':
            return (
              <blockquote
                key={`quote-${index}`}
                className="border-s-2 border-[#EBEBEB] ps-5 text-[17px] leading-[1.85] text-[#6B6F76] sm:text-[18px]"
              >
                {block.text}
              </blockquote>
            );
          case 'list':
            return (
              <ul
                key={`list-${index}`}
                className="space-y-3 ps-5 text-[17px] leading-[1.85] text-[#1D1D1D] marker:text-[#9CA3AF] sm:text-[18px]"
              >
                {block.items.map((item) => (
                  <li key={item.slice(0, 24)} className="ps-1">
                    {item}
                  </li>
                ))}
              </ul>
            );
          case 'paragraph':
          default:
            return (
              <p
                key={`paragraph-${index}`}
                className="text-[17px] leading-[1.85] text-[#1D1D1D] sm:text-[18px] sm:leading-[1.9]"
              >
                {block.text}
              </p>
            );
        }
      })}
    </div>
  );
}
