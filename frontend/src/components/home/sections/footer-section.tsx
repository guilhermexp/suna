'use client';

import { FlickeringGrid } from '@/components/home/ui/flickering-grid';
import { useMediaQuery } from '@/hooks/use-media-query';
import Link from 'next/link';

export function FooterSection() {
  const tablet = useMediaQuery('(max-width: 1024px)');

  return (
    <footer id="footer" className="w-full pb-0">
      <Link
        href="https://www.youtube.com/watch?v=nuf5BF1jvjQ"
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full h-48 md:h-64 relative mt-24 z-0 cursor-pointer"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-background z-10 from-40%" />
        <div className="absolute inset-0 ">
          <FlickeringGrid
            text={tablet ? 'Agents' : 'Agents Agents Agents'}
            fontSize={tablet ? 60 : 90}
            className="h-full w-full"
            squareSize={2}
            gridGap={tablet ? 2 : 3}
            color="#6B7280"
            maxOpacity={0.3}
            flickerChance={0.1}
          />
        </div>
      </Link>
    </footer>
  );
}
