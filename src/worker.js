export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Handle share image generation
    if (url.pathname === '/api/share-image') {
      return handleShareImage(request, env);
    }
    
    // Default to serving static assets
    return env.ASSETS.fetch(request);
  },
};

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