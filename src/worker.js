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
    // Use Cloudflare's native image transformation to overlay text on the base image
    // First, let's create an SVG overlay with just the scores
    const svgOverlay = `
      <svg width="620" height="630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            .score-text { 
              font-family: Arial, sans-serif; 
              font-weight: bold; 
              text-anchor: middle;
              fill: white;
              paint-order: stroke fill;
              stroke: rgba(0,0,0,0.8);
              stroke-width: 2px;
            }
            .score-number { 
              font-family: Arial, sans-serif; 
              font-weight: bold; 
              text-anchor: middle;
              fill: #FFD700;
              paint-order: stroke fill;
              stroke: rgba(0,0,0,0.8);
              stroke-width: 2px;
            }
          </style>
        </defs>
        ${scores.slice(0, 3).map((player, index) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
          const y = 200 + (index * 100);
          return `
            <text x="310" y="${y}" font-size="36" class="score-text">${medal} ${player.name}</text>
            <text x="310" y="${y + 35}" font-size="28" class="score-number">${player.score} pts</text>
          `;
        }).join('')}
      </svg>
    `;

    // Convert SVG to a data URL
    const svgDataUrl = `data:image/svg+xml;base64,${btoa(svgOverlay)}`;
    
    // Use Cloudflare Images transformation to composite the overlay onto the base image
    const response = await fetch(svgDataUrl, {
      cf: {
        image: {
          // First create a background from our base image (we'll serve it from a temporary URL)
          draw: [{
            url: `data:image/png;base64,${Buffer.from(baseImageBuffer).toString('base64')}`,
            fit: 'cover',
            width: 1200,
            height: 630
          }],
          width: 1200,
          height: 630,
          format: 'png'
        }
      }
    });

    if (response.ok) {
      return await response.arrayBuffer();
    } else {
      throw new Error('Image transformation failed');
    }
    
  } catch (error) {
    console.error('Error generating image with Cloudflare Images:', error);
    
    // Fallback: Composite using a different approach - create a new image entirely
    try {
      // Create a canvas-style approach using SVG that includes the background
      const compositeSvg = `
        <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
          <defs>
            <style>
              .score-text { 
                font-family: Arial, sans-serif; 
                font-weight: bold; 
                text-anchor: middle;
                fill: white;
                paint-order: stroke fill;
                stroke: rgba(0,0,0,0.8);
                stroke-width: 3px;
                stroke-linejoin: round;
              }
              .score-number { 
                font-family: Arial, sans-serif; 
                font-weight: bold; 
                text-anchor: middle;
                fill: #FFD700;
                paint-order: stroke fill;
                stroke: rgba(0,0,0,0.8);
                stroke-width: 3px;
                stroke-linejoin: round;
              }
            </style>
          </defs>
          
          <!-- Background image (base64 embedded) -->
          <image x="0" y="0" width="1200" height="630" 
                 xlink:href="data:image/png;base64,${Buffer.from(baseImageBuffer).toString('base64')}" />
          
          <!-- Safe zone overlay (right side) -->
          <g transform="translate(580, 0)">
            <!-- Semi-transparent background for better text readability -->
            <rect x="0" y="0" width="620" height="630" fill="rgba(255,0,0,0.1)" />
            
            <!-- Score text positioned in safe zone -->
            ${scores.slice(0, 3).map((player, index) => {
              const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
              const y = 200 + (index * 120);
              return `
                <text x="310" y="${y}" font-size="42" class="score-text">${medal} ${player.name}</text>
                <text x="310" y="${y + 45}" font-size="32" class="score-number">${player.score} pts</text>
              `;
            }).join('')}
          </g>
        </svg>
      `;
      
      return new Response(compositeSvg, {
        headers: { 'Content-Type': 'image/svg+xml' }
      }).arrayBuffer();
      
    } catch (finalError) {
      console.error('Final fallback failed:', finalError);
      
      // Ultimate fallback - simple text-based SVG
      const simpleSvg = `
        <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
          <rect width="1200" height="630" fill="#1f2937"/>
          <text x="600" y="150" font-family="Arial" font-size="48" fill="white" text-anchor="middle" font-weight="bold">🎵 Who Sampled That? 🎵</text>
          <text x="600" y="220" font-family="Arial" font-size="36" fill="#FFD700" text-anchor="middle" font-weight="bold">FINAL SCORES! 🏆</text>
          ${scores.slice(0, 3).map((player, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
            const y = 320 + (index * 80);
            return `<text x="600" y="${y}" font-family="Arial" font-size="32" fill="white" text-anchor="middle" font-weight="bold">${medal} ${player.name}: ${player.score} pts</text>`;
          }).join('')}
          <text x="600" y="580" font-family="Arial" font-size="24" fill="#9CA3AF" text-anchor="middle">Play at whosampledthat.com</text>
        </svg>
      `;
      
      return new Response(simpleSvg, {
        headers: { 'Content-Type': 'image/svg+xml' }
      }).arrayBuffer();
    }
  }
} 