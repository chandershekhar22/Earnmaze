import { json } from '@sveltejs/kit';

export async function GET() {
	try {
		// Return mock rewards data
		const mockRewards = [
			{
				id: '1',
				title: '$5 Amazon Gift Card',
				description: 'Redeem your points for a $5 Amazon gift card to shop for anything you want.',
				pointsCost: 500,
				originalPrice: 5,
				emoji: '🛒',
				stock: 25
			},
			{
				id: '2',
				title: '$10 Starbucks Gift Card',
				description: 'Enjoy your favorite coffee and treats with a $10 Starbucks gift card.',
				pointsCost: 1000,
				originalPrice: 10,
				emoji: '☕',
				stock: 15
			},
			{
				id: '3',
				title: '$25 Visa Gift Card',
				description: 'Use anywhere Visa is accepted with this flexible $25 gift card.',
				pointsCost: 2500,
				originalPrice: 25,
				emoji: '💳',
				stock: 8
			},
			{
				id: '4',
				title: 'Netflix 1-Month Subscription',
				description: 'Enjoy unlimited streaming with a 1-month Netflix subscription.',
				pointsCost: 1500,
				originalPrice: 15.99,
				emoji: '🎬',
				stock: 12
			},
			{
				id: '5',
				title: '$50 PayPal Cash',
				description: 'Get $50 directly to your PayPal account for maximum flexibility.',
				pointsCost: 5000,
				originalPrice: 50,
				emoji: '💰',
				stock: 5
			},
			{
				id: '6',
				title: 'Spotify Premium 3-Month',
				description: 'Enjoy ad-free music with 3 months of Spotify Premium.',
				pointsCost: 3000,
				originalPrice: 29.97,
				emoji: '🎵',
				stock: 10
			}
		];

		return json(mockRewards);
	} catch (error) {
		console.error('Rewards API error:', error);
		return json({ error: 'Failed to fetch rewards' }, { status: 500 });
	}
}

export async function POST({ request }) {
	try {
		const { rewardId } = await request.json();
		
		// In a real implementation, you would:
		// 1. Verify user authentication
		// 2. Check if user has enough points
		// 3. Deduct points from user account
		// 4. Create reward redemption record
		// 5. Send confirmation email
		
		// Mock successful redemption
		return json({ success: true, message: 'Reward redeemed successfully!' });
	} catch (error) {
		console.error('Reward redemption error:', error);
		return json({ error: 'Failed to redeem reward' }, { status: 500 });
	}
}
