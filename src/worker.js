export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Handle share page with dynamic meta tags
    if (url.pathname === '/share') {
      return handleSharePage(request, env);
    }
    
    // Handle share image generation
    if (url.pathname === '/api/share-image') {
      return handleShareImage(request, env);
    }
    
    // Default to serving static assets
    return env.ASSETS.fetch(request);
  },
};

async function handleSharePage(request, env) {
  try {
    const url = new URL(request.url);
    const scoresParam = url.searchParams.get('scores');
    
    if (!scoresParam) {
      // No scores provided, redirect to main game
      return Response.redirect(url.origin, 302);
    }
    
    const scores = JSON.parse(decodeURIComponent(scoresParam));
    const imageUrl = `${url.origin}/api/share-image?scores=${scoresParam}`;
    
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
    const scoresParam = url.searchParams.get('scores');
    
    if (!scoresParam) {
      return new Response('Missing scores parameter', { status: 400 });
    }
    
    const scores = JSON.parse(decodeURIComponent(scoresParam));
    
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
  // Create canvas and load base image
  const canvas = new OffscreenCanvas(1200, 630); // Standard social media share size
  const ctx = canvas.getContext('2d');
  
  // Load base image
  const baseImage = await createImageBitmap(new Uint8Array(baseImageBuffer));
  
  // Draw base image
  ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
  
  // Safe zone positioning (right side red area)
  const safeZoneLeft = 580; // Start of safe zone
  const safeZoneWidth = 620; // Width of safe zone
  const safeZoneCenterX = safeZoneLeft + (safeZoneWidth / 2);
  
  // Set up text styling for title
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.font = 'bold 36px Arial, sans-serif';
  
  // Add title in safe zone
  ctx.fillText('FINAL SCORES! 🏆', safeZoneCenterX, 120);
  
  // Position for scores (starting in safe zone)
  let yPosition = 180;
  const lineHeight = 65;
  
  // Set font for scores
  ctx.font = 'bold 32px Arial, sans-serif';
  
  // Draw top 3 scores in safe zone
  scores.slice(0, 3).forEach((player, index) => {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
    const text = `${medal} ${player.name}`;
    const scoreText = `${player.score} pts`;
    
    // Player name with medal
    ctx.fillStyle = '#000000'; // Shadow
    ctx.fillText(text, safeZoneCenterX + 2, yPosition + 2);
    ctx.fillStyle = '#FFFFFF'; // Main text
    ctx.fillText(text, safeZoneCenterX, yPosition);
    
    // Score below name
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.fillStyle = '#FFD700'; // Gold color for score
    ctx.fillText(scoreText, safeZoneCenterX, yPosition + 28);
    
    // Reset font for next player
    ctx.font = 'bold 32px Arial, sans-serif';
    
    yPosition += lineHeight;
  });
  
  // Add play text at bottom of safe zone
  ctx.font = 'bold 20px Arial, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('Play at whosampledthat.com', safeZoneCenterX, canvas.height - 60);
  
  // Convert canvas to PNG
  const blob = await canvas.convertToBlob({ type: 'image/png' });
  return await blob.arrayBuffer();
} 