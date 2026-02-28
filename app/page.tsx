/**
 * Homepage - Redirect to Admin Login
 */

import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/admin/login');
}
