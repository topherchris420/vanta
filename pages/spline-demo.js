import Head from 'next/head'
import Link from 'next/link'
import { SplineSceneBasic } from '@/components/ui/spline-scene-basic'

export default function SplineDemoPage() {
  return (
    <>
      <Head>
        <title>Spline Demo</title>
      </Head>
      <main style={{ padding: '2rem', background: '#020617', minHeight: '100vh' }}>
        <Link href="/" style={{ color: '#fff' }}>
          ← Back
        </Link>
        <div style={{ marginTop: '1rem' }}>
          <SplineSceneBasic />
        </div>
      </main>
    </>
  )
}
