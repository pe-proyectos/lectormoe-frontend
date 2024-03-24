import { useState, useEffect } from "react";
import { ToastContainer, toast } from 'react-toastify';
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
    Accordion,
    AccordionHeader,
    AccordionBody,
} from "@material-tailwind/react";
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Autocomplete from '@mui/material/Autocomplete';
import { DropzoneArea } from 'material-ui-dropzone';
import { DatePicker } from '../DatePicker';
import { ImageDropzone } from '../ImageDropzone';
import { AdminMangaProfileDialog } from './AdminMangaProfileDialog';
import { callAPI } from '../../util/callApi';

export function AdminSettings({ organization: { domain: organizationDomain } }) {
    // dialog
    const [loading, setLoading] = useState(false);
    // form
    const [name, setName] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [logoImageFile, setLogoImageFile] = useState(null);
    const [imageImageFile, setImageImageFile] = useState(null);
    const [bannerImageFile, setBannerImageFile] = useState(null);
    const [facebookUrl, setFacebookUrl] = useState('');
    const [twitterUrl, setTwitterUrl] = useState('');
    const [instagramUrl, setInstagramUrl] = useState('');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [patreonUrl, setPatreonUrl] = useState('');
    const [tiktokUrl, setTiktokUrl] = useState('');
    const [discordUrl, setDiscordUrl] = useState('');
    const [twitchUrl, setTwitchUrl] = useState('');
    // accordion
    const [openInformationAccordion, setOpenInformationAccordion] = useState(true);
    const [openImagesAccordion, setOpenImagesAccordion] = useState(false);
    const [openSocialAccordion, setOpenSocialAccordion] = useState(false);

    const handleInformationAccordion = () => setOpenInformationAccordion(!openInformationAccordion);
    const handleImagesAccordion = () => setOpenImagesAccordion(!openImagesAccordion);
    const handleSocialAccordion = () => setOpenSocialAccordion(!openSocialAccordion);

    useEffect(() => {
        refreshOrganization();
    }, []);

    const refreshOrganization = () => {
        setLoading(true);
        callAPI(`/api/organization/check?domain=${organizationDomain}`)
            .then(organization => {
                // Information
                setName(organization.name || '');
                setTitle(organization.title || '');
                setDescription(organization.description || '');
                // Social
                setFacebookUrl(organization.facebookUrl || '');
                setTwitterUrl(organization.twitterUrl || '');
                setInstagramUrl(organization.instagramUrl || '');
                setYoutubeUrl(organization.youtubeUrl || '');
                setPatreonUrl(organization.patreonUrl || '');
                setTiktokUrl(organization.tiktokUrl || '');
                setDiscordUrl(organization.discordUrl || '');
                setTwitchUrl(organization.twitchUrl || '');
                // Images
                setLogoImageFile(organization.logoUrl);
                setImageImageFile(organization.imageUrl);
                setBannerImageFile(organization.bannerUrl);
            })
            .catch(error => toast.error(error?.message))
            .finally(() => setLoading(false));
    };

    const handleSubmit = async () => {
        if (!name) {
            return toast.error('El nombre es obligatorio');
        }
        const formData = new FormData();
        formData.append('name', name);
        formData.append('title', title);
        formData.append('description', description);
        formData.append('facebookUrl', facebookUrl);
        formData.append('twitterUrl', twitterUrl);
        formData.append('instagramUrl', instagramUrl);
        formData.append('youtubeUrl', youtubeUrl);
        formData.append('patreonUrl', patreonUrl);
        formData.append('tiktokUrl', tiktokUrl);
        formData.append('discordUrl', discordUrl);
        formData.append('twitchUrl', twitchUrl);
        formData.append('logo', logoImageFile);
        formData.append('image', imageImageFile);
        formData.append('banner', bannerImageFile);
        setLoading(true);
        callAPI('/api/organization', {
            method: 'PATCH',
            body: formData,
        })
            .then(response => {
                toast.success('Opciones guardadas con éxito');
                refreshOrganization();
            })
            .catch(error => toast.error(error?.message))
            .finally(() => setLoading(false));
    };

    return (
        <>
            <Typography variant="h4" color="blue-gray">
                Opciones de la organización
            </Typography>
            <div className="max-w-lg p-4">
                <Accordion open={openInformationAccordion}>
                    <AccordionHeader onClick={handleInformationAccordion}>Información</AccordionHeader>
                    <AccordionBody>
                        <div className="flex flex-col gap-4 sm:ml-4">
                            <Typography className="-mb-2" variant="h6" color="gray">
                                Nombre
                            </Typography>
                            <Input
                                size="lg"
                                label="Nombre"
                                autoComplete='off'
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                            <Typography className="-mb-2" variant="h6" color="gray">
                                Titulo
                            </Typography>
                            <Input
                                size="md"
                                label="Titulo"
                                autoComplete='off'
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                            <Typography className="-mb-2" variant="h6" color="gray">
                                Descripción (Opcional)
                            </Typography>
                            <Textarea
                                size="lg"
                                label="Descripción"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />

                        </div>
                    </AccordionBody>
                </Accordion>
                <Accordion open={openSocialAccordion}>
                    <AccordionHeader onClick={handleSocialAccordion}>Social</AccordionHeader>
                    <AccordionBody>
                        <div className="flex flex-col gap-4 sm:ml-4">
                            <Typography className="-mb-2" variant="h6" color="gray">
                                Facebook
                            </Typography>
                            <Input
                                size="md"
                                label="URL a Facebook"
                                autoComplete='off'
                                value={facebookUrl}
                                onChange={(e) => setFacebookUrl(e.target.value)}
                            />
                            <Typography className="-mb-2" variant="h6" color="gray">
                                X (Twitter)
                            </Typography>
                            <Input
                                size="md"
                                label="URL a X (Twitter)"
                                autoComplete='off'
                                value={twitterUrl}
                                onChange={(e) => setTwitterUrl(e.target.value)}
                            />
                            <Typography className="-mb-2" variant="h6" color="gray">
                                Instagram
                            </Typography>
                            <Input
                                size="md"
                                label="URL a Instagram"
                                autoComplete='off'
                                value={instagramUrl}
                                onChange={(e) => setInstagramUrl(e.target.value)}
                            />
                            <Typography className="-mb-2" variant="h6" color="gray">
                                Youtube
                            </Typography>
                            <Input
                                size="md"
                                label="URL a Youtube"
                                autoComplete='off'
                                value={youtubeUrl}
                                onChange={(e) => setYoutubeUrl(e.target.value)}
                            />
                            <Typography className="-mb-2" variant="h6" color="gray">
                                Patreon
                            </Typography>
                            <Input
                                size="md"
                                label="URL a Patreon"
                                autoComplete='off'
                                value={patreonUrl}
                                onChange={(e) => setPatreonUrl(e.target.value)}
                            />
                            <Typography className="-mb-2" variant="h6" color="gray">
                                Tiktok
                            </Typography>
                            <Input
                                size="md"
                                label="URL a Tiktok"
                                autoComplete='off'
                                value={tiktokUrl}
                                onChange={(e) => setTiktokUrl(e.target.value)}
                            />
                            <Typography className="-mb-2" variant="h6" color="gray">
                                Discord
                            </Typography>
                            <Input
                                size="md"
                                label="URL a Discord"
                                autoComplete='off'
                                value={discordUrl}
                                onChange={(e) => setDiscordUrl(e.target.value)}
                            />
                            <Typography className="-mb-2" variant="h6" color="gray">
                                Twitch
                            </Typography>
                            <Input
                                size="md"
                                label="URL a Twitch"
                                autoComplete='off'
                                value={twitchUrl}
                                onChange={(e) => setTwitchUrl(e.target.value)}
                            />
                        </div>
                    </AccordionBody>
                </Accordion>
                <Accordion open={openImagesAccordion}>
                    <AccordionHeader onClick={handleImagesAccordion}>Imágenes</AccordionHeader>
                    <AccordionBody>
                        <div className="flex flex-col gap-4 sm:ml-4">
                            <Typography className="-mb-2" variant="h6" color="gray">
                                Logo
                            </Typography>
                            <ImageDropzone
                                value={logoImageFile}
                                label='Arrastra y suelta la imagen del logo'
                                alt='Imagen del logo'
                                onChange={(files) => files[0] ? setLogoImageFile(files[0]) : null}
                                onDelete={(file) => setLogoImageFile(null)}
                            />
                            <Typography className="-mb-2" variant="h6" color="gray">
                                Imagén de portada
                            </Typography>
                            <ImageDropzone
                                value={imageImageFile}
                                label='Arrastra y suelta la imagen de portada'
                                alt='Imagen de portada'
                                onChange={(files) => files[0] ? setImageImageFile(files[0]) : null}
                                onDelete={(file) => setImageImageFile(null)}
                            />
                            <Typography className="-mb-2" variant="h6" color="gray">
                                Banner
                            </Typography>
                            <ImageDropzone
                                value={bannerImageFile}
                                label='Arrastra y suelta la imagen de banner'
                                alt='Banner'
                                onChange={(files) => files[0] ? setBannerImageFile(files[0]) : null}
                                onDelete={(file) => setBannerImageFile(null)}
                            />
                        </div>
                    </AccordionBody>
                </Accordion>
                <div className="flex self-end my-4">
                    <Button variant="outlined" onClick={handleSubmit} loading={loading}>
                        Guardar opciones
                    </Button>
                </div>
            </div>
        </>
    );
}
