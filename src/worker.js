export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Handle share page with dynamic meta tags
    if (url.pathname.startsWith('/share/')) {
      return handleSharePage(request, env);
    }
    
    // Handle share image generation
    if (url.pathname.startsWith('/api/share-image/')) {
      return handleShareImage(request, env);
    }
    
    // Default to serving static assets
    return env.ASSETS.fetch(request);
  },
};

// Decode share ID back to score data
function decodeShareId(shareId) {
  try {
    // Reverse the URL-safe base64 encoding
    const base64 = shareId.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    
    // Decode from base64
    const decoded = atob(padded);
    
    // Parse the compact format: name1:score1,name2:score2,name3:score3
    const pairs = decoded.split(',');
    return pairs.map((pair, index) => {
      const [name, score] = pair.split(':');
      return {
        name: name,
        score: parseInt(score, 10),
        position: index + 1
      };
    });
  } catch (error) {
    console.error('Error decoding share ID:', error);
    return null;
  }
}

async function handleSharePage(request, env) {
  try {
    const url = new URL(request.url);
    const shareId = url.pathname.split('/share/')[1];
    
    if (!shareId) {
      // No share ID provided, redirect to main game
      return Response.redirect(url.origin, 302);
    }
    
    const scores = decodeShareId(shareId);
    if (!scores) {
      // Invalid share ID, redirect to main game
      return Response.redirect(url.origin, 302);
    }
    
    const imageUrl = `${url.origin}/api/share-image/${shareId}`;
    
    // Create dynamic title and description
    const top3Text = scores.slice(0, 3).map((p, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
      return `${medal} ${p.name}: ${p.score} pts`;
    }).join(' | ');
    
    const title = `Who Sampled That? - Game Results! 🎵`;
    const description = `Check out these amazing scores: ${top3Text}`;
    
    // Return HTML with dynamic meta tags
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    
    <!-- Dynamic Open Graph tags for this specific share -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${url.href}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:site_name" content="Who Sampled That?">
    
    <!-- Twitter Card tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${imageUrl}">
    
    <!-- Auto-redirect to main game after a short delay for social crawlers -->
    <meta http-equiv="refresh" content="3;url=${url.origin}">
    
    <style>
        body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 50px;
            background: linear-gradient(135deg, #1f2937, #374151);
            color: white;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }
        .logo { font-size: 2em; margin-bottom: 20px; }
        .scores { font-size: 1.2em; margin: 20px 0; }
        .redirect { font-size: 0.9em; color: #9CA3AF; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="logo">🎵 Who Sampled That? 🎵</div>
    <div class="scores">${top3Text}</div>
    <div class="redirect">Redirecting to game... <a href="${url.origin}">Click here if not redirected</a></div>
    
    <script>
        // Immediate redirect for human visitors
        setTimeout(() => {
            window.location.href = '${url.origin}';
        }, 1000);
    </script>
</body>
</html>`;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      }
    });
    
  } catch (error) {
    console.error('Error generating share page:', error);
    // Fallback to redirect to main game
    return Response.redirect(new URL(request.url).origin, 302);
  }
}

async function handleShareImage(request, env) {
  try {
    const url = new URL(request.url);
    const shareId = url.pathname.split('/api/share-image/')[1];
    
    if (!shareId) {
      return new Response('Missing share ID', { status: 400 });
    }
    
    const scores = decodeShareId(shareId);
    if (!scores) {
      return new Response('Invalid share ID', { status: 400 });
    }
    
    // Get the base image from assets
    const baseImageRequest = new Request(new URL('/social-share-card-base.png', request.url));
    const baseImageResponse = await env.ASSETS.fetch(baseImageRequest);
    
    if (!baseImageResponse.ok) {
      return new Response('Base image not found', { status: 404 });
    }
    
    const baseImageBuffer = await baseImageResponse.arrayBuffer();
    
    // Generate the dynamic image with scores
    const generatedImage = await generateShareImage(baseImageBuffer, scores);
    
    return new Response(generatedImage, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'X-Content-Type-Options': 'nosniff'
      }
    });
    
  } catch (error) {
    console.error('Error generating share image:', error);
    return new Response('Error generating image', { status: 500 });
  }
}

async function generateShareImage(baseImageBuffer, scores) {
  try {
    // Import the ImageResponse from workers-og (the correct library for Cloudflare Workers)
    const { ImageResponse } = await import('workers-og');
    
    // Create JSX component for the OG image using workers-og
    const jsx = {
      type: 'div',
      props: {
        style: {
          height: '630px',
          width: '1200px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1f2937',
          background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
          fontFamily: 'Arial, sans-serif',
          color: '#FFFFFF',
          padding: '40px'
        },
        children: [
          // Title
          {
            type: 'div',
            props: {
              style: {
                fontSize: '48px',
                fontWeight: 'bold',
                marginBottom: '40px',
                textAlign: 'center'
              },
              children: '🎵 Who Sampled That? 🎵'
            }
          },
          // Subtitle
          {
            type: 'div',
            props: {
              style: {
                fontSize: '36px',
                fontWeight: 'bold',
                marginBottom: '50px',
                color: '#FFD700',
                textAlign: 'center'
              },
              children: 'FINAL SCORES! 🏆'
            }
          },
          // Scores container
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                gap: '25px',
                alignItems: 'center',
                width: '100%'
              },
              children: scores.slice(0, 3).map((player, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
                return {
                  type: 'div',
                  key: index,
                  props: {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '600px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      padding: '20px 30px',
                      borderRadius: '15px',
                      fontSize: '32px',
                      fontWeight: 'bold'
                    },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: '15px'
                          },
                          children: [
                            {
                              type: 'span',
                              props: {
                                style: { fontSize: '40px' },
                                children: medal
                              }
                            },
                            {
                              type: 'span',
                              props: {
                                children: player.name
                              }
                            }
                          ]
                        }
                      },
                      {
                        type: 'span',
                        props: {
                          style: { color: '#FFD700' },
                          children: `${player.score} pts`
                        }
                      }
                    ]
                  }
                };
              })
            }
          },
          // Footer
          {
            type: 'div',
            props: {
              style: {
                fontSize: '24px',
                marginTop: '50px',
                color: '#9CA3AF',
                textAlign: 'center'
              },
              children: 'Play at whosampledthat.com'
            }
          }
        ]
      }
    };

    // Generate the image using ImageResponse from workers-og
    const response = new ImageResponse(jsx, {
      width: 1200,
      height: 630,
    });
    
    return await response.arrayBuffer();
  } catch (error) {
    console.error('Error generating image with workers-og:', error);
    
    // Fallback: return a simple SVG
    const fallbackSvg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1f2937;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#374151;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="1200" height="630" fill="url(#grad1)"/>
        <text x="600" y="150" font-family="Arial" font-size="48" fill="white" text-anchor="middle" font-weight="bold">🎵 Who Sampled That? 🎵</text>
        <text x="600" y="220" font-family="Arial" font-size="36" fill="#FFD700" text-anchor="middle" font-weight="bold">FINAL SCORES! 🏆</text>
        ${scores.slice(0, 3).map((player, index) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
          const y = 320 + (index * 80);
          return `
            <rect x="300" y="${y - 35}" width="600" height="60" fill="rgba(255, 255, 255, 0.1)" rx="15"/>
            <text x="330" y="${y}" font-family="Arial" font-size="32" fill="white" font-weight="bold">${medal} ${player.name}</text>
            <text x="870" y="${y}" font-family="Arial" font-size="32" fill="#FFD700" text-anchor="end" font-weight="bold">${player.score} pts</text>
          `;
        }).join('')}
        <text x="600" y="580" font-family="Arial" font-size="24" fill="#9CA3AF" text-anchor="middle">Play at whosampledthat.com</text>
      </svg>
    `;
    
    return new Response(fallbackSvg, {
      headers: { 'Content-Type': 'image/svg+xml' }
    }).arrayBuffer();
  }
} 