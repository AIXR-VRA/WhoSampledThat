export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Handle share page with dynamic meta tags
    if (url.pathname.startsWith('/share/')) {
      return handleSharePage(request, env);
    }
    
    // Handle share image generation with detailed logging
    if (url.pathname.startsWith('/api/share-image/')) {
      console.log('🖼️ OG_IMAGE_REQUEST:', url.pathname, 'from:', request.headers.get('User-Agent'));
      return handleShareImage(request, env);
    }
    
    // Default to serving static assets
    return env.ASSETS.fetch(request);
  },
};

// Decode share ID back to score data
function decodeShareId(shareId) {
  try {
    console.log('🔍 OG_DECODE_START:', shareId);
    
    // Reverse the URL-safe base64 encoding
    const base64 = shareId.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    
    // Decode from base64
    const decoded = atob(padded);
    console.log('🔍 OG_DECODE_STRING:', decoded);
    
    // Parse the compact format: name1:score1,name2:score2,name3:score3
    const pairs = decoded.split(',');
    const result = pairs.map((pair, index) => {
      const [name, score] = pair.split(':');
      return {
        name: name,
        score: parseInt(score, 10),
        position: index + 1
      };
    });
    
    console.log('✅ OG_DECODE_SUCCESS:', result.length, 'players');
    return result;
  } catch (error) {
    console.error('❌ OG_DECODE_ERROR:', error);
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
    console.log('🎨 OG_IMAGE_GENERATION_START');
    
    const url = new URL(request.url);
    const shareId = url.pathname.split('/api/share-image/')[1];
    
    if (!shareId) {
      console.error('❌ OG_MISSING_SHARE_ID');
      return new Response('Missing share ID', { status: 400 });
    }
    
    const scores = decodeShareId(shareId);
    if (!scores) {
      console.error('❌ OG_INVALID_SHARE_ID:', shareId);
      return new Response('Invalid share ID', { status: 400 });
    }
    
    console.log('📥 OG_FETCHING_BASE_IMAGE');
    
    // Get the base image from assets
    const baseImageRequest = new Request(new URL('/social-share-card-base.png', request.url));
    const baseImageResponse = await env.ASSETS.fetch(baseImageRequest);
    
    if (!baseImageResponse.ok) {
      console.error('❌ OG_BASE_IMAGE_NOT_FOUND');
      return new Response('Base image not found', { status: 404 });
    }
    
    const baseImageBuffer = await baseImageResponse.arrayBuffer();
    console.log('✅ OG_BASE_IMAGE_LOADED:', baseImageBuffer.byteLength, 'bytes');
    
    // Generate the dynamic image with scores
    console.log('🖼️ OG_GENERATING_IMAGE');
    const generatedImage = await generateShareImage(baseImageBuffer, scores);
    console.log('✅ OG_IMAGE_GENERATED:', generatedImage.byteLength, 'bytes');
    
    return new Response(generatedImage, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'X-Content-Type-Options': 'nosniff',
        'X-Generated-At': new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ OG_CRITICAL_ERROR:', error);
    console.error('❌ OG_ERROR_STACK:', error.stack);
    return new Response('Error generating image', { status: 500 });
  }
}

async function generateShareImage(baseImageBuffer, scores) {
  try {
    // Import the ImageResponse from workers-og (the correct library for Cloudflare Workers)
    const { ImageResponse } = await import('workers-og');
    
    // Convert base image to base64 for background
    const base64Image = `data:image/png;base64,${btoa(String.fromCharCode(...new Uint8Array(baseImageBuffer)))}`;
    
    // Create JSX component with base image background and scores in safe zone
    const jsx = {
      type: 'div',
      props: {
        style: {
          height: '1080px',
          width: '1920px',
          display: 'flex',
          position: 'relative',
          backgroundImage: `url(${base64Image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          fontFamily: 'Arial, sans-serif'
        },
        children: [
          // Safe zone container (right side red area) - scaled for 1920x1080
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                right: '80px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '800px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '50px'
              },
              children: scores.slice(0, 3).map((player, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
                return {
                  type: 'div',
                  key: index,
                  props: {
                    style: {
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      padding: '35px',
                      borderRadius: '25px',
                      width: '100%'
                    },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: '80px',
                            marginBottom: '10px'
                          },
                          children: medal
                        }
                      },
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: '60px',
                            fontWeight: 'bold',
                            color: '#FFFFFF',
                            textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
                            marginBottom: '10px'
                          },
                          children: player.name
                        }
                      },
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: '48px',
                            fontWeight: 'bold',
                            color: '#FFD700',
                            textShadow: '3px 3px 6px rgba(0,0,0,0.8)'
                          },
                          children: `${player.score} pts`
                        }
                      }
                    ]
                  }
                };
              })
            }
          }
        ]
      }
    };

    // Generate the image using ImageResponse from workers-og
    const response = new ImageResponse(jsx, {
      width: 1920,
      height: 1080,
    });
    
    return await response.arrayBuffer();
  } catch (error) {
    console.error('❌ OG_WORKERS_OG_ERROR:', error);
    console.log('🔄 OG_FALLBACK_TO_SVG');
    
    // Fallback: return a clean SVG with the actual base image background (1920x1080)
    const fallbackSvg = `
      <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="baseImage" patternUnits="userSpaceOnUse" width="1920" height="1080">
            <image href="data:image/png;base64,${btoa(String.fromCharCode(...new Uint8Array(baseImageBuffer)))}" x="0" y="0" width="1920" height="1080"/>
          </pattern>
        </defs>
        <rect width="1920" height="1080" fill="url(#baseImage)"/>
        
        <!-- Safe zone scores (right side) - scaled for 1920x1080 -->
        <g transform="translate(1520, 540)">
          ${scores.slice(0, 3).map((player, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
            const y = (index - 1) * 160; // Center around 0, bigger spacing
            return `
              <g transform="translate(0, ${y})">
                <rect x="-320" y="-50" width="640" height="100" fill="rgba(0, 0, 0, 0.5)" rx="25"/>
                <text x="0" y="-15" font-family="Arial" font-size="52" fill="white" text-anchor="middle" font-weight="bold">${medal} ${player.name}</text>
                <text x="0" y="30" font-family="Arial" font-size="40" fill="#FFD700" text-anchor="middle" font-weight="bold">${player.score} pts</text>
              </g>
            `;
          }).join('')}
        </g>
      </svg>
    `;
    
    console.log('✅ OG_FALLBACK_SVG_GENERATED');
    return new Response(fallbackSvg, {
      headers: { 'Content-Type': 'image/svg+xml' }
    }).arrayBuffer();
  }
} 