import { useEffect } from 'react'

export function SEO({
  title = "SkillVersus - Real-Time 1v1 Coding Duels Platform",
  description = "Join SkillVersus for competitive programming duels, practice coding challenges, and improve your skills in real-time 1v1 battles. Support for multiple programming languages including Python, Java, C++, and more.",
  keywords = "coding duels, competitive programming, online judge, programming practice, coding challenges, algorithm practice, real-time coding, 1v1 programming, skill versus, code competition",
  image = "/og-image.png",
  url = "https://skillversus.com",
  type = "website"
}) {
  const fullTitle = title.includes('SkillVersus') ? title : `${title} | SkillVersus`
  const fullUrl = url.startsWith('http') ? url : `https://skillversus.com${url}`

  useEffect(() => {
    // Update document title
    document.title = fullTitle

    // Update or create meta tags
    const updateMetaTag = (name, content, property = false) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`
      let meta = document.querySelector(selector)

      if (!meta) {
        meta = document.createElement('meta')
        if (property) {
          meta.setAttribute('property', name)
        } else {
          meta.setAttribute('name', name)
        }
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', content)
    }

    // Basic Meta Tags
    updateMetaTag('description', description)
    updateMetaTag('keywords', keywords)
    updateMetaTag('author', 'SkillVersus Team')
    updateMetaTag('robots', 'index, follow')

    // Open Graph Meta Tags
    updateMetaTag('og:title', fullTitle, true)
    updateMetaTag('og:description', description, true)
    updateMetaTag('og:image', image, true)
    updateMetaTag('og:url', fullUrl, true)
    updateMetaTag('og:type', type, true)
    updateMetaTag('og:site_name', 'SkillVersus', true)

    // Twitter Card Meta Tags
    updateMetaTag('twitter:card', 'summary_large_image')
    updateMetaTag('twitter:title', fullTitle)
    updateMetaTag('twitter:description', description)
    updateMetaTag('twitter:image', image)

    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', fullUrl)

    // Add structured data
    let structuredData = document.querySelector('#structured-data')
    if (!structuredData) {
      structuredData = document.createElement('script')
      structuredData.id = 'structured-data'
      structuredData.type = 'application/ld+json'
      document.head.appendChild(structuredData)
    }

    structuredData.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "SkillVersus",
      "description": description,
      "url": "https://skillversus.com",
      "applicationCategory": "EducationalApplication",
      "operatingSystem": "Web Browser",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "creator": {
        "@type": "Organization",
        "name": "SkillVersus Team"
      },
      "featureList": [
        "Real-time 1v1 coding duels",
        "Multiple programming languages support",
        "Practice mode with online compiler",
        "Competitive ranking system",
        "Friends and social features"
      ]
    })
  }, [fullTitle, description, keywords, image, fullUrl, type])

  return null // This component doesn't render anything visible
}

// Page-specific SEO configurations
export const seoConfigs = {
  home: {
    title: "SkillVersus - Real-Time 1v1 Coding Duels Platform",
    description: "Join SkillVersus for competitive programming duels, practice coding challenges, and improve your skills in real-time 1v1 battles. Support for multiple programming languages.",
    keywords: "coding duels, competitive programming, online judge, programming practice, coding challenges, algorithm practice, real-time coding, 1v1 programming",
    url: "/"
  },
  practice: {
    title: "Practice Mode - Code Online Compiler",
    description: "Practice coding with our online compiler supporting Python, Java, C++, JavaScript and more. Write, test, and execute code with stdin support like CodeChef.",
    keywords: "online compiler, code practice, programming practice, python compiler, java compiler, c++ compiler, coding practice platform",
    url: "/practice"
  },
  duels: {
    title: "Coding Duels - Real-Time Programming Battles",
    description: "Challenge other programmers in real-time 1v1 coding duels. Test your skills in competitive programming battles and climb the leaderboard.",
    keywords: "coding duels, programming battles, competitive programming, 1v1 coding, real-time coding competition",
    url: "/duels"
  },
  leaderboard: {
    title: "Leaderboard - Top Programmers Rankings",
    description: "View the top programmers and their rankings on SkillVersus. See who dominates the coding duels and competitive programming challenges.",
    keywords: "programming leaderboard, coding rankings, top programmers, competitive programming rankings",
    url: "/leaderboard"
  },
  dashboard: {
    title: "Dashboard - Your Coding Journey",
    description: "Track your coding progress, view your duel history, and manage your profile on SkillVersus dashboard.",
    keywords: "coding dashboard, programming progress, duel history, coding statistics",
    url: "/dashboard"
  },
  profile: {
    title: "Profile - Your Coding Profile",
    description: "Manage your SkillVersus profile, view your coding statistics, and customize your programmer identity.",
    keywords: "coding profile, programmer profile, coding statistics, user profile",
    url: "/profile"
  }
}
