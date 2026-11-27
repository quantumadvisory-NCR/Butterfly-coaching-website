import {
  ArrowsLeftRightIcon,
  ClockCounterClockwiseIcon,
  EnvelopeSimpleIcon,
  FileArrowDownIcon,
  FilePlusIcon,
  FilesIcon,
  GearSixIcon,
  GraduationCapIcon,
  HouseIcon,
  ImagesIcon,
  type Icon,
  NewspaperIcon,
  PlusCircleIcon,
  QuestionIcon,
  QuotesIcon,
  SignpostIcon,
  TrayIcon,
  UploadSimpleIcon,
  UsersIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";
import type { Role } from "@/lib/db/schema";

export type NavItem = { href: string; label: string; icon: Icon; min: Role; keywords?: string };
export type NavGroup = { title: string; items: NavItem[] };

const RANK: Record<Role, number> = { editor: 1, admin: 2, owner: 3 };
export const allowed = (role: Role, min: Role) => RANK[role] >= RANK[min];

/** The admin menu. The sidebar and the search palette both read it. */
export const NAV: NavGroup[] = [
  { title: "", items: [{ href: "/admin/", label: "Dashboard", icon: HouseIcon, min: "editor", keywords: "home overview" }] },
  {
    title: "Content",
    items: [
      { href: "/admin/pages/", label: "Pages", icon: FilesIcon, min: "editor", keywords: "homepage about sections" },
      { href: "/admin/programmes/", label: "Programmes", icon: GraduationCapIcon, min: "editor", keywords: "courses levels fees brochures" },
      { href: "/admin/faculty/", label: "Faculty", icon: UsersThreeIcon, min: "editor", keywords: "coaches mentors team" },
      { href: "/admin/testimonials/", label: "Testimonials", icon: QuotesIcon, min: "editor", keywords: "stories reviews videos" },
      { href: "/admin/faqs/", label: "FAQs", icon: QuestionIcon, min: "editor", keywords: "questions answers" },
      { href: "/admin/blog/", label: "Blog", icon: NewspaperIcon, min: "editor", keywords: "articles posts" },
      { href: "/admin/resources/", label: "Resources", icon: FileArrowDownIcon, min: "editor", keywords: "downloads pdf" },
      { href: "/admin/media/", label: "Media library", icon: ImagesIcon, min: "editor", keywords: "images photos videos pdfs uploads" },
    ],
  },
  {
    title: "Leads",
    items: [
      { href: "/admin/enquiries/", label: "Enquiries", icon: TrayIcon, min: "editor", keywords: "leads contacts forms" },
      { href: "/admin/subscribers/", label: "Subscribers", icon: EnvelopeSimpleIcon, min: "editor", keywords: "newsletter emails" },
    ],
  },
  {
    title: "Site",
    items: [
      { href: "/admin/navigation/", label: "Navigation", icon: SignpostIcon, min: "admin", keywords: "menu footer links" },
      { href: "/admin/redirects/", label: "Redirects", icon: ArrowsLeftRightIcon, min: "admin", keywords: "old addresses urls" },
      { href: "/admin/settings/", label: "Settings", icon: GearSixIcon, min: "admin", keywords: "contact colours announcement integrations" },
    ],
  },
  {
    title: "Team",
    items: [
      { href: "/admin/users/", label: "Users", icon: UsersIcon, min: "owner", keywords: "staff accounts roles" },
      { href: "/admin/audit/", label: "Audit log", icon: ClockCounterClockwiseIcon, min: "owner", keywords: "history changes" },
    ],
  },
];

/** Things to create, offered in the search palette. */
export const CREATE: NavItem[] = [
  { href: "/admin/pages/new/", label: "Create a page", icon: FilePlusIcon, min: "editor", keywords: "new page" },
  { href: "/admin/programmes/new/", label: "Add a programme", icon: PlusCircleIcon, min: "editor", keywords: "new course" },
  { href: "/admin/blog/new/", label: "Write an article", icon: NewspaperIcon, min: "editor", keywords: "new post blog" },
  { href: "/admin/testimonials/new/", label: "Add a testimonial", icon: QuotesIcon, min: "editor", keywords: "new story video" },
  { href: "/admin/faqs/new/", label: "Add an FAQ", icon: QuestionIcon, min: "editor", keywords: "new question" },
  { href: "/admin/media/", label: "Upload images, videos or PDFs", icon: UploadSimpleIcon, min: "editor", keywords: "upload media brochure" },
];

/** The menu item and group for an address, for the active highlight and the top bar. */
export function activeItem(pathname: string): { group: string; item: NavItem } | null {
  let best: { group: string; item: NavItem } | null = null;
  for (const group of NAV) {
    for (const item of group.items) {
      const hit = item.href === "/admin/" ? pathname === "/admin/" || pathname === "/admin" : pathname.startsWith(item.href);
      if (hit && (!best || item.href.length > best.item.href.length)) best = { group: group.title, item };
    }
  }
  return best;
}
