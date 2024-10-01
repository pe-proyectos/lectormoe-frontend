/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
interface ImportMetaEnv {
    readonly PUBLIC_API_URL: string;
    readonly PUBLIC_OVERRIDE_ORGANIZATION_DOMAIN: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

type Organization = {
    id: number;
    slug: string;
    name: string;
    title: string;
    domain: string;
    logoUrl?: string;
    imageUrl?: string;
    bannerUrl?: string;
    faviconUrl?: string;
    description?: string;
    language: string;
    useBlockedCountries?: boolean;
    useAllowedCountries?: boolean;
    enableMangaSection?: boolean;
    enableManhuaSection?: boolean;
    enableManhwaSection?: boolean;
    enableMainSlider?: boolean;
    enableMainBanner?: boolean;
    enableGoogleAds?: boolean;
    googleAdsMetaContent?: string;
    googleAdsAdsTxtContent?: string;
    enableAdsterraAds?: boolean;
    adsterraAdSource?: string;
    monitorWebsiteId?: string;
    enableDisqusIntegration?: boolean;
    disqusEmbedUrl?: string;
    facebookUrl?: string;
    twitterUrl?: string;
    instagramUrl?: string;
    youtubeUrl?: string;
    patreonUrl?: string;
    tiktokUrl?: string;
    discordUrl?: string;
    twitchUrl?: string;
    countryOptions?: {
        organizationId: number;
        countryCode: string;
        language: string;
        countryName: string;
        allowed: boolean;
        blocked: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[];
}

interface Window {
    organization: Organization;
}

declare namespace App {
    interface Locals {
        theme: 'light' | 'black',
        token: string | undefined,
        username: string | undefined,
        userSlug: string | undefined,
        member: undefined | {
            // Organization
            canSeeAdminPanel: boolean,
            canEditOrganization: boolean,
            canDeleteOrganization: boolean,
            // Organization Members
            canInviteMember: boolean,
            canEditMember: boolean,
            canDeleteMember: boolean,
            // Author
            canCreateAuthor: boolean,
            // Manga Profile
            canCreateMangaProfile: boolean,
            // Manga Custom
            canCreateMangaCustom: boolean,
            canEditMangaCustom: boolean,
            canDeleteMangaCustom: boolean,
            // Genre
            canCreateGenre: boolean,
            canEditGenre: boolean,
            canDeleteGenre: boolean,
            // Chapter
            canCreateChapter: boolean,
            canEditChapter: boolean,
            canDeleteChapter: boolean,
            // Pages
            canCreatePage: boolean,
            canEditPage: boolean,
            canDeletePage: boolean,
            // Coinpack
            canCreateCoinpack: boolean,
            canEditCoinpack: boolean,
            canDeleteCoinpack: boolean,
        },
        logged: boolean,

        organization: Organization,

        callAPI: (url: string, fetchOptions?: Partial<RequestInit> & { includeIp?: any }) => Promise<any>,
        formatDate: (dateString: string) => string,
    }
}
