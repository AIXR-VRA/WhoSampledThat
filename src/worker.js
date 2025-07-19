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
      // No share ID provided, serve normal homepage
      return env.ASSETS.fetch(request);
    }
    
    const scores = decodeShareId(shareId);
    if (!scores) {
      // Invalid share ID, serve normal homepage
      return env.ASSETS.fetch(request);
    }
    
    // Get the normal homepage HTML
    const homepageResponse = await env.ASSETS.fetch(new Request(url.origin, { 
      method: 'GET',
      headers: request.headers
    }));
    
    if (!homepageResponse.ok) {
      return homepageResponse;
    }
    
    let html = await homepageResponse.text();
    
    // Generate dynamic meta tags for this specific share
    const imageUrl = `${url.origin}/api/share-image/${shareId}`;
    const top3Text = scores.slice(0, 3).map((p, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
      return `${medal} ${p.name}: ${p.score} pts`;
    }).join(' | ');
    
    const title = `Who Sampled That? - Game Results! 🎵`;
    const description = `Check out these amazing scores: ${top3Text}`;
    
    // Create the dynamic meta tags
    const dynamicMetaTags = `
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
    <meta name="twitter:image" content="${imageUrl}">`;
    
    // Insert the dynamic meta tags into the HTML
    // Look for the closing </head> tag and insert before it
    html = html.replace('</head>', `${dynamicMetaTags}\n</head>`);
    
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      }
    });
    
  } catch (error) {
    console.error('Error generating share page:', error);
    // Fallback to normal homepage
    return env.ASSETS.fetch(request);
  }
}

// Detect if platform prefers square images
function prefersPlatformSquareImage(userAgent) {
  const ua = userAgent?.toLowerCase() || '';
  
  // WhatsApp and platforms that prefer square
  const squarePlatforms = [
    'whatsapp',
    'instagram', 
    'snapchat',
    'discord',
    'telegram'
  ];
  
  return squarePlatforms.some(platform => ua.includes(platform));
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
    
    // Detect platform and choose appropriate image format
    const userAgent = request.headers.get('User-Agent');
    const useSquare = prefersPlatformSquareImage(userAgent);
    const baseImageName = useSquare ? 'social-share-card-base-square.png' : 'social-share-card-base.png';
    
    console.log('🔍 OG_PLATFORM_DETECTION:', { userAgent, useSquare, baseImageName });
    console.log('📥 OG_FETCHING_BASE_IMAGE:', baseImageName);
    
    // Get the appropriate base image from assets
    const baseImageRequest = new Request(new URL(`/${baseImageName}`, request.url));
    const baseImageResponse = await env.ASSETS.fetch(baseImageRequest);
    
    if (!baseImageResponse.ok) {
      console.error('❌ OG_BASE_IMAGE_NOT_FOUND:', baseImageName);
      return new Response('Base image not found', { status: 404 });
    }
    
    const baseImageBuffer = await baseImageResponse.arrayBuffer();
    console.log('✅ OG_BASE_IMAGE_LOADED:', baseImageBuffer.byteLength, 'bytes');
    
    // Generate the dynamic image with scores
    console.log('🖼️ OG_GENERATING_IMAGE');
    const generatedImage = await generateShareImage(baseImageBuffer, scores, useSquare);
    console.log('✅ OG_IMAGE_GENERATED:', generatedImage.byteLength, 'bytes');
    
    return new Response(generatedImage, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'X-Content-Type-Options': 'nosniff',
        'X-Generated-At': new Date().toISOString(),
        'X-Format-Used': useSquare ? 'square' : 'rectangle'
      }
    });
    
  } catch (error) {
    console.error('❌ OG_CRITICAL_ERROR:', error);
    console.error('❌ OG_ERROR_STACK:', error.stack);
    return new Response('Error generating image', { status: 500 });
  }
}

async function generateShareImage(baseImageBuffer, scores, useSquare = false) {
  try {
    console.log('🎨 OG_GENERATING_WITH_FORMAT:', useSquare ? 'square' : 'rectangle');
    
    // Import the ImageResponse from workers-og (the correct library for Cloudflare Workers)
    const { ImageResponse } = await import('workers-og');
    
    // Convert base image to base64 for background
    const base64Image = `data:image/png;base64,${btoa(String.fromCharCode(...new Uint8Array(baseImageBuffer)))}`;
    
    // Set dimensions based on format
    const dimensions = useSquare ? { width: 1080, height: 1080 } : { width: 1920, height: 1080 };
    
    // Create JSX component with base image background and scores
    const jsx = {
      type: 'div',
      props: {
        style: {
          height: `${dimensions.height}px`,
          width: `${dimensions.width}px`,
          display: 'flex',
          position: 'relative',
          backgroundImage: `url(${base64Image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          fontFamily: 'Arial, sans-serif'
        },
        children: [
          // Scores container - centered for square, right-side for rectangle
          {
            type: 'div',
            props: {
              style: useSquare ? {
                // Square layout - centered
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: '800px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '40px'
              } : {
                // Rectangle layout - right side
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
                const position = index === 0 ? '1st' : index === 1 ? '2nd' : '3rd';
                const isWinner = index === 0;
                
                return {
                  type: 'div',
                  key: index,
                  props: {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      // Match leaderboard gradient style
                      background: isWinner 
                        ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.2) 100%)'
                        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                      border: isWinner ? '2px solid rgba(255, 215, 0, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)',
                      padding: '20px 30px',
                      borderRadius: '20px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                      backdropFilter: 'blur(10px)'
                    },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: '20px'
                          },
                          children: [
                            {
                              type: 'div',
                              props: {
                                style: {
                                  fontSize: '50px',
                                  fontWeight: 'bold',
                                  color: isWinner ? '#FFD700' : '#FFFFFF',
                                  textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
                                  minWidth: '80px'
                                },
                                children: position
                              }
                            },
                            {
                              type: 'div',
                              props: {
                                style: {
                                  fontSize: '48px',
                                  fontWeight: 'bold',
                                  color: isWinner ? '#FFFFFF' : '#FFFFFF',
                                  textShadow: '2px 2px 8px rgba(0,0,0,0.8)'
                                },
                                children: player.name
                              }
                            }
                          ]
                        }
                      },
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: '48px',
                            fontWeight: 'bold',
                            color: '#FFD700',
                            textShadow: '2px 2px 8px rgba(0,0,0,0.8)'
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
      width: dimensions.width,
      height: dimensions.height,
    });
    
    return await response.arrayBuffer();
  } catch (error) {
    console.error('❌ OG_WORKERS_OG_ERROR:', error);
    console.log('🔄 OG_FALLBACK_TO_SIMPLE_PNG');
    
    // Fallback: return the original base image without modifications
    console.log('✅ OG_FALLBACK_BASE_IMAGE_RETURNED');
    return baseImageBuffer;
  }
} 