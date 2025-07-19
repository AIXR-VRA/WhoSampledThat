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
    
    // Remove existing Open Graph tags and replace with dynamic ones
    // Remove static OG tags
    html = html.replace(/<meta property="og:type"[^>]*>/gi, '');
    html = html.replace(/<meta property="og:url"[^>]*>/gi, '');
    html = html.replace(/<meta property="og:title"[^>]*>/gi, '');
    html = html.replace(/<meta property="og:description"[^>]*>/gi, '');
    html = html.replace(/<meta property="og:image"[^>]*>/gi, '');
    html = html.replace(/<meta property="og:image:alt"[^>]*>/gi, '');
    html = html.replace(/<meta property="og:image:width"[^>]*>/gi, '');
    html = html.replace(/<meta property="og:image:height"[^>]*>/gi, '');
    html = html.replace(/<meta property="og:site_name"[^>]*>/gi, '');
    html = html.replace(/<meta property="og:locale"[^>]*>/gi, '');
    
    // Remove static Twitter tags
    html = html.replace(/<meta property="twitter:card"[^>]*>/gi, '');
    html = html.replace(/<meta property="twitter:url"[^>]*>/gi, '');
    html = html.replace(/<meta property="twitter:title"[^>]*>/gi, '');
    html = html.replace(/<meta property="twitter:description"[^>]*>/gi, '');
    html = html.replace(/<meta property="twitter:image"[^>]*>/gi, '');
    html = html.replace(/<meta property="twitter:image:alt"[^>]*>/gi, '');
    html = html.replace(/<meta property="twitter:creator"[^>]*>/gi, '');
    html = html.replace(/<meta property="twitter:site"[^>]*>/gi, '');
    html = html.replace(/<meta name="twitter:card"[^>]*>/gi, '');
    html = html.replace(/<meta name="twitter:title"[^>]*>/gi, '');
    html = html.replace(/<meta name="twitter:description"[^>]*>/gi, '');
    html = html.replace(/<meta name="twitter:image"[^>]*>/gi, '');
    
    // Create the dynamic meta tags with correct dimensions for square image
    const dynamicMetaTags = `
    <!-- Dynamic Open Graph tags for this specific share -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${url.href}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:image:width" content="1080">
    <meta property="og:image:height" content="1080">
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
    
    // Always use square image format for better compatibility
    const baseImageName = 'social-share-card-base-square.png';
    
    console.log('🔍 OG_USING_SQUARE_FORMAT:', { baseImageName });
    console.log('📥 OG_FETCHING_BASE_IMAGE:', baseImageName);
    
    // Get the base image from assets
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
    const generatedImage = await generateShareImage(baseImageBuffer, scores);
    console.log('✅ OG_IMAGE_GENERATED:', generatedImage.byteLength, 'bytes');
    
    return new Response(generatedImage, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'X-Content-Type-Options': 'nosniff',
        'X-Generated-At': new Date().toISOString(),
        'X-Format-Used': 'square'
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
    console.log('🎨 OG_GENERATING_SQUARE_FORMAT');
    
    // Import the ImageResponse from workers-og (the correct library for Cloudflare Workers)
    const { ImageResponse } = await import('workers-og');
    
    // Convert base image to base64 for background
    const base64Image = `data:image/png;base64,${btoa(String.fromCharCode(...new Uint8Array(baseImageBuffer)))}`;
    
    // Create JSX component with square base image background and centered scores
    const jsx = {
      type: 'div',
      props: {
        style: {
          height: '1080px',
          width: '1080px',
          display: 'flex',
          position: 'relative',
          backgroundImage: `url(${base64Image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          fontFamily: 'Arial, sans-serif'
        },
        children: [
          // Centered scores container for square format
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: '700px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '40px'
              },
              children: scores.slice(0, 3).map((player, index) => {
                const medal = index === 0 ? '1st' : index === 1 ? '2nd' : '3rd';
                return {
                  type: 'div',
                  key: index,
                  props: {
                    style: {
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      padding: '30px',
                      borderRadius: '25px',
                      width: '100%'
                    },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: {
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '20px',
                            marginBottom: '15px'
                          },
                          children: [
                            {
                              type: 'div',
                              props: {
                                style: {
                                  fontSize: '70px'
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
                                  textShadow: '3px 3px 6px rgba(0,0,0,0.8)'
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
                            textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
                            textAlign: 'center'
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
      width: 1080,
      height: 1080,
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