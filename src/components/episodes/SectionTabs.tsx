import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { EpisodeList } from './EpisodeList'
import { useEpisodes } from '@/hooks/useEpisodes'
import type { Section } from '@/types'

interface SingleSectionProps {
  slug: string
  section: string | null
}

function SectionEpisodes({ slug, section }: SingleSectionProps) {
  const { episodes, loading, loadingMore, error, hasMore, totRecords, loadMore } = useEpisodes(slug, section)
  return (
    <EpisodeList
      episodes={episodes}
      loading={loading}
      loadingMore={loadingMore}
      error={error}
      hasMore={hasMore}
      totRecords={totRecords}
      onLoadMore={loadMore}
    />
  )
}

interface Props {
  slug: string
  sections: Section[]
}

export function SectionTabs({ slug, sections }: Props) {
  if (sections.length === 0) {
    return <SectionEpisodes slug={slug} section={null} />
  }

  if (sections.length === 1) {
    return <SectionEpisodes slug={slug} section={sections[0].id} />
  }

  return (
    <Tabs defaultValue={sections[0].id}>
      <div className="sticky top-14 z-30 bg-background px-4 py-2 border-b border-border">
        <TabsList className="w-full overflow-x-auto">
          {sections.map((sec) => (
            <TabsTrigger key={sec.id} value={sec.id} className="text-xs">
              {sec.nombre}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {sections.map((sec) => (
        <TabsContent key={sec.id} value={sec.id}>
          <SectionEpisodes slug={slug} section={sec.id} />
        </TabsContent>
      ))}
    </Tabs>
  )
}
