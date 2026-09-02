import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { Markdown } from 'tiptap-markdown';
import Image from '@tiptap/extension-image';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Minus, Link as LinkIcon,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Undo, Redo, Upload, FileText, Eye, Image as ImageIcon, Loader2,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { uploadFile } from '../../util/uploadFile';
import { renderNovelHtml } from '../../util/novelMarkdown';

// Las ilustraciones se guardan en markdown como ![alt](url "wNN"), donde el
// title codifica el ancho: "w40" (40%), "w70" (70%) o "w100" (100%). El lector
// (NovelReader) interpreta ese marcador. Solo se permiten URLs del R2 propio.
const R2_PUBLIC_BASE = (import.meta.env.PUBLIC_R2_PUBLIC_URL || 'https://r2.capibaratraductor.com').replace(/\/$/, '');
const SIZE_OPTIONS: { label: string; marker: string }[] = [
  { label: 'Pequeña (40%)', marker: 'w40' },
  { label: 'Mediana (70%)', marker: 'w70' },
  { label: 'Completa (100%)', marker: 'w100' },
];

interface NovelEditorProps {
  value: string | null;
  onChange: (markdown: string) => void;
  disabled?: boolean;
}

const ToolbarButton: React.FC<{
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}> = ({ onClick, active, disabled, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
      active ? 'bg-cyan-500 text-zinc-950' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
    }`}
  >
    {children}
  </button>
);

const Divider = () => <div className="w-px h-6 bg-zinc-800 mx-1" />;

const NovelPreview: React.FC<{ markdown: string }> = ({ markdown }) => {
  const html = useMemo(() => renderNovelHtml(markdown).html, [markdown]);
  return (
    <div className="bg-[#0a0a0b] px-6 py-8 min-h-[400px]">
      <style>{`.nr-preview .nr-img{display:block;margin:1.5rem auto;border-radius:12px;height:auto}.nr-preview .nr-img-w40{max-width:40%}.nr-preview .nr-img-w70{max-width:70%}.nr-preview .nr-img-w100{max-width:100%}@media(max-width:767px){.nr-preview .nr-img{max-width:100%!important}}`}</style>
      {html ? (
        <article
          className="nr-preview prose prose-invert max-w-[680px] mx-auto"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '18px', lineHeight: 1.7, color: '#e6e6e6' }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <p className="text-zinc-500 text-center text-sm">Nada que previsualizar todavía.</p>
      )}
    </div>
  );
};

const NovelEditor: React.FC<NovelEditorProps> = ({ value, onChange, disabled = false }) => {
  const [view, setView] = useState<'editor' | 'preview' | 'source'>('editor');
  const [sizePickerFile, setSizePickerFile] = useState<File | null>(null);
  const [pendingReplace, setPendingReplace] = useState<{ file: File; endpoint: string } | null>(null);
  const [linkModal, setLinkModal] = useState<{ value: string } | null>(null);
  const [chars, setChars] = useState(0);
  const [uploadingImage, setUploadingImage] = useState(false);
  const docxInputRef = useRef<HTMLInputElement>(null);
  const mdInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const lastValueRef = useRef<string | null>(value);
  const uploadInsertRef = useRef<((file: File) => void) | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        protocols: ['http', 'https', 'mailto'],
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: { class: 'mx-auto rounded-xl max-w-full my-6' },
      }),
      Markdown.configure({
        html: false,
        tightLists: true,
        bulletListMarker: '-',
        linkify: true,
      }),
    ],
    content: value || '',
    editable: !disabled,
    editorProps: {
      attributes: {
        class:
          'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[400px] px-6 py-6',
      },
      // Pegar imagen desde el portapapeles -> sube a R2 e inserta en posicion.
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const it of Array.from(items)) {
          if (it.type.startsWith('image/')) {
            const file = it.getAsFile();
            if (file && uploadInsertRef.current) {
              event.preventDefault();
              uploadInsertRef.current(file);
              return true;
            }
          }
        }
        return false;
      },
      // Soltar imagen (drag and drop) -> sube a R2 e inserta.
      handleDrop: (_view, event) => {
        const files = event.dataTransfer?.files;
        if (files && files.length) {
          for (const f of Array.from(files)) {
            if (f.type.startsWith('image/') && uploadInsertRef.current) {
              event.preventDefault();
              uploadInsertRef.current(f);
              return true;
            }
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const md = editor.storage.markdown.getMarkdown();
      lastValueRef.current = md;
      setChars(md.length);
      onChange(md);
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value !== lastValueRef.current) {
      editor.commands.setContent(value || '', { emitUpdate: false });
      lastValueRef.current = value;
      const md = editor.storage.markdown.getMarkdown();
      setChars(md.length);
    }
  }, [value, editor]);

  if (!editor) return null;

  const replaceContent = (markdown: string) => {
    editor.commands.setContent(markdown, { emitUpdate: false });
    lastValueRef.current = markdown;
    setChars(markdown.length);
    onChange(markdown);
  };

  const isEmpty = editor.isEmpty;

  const doUpload = async (file: File, endpoint: string) => {
    try {
      const API_URL = import.meta.env['PUBLIC_API_URL'];
      const cookies = document.cookie.split(';').reduce((acc, c) => {
        const [k, v] = c.trim().split('=');
        if (k && v) acc[k] = decodeURIComponent(v);
        return acc;
      }, {} as Record<string, string>);
      const token = cookies['token'];
      // El slug de la org sale del path admin: /{slug}/admin/... o /red/{slug}/admin/...
      const parts = window.location.pathname.split('/').filter(Boolean);
      const orgSlug = parts[0] === 'red' ? parts[1] : parts[0];
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(orgSlug ? { 'x-organization': orgSlug } : {}),
        },
        body: formData,
      });
      const json = await res.json();
      if (!res.ok || json.status === false) {
        throw new Error(json?.message || 'Error al subir archivo');
      }
      replaceContent(json.data.markdown);
      const imgCount = json.data.images ?? 0;
      toast.success(
        `Archivo cargado (${json.data.chars} caracteres${imgCount ? `, ${imgCount} imagenes` : ''}).`
      );
      const warnings: string[] = json.data.warnings || [];
      if (warnings.length) toast(`Aviso: ${warnings[0]}`);
    } catch (e: any) {
      toast.error(e?.message || 'Error al subir archivo');
    }
  };

  const handleUpload = (file: File, endpoint: string) => {
    if (!isEmpty) {
      setPendingReplace({ file, endpoint });
      return;
    }
    doUpload(file, endpoint);
  };

  const onPickDocx = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleUpload(f, '/api/files/parse-docx');
    e.target.value = '';
  };

  const onPickMd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleUpload(f, '/api/files/parse-md');
    e.target.value = '';
  };

  const uploadAndInsertImage = async (file: File, marker = 'w70') => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast.error('Solo se permiten imágenes JPG, PNG, WEBP o GIF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar 5MB.');
      return;
    }
    setUploadingImage(true);
    try {
      const fileKey = await uploadFile(file, undefined, 'novels');
      const url = /^https?:\/\//i.test(fileKey) ? fileKey : `${R2_PUBLIC_BASE}/${fileKey.replace(/^\//, '')}`;
      editor.chain().focus().setImage({ src: url, title: marker } as any).run();
      toast.success('Ilustración insertada.');
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo subir la imagen.');
    } finally {
      setUploadingImage(false);
    }
  };
  uploadInsertRef.current = uploadAndInsertImage;

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setSizePickerFile(file);
  };

  const promptLink = () => {
    const previous = editor.getAttributes('link').href || '';
    setLinkModal({ value: previous || 'https://' });
  };

  const applyLink = (raw: string) => {
    const url = raw.trim();
    setLinkModal(null);
    if (!url) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800">
      {/* Toolbar — sticky so it stays reachable while scrolling long chapters */}
      <div className="sticky top-0 z-20 flex flex-wrap items-center gap-1 p-2 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur rounded-t-2xl">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Negrita (Ctrl+B)">
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Itálica (Ctrl+I)">
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Subrayado (Ctrl+U)">
          <UnderlineIcon size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Tachado">
          <Strikethrough size={16} />
        </ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Título 1">
          <Heading1 size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Título 2">
          <Heading2 size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Título 3">
          <Heading3 size={16} />
        </ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Lista">
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Lista numerada">
          <ListOrdered size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Cita">
          <Quote size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Línea horizontal">
          <Minus size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={promptLink} active={editor.isActive('link')} title="Enlace">
          <LinkIcon size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => imageInputRef.current?.click()} disabled={uploadingImage} title="Insertar ilustración">
          {uploadingImage ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
        </ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Alinear izquierda">
          <AlignLeft size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Alinear centro">
          <AlignCenter size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Alinear derecha">
          <AlignRight size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justificar">
          <AlignJustify size={16} />
        </ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Deshacer">
          <Undo size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Rehacer">
          <Redo size={16} />
        </ToolbarButton>
      </div>

      {/* Editor body */}
      <div className="bg-zinc-950">
        {view === 'editor' && <EditorContent editor={editor} />}
        {view === 'preview' && <NovelPreview markdown={editor.storage.markdown.getMarkdown()} />}
        {view === 'source' && (
          <pre className="px-6 py-6 text-sm text-zinc-300 whitespace-pre-wrap break-words overflow-x-auto min-h-[400px]">
            {editor.storage.markdown.getMarkdown()}
          </pre>
        )}
      </div>

      {/* Footer — also sticky so .docx/.md uploaders stay reachable */}
      <div className="sticky bottom-0 z-20 flex flex-wrap items-center gap-3 p-3 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur rounded-b-2xl">
        <button
          type="button"
          onClick={() => docxInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 text-xs font-bold uppercase tracking-wider transition-colors"
        >
          <Upload size={14} /> Subir .docx
        </button>
        <button
          type="button"
          onClick={() => mdInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 text-xs font-bold uppercase tracking-wider transition-colors"
        >
          <FileText size={14} /> Subir .md
        </button>
        <input ref={docxInputRef} type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={onPickDocx} />
        <input ref={mdInputRef} type="file" accept=".md,text/markdown,text/plain" className="hidden" onChange={onPickMd} />
        <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onPickImage} />

        <div className="ml-auto flex items-center gap-3">
          <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">
            Caracteres: {chars}
          </span>
          <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900 p-0.5">
            {([
              { k: 'editor', label: 'Editor' },
              { k: 'preview', label: 'Vista previa' },
              { k: 'source', label: 'Markdown' },
            ] as { k: 'editor' | 'preview' | 'source'; label: string }[]).map((opt) => (
              <button
                key={opt.k}
                type="button"
                onClick={() => setView(opt.k)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${view === opt.k ? 'bg-cyan-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                {opt.k === 'preview' ? <Eye size={11} className="inline mr-1 -mt-0.5" /> : null}
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modal: tamaño de la ilustración */}
      {sizePickerFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setSizePickerFile(null)}>
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white font-black text-base mb-1">Tamaño de la ilustración</h3>
            <p className="text-zinc-400 text-xs mb-5">Elige cómo se mostrará en el lector.</p>
            <div className="flex flex-col gap-2">
              {SIZE_OPTIONS.map((opt) => (
                <button
                  key={opt.marker}
                  type="button"
                  onClick={() => { const f = sizePickerFile; setSizePickerFile(null); if (f) uploadAndInsertImage(f, opt.marker); }}
                  className="w-full text-left px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-950 hover:border-cyan-500 hover:bg-zinc-900 transition-colors text-sm font-bold text-zinc-200"
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setSizePickerFile(null)} className="mt-4 w-full text-center text-xs text-zinc-500 hover:text-zinc-300 font-bold uppercase tracking-wider">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal: enlace */}
      {linkModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setLinkModal(null)}>
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white font-black text-base mb-1">Enlace</h3>
            <p className="text-zinc-400 text-xs mb-4">Pega la URL. Déjala vacía para quitar el enlace.</p>
            <input
              autoFocus
              type="url"
              value={linkModal.value}
              onChange={(e) => setLinkModal({ value: e.target.value })}
              onKeyDown={(e) => { if (e.key === 'Enter') applyLink(linkModal.value); }}
              placeholder="https://"
              className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-cyan-500"
            />
            <div className="flex gap-3 mt-5">
              <button type="button" onClick={() => setLinkModal(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-300 text-sm font-bold hover:bg-zinc-800 transition-colors">
                Cancelar
              </button>
              <button type="button" onClick={() => applyLink(linkModal.value)} className="flex-1 px-4 py-2.5 rounded-xl bg-cyan-500 text-zinc-950 text-sm font-black hover:bg-cyan-400 transition-colors">
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: confirmar reemplazo de contenido */}
      {pendingReplace && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setPendingReplace(null)}>
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white font-black text-base mb-1">Reemplazar contenido</h3>
            <p className="text-zinc-400 text-sm mb-5">El editor ya tiene contenido. ¿Reemplazarlo con el archivo subido?</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setPendingReplace(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-300 text-sm font-bold hover:bg-zinc-800 transition-colors">
                Cancelar
              </button>
              <button type="button" onClick={() => { const pr = pendingReplace; setPendingReplace(null); if (pr) doUpload(pr.file, pr.endpoint); }} className="flex-1 px-4 py-2.5 rounded-xl bg-cyan-500 text-zinc-950 text-sm font-black hover:bg-cyan-400 transition-colors">
                Reemplazar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NovelEditor;
