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
    domain: string,
    logoUrl?: string,
    imageUrl?: string,
    bannerUrl?: string,
    description?: string,
    googleAdsMetaContent?: string,
    googleAdsAdsTxtContent?: string,
    facebookUrl?: string,
    twitterUrl?: string,
    instagramUrl?: string,
    youtubeUrl?: string,
    patreonUrl?: string,
    tiktokUrl?: string,
    discordUrl?: string,
    twitchUrl?: string,
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
