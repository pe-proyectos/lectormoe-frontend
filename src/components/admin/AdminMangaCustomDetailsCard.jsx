import 'cookie-store';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    Card,
    Input,
    Checkbox,
    Button,
    Textarea,
    Typography,
    Collapse,
    CardBody,
} from "@material-tailwind/react";
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import { DropzoneArea } from 'material-ui-dropzone';
import { DatePicker } from '../DatePicker';
import { callAPI } from '../../util/callApi';
import { AdminChaptersTable } from './AdminChaptersTable';

export function AdminMangaCustomDetailsCard({ manga }) {
    console.log(manga)
    return (
        <Card color="transparent" shadow={false}>
            <Typography variant="h4" color="blue-gray">
                Detalles
            </Typography>
            <Typography variant="h6" color="blue-gray">
                Título:
            </Typography>
            <Typography variant="paragraph" color="blue-gray">
                {manga.title}
            </Typography>
            <Typography variant="h6" color="blue-gray">
                Descripción corta:
            </Typography>
            <Typography variant="paragraph" color="blue-gray">
                {manga.shortDescription}
            </Typography>
            <Typography variant="h6" color="blue-gray">
                Autor(es):
            </Typography>
            <p>
                {manga.authors.map((author, index) => (
                    <span key={author.slug}>
                        <a className="m-0" href={`/author/${author.slug}`}>{author.name}</a>
                        {index !== manga.authors.length - 1 ? (index === manga.authors.length - 2 ? ' & ' : ', ') : ''}
                    </span>
                ))}
            </p>
            <Typography variant="h6" color="blue-gray">
                Descripción
            </Typography>
            <p>{manga.description}</p>
            <Typography variant="h6" color="blue-gray">
                Géneros:
            </Typography>
            <p>
                {manga.genres.length === 0 ? 'Sin géneros' : ''}
                {manga.genres.map((genre, index) => (
                    <span key={genre.slug}>
                        <a className="m-0" href={`/genre/${genre.slug}`}>{genre.name}</a>
                        {index !== manga.genres.length - 1 ? (index === manga.genres.length - 2 ? ' & ' : ', ') : ''}
                    </span>
                ))}
            </p>
            <Typography variant="h6" color="blue-gray">
                Portada:
            </Typography>
            <img src={manga.imageUrl} className="w-56" alt="cover" />
            <Typography variant="h6" color="blue-gray">
                Fecha de lanzamiento:
            </Typography>
            <p>{manga.releasedAt ? new Date(manga.releasedAt).toISOString() : 'Sin fecha'}</p>
            <Typography variant="h6" color="blue-gray">
                Próximo capítulo:
            </Typography>
            <p>{manga.nextChapterAt ? new Date(manga.nextChapterAt).toISOString() : 'Sin fecha'}</p>
            <Typography variant="h4" color="blue-gray">
                Capítulos
            </Typography>
            <a href={`/admin/mangas/${manga.slug}/chapters/create`}>
                <Button variant="outlined">Publicar capítulo</Button>
            </a>
            <AdminChaptersTable mangaSlug={manga.slug} chapters={manga.chapters} />
        </Card>
    );
}
