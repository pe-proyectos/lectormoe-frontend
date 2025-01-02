import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Typography,
  Avatar,
  Button,
  Chip,
  Alert,
  Carousel,
} from "@material-tailwind/react";
import { callAPI } from "../util/callApi";
import { MangaCardsScroller } from "./MangaCardsScroller";
import { FeaturedMangaCard } from "./FeaturedMangaCard";
import { MangaCard } from "./MangaCard";
import { LazyImage } from "./LazyImage";
import { getTranslator } from "../util/translate";
import { SubscriptionPlanCard } from "./SubscriptionPlanCard";

export function Subscriptions({
  organization,
  user,
  logged,
  paypalClientId,
  subscriptionPlansData,
  manga,
  chapterNumber,
}) {
  const chapter = manga
    ? manga?.chapters?.find((chapter) => chapter.number === chapterNumber)
    : null;

  const _ = getTranslator(organization.language);

  const [loading, setLoading] = useState(true);
  const [loadingLatest, setLoadingLatest] = useState(true);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);

  const getValidMangaSubscriptionPlans = () => {
    return subscriptionPlansData.filter((plan) => plan.canReadUnreleased || manga?.subscriptionPlans?.find(
      (v) => v.id === plan.id
    ));
  }

  useEffect(() => {
    // Subscription Plans
    const scriptId = "paypal-sdk";

    if (!document.getElementById(scriptId) && !window.paypal) {
      const script = document.createElement("script");
      script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&vault=true&intent=subscription`;
      script.async = true;
      script.id = scriptId;
      script.onload = () => {
        setSubscriptionPlans(subscriptionPlansData);
        setLoading(false);
      };
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div className="2xl:max-w-[1320px] 2xl:mx-auto transition-all duration-500">
      {manga && chapter && (
        <div className="w-full flex justify-center my-6">
          <Card className="w-full max-w-[48rem] flex-row">
            <CardHeader
              shadow={false}
              floated={false}
              className="m-0 w-2/5 shrink-0 rounded-r-none"
            >
              <img
                src={chapter?.imageUrl || manga.imageUrl}
                alt="card-image"
                className="h-full w-full object-cover"
              />
            </CardHeader>
            <CardBody>
              <Typography variant="h6" color="gray" className="mb-4 uppercase">
                {manga.title} #{chapter.number}
              </Typography>
              <Typography variant="h4" color="blue-gray" className="mb-2">
                {chapter.title}
              </Typography>
              <Typography color="gray" className="mb-8 font-normal">
                {manga.description}
              </Typography>
              <div>
                <Typography
                  variant="lead"
                  className="mb-4 font-bold text-black text-center"
                >
                  {_(
                    "subscribe_now_to_one_of_these_plans_to_read_chapter_early"
                  )}
                </Typography>

                  <div className="flex flex-wrap gap-2 justify-center">
                    {getValidMangaSubscriptionPlans().map((plan) => 
                      (
                        <div
                          className="text-sm font-extralight text-black bg-gray-500 bg-opacity-50 rounded-lg px-2 py-1"
                        >
                          {plan.name}
                        </div>
                      )
                    )}
                  </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
      {subscriptionPlans.length > 0 && (
        <div className="w-full sm:mx-2 my-12">
          <div className="flex justify-center">
            <div className="max-w-[64rem] max-h-[8rem] text-center">
              <p className="uppercase text-2xl font-bold">
                {_("subscription_plans")}
              </p>
              <p className="uppercase">{_("subscription_plans_text")}</p>
              <p className="uppercase text-sm text-gray-500">
                {_("subscription_plans_subtext")}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 justify-center my-4">
            {subscriptionPlans
              .filter((plan) => plan.active)
              .sort((a, b) => a.price - b.price)
              .map((plan) => (
                <SubscriptionPlanCard
                  key={plan.id}
                  subscriptionPlan={plan}
                  organization={organization}
                  logged={logged}
                  user={user}
                  paypalClientId={paypalClientId}
                />
              ))}
          </div>
          {organization.patreonUrl && (
            <div className="w-full text-center">
              <a
                href={organization.patreonUrl}
                className="uppercase text-sm text-red-300 hover:underline"
              >
                {_("subscription_plans_patreon")}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
