import { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import {
    Alert,
    Spinner,
    Card,
    CardHeader,
    CardBody,
    Typography,
    IconButton,
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
    Button,
    Textarea
} from "@material-tailwind/react";
import { callAPI } from '../../util/callApi';
import { getTranslator } from "../../util/translate";

export function AdminComments({ language }) {
    const _ = getTranslator(language);

    const [loading, setLoading] = useState(true);
    const [comments, setComments] = useState([]);
    const [selectedComment, setSelectedComment] = useState(null);
    const [hideDialogOpen, setHideDialogOpen] = useState(false);
    const [hideReason, setHideReason] = useState('');

    useEffect(() => {
        refreshComments();
    }, []);

    const refreshComments = () => {
        setLoading(true);
        callAPI(`/api/comment?admin=true`)
            .then((data) => {
                setComments(data);
            })
            .catch(error => toast.error(error?.message || _('error_loading_comments')))
            .finally(() => setLoading(false));
    };

    const handleHideComment = async () => {
        if (!selectedComment) return;

        try {
            await callAPI(`/api/comment/${selectedComment.id}/hide`, {
                method: 'POST',
                body: JSON.stringify({ reason: hideReason })
            });
            toast.success(_('comment_hidden_successfully'));
            refreshComments();
            setHideDialogOpen(false);
            setHideReason('');
            setSelectedComment(null);
        } catch (error) {
            toast.error(error?.message || _('error_hiding_comment'));
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm(_('confirm_delete_comment'))) return;

        try {
            await callAPI(`/api/comments/${commentId}`, {
                method: 'DELETE'
            });
            toast.success(_('comment_deleted_successfully'));
            refreshComments();
        } catch (error) {
            toast.error(error?.message || _('error_deleting_comment'));
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString();
    };

    return (
        <div className="w-full my-4">
            <Card>
                <CardHeader floated={false} shadow={false} className="rounded-none">
                    <div className="flex items-center justify-between gap-8 mb-4">
                        <div>
                            <Typography variant="h5" color="blue-gray">
                                Gestión de Comentarios
                            </Typography>
                            <Typography color="gray" className="mt-1 font-normal">
                                Administra todos los comentarios de la plataforma
                            </Typography>
                        </div>
                    </div>
                </CardHeader>
                <CardBody className="px-0">
                    {loading ? (
                        <div className="flex justify-center p-4">
                            <Spinner />
                        </div>
                    ) : comments.length === 0 ? (
                        <Alert>No se encontraron comentarios</Alert>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full table-auto text-left">
                                <thead>
                                    <tr>
                                        <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                                            <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">
                                                Usuario
                                            </Typography>
                                        </th>
                                        <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                                            <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">
                                                Comentario
                                            </Typography>
                                        </th>
                                        <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                                            <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">
                                                Fecha
                                            </Typography>
                                        </th>
                                        <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                                            <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">
                                                Estado
                                            </Typography>
                                        </th>
                                        <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                                            <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">
                                                Acciones
                                            </Typography>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {comments.map((comment) => (
                                        <tr key={comment.id} className={comment.deletedAt ? 'bg-red-50' : comment.hiddenAt ? 'bg-yellow-50' : ''}>
                                            <td className="p-4 border-b border-blue-gray-50">
                                                <Typography variant="small">{comment.user.username}</Typography>
                                            </td>
                                            <td className="p-4 border-b border-blue-gray-50">
                                                <Typography variant="small">{comment.comment}</Typography>
                                                {comment.imageUrl && (
                                                    <img src={comment.imageUrl} alt="Imagen del comentario" className="mt-2 max-w-xs rounded" />
                                                )}
                                                {comment.hiddenReason && (
                                                    <Typography variant="small" color="red" className="mt-1">
                                                        Razón de ocultamiento: {comment.hiddenReason}
                                                    </Typography>
                                                )}
                                            </td>
                                            <td className="p-4 border-b border-blue-gray-50">
                                                <Typography variant="small">{formatDate(comment.createdAt)}</Typography>
                                            </td>
                                            <td className="p-4 border-b border-blue-gray-50">
                                                <Typography variant="small" color={comment.deletedAt ? 'red' : comment.hiddenAt ? 'orange' : 'green'}>
                                                    {comment.deletedAt ? 'Eliminado' : comment.hiddenAt ? 'Oculto' : 'Activo'}
                                                </Typography>
                                            </td>
                                            <td className="p-4 border-b border-blue-gray-50">
                                                <div className="flex flex-col gap-2">
                                                    {!comment.hiddenAt && !comment.deletedAt && (
                                                        <>
                                                            <IconButton
                                                                variant="text"
                                                                color="orange"
                                                                onClick={() => {
                                                                    setSelectedComment(comment);
                                                                    setHideDialogOpen(true);
                                                                }}
                                                            >
                                                                Ocultar
                                                            </IconButton>
                                                            <IconButton
                                                                variant="text"
                                                                color="red"
                                                                onClick={() => handleDeleteComment(comment.id)}
                                                            >
                                                                Eliminar
                                                            </IconButton>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardBody>
            </Card>

            <Dialog open={hideDialogOpen} handler={() => setHideDialogOpen(false)}>
                <DialogHeader>Ocultar Comentario</DialogHeader>
                <DialogBody>
                    <Textarea
                        label="Razón para ocultar"
                        value={hideReason}
                        onChange={(e) => setHideReason(e.target.value)}
                    />
                </DialogBody>
                <DialogFooter>
                    <Button
                        variant="text"
                        color="red"
                        onClick={() => setHideDialogOpen(false)}
                        className="mr-1"
                    >
                        Cancelar
                    </Button>
                    <Button variant="gradient" color="orange" onClick={handleHideComment}>
                        Ocultar Comentario
                    </Button>
                </DialogFooter>
            </Dialog>

            <ToastContainer theme="dark" />
        </div>
    );
}
