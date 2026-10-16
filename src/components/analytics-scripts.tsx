import Script from 'next/script'

/**
 * Google Analytics loader. Renders nothing for an empty or missing id so the
 * root layout never emits a stray text node (which breaks hydration).
 */
export function GoogleAnalytics({ gaId }: { gaId: string | undefined }) {
  const id = gaId?.trim()
  if (!id) return null
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}');
        `}
      </Script>
    </>
  )
}
