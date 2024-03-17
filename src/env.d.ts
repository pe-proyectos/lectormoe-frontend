/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
interface ImportMetaEnv {
    readonly PUBLIC_API_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

type Organization = {
    id: number,
    slug: string,
    name: string,
    title: string,
    imageUrl: string,
    description: string,
    googleAdsMetaContent?: string,
}

interface Window {
    organization: Organization;
}

declare namespace App {
    interface Locals {
        theme: 'light' | 'black',
        token: string | undefined,
        username: string | undefined,
        user_slug: string | undefined,
        logged: boolean,

        organization: Organization,

        callAPI: (url: string, fetchOptions?: RequestInit) => Promise<any>,
        formatDate: (dateString: string) => string,
    }
}
