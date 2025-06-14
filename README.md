﻿# chainTrack
 
ChainTrack: On-Chain Segment-Level Royalty System

Table of Contents

Introduction

Goals

Architecture Overview

Key Components

Platform Integrations

Revenue & Payout Flow

Data Flows

Smart Contracts

API specifications

Developer Setup

Deployment

Roadmap & Future Enhancements

Security Considerations

License & Disclaimer

Introduction

ChainTrack ensures creators are compensated fairly for any reuse of their videos—whether full uploads, clips, or live-stream highlights. It uses segment-level hashing, on-chain registries, and oracle reporting to automate detection and payout in stablecoins.

Goals

Fine-Grained Tracking: Detect usage at 5–10 second segments.

Immutable Ownership: Store metadata and royalty terms on-chain.

Automated Payouts: Oracle-driven reporting and stablecoin disbursement.

Live Stream Support: Real-time watermarking and chunking.

Cross-Platform: Integrate with YouTube, Facebook/Instagram, TikTok, Twitch, and web-based clips.

Architecture Overview

flowchart TD
  subgraph Registration
    UI[Creator UI]
    UI --> IPFS[IPFS metadata]
    IPFS --> Registry[ContentRegistry Contract]
  end
  subgraph Fingerprinting
    Registry --> Chunk[Chunking Service]
    Chunk --> Index[Elasticsearch Index]
  end
  subgraph Integrations
    Facebook[Facebook/IG API]
    TikTok[TikTok Webhook]
    YouTube[YouTube API]
    Twitch[Twitch VOD API]
    Scrapers[Web Scrapers]
    Facebook --> Match[Matching Engine]
    TikTok --> Match
    YouTube --> Match
    Twitch --> Match
    Scrapers --> Match
  end
  Index --> Match
  Match --> Proof[Generate & Pin Proof to IPFS]
  Proof --> Oracle[Oracle Bridge]
  Oracle --> Engine[RoyaltyEngine Contract]
  Engine --> Dashboard[Frontend Dashboard]

Key Components

Content Registration: API to upload metadata, set royalty BPS, mint on-chain ID.

Chunking Service: Slice videos into overlapping segments, compute audio/video hashes.

Matching Engine: Ingests platform clips/VODs, compares segment hashes, identifies matches.

Proof Storage: Assemble match details into JSON proofs; pin to IPFS.

Oracle Bridge: Batches proofs and calls reportUsage() on-chain.

Smart Contracts: ContentRegistry (registration) and RoyaltyEngine (usage reporting & payouts).

Frontend Dashboard: Visualize matches, track earnings, and claim payouts.

Platform Integrations

Facebook/Instagram Rights Manager

Upload reference content via API.

Configure match policies (block/monetize).

Poll match reports for clip URLs and view counts.

TikTok IP Protection

Register works and policies in IP portal.

Receive infringement webhooks with match timestamps.

YouTube Content ID: Fetch match reports from Partner API.

Twitch VOD: Download VODs post-stream and feed into matching pipeline.

Web Scrapers: Headless browser to detect clips on non-API platforms.

Revenue & Payout Flow

ChainTrack ingests revenue data from each integrated platform, transforms it into on‑chain proofs, and automates payouts as follows:

Collect Platform Revenue Data

YouTube: After matching clips, call the YouTube Analytics API (reports.query) with metrics=estimatedRevenue,views scoped to the matched hostVideoID and time window. Retrieve estimatedRevenue in currency units and attach to proof.

Facebook/Instagram: Poll the Graph API endpoint /{video-id}/insights with metrics total_video_impressions, total_video_views, and total_video_ad_revenue. Use the returned ad_revenue metric to compute platform earnings for the matched segments.

TikTok: Use the Creator or Marketing API (when accessible) to fetch play_count and creator_fund_earnings for the clip. If API data is unavailable, estimate revenue with a configurable CPM rate (e.g., $2 per 1,000 views) multiplied by the clip’s views.

Twitch VOD: Query the Twitch Video API (GET /videos) to get view_count and apply known subscription/ad revenue share rates for VOD views in the matched timeframe.

Web Scrapers (Other Platforms): For platforms without APIs, estimate revenue by scraping public view counts and applying a standard CPM or average ad rate defined in system configs.

Generate & Pin Proof JSON

Assemble proof objects containing:

{
  "videoId": 42,
  "platform": "YouTube",
  "hostVideoURL": "https://youtu.be/...",
  "matchedSpans": [{"start":30,"end":45}],
  "matchedSeconds": 15,
  "revenueAmount": 1.23
}

Pin the JSON to IPFS → proofCID.

Oracle Reporting

Batch multiple proofCID submissions and call the reportUsage(videoId, proofCID, revenueAmount, matchedSeconds) function on the RoyaltyEngine contract.

On-Chain Aggregation

The RoyaltyEngine multiplies each revenueAmount by the creator’s on-chain royaltyBps to compute their share.

Fund Treasury

Platform partners or an escrow account deposit ERC‑20 tokens (e.g., USDC) into the RoyaltyEngine contract in advance or per-report basis.

Claim Payout

Creators view their pending balance in the Dashboard and call claimPayout(videoId) to withdraw accrued tokens directly to their wallet.

Audit Trail

All proofs (pinned JSON) and reportUsage transactions are permanent and transparent on-chain, allowing creators or auditors to verify each match and payout.

Data Flows

Registration: UI → API → IPFS → ContentRegistry → Chunking

Matching: Platforms & scrapers → Matching Engine → Proof Storage

Reporting: Proofs → Oracle → RoyaltyEngine

Payouts: Aggregated on-chain → Dashboard → Creator wallets
