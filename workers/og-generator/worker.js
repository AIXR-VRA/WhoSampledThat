// Dedicated OG Image Generator Worker for "Who Sampled That?"
// This worker ONLY handles OG image generation for better logging and monitoring

export default {
  async fetch(request, env) {
    console.log('OG Generator Worker: Request received', request.url);
    
    const url = new URL(request.url);
    
    // Only handle OG image generation requests
    if (url.pathname.startsWith('/api/og-image/')) {
      return handleOgImageGeneration(request, env);
    }
    
    return new Response('Not Found - This worker only handles OG image generation', { status: 404 });
  },
};

// Decode share ID back to score data
function decodeShareId(shareId) {
  try {
    console.log('OG Generator: Decoding share ID:', shareId);
    
    // Reverse the URL-safe base64 encoding
    const base64 = shareId.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    
    // Decode from base64
    const decoded = atob(padded);
    console.log('OG Generator: Decoded string:', decoded);
    
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
    
    console.log('OG Generator: Parsed scores:', result);
    return result;
  } catch (error) {
    console.error('OG Generator: Error decoding share ID:', error);
    return null;
  }
}

async function handleOgImageGeneration(request, env) {
  try {
    console.log('OG Generator: Starting image generation process');
    
    const url = new URL(request.url);
    const shareId = url.pathname.split('/api/og-image/')[1];
    
    if (!shareId) {
      console.error('OG Generator: Missing share ID');
      return new Response('Missing share ID', { status: 400 });
    }
    
    const scores = decodeShareId(shareId);
    if (!scores) {
      console.error('OG Generator: Invalid share ID:', shareId);
      return new Response('Invalid share ID', { status: 400 });
    }
    
    console.log('OG Generator: Successfully decoded scores for', scores.length, 'players');
    
    // Get the base image - we'll fetch it from the main domain
    const baseImageUrl = `${url.protocol}//${url.hostname}/social-share-card-base.png`;
    console.log('OG Generator: Fetching base image from:', baseImageUrl);
    
    const baseImageResponse = await fetch(baseImageUrl);
    
    if (!baseImageResponse.ok) {
      console.error('OG Generator: Base image not found at:', baseImageUrl);
      return new Response('Base image not found', { status: 404 });
    }
    
    const baseImageBuffer = await baseImageResponse.arrayBuffer();
    console.log('OG Generator: Base image fetched, size:', baseImageBuffer.byteLength, 'bytes');
    
    // Generate the dynamic image with scores
    const generatedImage = await generateShareImage(baseImageBuffer, scores);
    console.log('OG Generator: Image generated successfully');
    
    return new Response(generatedImage, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'X-Content-Type-Options': 'nosniff',
        'X-Worker-Type': 'og-generator'
      }
    });
    
  } catch (error) {
    console.error('OG Generator: Critical error generating image:', error);
    console.error('OG Generator: Error stack:', error.stack);
    
    // Return fallback SVG with error info
    const errorSvg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <rect width="1200" height="630" fill="#1f2937"/>
        <text x="600" y="300" font-family="Arial" font-size="36" fill="white" text-anchor="middle">OG Image Generation Error</text>
        <text x="600" y="350" font-family="Arial" font-size="24" fill="#9CA3AF" text-anchor="middle">Please check worker logs</text>
      </svg>
    `;
    
    return new Response(errorSvg, {
      headers: { 'Content-Type': 'image/svg+xml' },
      status: 500
    });
  }
}

async function generateShareImage(baseImageBuffer, scores) {
  try {
    console.log('OG Generator: Starting image generation with workers-og');
    
    // Import the ImageResponse from workers-og (the correct library for Cloudflare Workers)
    const { ImageResponse } = await import('workers-og');
    
    // Convert base image to base64 for background
    const base64Image = `data:image/png;base64,${btoa(String.fromCharCode(...new Uint8Array(baseImageBuffer)))}`;
    console.log('OG Generator: Base image converted to base64, length:', base64Image.length);
    
    // Create JSX component with base image background and scores in safe zone
    const jsx = {
      type: 'div',
      props: {
        style: {
          height: '630px',
          width: '1200px',
          display: 'flex',
          position: 'relative',
          backgroundImage: `url(${base64Image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          fontFamily: 'Arial, sans-serif'
        },
        children: [
          // Safe zone container (right side red area)
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                right: '50px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '500px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '30px'
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
                      padding: '20px',
                      borderRadius: '15px',
                      width: '100%'
                    },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: '48px',
                            marginBottom: '5px'
                          },
                          children: medal
                        }
                      },
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: '36px',
                            fontWeight: 'bold',
                            color: '#FFFFFF',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                            marginBottom: '5px'
                          },
                          children: player.name
                        }
                      },
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: '28px',
                            fontWeight: 'bold',
                            color: '#FFD700',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
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

    console.log('OG Generator: JSX structure created, generating image...');

    // Generate the image using ImageResponse from workers-og
    const response = new ImageResponse(jsx, {
      width: 1200,
      height: 630,
    });
    
    const arrayBuffer = await response.arrayBuffer();
    console.log('OG Generator: Image generated successfully, size:', arrayBuffer.byteLength, 'bytes');
    
    return arrayBuffer;
  } catch (error) {
    console.error('OG Generator: Error in generateShareImage:', error);
    console.error('OG Generator: Falling back to SVG');
    
    // Fallback: return a clean SVG with the actual base image background
    const fallbackSvg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="baseImage" patternUnits="userSpaceOnUse" width="1200" height="630">
            <image href="data:image/png;base64,${btoa(String.fromCharCode(...new Uint8Array(baseImageBuffer)))}" x="0" y="0" width="1200" height="630"/>
          </pattern>
        </defs>
        <rect width="1200" height="630" fill="url(#baseImage)"/>
        
        <!-- Safe zone scores -->
        <g transform="translate(950, 315)">
          ${scores.slice(0, 3).map((player, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
            const y = (index - 1) * 100; // Center around 0
            return `
              <g transform="translate(0, ${y})">
                <rect x="-200" y="-35" width="400" height="70" fill="rgba(0, 0, 0, 0.5)" rx="15"/>
                <text x="0" y="-10" font-family="Arial" font-size="32" fill="white" text-anchor="middle" font-weight="bold">${medal} ${player.name}</text>
                <text x="0" y="20" font-family="Arial" font-size="24" fill="#FFD700" text-anchor="middle" font-weight="bold">${player.score} pts</text>
              </g>
            `;
          }).join('')}
        </g>
      </svg>
    `;
    
    return new Response(fallbackSvg, {
      headers: { 'Content-Type': 'image/svg+xml' }
    }).arrayBuffer();
  }
} 