import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // In a real implementation, this would call your backend service
    // that uses the cat-facts MCP server via dedalus-labs
    // For now, we'll return a demo fact
    
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
      "A cat's heart beats twice as fast as a human's 💓"
    ];
    
    const randomFact = demoFacts[Math.floor(Math.random() * demoFacts.length)];
    
    return NextResponse.json({ 
      fact: randomFact,
      source: 'demo',
      note: 'This is a demo fact. In production, this would come from the cat-facts MCP server.'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch cat fact' },
      { status: 500 }
    );
  }
}