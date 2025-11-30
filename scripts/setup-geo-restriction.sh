#!/bin/bash

# Geo-Restriction Setup Script
# This script helps you set up and configure the geo-restriction system

echo "🌍 Geo-Restriction Setup"
echo "========================"
echo ""

# Check if running in project directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from project root directory"
    exit 1
fi

echo "Step 1: Configuration"
echo "--------------------"
echo "Choose your restriction mode:"
echo "1) Allowlist (recommended) - Only allow specific countries"
echo "2) Blocklist - Block specific countries, allow all others"
read -p "Enter choice (1 or 2): " mode_choice

if [ "$mode_choice" = "1" ]; then
    restriction_mode="allowlist"
    echo "✅ Allowlist mode selected"
else
    restriction_mode="blocklist"
    echo "✅ Blocklist mode selected"
fi

echo ""
echo "Step 2: Security Options"
echo "-----------------------"
read -p "Block VPN/Proxy connections? (y/n): " block_vpn
read -p "Block TOR network? (y/n): " block_tor

echo ""
echo "Step 3: Deployment Method"
echo "------------------------"
echo "Choose your geo-detection method:"
echo "1) Cloudflare (recommended - fastest, most accurate, free)"
echo "2) ip-api.com (free tier - 45 req/min limit)"
echo "3) ipinfo.io (requires API token - 50k/month free)"
read -p "Enter choice (1-3): " detection_method

if [ "$detection_method" = "3" ]; then
    read -p "Enter your ipinfo.io API token: " ipinfo_token
fi

echo ""
echo "Step 4: Database Migration"
echo "-------------------------"
read -p "Create database table for logging? (y/n): " create_db

if [ "$create_db" = "y" ]; then
    echo "📝 Add the following to your drizzle/schema.ts:"
    echo ""
    cat drizzle/geo-restriction-schema.ts
    echo ""
    echo "Then run: npm run db:migrate"
fi

echo ""
echo "✅ Setup Complete!"
echo "================="
echo ""
echo "Configuration Summary:"
echo "- Mode: $restriction_mode"
echo "- Block VPN: $block_vpn"
echo "- Block TOR: $block_tor"
echo "- Detection: Method $detection_method"
echo ""
echo "Next Steps:"
echo "1. Edit src/lib/server/geo-restriction.ts to configure countries"
echo "2. Review GEO_RESTRICTION.md for detailed documentation"
echo "3. Test with VPN from different countries"
echo "4. Deploy behind Cloudflare (recommended)"
echo "5. Access admin panel at /admin/geo-settings"
echo ""
echo "Important URLs:"
echo "- Blocked page: /geo-blocked"
echo "- Admin settings: /admin/geo-settings"
echo "- Documentation: GEO_RESTRICTION.md"
echo ""
echo "Happy geo-restricting! 🌍"
