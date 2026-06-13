import Image from "next/image"

const featuredStory = {
  title: "The Architect of Neom: Engineering the Future of Desert Metropolises",
  description:
    "A deep dive into the radical engineering feats required to sustain human life in extreme climates without a carbon footprint.",
  author: "HELENA VANCE",
  reads: "1.1K VIEWS",
}

export const FeaturedCard = () => {
  return (
    <div className="font-inter">
      <div className="relative">
        <Image
          src="/test.png"
          alt={featuredStory.title}
          className="w-full object-cover"
          width={800}
          height={420}
        />
        <div className="absolute top-4 left-4">
          <span className="bg-neutral-900 px-3 py-1 text-xs font-semibold tracking-wide text-white uppercase">
            Featured
          </span>
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-4xl leading-[1.1] font-medium">
          {featuredStory.title}
        </h2>
      </div>
      <div className="mt-4">
        <p className="text-base leading-7 text-neutral-700">
          {featuredStory.description}
        </p>
      </div>
      <div className="mt-6 flex flex-row flex-wrap space-x-4 text-xs font-medium tracking-wide text-neutral-500 uppercase">
        <span>BY {featuredStory.author}</span>
        <span>· {featuredStory.reads}</span>
      </div>
    </div>
  )
}
