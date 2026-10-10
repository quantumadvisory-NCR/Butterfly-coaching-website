import { DownloadSimpleIcon, FilePdfIcon } from "@phosphor-icons/react/dist/ssr";
import { LiteYouTube } from "@/components/site/lite-youtube";
import { MediaImage } from "@/components/ui/media-image";
import { Section, SectionHeading } from "@/components/ui/section";
import { getResources } from "@/lib/content/public";
import { youtubeId } from "@/lib/utils";
import { type BlockProps, pickMedia } from "./types";

export function GalleryBlock({ data, ctx }: BlockProps<"gallery">) {
  const images = data.images.map((item) => ({ ...item, media: pickMedia(ctx, item.image) })).filter((item) => item.media);
  if (images.length === 0) return null;
  return (
    <Section background={data.background} anchor={data.anchor}>
      <div className="container-site">
        <SectionHeading heading={data.heading} intro={data.intro} />
        <ul className="mt-9 gap-5 [column-fill:_balance] min-[30rem]:columns-2 md:mt-12 lg:columns-3">
          {images.map((item, i) => (
            <li key={`${item.media!.id}-${i}`} className="mb-5 break-inside-avoid">
              <figure>
                <div className="overflow-hidden rounded-card bg-sky-deep">
                  <MediaImage media={item.media} sizes="(min-width: 64rem) 31vw, (min-width: 30rem) 46vw, 100vw" />
                </div>
                {(item.caption || item.media!.caption) && (
                  <figcaption className="mt-2.5 text-sm text-muted">{item.caption || item.media!.caption}</figcaption>
                )}
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

export function VideoBlock({ data }: BlockProps<"video">) {
  const videos = data.videos.map((video) => ({ ...video, id: youtubeId(video.url) })).filter((video) => video.id);
  if (videos.length === 0) return null;
  return (
    <Section background={data.background} anchor={data.anchor}>
      <div className="container-site">
        <SectionHeading heading={data.heading} intro={data.intro} />
        <ul className={videos.length === 1 ? "mt-9 max-w-4xl md:mt-12" : "mt-9 grid gap-6 md:mt-12 md:grid-cols-2"}>
          {videos.map((video) => (
            <li key={video.id}>
              <LiteYouTube id={video.id!} title={video.title} />
              <p className="mt-3 font-semibold text-navy">{video.title}</p>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

export async function ResourceDownloadsBlock({ data, ctx }: BlockProps<"resource_downloads">) {
  const resources = (await getResources()).map((r) => ({ ...r, file: pickMedia(ctx, r.fileId) })).filter((r) => r.file);
  if (resources.length === 0) {
    // Nothing published yet: stay invisible on the live site, explain in preview.
    return ctx.preview ? (
      <Section background={data.background}>
        <p className="container-site rounded-card border border-dashed border-sky-line p-6 text-muted">
          Resource downloads: no resources are published yet. Add them under Resources in the admin.
        </p>
      </Section>
    ) : null;
  }
  return (
    <Section background={data.background} anchor={data.anchor}>
      <div className="container-site">
        <SectionHeading heading={data.heading} intro={data.intro} />
        <ul className="mt-9 grid gap-5 md:mt-12 md:grid-cols-2">
          {resources.map((resource) => (
            <li key={resource.id} className="flex items-start gap-4 rounded-card border border-sky-line bg-surface p-6">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-sky text-primary">
                <FilePdfIcon aria-hidden weight="fill" className="size-6" />
              </span>
              <div className="min-w-0">
                <h3 className="text-h3">{resource.title}</h3>
                {resource.description && <p className="mt-1.5">{resource.description}</p>}
                <a
                  href={resource.file!.url}
                  download
                  data-track="download"
                  data-track-label={resource.title}
                  className="text-link mt-2"
                >
                  <DownloadSimpleIcon aria-hidden weight="bold" className="size-4" />
                  Download
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
