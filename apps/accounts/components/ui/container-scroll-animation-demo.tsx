"use client";

import { ContainerScroll } from "@/components/ui/container-scroll-animation";

export function HeroScrollDemo() {
  return (
    <div className="flex flex-col overflow-hidden pb-[500px] pt-[1000px]">
      <ContainerScroll
        titleComponent={
          <h1 className="text-4xl font-semibold text-foreground">
            Unleash the power of
            <br />
            <span className="mt-1 text-4xl font-bold leading-none md:text-[6rem]">Scroll Animations</span>
          </h1>
        }
      >
        <img
          src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1920&q=80"
          alt="hero"
          className="mx-auto h-full w-full rounded-2xl object-cover object-left-top"
          draggable={false}
        />
      </ContainerScroll>
    </div>
  );
}
