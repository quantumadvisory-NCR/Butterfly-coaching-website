import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import type { SectionSnapshot } from "@/lib/content/public";
import { type BlockData, type BlockType, isBlockType } from "@/lib/blocks/registry";
import { BlogTeasersBlock, CtaBlock, FaqBlock, NewsletterBlock } from "./closing";
import { ContactFormBlock } from "./contact";
import { FeatureListBlock, ImageTextBlock, RichTextBlock, TrustStripBlock } from "./content";
import { HeroBlock } from "./hero";
import { GalleryBlock, ResourceDownloadsBlock, VideoBlock } from "./media";
import { PathCardsBlock } from "./path-cards";
import { ProfilesBlock, TestimonialsBlock } from "./people";
import { ComparisonTableBlock, ProgrammeCardsBlock } from "./programmes";
import { TimelineBlock } from "./timeline";
import type { BlockContext, BlockProps } from "./types";

type Renderer<T extends BlockType> = (props: BlockProps<T>) => ReactNode | Promise<ReactNode>;

const RENDERERS: { [T in BlockType]: Renderer<T> } = {
  hero: HeroBlock,
  rich_text: RichTextBlock,
  image_text: ImageTextBlock,
  path_cards: PathCardsBlock,
  feature_list: FeatureListBlock,
  programme_cards: ProgrammeCardsBlock,
  comparison_table: ComparisonTableBlock,
  testimonials: TestimonialsBlock,
  profiles: ProfilesBlock,
  faq: FaqBlock,
  timeline: TimelineBlock,
  gallery: GalleryBlock,
  video: VideoBlock,
  cta: CtaBlock,
  contact_form: ContactFormBlock,
  newsletter: NewsletterBlock,
  resource_downloads: ResourceDownloadsBlock,
  trust_strip: TrustStripBlock,
  blog_teasers: BlogTeasersBlock,
};

/** Blocks that render the breadcrumb trail themselves when they open a page. */
const OWNS_BREADCRUMBS = new Set<string>(["hero", "rich_text"]);

/** Renders a page's sections in order. Unknown block types are skipped, never fatal. */
export function BlockRenderer({
  sections,
  ctx,
}: {
  sections: SectionSnapshot[];
  ctx: Omit<BlockContext, "index">;
}) {
  const visible = sections.filter((section) => !section.isHidden && isBlockType(section.type));
  const first = visible[0];
  const needsCrumbBar = ctx.breadcrumbs.length > 0 && (!first || !OWNS_BREADCRUMBS.has(first.type));
  return (
    <>
      {needsCrumbBar && (
        <div className="bg-sky">
          <div className="container-site py-4">
            <Breadcrumbs items={ctx.breadcrumbs} />
          </div>
        </div>
      )}
      {visible.map((section, index) => {
        const type = section.type as BlockType;
        const Component = RENDERERS[type] as Renderer<BlockType>;
        return <Component key={section.id} data={section.data as BlockData[BlockType]} ctx={{ ...ctx, index }} />;
      })}
    </>
  );
}
