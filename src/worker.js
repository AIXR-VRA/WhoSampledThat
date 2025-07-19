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
  // Simple, reliable SVG composition with your base image
  const base64Image = Buffer.from(baseImageBuffer).toString('base64');
  
  const svgImage = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Your base image -->
    <image x="0" y="0" width="1200" height="630" href="data:image/png;base64,${base64Image}" />
    
    <!-- Scores overlaid in the red safe zone (right side) -->
    ${scores.slice(0, 3).map((player, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
      const x = 890; // Center of safe zone (580 + 620/2)
      const startY = 200;
      const y = startY + (index * 100);
      
      return `
        <text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="36" font-weight="bold" 
              fill="white" text-anchor="middle" 
              stroke="black" stroke-width="2">${medal} ${player.name}</text>
        <text x="${x}" y="${y + 40}" font-family="Arial, sans-serif" font-size="28" font-weight="bold" 
              fill="#FFD700" text-anchor="middle" 
              stroke="black" stroke-width="2">${player.score} pts</text>
      `;
    }).join('')}
  </svg>`;

  return new Response(svgImage, {
    headers: { 
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600'
    }
  }).arrayBuffer();
} 