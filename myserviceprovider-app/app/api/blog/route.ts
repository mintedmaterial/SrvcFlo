import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Mock blog posts for local development
    const mockBlogPosts = [
      {
        id: 1,
        title: "Getting Started with AI Generation on Sonic",
        slug: "getting-started-ai-generation-sonic",
        excerpt: "Learn how to create stunning AI-generated content using our Web3-powered platform on the Sonic blockchain.",
        content: "Full blog post content here...",
        author: "ServiceFlow Team",
        publishedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        tags: ["tutorial", "ai", "sonic", "blockchain"],
        featured: true,
        imageUrl: "/blog/ai-generation-guide.jpg"
      },
      {
        id: 2,
        title: "Understanding NFT Staking and Voting Power",
        slug: "nft-staking-voting-power",
        excerpt: "Discover how staking your NFTs can give you voting power in our community-driven AI generation platform.",
        content: "Full blog post content here...",
        author: "Web3 Team",
        publishedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        tags: ["nft", "staking", "voting", "community"],
        featured: false,
        imageUrl: "/blog/nft-staking.jpg"
      },
      {
        id: 3,
        title: "The Future of Decentralized AI",
        slug: "future-decentralized-ai",
        excerpt: "Exploring the intersection of artificial intelligence and blockchain technology for the next generation of creative tools.",
        content: "Full blog post content here...",
        author: "Research Team",
        publishedAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        tags: ["ai", "blockchain", "future", "technology"],
        featured: true,
        imageUrl: "/blog/decentralized-ai.jpg"
      }
    ];

    return NextResponse.json({
      success: true,
      posts: mockBlogPosts,
      totalPosts: mockBlogPosts.length
    });
  } catch (error: any) {
    console.error('Blog API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}