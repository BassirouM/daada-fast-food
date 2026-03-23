import { redirect } from 'next/navigation'

// Root redirects to menu (main app entry point)
export default function RootPage() {
  redirect('/menu')
}
