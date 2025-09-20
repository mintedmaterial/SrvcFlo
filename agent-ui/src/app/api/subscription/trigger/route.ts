import { NextRequest, NextResponse } from 'next/server';
import { tasks } from "@trigger.dev/sdk/v3";
import {
  processSubscriptionRenewal,
  sendExpirationReminder,
  sendUsageAlert,
  processExpiredSubscription
} from '../../../../../trigger/subscription-tasks';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, payload } = body;

    if (!action || !payload) {
      return NextResponse.json(
        { error: 'Missing action or payload' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'process-renewal':
        result = await processSubscriptionRenewal.trigger(payload);
        break;

      case 'send-expiration-reminder':
        result = await sendExpirationReminder.trigger(payload);
        break;

      case 'send-usage-alert':
        result = await sendUsageAlert.trigger(payload);
        break;

      case 'process-expired':
        result = await processExpiredSubscription.trigger(payload);
        break;

      case 'trigger-monitoring':
        // Manually trigger subscription monitoring
        const { monitorSubscriptions } = await import('../../../../../trigger/subscription-tasks');
        result = await monitorSubscriptions.trigger({
          contractAddress: process.env.SUBSCRIPTION_CONTRACT_ADDRESS || "0x742d35Cc6635C0532925a3b8D140C1d23cC09B8E",
          rpcUrl: process.env.SONIC_RPC_URL || "https://rpc.soniclabs.com"
        });
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      taskId: result.id,
      status: result.status,
      payload: result.payload
    });

  } catch (error) {
    console.error('Subscription trigger error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { error: 'Missing taskId parameter' },
        { status: 400 }
      );
    }

    // Get task status from Trigger.dev
    const runs = await tasks.list({
      limit: 1,
      taskIdentifier: taskId
    });

    if (runs.data.length === 0) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    const task = runs.data[0];

    return NextResponse.json({
      success: true,
      task: {
        id: task.id,
        status: task.status,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        output: task.output,
        error: task.error
      }
    });

  } catch (error) {
    console.error('Task status error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}