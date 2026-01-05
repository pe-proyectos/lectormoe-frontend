import { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import {
  Button,
  ButtonGroup,
  Dialog,
  DialogHeader,
  DialogBody,
  Checkbox,
  DialogFooter,
  Typography,
  Input,
} from "@material-tailwind/react";
import { callAPI } from "../../util/callApi";
import { getTranslator } from "../../util/translate";
import { ImageDropzone } from "../ImageDropzone";

export function AdminUserDialog({ language, open, setOpen, user, setUser }) {
  const _ = getTranslator(language);

  // dialog
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState("user");
  // form
  const [role, setRole] = useState("");
  const [description, setDescription] = useState("");
  const [hierarchyLevel, setHierarchyLevel] = useState(0);
  const [imageFile, setImageFile] = useState(null);
  const [permissions, setPermissions] = useState({
    canSeeAdminPanel: false,
    canEditOrganization: false,
    canDeleteOrganization: false,
    canEditUser: false,
    canDeleteUser: false,
    canCreateAuthor: false,
    canCreateMangaProfile: false,
    canCreateMangaCustom: false,
    canEditMangaCustom: false,
    canDeleteMangaCustom: false,
    canCreateGenre: false,
    canEditGenre: false,
    canDeleteGenre: false,
    canCreateChapter: false,
    canEditChapter: false,
    canDeleteChapter: false,
    canCreatePage: false,
    canEditPage: false,
    canDeletePage: false,
    canCreateSubscriptionPlan: false,
    canEditSubscriptionPlan: false,
    canDeleteSubscriptionPlan: false,
    canDeleteComment: false,
    canEditComment: false,
    canHideComment: false,
    hideAds: false,
    canDownload: false,
    canReadUnreleased: false,
  });

  useEffect(() => {
    if (!user) return;
    // Usar permisos del usuario si están disponibles, sino usar valores por defecto
    // Nota: El API ahora siempre devuelve permissions (con valores por defecto si el usuario no tiene registro de permisos)
    const userPermissions = user.permissions || {};
    setRole(userPermissions.role || "user");
    setDescription(user.description || "");
    setHierarchyLevel(userPermissions.hierarchyLevel || 0);
    setPermissions({
      canSeeAdminPanel: userPermissions.canSeeAdminPanel || false,
      canEditOrganization: userPermissions.canEditOrganization || false,
      canDeleteOrganization: userPermissions.canDeleteOrganization || false,
      canEditUser: userPermissions.canEditUser || false,
      canDeleteUser: userPermissions.canDeleteUser || false,
      canCreateAuthor: userPermissions.canCreateAuthor || false,
      canCreateMangaProfile: userPermissions.canCreateMangaProfile || false,
      canCreateMangaCustom: userPermissions.canCreateMangaCustom || false,
      canEditMangaCustom: userPermissions.canEditMangaCustom || false,
      canDeleteMangaCustom: userPermissions.canDeleteMangaCustom || false,
      canCreateGenre: userPermissions.canCreateGenre || false,
      canEditGenre: userPermissions.canEditGenre || false,
      canDeleteGenre: userPermissions.canDeleteGenre || false,
      canCreateChapter: userPermissions.canCreateChapter || false,
      canEditChapter: userPermissions.canEditChapter || false,
      canDeleteChapter: userPermissions.canDeleteChapter || false,
      canCreatePage: userPermissions.canCreatePage || false,
      canEditPage: userPermissions.canEditPage || false,
      canDeletePage: userPermissions.canDeletePage || false,
      canCreateSubscriptionPlan: userPermissions.canCreateSubscriptionPlan || false,
      canEditSubscriptionPlan: userPermissions.canEditSubscriptionPlan || false,
      canDeleteSubscriptionPlan: userPermissions.canDeleteSubscriptionPlan || false,
      canDeleteComment: userPermissions.canDeleteComment || false,
      canEditComment: userPermissions.canEditComment || false,
      canHideComment: userPermissions.canHideComment || false,
      hideAds: userPermissions.hideAds || false,
      canDownload: userPermissions.canDownload || false,
      canReadUnreleased: userPermissions.canReadUnreleased || false,
    });
  }, [user]);

  const handleSubmit = async () => {
    if (!role) {
      return toast.error(_("role_mandatory"));
    }
    const formData = new FormData();
    formData.append("role", role);
    formData.append("hierarchyLevel", hierarchyLevel.toString());
    if (description) formData.append("description", description);
    formData.append("image", imageFile);
    // Append permissions to formData
    Object.keys(permissions).forEach((key) => {
      formData.append(key, permissions[key]);
    });
    setLoading(true);
    callAPI(user ? `/api/user/${user.id}` : "/api/user", {
      method: user ? "PATCH" : "POST",
      body: formData,
    })
      .then((response) => {
        toast.success(_("user_updated"));
        setUser(null);
        setRole("user");
        setDescription("");
        setHierarchyLevel(0);
        const permissionsSetToFalse = {};
        Object.keys(permissions).forEach((key) => {
          permissionsSetToFalse[key] = false;
        });
        setPermissions(permissionsSetToFalse);
        setImageFile(null);
        setOpen(false);
      })
      .catch((error) => toast.error(error?.message))
      .finally(() => setLoading(false));
  };

  const handleDeactivateSubscription = async (subscriptionId, userId) => {
    const formData = new FormData();
    formData.append("active", false);
    formData.append("userId", userId);
    callAPI(`/api/subscription/${subscriptionId}`, {
      method: "PATCH",
      body: formData,
    })
      .then((response) => {
        toast.success(_("subscription_deactivated"));
        setOpen(false);
      })
      .catch((error) => toast.error(error?.message));
  };

  const handleActivateSubscription = async (subscriptionId, userId) => {
    const formData = new FormData();
    formData.append("active", true);
    formData.append("userId", userId);
    callAPI(`/api/subscription/${subscriptionId}`, {
      method: "PATCH",
      body: formData,
    })
      .then((response) => {
        toast.success(_("subscription_activated"));
        setOpen(false);
      })
      .catch((error) => toast.error(error?.message));
  };

  return (
    <Dialog
      size="sm"
      open={open}
      handler={() => setOpen((previousState) => !previousState)}
      className="max-h-[95vh]"
    >
      <DialogHeader>
        <Typography variant="h4" color="blue-gray">
          {user ? _("edit_user") : _("create_user")}
        </Typography>
      </DialogHeader>
      <DialogBody className="max-h-[65vh] overflow-y-auto flex flex-col gap-4">
        <div className="flex items-center justify-center">
          <ButtonGroup>
            <Button onClick={() => setCurrentTab("user")}>
              {_("general")}
            </Button>
            <Button onClick={() => setCurrentTab("permissions")}>
              {_("permissions")}
            </Button>
            <Button onClick={() => setCurrentTab("subscriptions")}>
              {_("subscriptions")}
            </Button>
          </ButtonGroup>
        </div>

        <div
          className={`flex flex-col gap-4 ${
            currentTab === "user" ? "block" : "hidden"
          }`}
        >
          <Typography className="-mb-2" variant="h6" color="gray">
            {_("role")}
          </Typography>
          <Input
            size="lg"
            label={_("user_role")}
            autoComplete="off"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
          <Typography className="-mb-2" variant="h6" color="gray">
            {_("description")}
          </Typography>
          <Input
            size="lg"
            label={_("description")}
            autoComplete="off"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Typography className="-mb-2" variant="h6" color="gray">
            {_("hierarchy_level")}
          </Typography>
          <Input
            size="lg"
            label={_("hierarchy_level")}
            autoComplete="off"
            value={hierarchyLevel}
            onChange={(e) => setHierarchyLevel(e.target.value)}
          />
          <Typography className="-mb-2" variant="h6" color="gray">
            {_("profile_image")} ({_("optional")})
          </Typography>
          <ImageDropzone
            value={imageFile}
            label={_("drop_profile_image")}
            alt={_("profile_image")}
            onChange={(files) => (files[0] ? setImageFile(files[0]) : null)}
            onDelete={(file) => setImageFile(null)}
          />
        </div>
        <div
          className={`flex flex-col gap-4 ${
            currentTab === "permissions" ? "block" : "hidden"
          }`}
        >
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              variant="outlined"
              size="sm"
              onClick={() => {
                const permissionsSetToTrue = {};
                Object.keys(permissions).forEach((key) => {
                  permissionsSetToTrue[key] = true;
                });
                setPermissions(permissionsSetToTrue);
              }}
            >
              Marcar todos
            </Button>
            <Button
              variant="outlined"
              size="sm"
              onClick={() => {
                const permissionsSetToFalse = {};
                Object.keys(permissions).forEach((key) => {
                  permissionsSetToFalse[key] = false;
                });
                setPermissions(permissionsSetToFalse);
              }}
            >
              Desmarcar todos
            </Button>
          </div>
          <Typography className="-mb-2" variant="h6" color="gray">
            {_("general")}
          </Typography>
          <Checkbox
            label={_("can_see_admin_panel")}
            checked={permissions.canSeeAdminPanel}
            onChange={(e) =>
              setPermissions({
                ...permissions,
                canSeeAdminPanel: e.target.checked,
              })
            }
          />
          <Checkbox
            label={_("can_edit_organization")}
            checked={permissions.canEditOrganization}
            onChange={(e) =>
              setPermissions({
                ...permissions,
                canEditOrganization: e.target.checked,
              })
            }
          />
          <Checkbox
            label={_("can_delete_organization")}
            checked={permissions.canDeleteOrganization}
            onChange={(e) =>
              setPermissions({
                ...permissions,
                canDeleteOrganization: e.target.checked,
              })
            }
          />

          <Typography className="-mb-2" variant="h6" color="gray">
            {_("users")}
          </Typography>
          <Checkbox
            label={_("can_edit_user")}
            checked={permissions.canEditUser}
            onChange={(e) =>
              setPermissions({ ...permissions, canEditUser: e.target.checked })
            }
          />
          <Typography className="-mb-2" variant="h6" color="gray">
            {_("content")}
          </Typography>
          <Checkbox
            label={_("can_create_author")}
            checked={permissions.canCreateAuthor}
            onChange={(e) =>
              setPermissions({
                ...permissions,
                canCreateAuthor: e.target.checked,
              })
            }
          />
          <Checkbox
            label={_("can_create_manga_profile")}
            checked={permissions.canCreateMangaProfile}
            onChange={(e) =>
              setPermissions({
                ...permissions,
                canCreateMangaProfile: e.target.checked,
              })
            }
          />
          <Checkbox
            label={_("can_create_manga")}
            checked={permissions.canCreateMangaCustom}
            onChange={(e) =>
              setPermissions({
                ...permissions,
                canCreateMangaCustom: e.target.checked,
              })
            }
          />
          <Checkbox
            label={_("can_edit_manga")}
            checked={permissions.canEditMangaCustom}
            onChange={(e) =>
              setPermissions({
                ...permissions,
                canEditMangaCustom: e.target.checked,
              })
            }
          />
          <Checkbox
            label={_("can_delete_manga")}
            checked={permissions.canDeleteMangaCustom}
            onChange={(e) =>
              setPermissions({
                ...permissions,
                canDeleteMangaCustom: e.target.checked,
              })
            }
          />
          <Checkbox
            label={_("can_create_genre")}
            checked={permissions.canCreateGenre}
            onChange={(e) =>
              setPermissions({
                ...permissions,
                canCreateGenre: e.target.checked,
              })
            }
          />
          <Checkbox
            label={_("can_edit_genre")}
            checked={permissions.canEditGenre}
            onChange={(e) =>
              setPermissions({ ...permissions, canEditGenre: e.target.checked })
            }
          />
          <Checkbox
            label={_("can_delete_genre")}
            checked={permissions.canDeleteGenre}
            onChange={(e) =>
              setPermissions({
                ...permissions,
                canDeleteGenre: e.target.checked,
              })
            }
          />
          <Checkbox
            label={_("can_create_chapter")}
            checked={permissions.canCreateChapter}
            onChange={(e) =>
              setPermissions({
                ...permissions,
                canCreateChapter: e.target.checked,
              })
            }
          />
          <Checkbox
            label={_("can_edit_chapter")}
            checked={permissions.canEditChapter}
            onChange={(e) =>
              setPermissions({
                ...permissions,
                canEditChapter: e.target.checked,
              })
            }
          />
          <Checkbox
            label={_("can_delete_chapter")}
            checked={permissions.canDeleteChapter}
            onChange={(e) =>
              setPermissions({
                ...permissions,
                canDeleteChapter: e.target.checked,
              })
            }
          />
          <Checkbox
            label={_("can_create_page")}
            checked={permissions.canCreatePage}
            onChange={(e) =>
              setPermissions({
                ...permissions,
                canCreatePage: e.target.checked,
              })
            }
          />
          <Checkbox
            label={_("can_edit_page")}
            checked={permissions.canEditPage}
            onChange={(e) =>
              setPermissions({ ...permissions, canEditPage: e.target.checked })
            }
          />
          <Checkbox
            label={_("can_delete_page")}
            checked={permissions.canDeletePage}
            onChange={(e) =>
              setPermissions({
                ...permissions,
                canDeletePage: e.target.checked,
              })
            }
          />
          <Typography className="-mb-2" variant="h6" color="gray">
            {_("subscription_plans")}
          </Typography>
          <Checkbox
            label={_("can_create_subscription_plan")}
            checked={permissions.canCreateSubscriptionPlan}
            onChange={(e) =>
              setPermissions({
                ...permissions,
                canCreateSubscriptionPlan: e.target.checked,
              })
            }
          />
          <Checkbox
            label={_("can_edit_subscription_plan")}
            checked={permissions.canEditSubscriptionPlan}
            onChange={(e) =>
              setPermissions({
                ...permissions,
                canEditSubscriptionPlan: e.target.checked,
              })
            }
          />
          <Checkbox
            label={_("can_delete_subscription_plan")}
            checked={permissions.canDeleteSubscriptionPlan}
            onChange={(e) =>
              setPermissions({
                ...permissions,
                canDeleteSubscriptionPlan: e.target.checked,
              })
            }
          />
          <Checkbox
            label={_("can_delete_comment")}
            checked={permissions.canDeleteComment}
            onChange={(e) =>
              setPermissions({
                ...permissions,
                canDeleteComment: e.target.checked,
              })
            }
          />
          <Checkbox
            label={_("can_edit_comment")}
            checked={permissions.canEditComment}
            onChange={(e) =>
              setPermissions({
                ...permissions,
                canEditComment: e.target.checked,
              })
            }
          />
          <Checkbox
            label={_("can_hide_comment")}
            checked={permissions.canHideComment}
            onChange={(e) =>
              setPermissions({
                ...permissions,
                canHideComment: e.target.checked,
              })
            }
          />
          <Typography className="-mb-2" variant="h6" color="gray">
            {_("perks")}
          </Typography>
          <Checkbox
            label={_("hide_ads")}
            checked={permissions.hideAds}
            onChange={(e) =>
              setPermissions({ ...permissions, hideAds: e.target.checked })
            }
          />
          <Checkbox
            label={_("can_download")}
            checked={permissions.canDownload}
            onChange={(e) =>
              setPermissions({ ...permissions, canDownload: e.target.checked })
            }
          />
          <Checkbox
            label={_("can_read_unreleased")}
            checked={permissions.canReadUnreleased}
            onChange={(e) =>
              setPermissions({
                ...permissions,
                canReadUnreleased: e.target.checked,
              })
            }
          />
        </div>
        <div
          className={`flex flex-col gap-4 ${
            currentTab === "subscriptions" ? "block" : "hidden"
          }`}
        >
          {user?.subscriptions.length > 0 ? (
            <p>Suscripciones activas</p>
          ) : (
            <p>No hay suscripciones activas</p>
          )}
          <ul>
            {user?.subscriptions.map((subscription) => (
              <li key={subscription.id}>
                <p className="text-sm font-bold">
                  - {subscription.subscriptionPlan.name}
                </p>
                <p className="text-sm">
                  Estado: {subscription.active ? _("active") : _("inactive")}
                </p>
                <p className="text-sm">
                  Fecha de inicio:{" "}
                  {new Date(subscription.startDate).toLocaleDateString()}
                </p>
                <p className="text-sm">
                  Fecha de fin:{" "}
                  {subscription.endDate
                    ? new Date(subscription.endDate).toLocaleDateString()
                    : "N/A"}
                </p>
                <p className="text-sm">
                  Última fecha de pago:{" "}
                  {subscription.lastPayment
                    ? new Date(subscription.lastPayment).toLocaleDateString()
                    : "N/A"}
                </p>
                <p className="text-sm">
                  Próxima fecha de pago:{" "}
                  {subscription.nextPayment
                    ? new Date(subscription.nextPayment).toLocaleDateString()
                    : "N/A"}
                </p>
                <p className="text-sm">
                  Estado de la suscripción: {subscription.status}
                </p>
                <p className="text-sm">
                  ID de la suscripción de PayPal:{" "}
                  {subscription.paypalSubscriptionId}
                </p>
                <p className="text-sm">
                  ID de la suscripción: {subscription.id}
                </p>
                {subscription.active ? (
                  <Button
                    className="my-2"
                    variant="outlined"
                    size="sm"
                    onClick={() =>
                      handleDeactivateSubscription(subscription.id, user.id)
                    }
                  >
                    Desactivar suscripción
                  </Button>
                ) : (
                  <Button
                    className="my-2"
                    variant="outlined"
                    size="sm"
                    onClick={() =>
                      handleActivateSubscription(subscription.id, user.id)
                    }
                  >
                    Activar suscripción
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </DialogBody>
      <DialogFooter className="space-x-2">
        <Button variant="outlined" onClick={handleSubmit} loading={loading}>
          {_("save")}
        </Button>
      </DialogFooter>
      <ToastContainer theme="dark" />
    </Dialog>
  );
}
