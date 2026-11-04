import { staticSlugs } from '@/lib/content';
import { docRoute } from '@/lib/page';

const route = docRoute('en');
export const dynamicParams = false;
export const generateStaticParams = staticSlugs;
export const generateMetadata = route.generateMetadata;
export default route.Page;
