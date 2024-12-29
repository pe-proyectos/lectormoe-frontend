/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
interface ImportMetaEnv {
    readonly PUBLIC_API_URL: string;
    readonly PUBLIC_OVERRIDE_ORGANIZATION_DOMAIN: string;
    readonly PUBLIC_PAYPAL_CLIENT_ID: string;
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
    enableSubscriptionSection?: boolean;
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
        user: undefined | {
            // Organization
            canSeeAdminPanel: boolean,
            canEditOrganization: boolean,
            canDeleteOrganization: boolean,
            // Organization Users
            canEditUser: boolean,
            canDeleteUser: boolean,
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
            canReadUnreleasedChapter: boolean,
            canCreateChapter: boolean,
            canEditChapter: boolean,
            canDeleteChapter: boolean,
            // Pages
            canCreatePage: boolean,
            canEditPage: boolean,
            canDeletePage: boolean,
            // Subscription Plan
            canCreateSubscriptionPlan: boolean,
            canEditSubscriptionPlan: boolean,
            canDeleteSubscriptionPlan: boolean,
            // Perks
            hideAds: boolean,
            canDownload: boolean,
            canReadUnreleased: boolean,
            // Subscription
            subscriptions?: {
                id: number,
                startDate: Date,
                lastPayment: Date,
                nextPayment: Date,
                subscriptionPlan?: {
                    id: number,
                    name: string,
                    slug: string,
                    interval: string,
                    currency: string,
                    active: boolean,
                },
            }[],
        },
        logged: boolean,

        organization: Organization,

        callAPI: (url: string, fetchOptions?: Partial<RequestInit> & { includeIp?: any }) => Promise<any>,
        formatDate: (dateString: string) => string,
    }
}
