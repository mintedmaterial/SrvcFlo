# Creem Next.js Template

> A modern Next.js App Router template for integrating Creem subscriptions and payments with Prisma, Shadcn UI, Radix UI, and Tailwind.

<Frame>
  <img style={{ borderRadius: '0.75rem', width: '100%', maxHeight: '320px', objectFit: 'cover' }} src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/Screenshot%202025-05-02%20at%2018.43.31-Hli0OxqgtUupGAtzV8juwNU8qKfauI.png" alt="Creem Next.js Template Hero" />
</Frame>

<Tip>
  The Creem Next.js Template is open source and available on <a href="https://github.com/armitage-labs/creem-template" target="_blank">GitHub</a>.
  Use it for examples on how to integrate Creem with your Next.js App Router.
</Tip>

## Overview

<CardGroup cols={2}>
  <Card title="Modern Stack" icon="rocket">
    Next.js App Router, Prisma ORM, Shadcn UI, Radix UI, and Tailwind CSS.
  </Card>

  <Card title="Creem Integration" icon="credit-card">
    End-to-end subscription and payment flows powered by the Creem SDK.
  </Card>
</CardGroup>

<Accordion title="What you can do with it">
  How to use the Creem Next.js Template to:

  * Fetch and display products from your Creem account
  * Create checkout sessions for products
  * Fulfill orders and manage subscriptions
  * Handle webhooks and customer portal links
</Accordion>

***

## Quickstart

<Card title="1. Clone the repository" icon="github">
  ```bash
  git clone https://github.com/armitage-labs/creem-template.git
  cd creem-template
  ```
</Card>

<Card title="2. Install dependencies" icon="box-archive">
  ```bash
  yarn install
  # or
  npm install
  # or
  pnpm install
  ```
</Card>

<Card title="3. Set up environment variables" icon="gear">
  ```bash
  cp .env.example .env
  # Edit .env and fill in the required variables
  ```
</Card>

<Card title="4. Run database migrations" icon="database">
  ```bash
  yarn prisma migrate dev
  ```
</Card>

<Card title="5. Start the development server" icon="bolt">
  ```bash
  yarn dev
  ```
</Card>

<Card title="6. Expose your app for webhooks (optional)" icon="globe">
  To receive webhooks from Creem, use a reverse proxy like <a href="https://ngrok.com/" target="_blank">NGROK</a>.
</Card>

***

## Screenshots

<div className="space-y-16">
  <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
    <img src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/Screenshot%202025-05-02%20at%2018.43.48-yr5LHWkWEaq1fWsSUWAMXbe9OKqgo8.png" alt="Product Catalog Screenshot" class="rounded-xl shadow-2xl w-full md:w-3/4 md:max-w-2xl border border-gray-200 dark:border-gray-800" loading="lazy" width="900" height="500" />

    <div className="md:w-1/2">
      <h4 className="text-xl font-semibold mb-3">Interactive onboarding</h4>
      <p className="text-gray-600 dark:text-gray-300 text-lg">The template includes a step-by-step tutorial to help you get started and your account ready.</p>
    </div>
  </div>

  <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
    <img src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/Screenshot%202025-05-02%20at%2018.44.21-TKkVtUa8zr5AKIomBa5tyU1eFR9cUz.png" alt="Checkout Session Screenshot" class="rounded-xl shadow-2xl w-full md:w-3/4 md:max-w-2xl border border-gray-200 dark:border-gray-800" loading="lazy" width="900" height="500" />

    <div className="md:w-1/2">
      <h4 className="text-xl font-semibold mb-3">Product Catalog</h4>
      <p className="text-gray-600 dark:text-gray-300 text-lg">Allows you to test your products in a easy way, without having to manually set product IDs</p>
    </div>
  </div>

  <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
    <img src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/Screenshot%202025-05-02%20at%2018.44.26-CH2Mk61LZB9nz8pdibTFrUHrvrCMcx.png" alt="Customer Portal Screenshot" class="rounded-xl shadow-2xl w-full md:w-3/4 md:max-w-2xl border border-gray-200 dark:border-gray-800" loading="lazy" width="900" height="500" />

    <div className="md:w-1/2">
      <h4 className="text-xl font-semibold mb-3">Account Management</h4>
      <p className="text-gray-600 dark:text-gray-300 text-lg">Includes an account management page, to manage subscriptions, billing and customer portal links.</p>
    </div>
  </div>
</div>

***

## Features

<CardGroup cols={2}>
  <Card title="Product Catalog" icon="list">
    Fetch and display all products in your Creem account.
  </Card>

  <Card title="Checkout Sessions" icon="credit-card">
    Create checkout sessions for any product.
  </Card>

  <Card title="Subscription Management" icon="repeat">
    Handle creation, cancellation, and expiration of subscriptions.
  </Card>

  <Card title="Customer Portal" icon="user">
    Generate portal links for clients with active subscriptions.
  </Card>

  <Card title="Webhooks" icon="bell">
    Fulfill orders and update your app using Creem webhooks.
  </Card>

  <Card title="Auth" icon="lock">
    Minimal auth setup with BetterAuth.
  </Card>
</CardGroup>

***

## Technology Stack

<CardGroup cols={3}>
  <Card title="Next.js" icon="code">
    App Router, SSR, and React Server Components.
  </Card>

  <Card title="Prisma" icon="database">
    Type-safe ORM for database access (SQLite by default).
  </Card>

  <Card title="Creem SDK" icon="credit-card">
    Subscription and payment integration.
  </Card>

  <Card title="Shadcn UI" icon="palette">
    Accessible, beautiful React components.
  </Card>

  <Card title="Radix UI" icon="book">
    Low-level UI primitives for React.
  </Card>

  <Card title="Tailwind CSS" icon="paintbrush">
    Utility-first CSS for rapid UI development.
  </Card>
</CardGroup>

***

## Resources

<CardGroup>
  <Card title="GitHub Repository" icon="github" href="https://github.com/armitage-labs/creem-template">
    View the source code, open issues, or contribute.
  </Card>

  <Card title="Creem SDK Docs" icon="book" href="/sdk/typescript">
    Learn more about the Creem TypeScript SDK.
  </Card>

  <Card title="Next.js Documentation" icon="code" href="https://nextjs.org/docs">
    Official Next.js docs for routing, SSR, and more.
  </Card>

  <Card title="Prisma Documentation" icon="database" href="https://www.prisma.io/docs">
    ORM docs and guides.
  </Card>
</CardGroup>

***

<Tip>
  For feedback, feature requests, or to contribute, open an issue or pull request on the <a href="https://github.com/armitage-labs/creem-template" target="_blank">GitHub repository</a>.
</Tip>


# Introduction

> Use webhooks to notify your application about payment events."


## What is a webhook?

Creem uses webhooks to push real-time notifications to you about your payments and subscriptions. All webhooks use HTTPS and deliver a JSON payload that can be used by your application. You can use webhook feeds to do things like:

* Automatically enable access to a user after a successful payment
* Automatically remove access to a user after a canceled subscription
* Confirm that a payment has been received by the same customer that initiated it.

In case webhooks are not successfully received by your endpoint, creem automatically retries to send the request with a progressive backoff period of 30 seconds, 1 minute, 5 minutes and 1 hour.

## Steps to receive a webhook

You can start receiving real-time events in your app using the steps:

* Create a local endpoint to receive requests
* Register your development webhook endpoint on the Developers tab of the Creem dashboard
* Test that your webhook endpoint is working properly using the test environment
* Deploy your webhook endpoint to production
* Register your production webhook endpoint on Creem live dashboard

### 1. Create a local endpoint to receive requests

In your local application, create a new route that can accept POST requests.

For example, you can add an API route on Next.js:

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';

export default (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    const payload = req.body;
    console.log(payload);
    res.status(200);
  }
};
```

On receiving an event, you should respond with an HTTP 200 OK to signal to Creem that the event was successfully delivered.

### 2. Register your development webhook endpoint

Register your publicly accessible HTTPS URL in the Creem dashboard.

<Tip>
  You can create a tunnel to your localhost server using a tool like ngrok. For example: [https://8733-191-204-177-89.sa.ngrok.io/api/webhooks](https://8733-191-204-177-89.sa.ngrok.io/api/webhooks)
</Tip>

<img style={{ borderRadius: '0.5rem' }} src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/test-webhook-yBodvIWasxCmgr4bYqZJBlWg8qbUD2.png" />

### 3. Test that your webhook endpoint is working properly

Create a few test payments to check that your webhook endpoint is receiving the events.

### 4. Deploy your webhook endpoint

After you’re done testing, deploy your webhook endpoint to production.

### 5. Register your production webhook endpoint

Once your webhook endpoint is deployed to production, you can register it in the Creem dashboard.


# Event Types

> List of supported event types and their payloads.

## checkout.completed

A checkout session was completed, returning all the information about the payment and the order created.

<AccordionGroup>
  <Accordion title="Sample Request Body">
    ```json
    {
      "id": "evt_5WHHcZPv7VS0YUsberIuOz",
      "eventType": "checkout.completed",
      "created_at": 1728734325927,
      "object": {
        "id": "ch_4l0N34kxo16AhRKUHFUuXr",
        "object": "checkout",
        "request_id": "my-request-id",
        "order": {
          "id": "ord_4aDwWXjMLpes4Kj4XqNnUA",
          "customer": "cust_1OcIK1GEuVvXZwD19tjq2z",
          "product": "prod_d1AY2Sadk9YAvLI0pj97f",
          "amount": 1000,
          "currency": "EUR",
          "status": "paid",
          "type": "recurring",
          "created_at": "2024-10-12T11:58:33.097Z",
          "updated_at": "2024-10-12T11:58:33.097Z",
          "mode": "local"
        },
        "product": {
          "id": "prod_d1AY2Sadk9YAvLI0pj97f",
          "name": "Monthly",
          "description": "Monthly",
          "image_url": null,
          "price": 1000,
          "currency": "EUR",
          "billing_type": "recurring",
          "billing_period": "every-month",
          "status": "active",
          "tax_mode": "exclusive",
          "tax_category": "saas",
          "default_success_url": "",
          "created_at": "2024-10-11T11:50:00.182Z",
          "updated_at": "2024-10-11T11:50:00.182Z",
          "mode": "local"
        },
        "customer": {
          "id": "cust_1OcIK1GEuVvXZwD19tjq2z",
          "object": "customer",
          "email": "text@example.com",
          "name": "Tester Test",
          "country": "NL",
          "created_at": "2024-10-11T09:16:48.557Z",
          "updated_at": "2024-10-11T09:16:48.557Z",
          "mode": "local"
        },
        "subscription": {
          "id": "sub_6pC2lNB6joCRQIZ1aMrTpi",
          "object": "subscription",
          "product": "prod_d1AY2Sadk9YAvLI0pj97f",
          "customer": "cust_1OcIK1GEuVvXZwD19tjq2z",
          "collection_method": "charge_automatically",
          "status": "active",
          "canceled_at": null,
          "created_at": "2024-10-12T11:58:45.425Z",
          "updated_at": "2024-10-12T11:58:45.425Z",
          "metadata": {
            "custom_data": "mycustom data",
            "internal_customer_id": "internal_customer_id"
          },
          "mode": "local"
        },
        "custom_fields": [],
        "status": "completed",
        "metadata": {
          "custom_data": "mycustom data",
          "internal_customer_id": "internal_customer_id"
        },
        "mode": "local"
      }
    }
    ```
  </Accordion>
</AccordionGroup>

## subscription.active

Received when a new subscription is created, the payment was successful and Creem collected the payment creating a new subscription object in your account.
Use only for synchronization, we encourage using `subscription.paid` for activating access.

<AccordionGroup>
  <Accordion title="Sample Request Body">
    ```json
    {
      "id": "evt_6EptlmjazyGhEPiNQ5f4lz",
      "eventType": "subscription.active",
      "created_at": 1728734325927,
      "object": {
          "id": "sub_21lfZb67szyvMiXnm6SVi0",
          "object": "subscription",
          "product": {
              "id": "prod_AnVJ11ujp7x953ARpJvAF",
              "name": "My Product - Product 01",
              "description": "Test my product",
              "image_url": null,
              "price": 10000,
              "currency": "EUR",
              "billing_type": "recurring",
              "billing_period": "every-month",
              "status": "active",
              "tax_mode": "inclusive",
              "tax_category": "saas",
              "default_success_url": "",
              "created_at": "2024-09-16T16:12:09.813Z",
              "updated_at": "2024-09-16T16:12:09.813Z",
              "mode": "local"
          },
          "customer": {
              "id": "cust_3biFPNt4Cz5YRDSdIqs7kc",
              "object": "customer",
              "email": "text@example.com",
              "name": "Tester Test",
              "country": "SE",
              "created_at": "2024-09-16T16:13:39.265Z",
              "updated_at": "2024-09-16T16:13:39.265Z",
              "mode": "local"
          },
          "collection_method": "charge_automatically",
          "status": "active",
          "canceled_at": "2024-09-16T19:40:41.984Z",
          "created_at": "2024-09-16T19:40:41.984Z",
          "updated_at": "2024-09-16T19:40:42.121Z",
          "mode": "local"
      }
    }
    ```
  </Accordion>
</AccordionGroup>

## subscription.paid

A subscription transaction was paid by the customer

<AccordionGroup>
  <Accordion title="Sample Request Body">
    ```json
    {
      "id": "evt_21mO1jWmU2QHe7u2oFV7y1",
      "eventType": "subscription.paid",
      "created_at": 1728734327355,
      "object": {
        "id": "sub_6pC2lNB6joCRQIZ1aMrTpi",
        "object": "subscription",
        "product": {
          "id": "prod_d1AY2Sadk9YAvLI0pj97f",
          "name": "Monthly",
          "description": "Monthly",
          "image_url": null,
          "price": 1000,
          "currency": "EUR",
          "billing_type": "recurring",
          "billing_period": "every-month",
          "status": "active",
          "tax_mode": "exclusive",
          "tax_category": "saas",
          "default_success_url": "",
          "created_at": "2024-10-11T11:50:00.182Z",
          "updated_at": "2024-10-11T11:50:00.182Z",
          "mode": "local"
        },
        "customer": {
          "id": "cust_1OcIK1GEuVvXZwD19tjq2z",
          "object": "customer",
          "email": "text@example.com",
          "name": "Tester Test",
          "country": "NL",
          "created_at": "2024-10-11T09:16:48.557Z",
          "updated_at": "2024-10-11T09:16:48.557Z",
          "mode": "local"
        },
        "collection_method": "charge_automatically",
        "status": "active",
        "last_transaction_id": "tran_5yMaWzAl3jxuGJMCOrYWwk",
        "last_transaction_date": "2024-10-12T11:58:47.109Z",
        "next_transaction_date": "2024-11-12T11:58:38.000Z",
        "current_period_start_date": "2024-10-12T11:58:38.000Z",
        "current_period_end_date": "2024-11-12T11:58:38.000Z",
        "canceled_at": null,
        "created_at": "2024-10-12T11:58:45.425Z",
        "updated_at": "2024-10-12T11:58:45.425Z",
        "metadata": {
          "custom_data": "mycustom data",
          "internal_customer_id": "internal_customer_id"
        },
        "mode": "local"
      }
    }
    ```
  </Accordion>
</AccordionGroup>

## subscription.canceled

The subscription was canceled by the merchant or by the customer.

<AccordionGroup>
  <Accordion title="Sample Request Body">
    ```json
    {
      "id": "evt_2iGTc600qGW6FBzloh2Nr7",
      "eventType": "subscription.canceled",
      "created_at": 1728734337932,
      "object": {
        "id": "sub_6pC2lNB6joCRQIZ1aMrTpi",
        "object": "subscription",
        "product": {
          "id": "prod_d1AY2Sadk9YAvLI0pj97f",
          "name": "Monthly",
          "description": "Monthly",
          "image_url": null,
          "price": 1000,
          "currency": "EUR",
          "billing_type": "recurring",
          "billing_period": "every-month",
          "status": "active",
          "tax_mode": "exclusive",
          "tax_category": "saas",
          "default_success_url": "",
          "created_at": "2024-10-11T11:50:00.182Z",
          "updated_at": "2024-10-11T11:50:00.182Z",
          "mode": "local"
        },
        "customer": {
          "id": "cust_1OcIK1GEuVvXZwD19tjq2z",
          "object": "customer",
          "email": "text@example.com",
          "name": "Tester Test",
          "country": "NL",
          "created_at": "2024-10-11T09:16:48.557Z",
          "updated_at": "2024-10-11T09:16:48.557Z",
          "mode": "local"
        },
        "collection_method": "charge_automatically",
        "status": "canceled",
        "last_transaction_id": "tran_5yMaWzAl3jxuGJMCOrYWwk",
        "last_transaction_date": "2024-10-12T11:58:47.109Z",
        "current_period_start_date": "2024-10-12T11:58:38.000Z",
        "current_period_end_date": "2024-11-12T11:58:38.000Z",
        "canceled_at": "2024-10-12T11:58:57.813Z",
        "created_at": "2024-10-12T11:58:45.425Z",
        "updated_at": "2024-10-12T11:58:57.827Z",
        "metadata": {
          "custom_data": "mycustom data",
          "internal_customer_id": "internal_customer_id"
        },
        "mode": "local"
      }
    }
    ```
  </Accordion>
</AccordionGroup>

## subscription.expired

The subscription was expired, given that the `current_end_period` has been reached without a new payment.
Payment retries can happen at this stage, and the subscription status will be terminal only when status is changed to `canceled`.

<AccordionGroup>
  <Accordion title="Sample Request Body">
    ```json
    {
      "id": "evt_V5CxhipUu10BYonO2Vshb",
      "eventType": "subscription.expired",
      "created_at": 1734463872058,
      "object": {
          "id": "sub_7FgHvrOMC28tG5DEemoCli",
          "object": "subscription",
          "product": {
              "id": "prod_3ELsC3Lt97orn81SOdgQI3",
              "name": "Subs",
              "description": "Subs",
              "image_url": null,
              "price": 1200,
              "currency": "EUR",
              "billing_type": "recurring",
              "billing_period": "every-year",
              "status": "active",
              "tax_mode": "exclusive",
              "tax_category": "saas",
              "default_success_url": "",
              "created_at": "2024-12-11T17:33:32.186Z",
              "updated_at": "2024-12-11T17:33:32.186Z",
              "mode": "local"
          },
          "customer": {
              "id": "cust_3y4k2CELGsw7n9Eeeiw2hm",
              "object": "customer",
              "email": "text@example.com",
              "name": "Alec Erasmus",
              "country": "NL",
              "created_at": "2024-12-09T16:09:20.709Z",
              "updated_at": "2024-12-09T16:09:20.709Z",
              "mode": "local"
          },
          "collection_method": "charge_automatically",
          "status": "active",
          "last_transaction_id": "tran_6ZeTvMqMkGdAIIjw5aAcnh",
          "last_transaction_date": "2024-12-16T12:40:12.658Z",
          "next_transaction_date": "2025-12-16T12:39:47.000Z",
          "current_period_start_date": "2024-12-16T12:39:47.000Z",
          "current_period_end_date": "2024-12-16T12:39:47.000Z",
          "canceled_at": null,
          "created_at": "2024-12-16T12:40:05.058Z",
          "updated_at": "2024-12-16T12:40:05.058Z",
          "mode": "local"
      }
    }
    ```
  </Accordion>
</AccordionGroup>

## refund.created

A refund was created by the merchant

<AccordionGroup>
  <Accordion title="Sample Request Body">
    ```json
    {
    "id": "evt_61eTsJHUgInFw2BQKhTiPV",
    "eventType": "refund.created",
    "created_at": 1728734351631,
    "object": {
      "id": "ref_3DB9NQFvk18TJwSqd0N6bd",
      "object": "refund",
      "status": "succeeded",
      "refund_amount": 1210,
      "refund_currency": "EUR",
      "reason": "requested_by_customer",
      "transaction": {
        "id": "tran_5yMaWzAl3jxuGJMCOrYWwk",
        "object": "transaction",
        "amount": 1000,
        "amount_paid": 1210,
        "currency": "EUR",
        "type": "invoice",
        "tax_country": "NL",
        "tax_amount": 210,
        "status": "refunded",
        "refunded_amount": 1210,
        "order": "ord_4aDwWXjMLpes4Kj4XqNnUA",
        "subscription": "sub_6pC2lNB6joCRQIZ1aMrTpi",
        "description": "Subscription payment",
        "period_start": 1728734318000,
        "period_end": 1731412718000,
        "created_at": 1728734327109,
        "mode": "local"
      },
      "subscription": {
        "id": "sub_6pC2lNB6joCRQIZ1aMrTpi",
        "object": "subscription",
        "product": "prod_d1AY2Sadk9YAvLI0pj97f",
        "customer": "cust_1OcIK1GEuVvXZwD19tjq2z",
        "collection_method": "charge_automatically",
        "status": "canceled",
        "last_transaction_id": "tran_5yMaWzAl3jxuGJMCOrYWwk",
        "last_transaction_date": "2024-10-12T11:58:47.109Z",
        "current_period_start_date": "2024-10-12T11:58:38.000Z",
        "current_period_end_date": "2024-11-12T11:58:38.000Z",
        "canceled_at": "2024-10-12T11:58:57.813Z",
        "created_at": "2024-10-12T11:58:45.425Z",
        "updated_at": "2024-10-12T11:58:57.827Z",
        "metadata": {
          "custom_data": "mycustom data",
          "internal_customer_id": "internal_customer_id"
        },
        "mode": "local"
      },
      "checkout": {
        "id": "ch_4l0N34kxo16AhRKUHFUuXr",
        "object": "checkout",
        "request_id": "my-request-id",
        "custom_fields": [],
        "status": "completed",
        "metadata": {
          "custom_data": "mycustom data",
          "internal_customer_id": "internal_customer_id"
        },
        "mode": "local"
      },
      "order": {
        "id": "ord_4aDwWXjMLpes4Kj4XqNnUA",
        "customer": "cust_1OcIK1GEuVvXZwD19tjq2z",
        "product": "prod_d1AY2Sadk9YAvLI0pj97f",
        "amount": 1000,
        "currency": "EUR",
        "status": "paid",
        "type": "recurring",
        "created_at": "2024-10-12T11:58:33.097Z",
        "updated_at": "2024-10-12T11:58:33.097Z",
        "mode": "local"
      },
      "customer": {
        "id": "cust_1OcIK1GEuVvXZwD19tjq2z",
        "object": "customer",
        "email": "text@example.com",
        "name": "Tester Test",
        "country": "NL",
        "created_at": "2024-10-11T09:16:48.557Z",
        "updated_at": "2024-10-11T09:16:48.557Z",
        "mode": "local"
      },
      "created_at": 1728734351525,
      "mode": "local"
    }
    }
    ```
  </Accordion>
</AccordionGroup>

## dispute.created

A dispute was created by the customer

<AccordionGroup>
  <Accordion title="Sample Request Body">
    ```json
    {
      "id": "evt_6mfLDL7P0NYwYQqCrICvDH",
      "eventType": "dispute.created",
      "created_at": 1750941264812,
      "object": {
        "id": "disp_6vSsOdTANP5PhOzuDlUuXE",
        "object": "dispute",
        "amount": 1331,
        "currency": "EUR",
        "transaction": {
          "id": "tran_4Dk8CxWFdceRUQgMFhCCXX",
          "object": "transaction",
          "amount": 1100,
          "amount_paid": 1331,
          "currency": "EUR",
          "type": "invoice",
          "tax_country": "NL",
          "tax_amount": 231,
          "status": "chargeback",
          "refunded_amount": 1331,
          "order": "ord_57bf8042UmG8fFypxZrfnj",
          "subscription": "sub_5sD6zM482uwOaEoyEUDDJs",
          "customer": "cust_OJPZd2GMxgo1MGPNXXBSN",
          "description": "Subscription payment",
          "period_start": 1750941201000,
          "period_end": 1753533201000,
          "created_at": 1750941205659,
          "mode": "sandbox"
        },
        "subscription": {
          "id": "sub_5sD6zM482uwOaEoyEUDDJs",
          "object": "subscription",
          "product": "prod_3EFtQRQ9SNIizK3xwfxZHu",
          "customer": "cust_OJPZd2GMxgo1MGPNXXBSN",
          "collection_method": "charge_automatically",
          "status": "active",
          "current_period_start_date": "2025-06-26T12:33:21.000Z",
          "current_period_end_date": "2025-07-26T12:33:21.000Z",
          "canceled_at": null,
          "created_at": "2025-06-26T12:33:23.589Z",
          "updated_at": "2025-06-26T12:33:26.102Z",
          "mode": "sandbox"
        },
        "checkout": {
          "id": "ch_1bJMvqGGzHIftf4ewLXJeq",
          "object": "checkout",
          "product": "prod_3EFtQRQ9SNIizK3xwfxZHu",
          "units": 1,
          "custom_fields": [
            {
              "key": "testing",
              "text": {
                "value": "asdfasdf",
                "max_length": 255
              },
              "type": "text",
              "label": "Testing",
              "optional": false
            }
          ],
          "status": "completed",
          "mode": "sandbox"
        },
        "order": {
          "object": "order",
          "id": "ord_57bf8042UmG8fFypxZrfnj",
          "customer": "cust_OJPZd2GMxgo1MGPNXXBSN",
          "product": "prod_3EFtQRQ9SNIizK3xwfxZHu",
          "amount": 1100,
          "currency": "EUR",
          "sub_total": 1100,
          "tax_amount": 231,
          "amount_due": 1331,
          "amount_paid": 1331,
          "status": "paid",
          "type": "recurring",
          "transaction": "tran_4Dk8CxWFdceRUQgMFhCCXX",
          "created_at": "2025-06-26T12:32:41.395Z",
          "updated_at": "2025-06-26T12:32:41.395Z",
          "mode": "sandbox"
        },
        "customer": {
          "id": "cust_OJPZd2GMxgo1MGPNXXBSN",
          "object": "customer",
          "email": "text@example.com",
          "name": "Alec Erasmus",
          "country": "NL",
          "created_at": "2025-02-05T10:11:01.146Z",
          "updated_at": "2025-02-05T10:11:01.146Z",
          "mode": "sandbox"
        },
        "created_at": 1750941264728,
        "mode": "local"
      }
    }
    ```
  </Accordion>
</AccordionGroup>

## subscription.update

A subscription object was updated

<AccordionGroup>
  <Accordion title="Sample Request Body">
    ```json
    {
    "id": "evt_5pJMUuvqaqvttFVUvtpY32",
    "eventType": "subscription.update",
    "created_at": 1737890536421,
    "object": {
      "id": "sub_2qAuJgWmXhXHAuef9k4Kur",
      "object": "subscription",
      "product": {
        "id": "prod_1dP15yoyogQe2seEt1Evf3",
        "name": "Monthly Sub",
        "description": "Test Test",
        "image_url": null,
        "price": 1000,
        "currency": "EUR",
        "billing_type": "recurring",
        "billing_period": "every-month",
        "status": "active",
        "tax_mode": "exclusive",
        "tax_category": "saas",
        "default_success_url": "",
        "created_at": "2025-01-26T11:17:16.082Z",
        "updated_at": "2025-01-26T11:17:16.082Z",
        "mode": "local"
      },
      "customer": {
        "id": "cust_2fQZKKUZqtNhH2oDWevQkW",
        "object": "customer",
        "email": "text@example.com",
        "name": "John Doe",
        "country": "NL",
        "created_at": "2025-01-26T11:18:24.071Z",
        "updated_at": "2025-01-26T11:18:24.071Z",
        "mode": "local"
      },
      "items": [
        {
          "object": "subscription_item",
          "id": "sitem_3QWlqRbAat2eBRakAxFtt9",
          "product_id": "prod_5jnudVkLGZWF4AqMFBs5t5",
          "price_id": "pprice_4W0mJK6uGiQzHbVhfaFTl1",
          "units": 1,
          "created_at": "2025-01-26T11:20:40.296Z",
          "updated_at": "2025-01-26T11:20:40.296Z",
          "mode": "local"
        }
      ],
      "collection_method": "charge_automatically",
      "status": "active",
      "current_period_start_date": "2025-01-26T11:20:36.000Z",
      "current_period_end_date": "2025-02-26T11:20:36.000Z",
      "canceled_at": null,
      "created_at": "2025-01-26T11:20:40.292Z",
      "updated_at": "2025-01-26T11:22:16.388Z",
      "mode": "local"
    }
    }
    ```
  </Accordion>
</AccordionGroup>

## subscription.trialing

A subscription started a trial period

<AccordionGroup>
  <Accordion title="Sample Request Body">
    ```json
    {
    "id": "evt_2ciAM8ABYtj0pVueeJPxUZ",
    "eventType": "subscription.trialing",
    "created_at": 1739963911073,
    "object": {
      "id": "sub_dxiauR8zZOwULx5QM70wJ",
      "object": "subscription",
      "product": {
        "id": "prod_3kpf0ZdpcfsSCQ3kDiwg9m",
        "name": "trail",
        "description": "asdfasf",
        "image_url": null,
        "price": 1100,
        "currency": "EUR",
        "billing_type": "recurring",
        "billing_period": "every-month",
        "status": "active",
        "tax_mode": "exclusive",
        "tax_category": "saas",
        "default_success_url": "",
        "created_at": "2025-02-19T11:18:07.570Z",
        "updated_at": "2025-02-19T11:18:07.570Z",
        "mode": "test"
      },
      "customer": {
        "id": "cust_4fpU8kYkQmI1XKBwU2qeME",
        "object": "customer",
        "email": "alecerasmus2@gmail.com",
        "name": "Alec Erasmus",
        "country": "NL",
        "created_at": "2024-11-07T23:21:11.763Z",
        "updated_at": "2024-11-07T23:21:11.763Z",
        "mode": "test"
      },
      "items": [
        {
          "object": "subscription_item",
          "id": "sitem_1xbHCmIM61DHGRBCFn0W1L",
          "product_id": "prod_3kpf0ZdpcfsSCQ3kDiwg9m",
          "price_id": "pprice_517h9CebmM3P079bGAXHnE",
          "units": 1,
          "created_at": "2025-02-19T11:18:30.690Z",
          "updated_at": "2025-02-19T11:18:30.690Z",
          "mode": "test"
        }
      ],
      "collection_method": "charge_automatically",
      "status": "trialing",
      "current_period_start_date": "2025-02-19T11:18:25.000Z",
      "current_period_end_date": "2025-02-26T11:18:25.000Z",
      "canceled_at": null,
      "created_at": "2025-02-19T11:18:30.674Z",
      "updated_at": "2025-02-19T11:18:30.674Z",
      "mode": "test"
      }
    }
    ```
  </Accordion>
</AccordionGroup>
