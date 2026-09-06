import React, { useCallback } from 'react'
import { MessageSquareText } from 'lucide-react'
import { callAPI } from '../../../util/callApi'
import PostComposer from './PostComposer'
import PostFeed from './PostFeed'

interface Props { organization: any; user: any; logged: boolean; language?: string }

const ScanCommunity: React.FC<Props> = ({ organization, user, logged, language = 'es' }) => {
  const en = language === 'en'
  const isStaff = !!user?.permissions?.find((p: any) => p.organizationId === organization?.id)?.canSeeAdminPanel
  const [reload, setReload] = React.useState(0)
  const fetcher = useCallback(async (page: number) => {
    const d: any = await callAPI(`/api/organizations/${organization.slug}/posts?page=${page}`)
    return { items: d?.items || [], hasMore: !!d?.hasMore }
  }, [organization?.slug, reload])

  return (
    <section className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquareText className="text-teal-400" size={22} />
        <h2 className="text-xl font-black text-white">{en ? `${organization?.name || 'Scan'} on The Pond` : `${organization?.name || 'El scan'} en La Charca`}</h2>
        <a href="/socials" className="ml-auto text-xs font-bold text-teal-400 hover:underline">{en ? 'Open The Pond' : 'Abrir La Charca'}</a>
      </div>
      {isStaff && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] mb-4">
          <PostComposer user={user} language={language} asOrgSlug={organization.slug} onCreated={() => setReload((n) => n + 1)} />
        </div>
      )}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <PostFeed fetcher={fetcher} reloadKey={`${organization?.slug}-${reload}`} user={user} logged={logged} language={language}
          emptyText={en ? 'No posts yet.' : 'Aún no hay publicaciones.'} />
      </div>
    </section>
  )
}

export default ScanCommunity
