import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  Info,
  Globe,
  Share2,
  Image as ImageIcon,
  Bell,
  Save,
  Trash2,
} from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Textarea from './ui/Textarea';
import Select from './ui/Select';
import Switch from './ui/Switch';
import Accordion from './ui/Accordion';
import { ImageDropzone } from '../ImageDropzone';
import { callAPI } from '../../util/callApi';
import { getTranslator } from '../../util/translate';
import { uploadFile } from '../../util/uploadFile';

interface AdminSettingsProps {
  language: string;
  organizationSlug: string;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ language: translatorLanguage, organizationSlug }) => {
  const _ = getTranslator(translatorLanguage);

  const [loading, setLoading] = useState(false);

  // Información básica
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('es');

  // Secciones
  const [enableMangaSection, setEnableMangaSection] = useState(false);
  const [enableManhuaSection, setEnableManhuaSection] = useState(false);
  const [enableManhwaSection, setEnableManhwaSection] = useState(false);
  const [enableSubscriptionSection, setEnableSubscriptionSection] = useState(false);
  const [enableMainSlider, setEnableMainSlider] = useState(false);
  const [enableMainBanner, setEnableMainBanner] = useState(false);

  // Webhooks Discord
  const [enableDiscordWebhookNewChapter, setEnableDiscordWebhookNewChapter] = useState(false);
  const [enableDiscordWebhookNewSubscription, setEnableDiscordWebhookNewSubscription] = useState(false);
  const [discordWebhookUrlNewChapter, setDiscordWebhookUrlNewChapter] = useState('');
  const [discordWebhookMessageTemplateNewChapter, setDiscordWebhookMessageTemplateNewChapter] = useState('');
  const [discordWebhookMessageTemplateNewSubscription, setDiscordWebhookMessageTemplateNewSubscription] = useState('');
  const [discordWebhookUrlNewSubscription, setDiscordWebhookUrlNewSubscription] = useState('');

  // Países
  const [useBlockedCountries, setUseBlockedCountries] = useState(false);
  const [useAllowedCountries, setUseAllowedCountries] = useState(false);
  const [countryOptions, setCountryOptions] = useState<any[]>([]);
  const [countryName, setCountryName] = useState('');
  const [countryLanguage, setCountryLanguage] = useState('');
  const [countryCode, setCountryCode] = useState('');

  // Anuncios y clasificación +18 ya NO se configuran por scan: los gestiona la
  // plataforma (AdSense en normal, Adsterra en +18) y el +18 es por manga.

  // Imágenes
  const [logoImageFile, setLogoImageFile] = useState<any>(null);
  const [imageImageFile, setImageImageFile] = useState<any>(null);
  const [bannerImageFile, setBannerImageFile] = useState<any>(null);
  const [faviconImageFile, setFaviconImageFile] = useState<any>(null);
  
  // Estado original de las imágenes para detectar si fueron eliminadas
  const [originalLogoUrl, setOriginalLogoUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [originalBannerUrl, setOriginalBannerUrl] = useState<string | null>(null);
  const [originalFaviconUrl, setOriginalFaviconUrl] = useState<string | null>(null);

  // Redes sociales
  const [facebookUrl, setFacebookUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [patreonUrl, setPatreonUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [discordUrl, setDiscordUrl] = useState('');
  const [twitchUrl, setTwitchUrl] = useState('');

  useEffect(() => {
    refreshOrganization();
  }, []);

  const refreshOrganization = () => {
    setLoading(true);
    callAPI(`/api/organization/check?slug=${organizationSlug}`)
      .then((organization) => {
        setName(organization.name || '');
        setTitle(organization.title || '');
        setDescription(organization.description || '');
        setLanguage(organization.language || 'es');
        setEnableMangaSection(organization.enableMangaSection || false);
        setEnableManhuaSection(organization.enableManhuaSection || false);
        setEnableManhwaSection(organization.enableManhwaSection || false);
        setEnableSubscriptionSection(organization.enableSubscriptionSection || false);
        setEnableMainSlider(organization.enableMainSlider || false);
        setEnableMainBanner(organization.enableMainBanner || false);
        setUseBlockedCountries(organization.useBlockedCountries || false);
        setUseAllowedCountries(organization.useAllowedCountries || false);
        setCountryOptions(organization.countryOptions || []);
        setEnableDiscordWebhookNewChapter(organization.enableDiscordWebhookNewChapter === true || organization.enableDiscordWebhookNewChapter === 'true');
        setEnableDiscordWebhookNewSubscription(organization.enableDiscordWebhookNewSubscription === true || organization.enableDiscordWebhookNewSubscription === 'true');
        setDiscordWebhookUrlNewChapter(organization.discordWebhookUrlNewChapter || '');
        setDiscordWebhookMessageTemplateNewChapter(organization.discordWebhookMessageTemplateNewChapter || '');
        setDiscordWebhookMessageTemplateNewSubscription(organization.discordWebhookMessageTemplateNewSubscription || '');
        setDiscordWebhookUrlNewSubscription(organization.discordWebhookUrlNewSubscription || '');
        setFacebookUrl(organization.facebookUrl || '');
        setTwitterUrl(organization.twitterUrl || '');
        setInstagramUrl(organization.instagramUrl || '');
        setYoutubeUrl(organization.youtubeUrl || '');
        setPatreonUrl(organization.patreonUrl || '');
        setTiktokUrl(organization.tiktokUrl || '');
        setDiscordUrl(organization.discordUrl || '');
        setTwitchUrl(organization.twitchUrl || '');
        setLogoImageFile(organization.logoUrl);
        setImageImageFile(organization.imageUrl);
        setBannerImageFile(organization.bannerUrl);
        setFaviconImageFile(organization.faviconUrl);
        // Guardar URLs originales para detectar eliminaciones
        setOriginalLogoUrl(organization.logoUrl || null);
        setOriginalImageUrl(organization.imageUrl || null);
        setOriginalBannerUrl(organization.bannerUrl || null);
        setOriginalFaviconUrl(organization.faviconUrl || null);
        setCountryCode('');
        setCountryLanguage('');
        setCountryName('');
      })
      .catch((error) => toast.error(error?.message))
      .finally(() => setLoading(false));
  };

  const handleSubmit = async () => {
    if (!name) {
      return toast.error('El nombre es requerido');
    }
    setLoading(true);
    try {
      let logoKey = logoImageFile;
      let imageKey = imageImageFile;
      let bannerKey = bannerImageFile;
      let faviconKey = faviconImageFile;

      const filesToUpload = [
        logoImageFile instanceof File,
        imageImageFile instanceof File,
        bannerImageFile instanceof File,
        faviconImageFile instanceof File,
      ].filter(Boolean).length;

      let toastId: any = null;
      let uploadedCount = 0;

      if (filesToUpload > 0) {
        toastId = toast.loading(`Subiendo archivos ${uploadedCount + 1}/${filesToUpload}`, {
          position: 'bottom-right',
        });
      }

      try {
        if (logoImageFile instanceof File) {
          uploadedCount++;
          toast.update(toastId, {
            render: `Subiendo archivos ${uploadedCount}/${filesToUpload}`,
            position: 'bottom-right',
          });
          logoKey = await uploadFile(logoImageFile, undefined, 'organization');
        }

        if (imageImageFile instanceof File) {
          uploadedCount++;
          toast.update(toastId, {
            render: `Subiendo archivos ${uploadedCount}/${filesToUpload}`,
            position: 'bottom-right',
          });
          imageKey = await uploadFile(imageImageFile, undefined, 'organization');
        }

        if (bannerImageFile instanceof File) {
          uploadedCount++;
          toast.update(toastId, {
            render: `Subiendo archivos ${uploadedCount}/${filesToUpload}`,
            position: 'bottom-right',
          });
          bannerKey = await uploadFile(bannerImageFile, undefined, 'organization');
        }

        if (faviconImageFile instanceof File) {
          uploadedCount++;
          toast.update(toastId, {
            render: `Subiendo archivos ${uploadedCount}/${filesToUpload}`,
            position: 'bottom-right',
          });
          faviconKey = await uploadFile(faviconImageFile, undefined, 'organization');
        }

        if (toastId) {
          toast.dismiss(toastId);
          toast.success(`${filesToUpload} ${filesToUpload === 1 ? 'archivo subido' : 'archivos subidos'} correctamente`, {
            position: 'bottom-right',
          });
        }
      } catch (error) {
        if (toastId) {
          toast.dismiss(toastId);
          toast.error('Error al subir archivos', {
            position: 'bottom-right',
          });
        }
        throw error;
      }

      const requestBody: any = {
        name,
        title,
        description,
        language,
        enableMangaSection,
        enableManhuaSection,
        enableManhwaSection,
        enableSubscriptionSection,
        enableMainSlider,
        enableMainBanner,
        enableDiscordWebhookNewChapter,
        enableDiscordWebhookNewSubscription,
        discordWebhookUrlNewChapter,
        discordWebhookUrlNewSubscription,
        discordWebhookMessageTemplateNewChapter,
        discordWebhookMessageTemplateNewSubscription,
        useBlockedCountries,
        useAllowedCountries,
        facebookUrl,
        twitterUrl,
        instagramUrl,
        youtubeUrl,
        patreonUrl,
        tiktokUrl,
        discordUrl,
        twitchUrl,
        countryOptions,
      };

      // Incluir imágenes si:
      // 1. Es un nuevo archivo (File) -> se subió y logoKey es un string
      // 2. Es una URL existente (string) -> se mantiene la imagen actual
      // 3. Era null originalmente y sigue siendo null -> no enviar (no cambiar)
      // 4. Tenía una URL y ahora es null -> usuario eliminó, enviar null explícitamente
      
      // Logo
      if (logoKey !== null && logoKey !== undefined) {
        // Nueva imagen o imagen existente
        requestBody.logo = logoKey;
      } else if (originalLogoUrl !== null && logoImageFile === null) {
        // Usuario eliminó una imagen que existía
        requestBody.logo = null;
      }
      
      // Image
      if (imageKey !== null && imageKey !== undefined) {
        requestBody.image = imageKey;
      } else if (originalImageUrl !== null && imageImageFile === null) {
        requestBody.image = null;
      }
      
      // Banner
      if (bannerKey !== null && bannerKey !== undefined) {
        requestBody.banner = bannerKey;
      } else if (originalBannerUrl !== null && bannerImageFile === null) {
        requestBody.banner = null;
      }
      
      // Favicon
      if (faviconKey !== null && faviconKey !== undefined) {
        requestBody.favicon = faviconKey;
      } else if (originalFaviconUrl !== null && faviconImageFile === null) {
        requestBody.favicon = null;
      }

      await callAPI('/api/organization', {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
      });
      toast.success('Configuración guardada exitosamente');
      refreshOrganization();
    } catch (error: any) {
      toast.error(error?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCountry = () => {
    if (!countryCode.match(/^[A-Z]{2}$/)) {
      toast.error('Código de país inválido (ISO2)');
      return;
    }
    if (!countryLanguage.match(/^[a-z]{2}$/)) {
      toast.error('Lenguaje inválido (ISO2)');
      return;
    }
    if (!countryName) {
      toast.error('El nombre del país es requerido');
      return;
    }
    if (countryOptions.find((option) => option.countryCode === countryCode)) {
      toast.error('El código de país ya existe');
      return;
    }
    setCountryOptions((oldValue) => [
      ...oldValue,
      {
        countryCode,
        language: countryLanguage,
        countryName,
        allowed: useAllowedCountries,
        blocked: useBlockedCountries,
      },
    ]);
    setCountryCode('');
    setCountryLanguage('');
    setCountryName('');
  };

  const handleRemoveCountry = (code: string) => {
    setCountryOptions((oldValue) => oldValue.filter((option) => option.countryCode !== code));
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">Configuración de Organización</h1>
            <p className="text-sm text-zinc-400 mt-1">Gestiona la configuración y opciones de tu organización</p>
          </div>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={18} />}
            Guardar Cambios
          </Button>
        </div>
      </Card>

      {/* Información Básica */}
      <Accordion title="Información Básica" icon={<Info size={20} />} defaultOpen>
        <div className="space-y-6">
          <Input label="Nombre de la Organización" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea label="Descripción (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          <Select
            label="Idioma"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            options={[
              { value: 'es', label: 'Español' },
              { value: 'en', label: 'English' },
            ]}
          />

          <div className="pt-4 border-t border-zinc-800">
            <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Secciones Habilitadas</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Switch label="Sección de Manga" checked={enableMangaSection} onChange={setEnableMangaSection} />
              <Switch label="Sección de Manhua" checked={enableManhuaSection} onChange={setEnableManhuaSection} />
              <Switch label="Sección de Manhwa" checked={enableManhwaSection} onChange={setEnableManhwaSection} />
              <Switch label="Sección de Suscripciones" checked={enableSubscriptionSection} onChange={setEnableSubscriptionSection} />
              <Switch label="Slider Principal" checked={enableMainSlider} onChange={setEnableMainSlider} />
              <Switch label="Banner Principal" checked={enableMainBanner} onChange={setEnableMainBanner} />
            </div>
          </div>
        </div>
      </Accordion>

      {/* Imágenes */}
      <Accordion title="Imágenes" icon={<ImageIcon size={20} />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Logo</p>
            <ImageDropzone
              value={logoImageFile}
              label="Arrastra el logo aquí o haz clic"
              alt="Logo"
              onChange={(files) => setLogoImageFile(files[0] || null)}
              onDelete={() => setLogoImageFile(null)}
            />
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Imagen de Portada</p>
            <ImageDropzone
              value={imageImageFile}
              label="Arrastra la imagen aquí o haz clic"
              alt="Imagen de Portada"
              onChange={(files) => setImageImageFile(files[0] || null)}
              onDelete={() => setImageImageFile(null)}
            />
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Banner</p>
            <ImageDropzone
              value={bannerImageFile}
              label="Arrastra el banner aquí o haz clic"
              alt="Banner"
              onChange={(files) => setBannerImageFile(files[0] || null)}
              onDelete={() => setBannerImageFile(null)}
            />
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Favicon</p>
            <ImageDropzone
              value={faviconImageFile}
              label="Arrastra el favicon aquí o haz clic"
              alt="Favicon"
              onChange={(files) => setFaviconImageFile(files[0] || null)}
              onDelete={() => setFaviconImageFile(null)}
            />
          </div>
        </div>
      </Accordion>

      {/* Redes Sociales */}
      <Accordion title="Redes Sociales" icon={<Share2 size={20} />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Facebook URL" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} placeholder="https://facebook.com/..." />
          <Input label="Twitter/X URL" value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} placeholder="https://twitter.com/..." />
          <Input label="Instagram URL" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/..." />
          <Input label="YouTube URL" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/..." />
          <Input label="Patreon URL" value={patreonUrl} onChange={(e) => setPatreonUrl(e.target.value)} placeholder="https://patreon.com/..." />
          <Input label="TikTok URL" value={tiktokUrl} onChange={(e) => setTiktokUrl(e.target.value)} placeholder="https://tiktok.com/..." />
          <Input label="Discord URL" value={discordUrl} onChange={(e) => setDiscordUrl(e.target.value)} placeholder="https://discord.gg/..." />
          <Input label="Twitch URL" value={twitchUrl} onChange={(e) => setTwitchUrl(e.target.value)} placeholder="https://twitch.tv/..." />
        </div>
      </Accordion>

      {/* Discord Webhooks */}
      <Accordion title="Notificaciones de Discord" icon={<Bell size={20} />}>
        <div className="space-y-6">
          {/* Nuevos Capítulos */}
          <div className="p-6 bg-zinc-800/30 rounded-lg border border-zinc-700">
            <h4 className="text-lg font-bold text-white mb-4">Webhook de Nuevos Capítulos</h4>
            <div className="space-y-4">
              <Switch
                label="Habilitar webhook para nuevos capítulos"
                checked={enableDiscordWebhookNewChapter}
                onChange={setEnableDiscordWebhookNewChapter}
              />
              {enableDiscordWebhookNewChapter && (
                <>
                  <Input
                    label="URL del Webhook"
                    value={discordWebhookUrlNewChapter}
                    onChange={(e) => setDiscordWebhookUrlNewChapter(e.target.value)}
                    placeholder="https://discord.com/api/webhooks/..."
                  />
                  <Textarea
                    label="Plantilla del Mensaje"
                    value={discordWebhookMessageTemplateNewChapter}
                    onChange={(e) => setDiscordWebhookMessageTemplateNewChapter(e.target.value)}
                    rows={4}
                  />
                  <div className="p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
                    <p className="text-sm text-cyan-400 font-bold mb-2">Variables disponibles:</p>
                    <div className="space-y-1 text-xs text-zinc-400">
                      <p><code className="text-cyan-500">%manga%</code> - Nombre del manga</p>
                      <p><code className="text-cyan-500">%chapter%</code> - Numero del capitulo</p>
                      <p><code className="text-cyan-500">%chapter_title%</code> - Titulo del capitulo</p>
                      <p><code className="text-cyan-500">%scan%</code> - Nombre del scan</p>
                      <p><code className="text-cyan-500">%link%</code> - Enlace al capitulo</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Nuevas Suscripciones */}
          <div className="p-6 bg-zinc-800/30 rounded-lg border border-zinc-700">
            <h4 className="text-lg font-bold text-white mb-4">Webhook de Nuevas Suscripciones</h4>
            <div className="space-y-4">
              <Switch
                label="Habilitar webhook para nuevas suscripciones"
                checked={enableDiscordWebhookNewSubscription}
                onChange={setEnableDiscordWebhookNewSubscription}
              />
              {enableDiscordWebhookNewSubscription && (
                <>
                  <Input
                    label="URL del Webhook"
                    value={discordWebhookUrlNewSubscription}
                    onChange={(e) => setDiscordWebhookUrlNewSubscription(e.target.value)}
                    placeholder="https://discord.com/api/webhooks/..."
                  />
                  <Textarea
                    label="Plantilla del Mensaje"
                    value={discordWebhookMessageTemplateNewSubscription}
                    onChange={(e) => setDiscordWebhookMessageTemplateNewSubscription(e.target.value)}
                    rows={4}
                  />
                  <div className="p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
                    <p className="text-sm text-cyan-400 font-bold mb-2">Variables disponibles:</p>
                    <div className="space-y-1 text-xs text-zinc-400">
                      <p><code className="text-cyan-500">%user%</code> - Nombre de usuario</p>
                      <p><code className="text-cyan-500">%plan%</code> - Nombre del plan</p>
                      <p><code className="text-cyan-500">%amount%</code> - Monto pagado</p>
                      <p><code className="text-cyan-500">%scan%</code> - Nombre del scan</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </Accordion>

      {/* Geo-Restricciones */}
      <Accordion title="Restricciones por País" icon={<Globe size={20} />}>
        <div className="space-y-6">
          <div className="flex gap-6">
            <Switch
              label="Habilitar lista de países permitidos (Whitelist)"
              checked={useAllowedCountries}
              onChange={(checked) => {
                setUseAllowedCountries(checked);
                if (checked) setUseBlockedCountries(false);
              }}
            />
            <Switch
              label="Habilitar lista de países bloqueados (Blacklist)"
              checked={useBlockedCountries}
              onChange={(checked) => {
                setUseBlockedCountries(checked);
                if (checked) setUseAllowedCountries(false);
              }}
            />
          </div>

          {(useAllowedCountries || useBlockedCountries) && (
            <>
              <div className="p-6 bg-zinc-800/30 rounded-lg border border-zinc-700">
                <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Agregar País</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input label="Nombre del País" value={countryName} onChange={(e) => setCountryName(e.target.value)} placeholder="México" />
                  <Input
                    label="Código ISO2"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                    placeholder="MX"
                    maxLength={2}
                  />
                  <Input
                    label="Idioma ISO2"
                    value={countryLanguage}
                    onChange={(e) => setCountryLanguage(e.target.value.toLowerCase())}
                    placeholder="es"
                    maxLength={2}
                  />
                </div>
                <div className="flex justify-end mt-4">
                  <Button variant="secondary" onClick={handleAddCountry}>
                    Agregar País
                  </Button>
                </div>
              </div>

              {countryOptions.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-zinc-900/60 border-b border-zinc-800">
                      <tr>
                        <th className="p-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Código</th>
                        <th className="p-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">País</th>
                        <th className="p-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Idioma</th>
                        {useAllowedCountries && <th className="p-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Permitido</th>}
                        {useBlockedCountries && <th className="p-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Bloqueado</th>}
                        <th className="p-4 text-center text-xs font-bold text-zinc-400 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {countryOptions.map((countryOption) => (
                        <tr key={countryOption.countryCode} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="p-4 text-sm text-zinc-300 font-mono">{countryOption.countryCode}</td>
                          <td className="p-4 text-sm text-zinc-300">{countryOption.countryName}</td>
                          <td className="p-4 text-sm text-zinc-300 font-mono">{countryOption.language}</td>
                          {useAllowedCountries && (
                            <td className="p-4">
                              <Switch
                                checked={countryOption.allowed}
                                onChange={(checked) =>
                                  setCountryOptions((oldValue) =>
                                    oldValue.map((option) =>
                                      option.countryCode === countryOption.countryCode
                                        ? { ...option, allowed: checked }
                                        : option
                                    )
                                  )
                                }
                              />
                            </td>
                          )}
                          {useBlockedCountries && (
                            <td className="p-4">
                              <Switch
                                checked={countryOption.blocked}
                                onChange={(checked) =>
                                  setCountryOptions((oldValue) =>
                                    oldValue.map((option) =>
                                      option.countryCode === countryOption.countryCode
                                        ? { ...option, blocked: checked }
                                        : option
                                    )
                                  )
                                }
                              />
                            </td>
                          )}
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleRemoveCountry(countryOption.countryCode)}
                              className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </Accordion>


      {/* Save Button Bottom */}
      <Card>
        <div className="flex justify-end">
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={18} />}
            Guardar Todos los Cambios
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AdminSettings;

