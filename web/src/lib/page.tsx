import type { Metadata } from 'next';
import { DocPage } from '@/components/DocPage';
import { fileFromSlug, loadDoc, titleOf } from './content';
import { NAV, type Locale, type NavItem, routeOf } from './nav';

export type NavNode = { label: string; href?: string; children?: NavNode[] };

function navTree(items: NavItem[], locale: Locale): NavNode[] {
  return items.map((i) =>
    'file' in i
      ? { label: titleOf(i.file, locale), href: routeOf(i.file, locale) }
      : { label: i.label[locale], children: navTree(i.children, locale) },
  );
}

type Props = { params: Promise<{ slug?: string[] }> };

/** Página e metadata compartilhadas entre a rota em inglês (raiz) e a em português (/pt). */
export function docRoute(locale: Locale) {
  async function Page({ params }: Props) {
    const file = fileFromSlug((await params).slug);
    const doc = loadDoc(file, locale);
    return (
      <DocPage
        locale={locale}
        doc={doc}
        nav={navTree(NAV, locale)}
        altHref={routeOf(file, locale === 'en' ? 'pt' : 'en')}
      />
    );
  }
  async function generateMetadata({ params }: Props): Promise<Metadata> {
    const file = fileFromSlug((await params).slug);
    return file === 'index' ? {} : { title: titleOf(file, locale) };
  }
  return { Page, generateMetadata };
}
