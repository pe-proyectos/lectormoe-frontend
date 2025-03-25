import {
    Button,
    Card,
    CardHeader,
    CardBody,
    Typography,
} from "@material-tailwind/react";
import { getTranslator } from "../../util/translate";

export function AdminSubscriptionPlanCard({ organization, subscriptionPlan, onClick }) {
    const _ = getTranslator(organization.language);

    return (
        <Card className="w-64 mt-6">
            <CardHeader color="blue" className="p-4">
                <Typography variant="h5" color="white">
                    {subscriptionPlan.name || _("no_name")}
                </Typography>
            </CardHeader>
            <CardBody>
                <Typography color="black" className="font-bold">
                    {_("description")}
                </Typography>
                <Typography color="blue-gray" className="mb-2">
                    {subscriptionPlan.description || _("no_description")}
                </Typography>
                <Typography color="black" className="font-bold">
                    {_("price")}
                </Typography>
                <Typography color="blue-gray" className="mb-2">
                    ${subscriptionPlan.price.toFixed(2)}
                </Typography>
                <Typography color="black" className="font-bold">
                    {_("interval")}
                </Typography>
                <Typography color="blue-gray" className="mb-2">
                    {subscriptionPlan.interval}
                </Typography>
                <Typography color="black" className="font-bold">
                    {_("currency")}
                </Typography>
                <Typography color="blue-gray" className="mb-2">
                    {subscriptionPlan.currency}
                </Typography>
                <Typography color="black" className="font-bold">
                    {_("active")}
                </Typography>
                <Typography color="blue-gray" className="mb-2">
                    {subscriptionPlan.active ? _("yes") : _("no")}
                </Typography>
                <Typography color="black" className="font-bold">
                    {_("active_subscriptions")}
                </Typography>
                <Typography color="blue-gray" className="mb-2">
                    {subscriptionPlan.subscriptions.length}
                </Typography>
                <Button color="blue" className="mt-4" onClick={() => onClick(subscriptionPlan)}>
                    {_("edit")}
                </Button>
            </CardBody>
        </Card>
    );
}
