import { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import {
  Textarea,
  Button,
  Dialog,
  Spinner,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Typography,
  Input,
  Checkbox,
  Select,
  Option,
  Accordion,
  AccordionHeader,
  AccordionBody,
  Switch,
} from "@material-tailwind/react";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Autocomplete from "@mui/material/Autocomplete";
import { DropzoneArea } from "material-ui-dropzone";
import { DatePicker } from "../DatePicker";
import { ImageDropzone } from "../ImageDropzone";
import { callAPI } from "../../util/callApi";
import { getTranslator } from "../../util/translate";
import { TrashIcon } from "@heroicons/react/24/outline";

export function AdminSettings({
  organization: { domain: organizationDomain, language: organizationLanguage },
}) {
  const _ = getTranslator(organizationLanguage);

  // dialog
  const [loading, setLoading] = useState(false);
  // form
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("");
  const [enableMangaSection, setEnableMangaSection] = useState(false);
  const [enableManhuaSection, setEnableManhuaSection] = useState(false);
  const [enableManhwaSection, setEnableManhwaSection] = useState(false);
  const [useBlockedCountries, setUseBlockedCountries] = useState(false);
  const [useAllowedCountries, setUseAllowedCountries] = useState(false);
  const [enableGoogleAds, setEnableGoogleAds] = useState(false);
  const [enableDisqusIntegration, setEnableDisqusIntegration] = useState(false);
  const [disqusEmbedUrl, setDisqusEmbedUrl] = useState("");
  const [logoImageFile, setLogoImageFile] = useState(null);
  const [imageImageFile, setImageImageFile] = useState(null);
  const [bannerImageFile, setBannerImageFile] = useState(null);
  const [faviconImageFile, setFaviconImageFile] = useState(null);
  const [facebookUrl, setFacebookUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [patreonUrl, setPatreonUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [discordUrl, setDiscordUrl] = useState("");
  const [twitchUrl, setTwitchUrl] = useState("");
  const [countryOptions, setCountryOptions] = useState([]);
  // country options
  const [countryName, setCountryName] = useState("");
  const [countryLanguage, setCountryLanguage] = useState("");
  const [countryCode, setCountryCode] = useState("");
  // accordion
  const [openInformationAccordion, setOpenInformationAccordion] =
    useState(true);
  const [openCountriesAccordion, setOpenCountriesAccordion] = useState(false);
  const [openIntegrationsAccordion, setOpenIntegrationsAccordion] =
    useState(false);
  const [openImagesAccordion, setOpenImagesAccordion] = useState(false);
  const [openSocialAccordion, setOpenSocialAccordion] = useState(false);

  const handleInformationAccordion = () =>
    setOpenInformationAccordion(!openInformationAccordion);
  const handleCountriesAccordion = () =>
    setOpenCountriesAccordion(!openCountriesAccordion);
  const handleIntegrationsAccordion = () =>
    setOpenIntegrationsAccordion(!openIntegrationsAccordion);
  const handleImagesAccordion = () =>
    setOpenImagesAccordion(!openImagesAccordion);
  const handleSocialAccordion = () =>
    setOpenSocialAccordion(!openSocialAccordion);

  const handleAddCountry = () => {
    if (!countryCode.match(/^[A-Z]{2}$/)) {
      toast.error(_("country_code_invalid"));
      return;
    }
    if (!countryLanguage.match(/^[a-z]{2}$/)) {
      toast.error(_("language_invalid"));
      return;
    }
    if (!countryName) {
      toast.error(_("country_name_required"));
      return;
    }
    if (countryOptions.find((option) => option.countryCode === countryCode)) {
      toast.error(_("country_code_already_exists"));
      return;
    }
    setCountryOptions((oldValue) => [
      ...oldValue,
      {
        countryCode,
        language,
        countryName,
        allowed: useAllowedCountries,
        blocked: useBlockedCountries,
      },
    ]);
  };

  useEffect(() => {
    refreshOrganization();
  }, []);

  const refreshOrganization = () => {
    setLoading(true);
    callAPI(`/api/organization/check?domain=${organizationDomain}`)
      .then((organization) => {
        // Information
        setName(organization.name || "");
        setTitle(organization.title || "");
        setDescription(organization.description || "");
        setLanguage(organization.language || "es");
        setEnableMangaSection(organization.enableMangaSection || false);
        setEnableManhuaSection(organization.enableManhuaSection || false);
        setEnableManhwaSection(organization.enableManhwaSection || false);
        setUseBlockedCountries(organization.useBlockedCountries || false);
        setUseAllowedCountries(organization.useAllowedCountries || false);
        setCountryOptions(organization.countryOptions || []);
        // Integrations
        setEnableGoogleAds(organization.enableGoogleAds || false);
        setEnableDisqusIntegration(
          organization.enableDisqusIntegration || false
        );
        setDisqusEmbedUrl(organization.disqusEmbedUrl || "");
        // Social
        setFacebookUrl(organization.facebookUrl || "");
        setTwitterUrl(organization.twitterUrl || "");
        setInstagramUrl(organization.instagramUrl || "");
        setYoutubeUrl(organization.youtubeUrl || "");
        setPatreonUrl(organization.patreonUrl || "");
        setTiktokUrl(organization.tiktokUrl || "");
        setDiscordUrl(organization.discordUrl || "");
        setTwitchUrl(organization.twitchUrl || "");
        // Images
        setLogoImageFile(organization.logoUrl);
        setImageImageFile(organization.imageUrl);
        setBannerImageFile(organization.bannerUrl);
        setFaviconImageFile(organization.faviconUrl);
        // Country options
        setCountryCode("");
        setCountryLanguage("");
        setCountryName("");
      })
      .catch((error) => toast.error(error?.message))
      .finally(() => setLoading(false));
  };
  const handleSubmit = async () => {
    if (!name) {
      return toast.error(_("name_is_required"));
    }
    const formData = new FormData();
    formData.append("name", name);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("language", language);
    formData.append("enableMangaSection", enableMangaSection);
    formData.append("enableManhuaSection", enableManhuaSection);
    formData.append("enableManhwaSection", enableManhwaSection);
    formData.append("useBlockedCountries", useBlockedCountries);
    formData.append("useAllowedCountries", useAllowedCountries);
    formData.append("enableGoogleAds", enableGoogleAds);
    formData.append("enableDisqusIntegration", enableDisqusIntegration);
    formData.append("disqusEmbedUrl", disqusEmbedUrl);
    formData.append("facebookUrl", facebookUrl);
    formData.append("twitterUrl", twitterUrl);
    formData.append("instagramUrl", instagramUrl);
    formData.append("youtubeUrl", youtubeUrl);
    formData.append("patreonUrl", patreonUrl);
    formData.append("tiktokUrl", tiktokUrl);
    formData.append("discordUrl", discordUrl);
    formData.append("twitchUrl", twitchUrl);
    formData.append("logo", logoImageFile);
    formData.append("image", imageImageFile);
    formData.append("banner", bannerImageFile);
    formData.append("favicon", faviconImageFile);
    formData.append("countryOptions", JSON.stringify(countryOptions));
    setLoading(true);
    callAPI("/api/organization", {
      method: "PATCH",
      body: formData,
    })
      .then((response) => {
        toast.success(_("options_saved_successfully"));
        refreshOrganization();
      })
      .catch((error) => toast.error(error?.message))
      .finally(() => setLoading(false));
  };

  return (
    <>
      <Typography variant="h4" color="blue-gray">
        {_("organization_options")}
      </Typography>
      <div className="max-w-lg p-4">
        <Accordion open={openInformationAccordion}>
          <AccordionHeader onClick={handleInformationAccordion}>
            {_("information")}
          </AccordionHeader>
          <AccordionBody>
            <div className="flex flex-col gap-4 sm:ml-4">
              <Typography className="-mb-2" variant="h6" color="gray">
                {_("name")}
              </Typography>
              <Input
                size="lg"
                label={_("name")}
                autoComplete="off"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Typography className="-mb-2" variant="h6" color="gray">
                {_("title")}
              </Typography>
              <Input
                size="md"
                label={_("title")}
                autoComplete="off"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Typography className="-mb-2" variant="h6" color="gray">
                {_("description_optional")}
              </Typography>
              <Textarea
                size="lg"
                label={_("description")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <Typography className="-mb-2" variant="h6" color="gray">
                {_("language")}
              </Typography>
              <div className="w-80">
                <Select
                  label={_("language")}
                  value={language}
                  onChange={(val) => setLanguage(val)}
                >
                  <Option value="es" selected={language === "es"}>
                    {_("spanish")}
                  </Option>
                  <Option value="en" selected={language === "en"}>
                    {_("english")}
                  </Option>
                  <Option value="pt" selected={language === "pt"}>
                    {_("portuguese")}
                  </Option>
                </Select>
              </div>
              <Typography className="-mb-2" variant="h6" color="gray">
                {_("manga_section")}
              </Typography>
              <Switch
                label={_("enable_manga_section")}
                checked={enableMangaSection}
                onChange={(e) => setEnableMangaSection(e.target.checked)}
              />
              <Typography className="-mb-2" variant="h6" color="gray">
                {_("manhua_section")}
              </Typography>
              <Switch
                label={_("enable_manhua_section")}
                checked={enableManhuaSection}
                onChange={(e) => setEnableManhuaSection(e.target.checked)}
              />
              <Typography className="-mb-2" variant="h6" color="gray">
                {_("manhwa_section")}
              </Typography>
              <Switch
                label={_("enable_manhwa_section")}
                checked={enableManhwaSection}
                onChange={(e) => setEnableManhwaSection(e.target.checked)}
              />
            </div>
          </AccordionBody>
        </Accordion>
        <Accordion open={openCountriesAccordion}>
          <AccordionHeader onClick={handleCountriesAccordion}>
            {_("countries")}
          </AccordionHeader>
          <AccordionBody>
            <div className="flex flex-col gap-4 sm:ml-4">
              <Typography className="-mb-2" variant="h6" color="gray">
                {_("use_allowed_countries")}
              </Typography>
              <Switch
                label={_("enable_allowed_countries_whitelist")}
                checked={useAllowedCountries}
                onChange={(e) => {
                    setUseAllowedCountries(e.target.checked);
                    setUseBlockedCountries(false);
                }}
              />
              <p className="text-sm text-gray-500">
                ⚠️ {_("warning_use_allowed_countries")}
              </p>
              <Typography className="-mb-2" variant="h6" color="gray">
                {_("use_blocked_countries")}
              </Typography>
              <Switch
                label={_("enable_blocked_countries_whitelist")}
                checked={useBlockedCountries}
                onChange={(e) => {
                    setUseBlockedCountries(e.target.checked);
                    setUseAllowedCountries(false);
                }}
              />
              <p className="text-sm text-gray-500">
                ⚠️ {_("warning_use_blocked_countries")}
              </p>
              {(useAllowedCountries || useBlockedCountries) && (
                <>
                  <Typography className="-mb-2" variant="h6" color="gray">
                    {_("countries")}
                  </Typography>
                  <div className="sm:ml-4 border-gray-400 border-2 rounded-md p-2">
                    <p className="text-sm mb-1 text-gray-800 font-bold">
                      {_("country_name")}
                    </p>
                    <Input
                      size="md"
                      label={_("country_name")}
                      autoComplete="off"
                      value={countryName}
                      onChange={(e) => setCountryName(e.target.value)}
                    />
                    <div className="flex mt-2 gap-2 justify-between">
                      <div>
                        <p className="text-sm mb-1 text-gray-800 font-bold">
                          {_("language")} (ISO2)
                        </p>
                        <Input
                          size="md"
                          label={_("country_language")}
                          autoComplete="off"
                          maxLength={2}
                          minLength={2}
                          pattern="^[a-z]{2}$"
                          value={countryLanguage}
                          onChange={(e) => setCountryLanguage(e.target.value.toLowerCase())}
                        />
                      </div>
                      <div>
                        <p className="text-sm mb-1 text-gray-800 font-bold">
                          {_("country_code")} (ISO2)
                        </p>
                        <Input
                          size="md"
                          label={_("country_code")}
                          autoComplete="off"
                          maxLength={2}
                          minLength={2}
                          pattern="^[A-Z]{2}$"
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end mt-2">
                      <Button variant="outlined" onClick={handleAddCountry}>
                        {_("add_country")}
                      </Button>
                    </div>
                  </div>
                  {/* table */}
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th>{_("country_code")}</th>
                        <th>{_("country_name")}</th>
                        <th>{_("country_language")}</th>
                        {useAllowedCountries && <th>{_("country_allowed")}</th>}
                        {useBlockedCountries && <th>{_("country_blocked")}</th>}
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {countryOptions.map((countryOption) => (
                        <tr key={countryOption.countryCode}>
                          <td>{countryOption.countryCode}</td>
                          <td>{countryOption.countryName}</td>
                          <td>{countryOption.language}</td>
                          {useAllowedCountries && (
                            <td>
                              <Switch
                                label={_("allowed")}
                                checked={countryOption.allowed}
                                onChange={(e) =>
                                  setCountryOptions((oldValue) =>
                                    oldValue.map((option) =>
                                      option.countryCode ===
                                      countryOption.countryCode
                                        ? {
                                            ...option,
                                            allowed: e.target.checked,
                                          }
                                        : option
                                    )
                                  )
                                }
                              />
                            </td>
                          )}
                          {useBlockedCountries && (
                            <td>
                              <Switch
                                label={_("blocked")}
                                checked={countryOption.blocked}
                                onChange={(e) =>
                                  setCountryOptions((oldValue) =>
                                    oldValue.map((option) =>
                                      option.countryCode ===
                                      countryOption.countryCode
                                        ? {
                                            ...option,
                                            blocked: e.target.checked,
                                          }
                                        : option
                                    )
                                  )
                                }
                              />
                            </td>
                          )}
                          <td>
                            <a
                              href="#!"
                              className="px-2 ml-1 hover:text-red-400"
                              size="sm"
                              onClick={() => {
                                setCountryOptions((oldValue) =>
                                  oldValue.filter(
                                    (option) =>
                                      option.countryCode !==
                                      countryOption.countryCode
                                  )
                                );
                              }}
                            >
                              <TrashIcon strokeWidth={2} className="h-5 w-5" />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </AccordionBody>
        </Accordion>
        <Accordion open={openIntegrationsAccordion}>
          <AccordionHeader onClick={handleIntegrationsAccordion}>
            {_("integrations")}
          </AccordionHeader>
          <AccordionBody>
            <div className="flex flex-col gap-4 sm:ml-4">
              <Typography className="-mb-2" variant="h6" color="gray">
                {_("ads")}
              </Typography>
              <Switch
                label={_("enable_google_ads")}
                checked={enableGoogleAds}
                onChange={(e) => setEnableGoogleAds(e.target.checked)}
              />
              <Typography className="-mb-2" variant="h6" color="gray">
                {_("comments")}
              </Typography>
              <Switch
                label={_("enable_disqus_comments")}
                checked={enableDisqusIntegration}
                onChange={(e) => setEnableDisqusIntegration(e.target.checked)}
              />
              <Input
                size="lg"
                label={_("disqus_embed_url")}
                autoComplete="off"
                value={disqusEmbedUrl}
                onChange={(e) => setDisqusEmbedUrl(e.target.value)}
                disabled={!enableDisqusIntegration}
              />
            </div>
          </AccordionBody>
        </Accordion>
        <Accordion open={openSocialAccordion}>
          <AccordionHeader onClick={handleSocialAccordion}>
            {_("social")}
          </AccordionHeader>
          <AccordionBody>
            <div className="flex flex-col gap-4 sm:ml-4">
              <Typography className="-mb-2" variant="h6" color="gray">
                Facebook
              </Typography>
              <Input
                size="md"
                label={_("facebook_url")}
                autoComplete="off"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
              />
              <Typography className="-mb-2" variant="h6" color="gray">
                X (Twitter)
              </Typography>
              <Input
                size="md"
                label={_("twitter_url")}
                autoComplete="off"
                value={twitterUrl}
                onChange={(e) => setTwitterUrl(e.target.value)}
              />
              <Typography className="-mb-2" variant="h6" color="gray">
                Instagram
              </Typography>
              <Input
                size="md"
                label={_("instagram_url")}
                autoComplete="off"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
              />
              <Typography className="-mb-2" variant="h6" color="gray">
                Youtube
              </Typography>
              <Input
                size="md"
                label={_("youtube_url")}
                autoComplete="off"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
              />
              <Typography className="-mb-2" variant="h6" color="gray">
                Patreon
              </Typography>
              <Input
                size="md"
                label={_("patreon_url")}
                autoComplete="off"
                value={patreonUrl}
                onChange={(e) => setPatreonUrl(e.target.value)}
              />
              <Typography className="-mb-2" variant="h6" color="gray">
                Tiktok
              </Typography>
              <Input
                size="md"
                label={_("tiktok_url")}
                autoComplete="off"
                value={tiktokUrl}
                onChange={(e) => setTiktokUrl(e.target.value)}
              />
              <Typography className="-mb-2" variant="h6" color="gray">
                Discord
              </Typography>
              <Input
                size="md"
                label={_("discord_url")}
                autoComplete="off"
                value={discordUrl}
                onChange={(e) => setDiscordUrl(e.target.value)}
              />
              <Typography className="-mb-2" variant="h6" color="gray">
                Twitch
              </Typography>
              <Input
                size="md"
                label={_("twitch_url")}
                autoComplete="off"
                value={twitchUrl}
                onChange={(e) => setTwitchUrl(e.target.value)}
              />
            </div>
          </AccordionBody>
        </Accordion>
        <Accordion open={openImagesAccordion}>
          <AccordionHeader onClick={handleImagesAccordion}>
            {_("images")}
          </AccordionHeader>
          <AccordionBody>
            <div className="flex flex-col gap-4 sm:ml-4">
              <Typography className="-mb-2" variant="h6" color="gray">
                {_("logo")}
              </Typography>
              <ImageDropzone
                value={logoImageFile}
                label={_("drag_and_drop_logo_image")}
                alt={_("logo_image")}
                onChange={(files) =>
                  files[0] ? setLogoImageFile(files[0]) : null
                }
                onDelete={(file) => setLogoImageFile(null)}
              />
              <Typography className="-mb-2" variant="h6" color="gray">
                {_("cover_image")}
              </Typography>
              <ImageDropzone
                value={imageImageFile}
                label={_("drag_and_drop_cover_image")}
                alt={_("cover_image")}
                onChange={(files) =>
                  files[0] ? setImageImageFile(files[0]) : null
                }
                onDelete={(file) => setImageImageFile(null)}
              />
              <Typography className="-mb-2" variant="h6" color="gray">
                {_("banner")}
              </Typography>
              <ImageDropzone
                value={bannerImageFile}
                label={_("drag_and_drop_banner_image")}
                alt={_("banner")}
                onChange={(files) =>
                  files[0] ? setBannerImageFile(files[0]) : null
                }
                onDelete={(file) => setBannerImageFile(null)}
              />
              <Typography className="-mb-2" variant="h6" color="gray">
                {_("favicon")}
              </Typography>
              <ImageDropzone
                value={faviconImageFile}
                label={_("drag_and_drop_favicon_image")}
                alt={_("favicon")}
                onChange={(files) =>
                  files[0] ? setFaviconImageFile(files[0]) : null
                }
                onDelete={(file) => setFaviconImageFile(null)}
              />
            </div>
          </AccordionBody>
        </Accordion>
        <div className="flex self-end my-4">
          <Button variant="outlined" onClick={handleSubmit} loading={loading}>
            {_("save_options")}
          </Button>
        </div>
      </div>
    </>
  );
}
