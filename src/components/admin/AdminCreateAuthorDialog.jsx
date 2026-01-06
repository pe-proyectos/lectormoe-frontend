import { useState } from "react";
import { ToastContainer, toast } from 'react-toastify';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import Textarea from './ui/Textarea';
import { ImageDropzone } from '../ImageDropzone';
import { callAPI } from '../../util/callApi';
import { getTranslator } from "../../util/translate";
import { uploadFile } from "../../util/uploadFile";

export function AdminCreateAuthorDialog({ language, open, setOpen }) {
    const _ = getTranslator(language);

    // dialog
    const [loading, setLoading] = useState(false);
    // form
    const [name, setName] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    const [description, setDescription] = useState('');
    const [coverImageFile, setCoverImageFile] = useState(null);

    const handleSubmit = async () => {
        if (!name) {
            return toast.error(_('name_is_required'));
        }
        setLoading(true);
        try {
            let imageKey = null;
            if (coverImageFile) {
                const toastId = toast.loading("Subiendo imagen...", {
                    position: "bottom-right"
                });
                try {
                    imageKey = await uploadFile(coverImageFile, undefined, 'authors');
                    toast.dismiss(toastId);
                    toast.success("Imagen subida correctamente", {
                        position: "bottom-right"
                    });
                } catch (error) {
                    toast.dismiss(toastId);
                    toast.error("Error al subir imagen", {
                        position: "bottom-right"
                    });
                    throw error;
                }
            }
            
            const response = await callAPI('/api/author', {
                method: 'POST',
                body: JSON.stringify({
                    name,
                    shortDescription,
                    description,
                    ...(imageKey ? { image: imageKey } : {}),
                }),
            });
            toast.success(_('author_created'));
            setName('');
            setDescription('');
            setShortDescription('');
            setCoverImageFile(null);
            setOpen(false);
        } catch (error) {
            toast.error(error?.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Modal
                isOpen={open}
                onClose={() => setOpen(false)}
                title={_('create_author')}
                size="sm"
            >
                <div className="flex flex-col gap-6">
                    <Input
                        label={_('author_name')}
                        autoComplete='off'
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <Input
                        label={_('author_role_example')}
                        autoComplete='off'
                        value={shortDescription}
                        onChange={(e) => setShortDescription(e.target.value)}
                    />
                    <Textarea
                        label={_('author_description')}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
                            {_('author_image_optional')}
                        </label>
                        <ImageDropzone
                            value={coverImageFile}
                            label={_('drag_and_drop_author_image')}
                            alt={_('author_image')}
                            onChange={(files) => files[0] ? setCoverImageFile(files[0]) : null}
                            onDelete={(file) => setCoverImageFile(null)}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                        <Button variant="secondary" onClick={() => setOpen(false)}>
                            {_('cancel') || 'Cancelar'}
                        </Button>
                        <Button variant="primary" onClick={handleSubmit} loading={loading}>
                            {_('save_author')}
                        </Button>
                    </div>
                </div>
            </Modal>
            <ToastContainer theme="dark" />
        </>
    );
}
