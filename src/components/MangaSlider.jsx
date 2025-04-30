import { useEffect, useState } from "react";
import { Typography, Button, Chip, Carousel } from "@material-tailwind/react";

import { getTranslator } from "../util/translate";
import { callAPI } from "../util/callApi";

export function MangaSlider({ organization, language }) {
  const _ = getTranslator(language);
  const [sliderMangas, setSliderMangas] = useState([]);

  useEffect(() => {
    callAPI(`/api/manga-custom?order=latest&limit=5`).then(({ data }) => {
      setSliderMangas(data);
    });
  }, []);

  if (!organization.enableMainSlider || sliderMangas.length === 0) {
    return null;
  }

  return (
    <div className="left-0 top-0 h-[38rem] w-full">
      <Carousel
        className="no-scrollbar"
        nextArrow={() => {}}
        prevArrow={() => {}}
        autoplay={true}
        autoplayDelay={15000}
        loop={true}
      >
        {sliderMangas.map((manga, index) => (
          <div key={manga.id}>
            <div className="relative w-full h-full">
              <div className="relative">
                <img
                  src={manga.bannerUrl || manga.imageUrl}
                  alt={`Popular Manga ${index + 1}`}
                  className="h-[38rem] w-full object-cover object-center"
                />
                <div className="absolute bottom-0 left-0 w-full h-1/6 bg-gradient-to-t from-black to-transparent"></div>
              </div>
              <div className="absolute inset-0 2xl:max-w-[1320px] 2xl:mx-auto flex flex-col justify-end items-start p-4">
                <div className="flex flex-col gap-4 w-full md:w-[75%] my-8 bg-black bg-opacity-25 backdrop-blur-sm p-2 rounded-md">
                  <Typography className="text-white text-xl font-light">
                    {manga.title || ""}
                  </Typography>
                  <Typography className="hidden md:block text-white font-extralight">
                    {manga.shortDescription || ""}
                  </Typography>
                  <div className="flex flex-wrap gap-2 items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outlined"
                        color="green"
                        className="z-40 bg-black bg-opacity-50"
                        onClick={() =>
                          (window.location.href = `/manga/${manga.slug}`)
                        }
                      >
                        {_("read_now")}
                      </Button>
                      {manga.status === "ongoing" && (
                        <div className="flex gap-2 items-center">
                          <div className="bg-green-500 w-2 h-2 rounded-full"></div>
                          {_("ongoing")}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap justify-start">
                      {(manga.genres || []).map((genre) => (
                        <Chip
                          key={genre.id}
                          value={genre.name}
                          className="m-1"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </Carousel>
    </div>
  );
}
