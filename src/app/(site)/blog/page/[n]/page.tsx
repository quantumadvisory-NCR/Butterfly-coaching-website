import { permanentRedirect } from "next/navigation";

/** Legacy WordPress pagination (/blog/page/2/) now lives at /blog/?page=2. */
export default async function LegacyBlogPagination({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const page = Number(n);
  permanentRedirect(Number.isInteger(page) && page > 1 ? `/blog/?page=${page}` : "/blog/");
}
