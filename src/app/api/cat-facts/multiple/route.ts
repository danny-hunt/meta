import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '3');
    
    // In a real implementation, this would call your backend service
    // that uses the cat-facts MCP server via dedalus-labs
    // For now, we'll return demo facts
    
    const demoFacts = [
      "Cats have been companions to humans for over 4,000 years! 🐱",
      "A group of cats is called a 'clowder' 🐾",
      "Cats spend 70% of their lives sleeping 😴",
      "A cat's purr vibrates at 20-140 Hz, which can help heal bones! 🦴",
      "Cats have over 30 muscles controlling their ears 👂",
      "A cat's nose print is unique, just like human fingerprints 🔍",
      "Cats can rotate their ears 180 degrees 🔄",
      "The oldest known pet cat existed 9,500 years ago 🏺",
      "Cats have a third eyelid called a 'nictitating membrane' 👁️",
      "A cat's heart beats twice as fast as a human's 💓",
      "Cats can jump up to 6 times their body length 🦘",
      "A cat's whiskers are roughly as wide as their body 🐭",
      "Cats have a specialized collarbone that allows them to always land on their feet 🦴",
      "The richest cat in the world inherited $13 million from its owner 💰",
      "Cats can make over 100 different sounds 🎵"
    ];
    
    // Shuffle and take the requested number of facts
    const shuffled = [...demoFacts].sort(() => 0.5 - Math.random());
    const selectedFacts = shuffled.slice(0, Math.min(limit, demoFacts.length));
    
    return NextResponse.json({ 
      facts: selectedFacts,
      count: selectedFacts.length,
      source: 'demo',
      note: 'These are demo facts. In production, these would come from the cat-facts MCP server.'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch cat facts' },
      { status: 500 }
    );
  }
}