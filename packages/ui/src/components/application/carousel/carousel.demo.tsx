"use client";

import { ChevronLeft, ChevronRight } from "@properui/icons";
import { IMAGES } from "../../../utils/demo-assets";
import { PaginationDot } from "../pagination/pagination-dot";
import { Carousel, useCarousel } from "./carousel-base";

/** Wires the carousel's internal scroll state into a `PaginationDot` indicator row. */
const CarouselDotIndicator = ({ size = "md", framed }: { size?: "md" | "lg"; framed?: boolean }) => {
    const { selectedIndex, scrollSnaps, api } = useCarousel();

    return (
        <PaginationDot
            size={size}
            framed={framed}
            page={selectedIndex + 1}
            total={scrollSnaps.length}
            onPageChange={(page) => {
                api?.scrollTo(page - 1);
            }}
        />
    );
};

const CarouselSlides = () => (
    <Carousel.Content className="gap-2">
        <Carousel.Item className="overflow-hidden rounded-xl">
            <img src={IMAGES.landscape[0].src} alt={IMAGES.landscape[0].alt} className="size-full object-cover" />
        </Carousel.Item>
        <Carousel.Item className="overflow-hidden rounded-xl">
            <img src={IMAGES.landscape[1].src} alt={IMAGES.landscape[1].alt} className="size-full object-cover" />
        </Carousel.Item>
        <Carousel.Item className="overflow-hidden rounded-xl">
            <img src={IMAGES.landscape[2].src} alt={IMAGES.landscape[2].alt} className="size-full object-cover" />
        </Carousel.Item>
    </Carousel.Content>
);

export const CarouselExample = () => {
    return (
        <Carousel.Root className="relative aspect-[1.6] max-w-160">
            <Carousel.PrevTrigger className="bg-alpha-white/90 text-fg-secondary outline-focus-ring absolute start-4 top-1/2 z-10 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full p-2 backdrop-blur-xs focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                <ChevronLeft className="size-5" />
            </Carousel.PrevTrigger>
            <Carousel.NextTrigger className="bg-alpha-white/90 text-fg-secondary outline-focus-ring absolute end-4 top-1/2 z-10 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full p-2 backdrop-blur-xs focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                <ChevronRight className="size-5" />
            </Carousel.NextTrigger>

            <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
                <CarouselDotIndicator framed />
            </div>

            <CarouselSlides />
        </Carousel.Root>
    );
};

export const CarouselMd = () => {
    return (
        <Carousel.Root className="relative aspect-[1.6] max-w-160">
            <Carousel.PrevTrigger className="bg-alpha-white/90 text-fg-secondary outline-focus-ring absolute start-4 top-1/2 z-10 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full p-2 backdrop-blur-xs focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                <ChevronLeft className="size-5" />
            </Carousel.PrevTrigger>
            <Carousel.NextTrigger className="bg-alpha-white/90 text-fg-secondary outline-focus-ring absolute end-4 top-1/2 z-10 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full p-2 backdrop-blur-xs focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                <ChevronRight className="size-5" />
            </Carousel.NextTrigger>

            <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
                <CarouselDotIndicator framed />
            </div>

            <CarouselSlides />
        </Carousel.Root>
    );
};

export const CarouselLg = () => {
    return (
        <Carousel.Root className="relative aspect-[1.6] max-w-160">
            <Carousel.PrevTrigger className="bg-alpha-white/90 text-fg-secondary outline-focus-ring absolute start-5 top-1/2 z-10 flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full p-2 backdrop-blur-xs focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                <ChevronLeft className="size-6" />
            </Carousel.PrevTrigger>
            <Carousel.NextTrigger className="bg-alpha-white/90 text-fg-secondary outline-focus-ring absolute end-5 top-1/2 z-10 flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full p-2 backdrop-blur-xs focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                <ChevronRight className="size-6" />
            </Carousel.NextTrigger>

            <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
                <CarouselDotIndicator size="lg" framed />
            </div>

            <CarouselSlides />
        </Carousel.Root>
    );
};
