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
    
    // Detect platform and choose appropriate image format
    const userAgent = request.headers.get('User-Agent');
    const useSquare = prefersPlatformSquareImage(userAgent);
    const baseImageName = useSquare ? 'social-share-card-base-square.png' : 'social-share-card-base.png';
    
    console.log('OG Generator: Platform detection:', { userAgent, useSquare, baseImageName });
    
    // Get the base image - we'll fetch it from the main domain
    const baseImageUrl = `${url.protocol}//${url.hostname}/${baseImageName}`;
    console.log('OG Generator: Fetching base image from:', baseImageUrl);
    
    const baseImageResponse = await fetch(baseImageUrl);
    
    if (!baseImageResponse.ok) {
      console.error('OG Generator: Base image not found at:', baseImageUrl);
      return new Response('Base image not found', { status: 404 });
    }
    
    const baseImageBuffer = await baseImageResponse.arrayBuffer();
    console.log('OG Generator: Base image fetched, size:', baseImageBuffer.byteLength, 'bytes');
    
    // Generate the dynamic image with scores
    const generatedImage = await generateShareImage(baseImageBuffer, scores, useSquare);
    console.log('OG Generator: Image generated successfully');
    
    return new Response(generatedImage, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'X-Content-Type-Options': 'nosniff',
        'X-Worker-Type': 'og-generator',
        'X-Format-Used': useSquare ? 'square' : 'rectangle'
      }
    });
    
  } catch (error) {
    console.error('OG Generator: Critical error generating image:', error);
    console.error('OG Generator: Error stack:', error.stack);
    
    // Return fallback error message
    const dimensions = { width: 1080, height: 1080 }; // Default to square
    const errorSvg = `
      <svg width="${dimensions.width}" height="${dimensions.height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${dimensions.width}" height="${dimensions.height}" fill="#1f2937"/>
        <text x="${dimensions.width/2}" y="${dimensions.height/2 - 25}" font-family="Arial" font-size="36" fill="white" text-anchor="middle">OG Image Generation Error</text>
        <text x="${dimensions.width/2}" y="${dimensions.height/2 + 25}" font-family="Arial" font-size="24" fill="#9CA3AF" text-anchor="middle">Please check worker logs</text>
      </svg>
    `;
    
    return new Response(errorSvg, {
      headers: { 'Content-Type': 'image/svg+xml' },
      status: 500
    });
  }
}

async function generateShareImage(baseImageBuffer, scores, useSquare = false) {
  try {
    console.log('OG Generator: Starting image generation with workers-og, format:', useSquare ? 'square' : 'rectangle');
    
    // Import the ImageResponse from workers-og (the correct library for Cloudflare Workers)
    const { ImageResponse } = await import('workers-og');
    
    // Convert base image to base64 for background
    const base64Image = `data:image/png;base64,${btoa(String.fromCharCode(...new Uint8Array(baseImageBuffer)))}`;
    console.log('OG Generator: Base image converted to base64, length:', base64Image.length);
    
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

    console.log('OG Generator: JSX structure created, generating image...');

    // Generate the image using ImageResponse from workers-og
    const response = new ImageResponse(jsx, {
      width: dimensions.width,
      height: dimensions.height,
    });
    
    const arrayBuffer = await response.arrayBuffer();
    console.log('OG Generator: Image generated successfully, size:', arrayBuffer.byteLength, 'bytes');
    
    return arrayBuffer;
    } catch (error) {
    console.error('OG Generator: Error in generateShareImage:', error);
    console.error('OG Generator: Falling back to base image');
    
    // Fallback: return the original base image without modifications
    return baseImageBuffer;
  }
} 