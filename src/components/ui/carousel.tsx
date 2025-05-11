import * as React from "react"
import useEmblaCarousel from "embla-carousel-react" // Keep useEmblaCarousel for the main component
// ArrowLeft, ArrowRight are now in their respective button components
import { cn } from "@/lib/utils"
// Button is used by CarouselPrevious/Next, not directly here anymore unless main Carousel uses it.

// Import types and context from the new context file
import {
  CarouselContext,
  type CarouselApi,
  type CarouselProps, // This includes CarouselOptions, CarouselPlugin
} from "./carousel/carousel-context"

// Import sub-components
import CarouselContent from "./carousel/CarouselContent"
import CarouselItem from "./carousel/CarouselItem"
import CarouselPrevious from "./carousel/CarouselPrevious"
import CarouselNext from "./carousel/CarouselNext"

const Carousel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & CarouselProps // Use CarouselProps from context file
>(
  (
    {
      orientation = "horizontal",
      opts,
      setApi,
      plugins,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [carouselRef, api] = useEmblaCarousel(
      {
        ...opts,
        axis: orientation === "horizontal" ? "x" : "y",
      },
      plugins
    )
    const [canScrollPrev, setCanScrollPrev] = React.useState(false)
    const [canScrollNext, setCanScrollNext] = React.useState(false)

    const onSelect = React.useCallback((currentApi: CarouselApi) => { // Renamed api to currentApi to avoid conflict
      if (!currentApi) {
        return
      }

      setCanScrollPrev(currentApi.canScrollPrev())
      setCanScrollNext(currentApi.canScrollNext())
    }, [])

    const scrollPrev = React.useCallback(() => {
      api?.scrollPrev()
    }, [api])

    const scrollNext = React.useCallback(() => {
      api?.scrollNext()
    }, [api])

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault()
          scrollPrev()
        } else if (event.key === "ArrowRight") {
          event.preventDefault()
          scrollNext()
        }
      },
      [scrollPrev, scrollNext]
    )

    React.useEffect(() => {
      if (!api || !setApi) {
        return
      }

      setApi(api)
    }, [api, setApi])

    React.useEffect(() => {
      if (!api) {
        return
      }

      onSelect(api)
      api.on("reInit", onSelect)
      api.on("select", onSelect)

      return () => {
        api?.off("select", onSelect)
      }
    }, [api, onSelect])

    return (
      <CarouselContext.Provider
        value={{
          carouselRef,
          api: api, // This is the Embla API instance
          opts, // Pass opts through context
          orientation:
            orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
          scrollPrev,
          scrollNext,
          canScrollPrev,
          canScrollNext,
          plugins, // Pass plugins through context
          setApi, // Pass setApi through context
        }}
      >
        <div
          ref={ref}
          onKeyDownCapture={handleKeyDown}
          className={cn("relative", className)}
          role="region"
          aria-roledescription="carousel"
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    )
  }
)
Carousel.displayName = "Carousel"

// CarouselContent, CarouselItem, CarouselPrevious, CarouselNext are now imported

export {
  type CarouselApi, // Export type from context file
  Carousel,
  CarouselContent, // Re-export imported component
  CarouselItem,    // Re-export imported component
  CarouselPrevious,// Re-export imported component
  CarouselNext,    // Re-export imported component
}
