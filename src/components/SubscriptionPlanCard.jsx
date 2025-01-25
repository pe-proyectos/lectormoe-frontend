import React, { useEffect } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Typography,
} from "@material-tailwind/react";
import { callAPI } from "../util/callApi";
import { getTranslator } from "../util/translate";
import { ToastContainer, toast } from "react-toastify";

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className="h-3 w-3"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 12.75l6 6 9-13.5"
      />
    </svg>
  );
}

export function SubscriptionPlanCard({
  subscriptionPlan,
  organization,
  user,
  logged,
  paypalClientId,
}) {
  const _ = getTranslator(organization.language);

  useEffect(() => {
    if (logged) {
      renderPayPalButton(subscriptionPlan.planId);
    }
  }, [paypalClientId, subscriptionPlan.planId]);

  const renderPayPalButton = (planId) => {
    window.paypal
      .Buttons({
        createSubscription: function (data, actions) {
          return actions.subscription.create({
            plan_id: planId,
          });
        },
        onApprove: async function (data) {
          try {
            const createdSubscription = await callAPI("/api/subscription", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                paypalSubscriptionId: data.subscriptionID,
                subscriptionPlanId: subscriptionPlan.id,
                userId: user.id,
              }),
            });
  
            if (!createdSubscription.status) {
              toast.error(createdSubscription?.message || "Failed to save subscription. Please contact support.");
              return;
            }
  
            toast.success(_("subscribed_successfully"));
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          } catch (err) {
            console.error("Error saving subscription:", err);
            toast.error(err?.message || err || "An error occurred while saving your subscription.");
          }
        },
        onError: function (err) {
          console.error("Error creating subscription:", err);
          toast.error(err?.message || err || "An error occurred while processing your subscription.");
        },
      })
      .render(`#paypal-button-container-${planId}`);
  };

  return (
    <Card color="gray" variant="gradient" className="w-full max-w-[20rem] p-8 transition-all duration-300 hover:scale-[1.01]">
      <CardHeader
        floated={false}
        shadow={false}
        color="transparent"
        className="m-0 mb-8 rounded-none border-b border-white/10 pb-8 text-center"
      >
        <Typography
          variant="h4"
          color="white"
          className="font-normal underline underline-offset-4"
        >
          {subscriptionPlan.name}
        </Typography>
        <Typography
          variant="h1"
          color="white"
          className="mt-6 flex justify-center gap-1 text-7xl font-normal"
        >
          <span className="mt-2 text-4xl">$</span>
          {subscriptionPlan.price}{" "}
          <span className="self-end text-4xl">
            /&nbsp;
            {_(
              `interval_${subscriptionPlan.interval.toLowerCase()}`
            ).toUpperCase()}
          </span>
        </Typography>
      </CardHeader>
      <CardBody className="p-0 mb-auto">
        <ul className="flex flex-col gap-4">
          {subscriptionPlan.description
            .split("\n")
            .map((description, index) => (
              <li key={index} className="flex items-center gap-4">
                <span className="rounded-full border border-white/20 bg-white/20 p-1">
                  <CheckIcon />
                </span>
                <Typography className="font-normal">{description}</Typography>
              </li>
            ))}
        </ul>
      </CardBody>
      <CardFooter className="mt-12 p-0">
        {logged ? (
          <div
            id={`paypal-button-container-${subscriptionPlan.planId}`}
            className="paypal-button-container"
          ></div>
        ) : (
          <Typography variant="small" color="white" className="font-normal">
            {_(
              "please_log_in_to_subscribe"
            )}
          </Typography>
        )}
        {user?.subscriptions.find(subscription => subscription.subscriptionPlan.id === subscriptionPlan.id) && (
          <div className="flex justify-center">
            <Typography variant="small" color="red" className="font-normal">
              {_("already_subscribed")}
            </Typography>
          </div>
        )}
      </CardFooter>
      <ToastContainer theme="dark" />
    </Card>
  );
}
