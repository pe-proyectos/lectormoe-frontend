import React from "react";
import {
    Card,
    Typography,
    List,
    ListItem,
    ListItemPrefix,
    ListItemSuffix,
    Chip,
    Accordion,
    Alert,
    AccordionHeader,
    AccordionBody,
} from "@material-tailwind/react";
import {
    PresentationChartBarIcon,
    ShoppingBagIcon,
    Cog6ToothIcon,
    CubeTransparentIcon,
    ServerStackIcon,
    NewspaperIcon,
    BookOpenIcon,
    ChartBarIcon,
    UsersIcon,
    TicketIcon,
    InboxIcon,
    AcademicCapIcon,
    PowerIcon,
} from "@heroicons/react/24/solid";
import {
    UserCircleIcon,
    ChartPieIcon,
    ChevronRightIcon,
    ChevronDownIcon
} from "@heroicons/react/24/outline";
import { getTranslator } from "../../util/translate";

export function AdminSidebar({ organization, page }) {
    const _ = getTranslator(organization.language);

    const initialOpen = (page === "analytics" || page === "members") ? 1 : 0;
    const [open, setOpen] = React.useState(initialOpen);
    const [openAlert, setOpenAlert] = React.useState(true);

    const handleOpen = (value) => {
        setOpen(open === value ? 0 : value);
    };

    return (
        <Card className="sticky top-[calc(5rem)] h-[calc(100vh-100px)] w-full max-w-[20rem] p-4 shadow-xl shadow-blue-gray-900/5">
            <div className="mb-2 p-4">
                <Typography variant="h5" color="blue-gray">
                    {_("administrator")}
                </Typography>
            </div>
            <List>
                <Accordion
                    open={open === 1}
                    icon={
                        <ChevronDownIcon
                            strokeWidth={2.5}
                            className={`mx-auto h-4 w-4 transition-transform ${open === 1 ? "rotate-180" : ""}`}
                        />
                    }
                >
                    <ListItem className="p-0" selected={open === 1}>
                        <AccordionHeader onClick={() => handleOpen(1)} className="border-b-0 p-3">
                            <ListItemPrefix>
                                <PresentationChartBarIcon className="h-5 w-5" />
                            </ListItemPrefix>
                            <Typography color="blue-gray" className="mr-auto font-normal">
                                {_("organization")}
                            </Typography>
                        </AccordionHeader>
                    </ListItem>
                    <AccordionBody className="py-1">
                        <List className="p-0">
                            <a href="/admin/organization/members">
                                <ListItem selected={page === "members"}>
                                    <ListItemPrefix>
                                        <UserCircleIcon strokeWidth={3} className="h-3 w-5" />
                                    </ListItemPrefix>
                                    {_("members")}
                                </ListItem>
                            </a>
                            <a href="/admin/organization/analytics">
                                <ListItem selected={page === "analytics"}>
                                    <ListItemPrefix>
                                        <ChartPieIcon strokeWidth={3} className="h-3 w-5" />
                                    </ListItemPrefix>
                                    {_("analytics")}
                                </ListItem>
                            </a>
                        </List>
                    </AccordionBody>
                </Accordion>
                {/*
                <Accordion
                    open={open === 2}
                    icon={
                        <ChevronDownIcon
                            strokeWidth={2.5}
                            className={`mx-auto h-4 w-4 transition-transform ${open === 2 ? "rotate-180" : ""}`}
                        />
                    }
                >
                    <ListItem className="p-0" selected={open === 2}>
                        <AccordionHeader onClick={() => handleOpen(2)} className="border-b-0 p-3">
                            <ListItemPrefix>
                                <ShoppingBagIcon className="h-5 w-5" />
                            </ListItemPrefix>
                            <Typography color="blue-gray" className="mr-auto font-normal">
                                E-Commerce
                            </Typography>
                        </AccordionHeader>
                </ListItem>
                    <AccordionBody className="py-1">
                        <List className="p-0">
                            <ListItem>
                                <ListItemPrefix>
                                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                                </ListItemPrefix>
                                Orders
                            </ListItem>
                            <ListItem>
                                <ListItemPrefix>
                                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                                </ListItemPrefix>
                                Products
                            </ListItem>
                        </List>
                    </AccordionBody>
                </Accordion>
                */}
                <hr className="my-2 border-blue-gray-50" />
                <a href="/admin">
                    <ListItem selected={page === "dashboard"}>
                        <ListItemPrefix>
                            <ChartBarIcon className="h-5 w-5" />
                        </ListItemPrefix>
                        {_("dashboard")}
                    </ListItem>
                </a>
                <a href="/admin/authors">
                    <ListItem selected={page === "authors"}>
                        <ListItemPrefix>
                            <AcademicCapIcon className="h-5 w-5" />
                        </ListItemPrefix>
                        {_("authors")}
                    </ListItem>
                </a>
                <a href="/admin/mangas">
                    <ListItem selected={page === "mangas"}>
                        <ListItemPrefix>
                            <BookOpenIcon className="h-5 w-5" />
                        </ListItemPrefix>
                        {_("mangas")}
                        {/* <ListItemSuffix>
                            <Chip value="14" size="sm" variant="ghost" color="blue-gray" className="rounded-full" />
                        </ListItemSuffix> */}
                    </ListItem>
                </a>
                <a href="/admin/news">
                    <ListItem selected={page === "news"}>
                        <ListItemPrefix>
                            <NewspaperIcon strokeWidth={3} className="h-5 w-5" />
                        </ListItemPrefix>
                        {_("news")}
                    </ListItem>
                </a>
                <a href="/admin/members">
                    <ListItem selected={page === "members"}>
                        <ListItemPrefix>
                            <UsersIcon className="h-5 w-5" />
                        </ListItemPrefix>
                        {_("members")}
                    </ListItem>
                </a>
                <a href="/admin/coinpacks">
                    <ListItem selected={page === "coinpacks"}>
                        <ListItemPrefix>
                            <TicketIcon className="h-5 w-5" />
                        </ListItemPrefix>
                        {_("coin_packs")}
                    </ListItem>
                </a>
                <a href="/admin/storage">
                    <ListItem selected={page === "storage"}>
                        <ListItemPrefix>
                            <ServerStackIcon strokeWidth={3} className="h-5 w-5" />
                        </ListItemPrefix>
                        {_("storage")}
                    </ListItem>
                </a>
                <a href="/admin/settings">
                    <ListItem selected={page === "settings"}>
                        <ListItemPrefix>
                            <Cog6ToothIcon className="h-5 w-5" />
                        </ListItemPrefix>
                        {_("settings")}
                    </ListItem>
                </a>
            </List>
            <Alert open={openAlert} className="mt-auto hidden" onClose={() => setOpenAlert(false)}>
                <CubeTransparentIcon className="mb-4 h-12 w-12" />
                <Typography variant="h6" className="mb-1">
                    {_("upgrade_to_pro")}
                </Typography>
                <Typography variant="small" className="font-normal opacity-80">
                    {_("upgrade_to_pro_description")}
                </Typography>
                <div className="mt-4 flex gap-3">
                    <Typography
                        as="a"
                        href="#"
                        variant="small"
                        className="font-medium opacity-80"
                        onClick={() => setOpenAlert(false)}
                    >
                        {_("hide")}
                    </Typography>
                    <Typography as="a" href="/pro" variant="small" className="font-medium">
                        {_("learn_more")}
                    </Typography>
                </div>
            </Alert>
        </Card>
    );
}
