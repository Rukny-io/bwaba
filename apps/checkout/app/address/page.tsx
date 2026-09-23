import { redirect } from 'next/navigation';

/** Legacy multi-page route — checkout is now a single page at `/`. */
export default function AddressRedirectPage() {
  redirect('/');
}
