import React from "react";
import {
  Card,
  Typography,
  List,
  ListItem,
  ListItemPrefix,
  Alert,
} from "@material-tailwind/react";
import {
  Cog6ToothIcon,
  CubeTransparentIcon,
  ServerStackIcon,
  BookOpenIcon,
  ChartBarIcon,
  UsersIcon,
  TicketIcon,
  InboxIcon,
  AcademicCapIcon,
  BanknotesIcon,
  ChatBubbleBottomCenterTextIcon,
} from "@heroicons/react/24/solid";
import { getTranslator } from "../../util/translate";

export function AdminSidebar({ organization, page }) {
  const _ = getTranslator(organization.language);

  const [openAlert, setOpenAlert] = React.useState(true);

  return (
    <Card className="sticky top-[calc(5rem)] h-[calc(100vh-100px)] w-full max-w-[20rem] p-4 shadow-xl shadow-blue-gray-900/5">
      <div className="mb-2 p-4">
        <Typography variant="h5" color="blue-gray">
          {_("administrator")}
        </Typography>
      </div>
      <List>
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
        <a href="/admin/genres">
          <ListItem selected={page === "genres"}>
            <ListItemPrefix>
              <InboxIcon className="h-5 w-5" /> {/* Changed icon for genres */}
            </ListItemPrefix>
            {_("genres")}
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
        <a href="/admin/users">
          <ListItem selected={page === "users"}>
            <ListItemPrefix>
              <UsersIcon className="h-5 w-5" />
            </ListItemPrefix>
            {_("users")}
          </ListItem>
        </a>
        <a href="/admin/subscription-plans">
          <ListItem selected={page === "subscription_plans"}>
            <ListItemPrefix>
              <TicketIcon className="h-5 w-5" />
            </ListItemPrefix>
            {_("subscription_plans")}
          </ListItem>
        </a>
        <a href="/admin/finance">
          <ListItem selected={page === "finance"}>
            <ListItemPrefix>
              <BanknotesIcon className="h-5 w-5" />
            </ListItemPrefix>
            {_("Finanzas")}
          </ListItem>
        </a>
        <a href="/admin/comments">
          <ListItem selected={page === "comments"}>
            <ListItemPrefix>
              <ChatBubbleBottomCenterTextIcon className="h-5 w-5" />
            </ListItemPrefix>
            {_("comments")}
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
      <Alert
        open={openAlert}
        className="mt-auto hidden"
        onClose={() => setOpenAlert(false)}
      >
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
          <Typography
            as="a"
            href="/pro"
            variant="small"
            className="font-medium"
          >
            {_("learn_more")}
          </Typography>
        </div>
      </Alert>
    </Card>
  );
}
