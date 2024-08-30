import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { Webhook } from 'svix';
import { internal } from './_generated/api';

// Define a simple interface for WebhookEvent if it is not found
type WebhookEvent = {
	type: string;
	data: {
		id: string;
		first_name: string;
		last_name: string;
		image_url: string;
		email_addresses: { email_address: string }[];
	};
};

const validatePayload = async (req: Request): Promise<WebhookEvent | undefined> => {
	const payload = await req.text();

	const svixHeaders = {
		'svix-id': req.headers.get('svix-id')!,
		'svix-timestamp': req.headers.get('svix-timestamp')!,
		'svix-signature': req.headers.get('svix-signature')!,
	};
	const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

	try {
		const event = webhook.verify(payload, svixHeaders) as WebhookEvent;
		return event;
	} catch (error) {
		console.log('Clerk webhook error, could not be verified');
		return undefined;
	}
};

const handleClerkWebhook = httpAction(async (ctx, req) => {
	const event = await validatePayload(req);

	if (!event) {
		return new Response('Invalid webhook', { status: 400 });
	}

	switch (event.type) {
		case 'user.created': {
			const user = await ctx.runQuery(internal.user.get, {
				clerkId: event.data.id,
			});

			if (user) {
				console.log(`Updating user ${event.data.id} with: ${event.data}`);
			}

			break;
		}
		case 'user.updated': {
			console.log('Creating/Updating User:', event.data.id);

			await ctx.runMutation(internal.user.create, {
				username: `${event.data.first_name} ${event.data.last_name}`,
				imageUrl: event.data.image_url,
				clerkId: event.data.id,
				email: event.data.email_addresses[0].email_address,
			});

			break;
		}
		default: {
			console.log('Clerk webhook event not supported', event.type);
			break;
		}
	}

	return new Response(null, { status: 200 });
});

// Create the router
const http = httpRouter();

// Define the route
http.route({
	path: '/clerk-users-webhook',
	method: 'POST',
	handler: handleClerkWebhook,
});

// Export the router as the default export
export default http;
