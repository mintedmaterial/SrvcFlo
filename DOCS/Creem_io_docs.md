# Api Keys
Source: https://docs.creem.io/api-keys

Learn how to generate and use your API key

## What is an API Key

API Keys are secret tokens used to authenticate your requests. They are unique to your account and should be kept confidential.

## Create API Key

1. Go over to the [dashboard](https://creem.io/dashboard/home) and login to your account.
2. On the top navbar, navigate to the "Developers" section.
3. Click on the eye icon to reveal your API key.
4. Copy your API key and keep it safe.

   <img style={{ borderRadius: '0.5rem' }} src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/api-key-NPHWvJnYNfSuDjaGVpscKUORPO3Gsg.png" />


# Activate License Key
Source: https://docs.creem.io/api-reference/endpoint/activate-license

post /v1/licenses/activate



# Cancel Subscription
Source: https://docs.creem.io/api-reference/endpoint/cancel-subscription

post /v1/subscriptions/{id}/cancel



# Create Checkout Session
Source: https://docs.creem.io/api-reference/endpoint/create-checkout

post /v1/checkouts



# Create Discount Code
Source: https://docs.creem.io/api-reference/endpoint/create-discount-code

post /v1/discounts



# Create Product
Source: https://docs.creem.io/api-reference/endpoint/create-product

post /v1/products



# Deactivate License Key
Source: https://docs.creem.io/api-reference/endpoint/deactivate-license

post /v1/licenses/deactivate



# Delete Discount Code
Source: https://docs.creem.io/api-reference/endpoint/delete-discount-code

delete /v1/discounts/{id}/delete



# Get Checkout Session
Source: https://docs.creem.io/api-reference/endpoint/get-checkout

get /v1/checkouts



# Get Customer
Source: https://docs.creem.io/api-reference/endpoint/get-customer

get /v1/customers



# Get Discount Code
Source: https://docs.creem.io/api-reference/endpoint/get-discount-code

get /v1/discounts



# Get Product
Source: https://docs.creem.io/api-reference/endpoint/get-product

get /v1/products



# Get Subscription
Source: https://docs.creem.io/api-reference/endpoint/get-subscription

get /v1/subscriptions



# List Transactions
Source: https://docs.creem.io/api-reference/endpoint/get-transactions

get /v1/transactions/search



# List Products
Source: https://docs.creem.io/api-reference/endpoint/search-products

get /v1/products/search



# Update Subscription
Source: https://docs.creem.io/api-reference/endpoint/update-subscription

post /v1/subscriptions/{id}



# Upgrade Subscription
Source: https://docs.creem.io/api-reference/endpoint/upgrade-subscription

post /v1/subscriptions/{id}/upgrade



# Validate License Key
Source: https://docs.creem.io/api-reference/endpoint/validate-license

post /v1/licenses/validate



# Introduction
Source: https://docs.creem.io/api-reference/introduction

Understand general concepts, response codes, and authentication strategies.

## Base URL

The Creem API is built on REST principles. We enforce HTTPS in every request to improve data security, integrity, and privacy. The API does not support HTTP.

All requests contain the following base URL:

```http
https://api.creem.io
```

## Authentication

To authenticate you need to add an `x-api-key` header with the contents of the header being your API Key.
All API endpoints are authenticated using Api Keys and picked up from the specification file.

```json
{
  "headers": {
    "x-api-key": "creem_123456789"
  }
}
```

## Response codes

Creem uses standard HTTP codes to indicate the success or failure of your requests.
In general, 2xx HTTP codes correspond to success, 4xx codes are for user-related failures, and 5xx codes are for infrastructure issues.

| Status | Description                             |
| ------ | --------------------------------------- |
| 200    | Successful request.                     |
| 400    | Check that the parameters were correct. |
| 401    | The API key used was missing.           |
| 403    | The API key used was invalid.           |
| 404    | The resource was not found.             |
| 429    | The rate limit was exceeded.            |
| 500    | Indicates an error with Creem servers.  |


# Standard Integration
Source: https://docs.creem.io/checkout-flow

Learn how to receive payments on your application

## Prerequisites

To get the most out of this guide, you'll need to:

* **Create an account on Creem.io**
* **Have your API key ready**

## 1. Create a product

Go over to the [products tab](https://creem.io/dashboard/products) and create a product.
You can add a name, description, and price to your product. Optionally you can also add a picture to your product that will be shown to users.

<AccordionGroup>
  <Accordion icon="browser" title="Product page">
    <img style={{ borderRadius: '0.5rem' }} src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/add-product-B0Khh16pSFp3DpwsuBrrExvlwovhMq.png" />
  </Accordion>

  <Accordion icon="file-spreadsheet" title="Adding product details">
    <img style={{ borderRadius: '0.5rem' }} src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/Screenshot%202024-10-03%20at%2015.51.45-arQ1KogX03W1cGCmTgMBSJFd8d8QYR.png" />
  </Accordion>
</AccordionGroup>

## 2 Create a checkout session

Once your product is created, you can copy the product ID by clicking on the product options and selecting "Copy ID".

Now grab your api-key and create a checkout session by sending a POST request to the following endpoint:

<Warning>
  If you are using test mode, make sure to use the test mode API endpoint. See the [Test Mode](/test-mode) page for more details.
</Warning>

<CodeGroup>
  ```bash getCheckout.sh
  curl -X POST https://api.creem.io/v1/checkouts \
    -H "x-api-key: creem_123456789"
    -D '{"product_id": "prod_6tW66i0oZM7w1qXReHJrwg"}'
  ```

  ```javascript getCheckout.js
      const redirectUrl = await axios.post(
        `https://api.creem.io/v1/checkouts`,
          {
            product_id: 'prod_6tW66i0oZM7w1qXReHJrwg',
          },
          {
            headers: { "x-api-key": `creem_123456789` },
          },
      );
  ```
</CodeGroup>

<Tip>
  Read more about all attributes you can pass to a checkout sesssion [here](/learn/checkout-session/introduction)
</Tip>

## 3. Redirect user to checkout url

Once you have created a checkout session, you will receive a checkout URL in the response.

Redirect the user to this URL and that is it! You have successfully created a checkout session and received your first payment!

<AccordionGroup>
  <Accordion icon="table-tree" title="Track payments with a request ID">
    When creating a checkout-session, you can optionally add a `request_id` parameter to track the payment.
    This parameter will be sent back to you in the response and in the webhook events.
    Use this parameter to track the payment or user in your system.
  </Accordion>

  <Accordion icon="location-crosshairs" title="Set a success URL on the checkout session">
    After successfully completing the payment, the user will be automatically redirected to the URL you have set on the product creation.
    You can bypass this setting by setting a success URL on the checkout session request by adding the `success_url` parameter.
    The user will always be redirected with the following query parameters:

    * `session_id`: The ID of the checkout session
    * `product_id`: The ID of the product
    * `status`: The status of the payment
    * `request_id`: The request ID of the payment that you optionally have sent
  </Accordion>
</AccordionGroup>

## 4. Receive payment data on your Return URL

A return URL will always contain the following query parameters, and will look like the following:

<Tip>
  `https://yourwebsite.com/your-return-path?checkout_id=ch_1QyIQDw9cbFWdA1ry5Qc6I&order_id=ord_4ucZ7Ts3r7EhSrl5yQE4G6&customer_id=cust_2KaCAtu6l3tpjIr8Nr9XOp&subscription_id=sub_ILWMTY6uBim4EB0uxK6WE&product_id=prod_6tW66i0oZM7w1qXReHJrwg&signature=044bd1691d254c4ad4b31b7f246330adf09a9f07781cd639979a288623f4394c?`

  You can read more about [Return Urls](/learn/checkout-session/return-url) here.
</Tip>

| Query parameter  | Description                                                                    |
| ---------------- | ------------------------------------------------------------------------------ |
| checkout\_id     | The ID of the checkout session created for this payment.                       |
| order\_id        | The ID of the order created after successful payment.                          |
| customer\_id     | The customer ID, based on the email that executed the successful payment.      |
| subscription\_id | The subscription ID of the product.                                            |
| product\_id      | The product ID that the payment is related to.                                 |
| request\_id      | **Optional** The request ID you provided when creating this checkout session.  |
| signature        | All previous parameters signed by creem using your API-key, verifiable by you. |

<Warning>
  We also encourage reading on how you can verify Creem signature on return URLs [here](/learn/checkout-session/return-url).
</Warning>

### Expanding your integration

You can also use webhooks to check payment data dynamically in your application, without the need to wait for the return URLs, or have the user redirected to your application website.

<CardGroup>
  <Card title="Return URLs" icon="globe-pointer" href="/learn/checkout-session/return-url">
    Understand what you will receive when users complete a payment and get redirected back to your website.
  </Card>

  <Card title="Webhooks and Events" icon="square-code" href="/learn/webhooks/introduction">
    Set up webhooks to receive updates on your application automatically.
  </Card>
</CardGroup>


# Account Reviews
Source: https://docs.creem.io/faq/account-reviews/account-reviews

Learn how account reviews work on Creem.

As the Merchant of Record (MoR), we serve as the reseller of digital goods and services.
Consequently, it is imperative that businesses utilizing Creem adhere to our acceptable product guidelines.
This involves continuous monitoring, reviewing, and preventing fraud, misuse, malicious activities, and high-risk accounts.

<Tip>
  Below you can find a TLDR checklist to ensure your account review is
  successful.
</Tip>

| Checklist for Account Review Submission | Description                                                                                                                                        |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product readiness                       | Your product is ready for production (if you are still developing it, feel free to use the test-mode)                                              |
| No false information                    | Your website does not contain any false information such as reviews, testimonials or past usage                                                    |
| Privacy Policy and Terms of Service     | Your website has a Privacy Policy and Terms of Service                                                                                             |
| Product visibility                      | We can clearly see and understand the product from your website or landing page                                                                    |
| Product name                            | The product name clearly does not infringe on any existing trademarks nor does it create any likelihood of consumer confusion or misrepresentation |
| Pricing display                         | The pricing is easily accessible and displayed to the user                                                                                         |
| Compliance with acceptable use          | Your product does not engage in high-risk, shady, or illegitimate use of technology, and you are proud of its integrity                            |
| Reachable customer support email        | Ensure you have a reachable email for customer support which will be displayed on the email receipt customers receive                              |
| Compliance with prohibited product list | Your product is not included in our [prohibited product list](https://docs.creem.io/faq/prohibited-products)                                       |

## How to submit an account review, and what information is needed?

To submit an account review, you need to navigate to the Balance menu, located on the left-side menu of the platform.
Upon successful navigation to the Balance menu, click on the Payout Account option to start the process of submitting a payout account and getting your store reviewed.

The information necessary for the store review includes:

* Your full individual name and/or your business entity name
* Your store/product name
* The product URL of your store
* A description of your business and how you operate
* A description of the products you are intending to sell through Creem with your store
* The country you are a tax resident in (Country of citizenship if an individual store account, or country of incorporation if a business entity)

### How to ensure that your account review is successful?

To ensure that your account review is successful, follow these tips when submitting your application.

Make sure to provide accurate and detailed information about your store and the products you intend to sell.
We work with a variety of digital products, including software & SaaS, templates, eBooks, PDFs, code, icons, fonts, design assets, photos, videos, audio, and premium access such as Discord servers, GitHub repositories, and subscription-based courses.

As a Merchant of Record, we can handle digital goods, software, or services that can be fulfilled by Creem on your behalf, such as license keys, file downloads, private links, and premium content.
Alternatively, you can use our APIs to grant immediate access to digital assets, services, or software for customers with one-time purchases or subscriptions.

We meticulously review every store application to ensure there is no deceptive content, such as

* Unearned badges (e.g. Product Hunt)
* False customer testimonials
* Misleading reviews or number of users

We do not allow anything that is unfair, deceptive, abusive, harmful, or shady.
If you are unsure whether your use case would be approved, please reach out to us in advance for clarification.

### Why do you need to review my account?

We review accounts to ensure that they are legitimate and in compliance with our terms of service.
This helps us prevent fraud, misuse, malicious activities, and high-risk accounts.

We need to perform these reviews to protect our users and ensure a safe and secure platform for all. Combined with meeting our own KYC/AML requirements as a billing platform.

### On-going monitoring

We continuously monitor all accounts to ensure that they are in compliance with our terms of service and to proactively prevent fraud.
If we notice any suspicious activity, we will review the account again.

In addition to performing these reviews, we also perform random audits of accounts to ensure that they are in compliance with our terms of service. These reviews are often completed within hours and without any additional information required from you.

We look at:

* The product and its description
* The pricing and payment methods
* The customer support and contact information
* The website and landing page
* Risk scores across historic transactions
* Refund & Chargeback ratio


# AI Wrapper Compliance
Source: https://docs.creem.io/faq/account-reviews/ai-wrapper-compliance

Understand the compliance requirements for building AI wrapper products on Creem.

To ensure a fair and transparent ecosystem for both merchants and customers, Creem has established a set of compliance requirements for all AI wrapper products. These are platforms that provide a custom interface or extended features for third-party AI models like VEO3, Claude, or Gemini.

<Warning>
  Failure to comply with these policies will result in the suspension of your payment processing capabilities.
</Warning>

## 1. Product Branding and Naming

Your product's brand identity must be distinct from the underlying AI models it uses. This is crucial for trademark protection and to avoid customer confusion.

### Prohibited Practices

* **Do not use AI model brand names in your product name.** For example, names like "VEO3Studio" or "GeminiVideo" are not allowed.

### Required Practices

* **Develop independent branding.** Choose a name that is unique and does not directly reference the AI models. Examples of compliant names include `MintAI`, `RenderZen`, or `SlateVidAI`.
* **You may mention supported models within your application or on your website**, but not as part of the core product branding. For instance, you can say "Powered by VEO3" or "Integrates with Gemini."
* **SEO-focused domains are permitted with a redirect.** You can use a domain like `veo3generator.com` for SEO, but it must redirect to your properly branded product website.

## 2. Marketing and Transparency

When marketing your product, it's essential to be transparent about its nature and your relationship with the AI model providers.

### Disclaimers

* If you use model names in advertisements or marketing content, you must include a disclaimer stating that your product is not affiliated with, endorsed by, or sponsored by the model creators.
* **Example Disclaimer:** `"This platform is an independent product and is not affiliated with Google. We provide access to the VEO3 model through our custom interface."`

### Feature Representation

* **Advertise only the features you deliver.** Do not claim functionalities that are part of a more advanced model version than the one you use.
* Be explicit about any limitations or tiered access to specific model capabilities.

## 3. Platform and Product Integrity

Your Creem integration should be used for a single, clearly defined product.

* **One Product per Integration:** If you launch new AI tools, they must be onboarded as separate products through Creem's review process.
* **Disclose the Wrapper Nature:** Clearly state that your platform provides a custom interface for underlying AI models. This prevents potential flags for consumer deception.
* **Example Disclosure:** `"Our platform offers a user-friendly interface built on top of models like VEO3 to enhance usability and provide additional features. We are an independent service and not affiliated with the model providers."`

## 4. Customer Experience and Support

Providing excellent customer support is a core requirement for all merchants on Creem.

### Support Channels

* **A visible support email is mandatory.** This email must be accessible on your public website and within the user dashboard.
* **Use a branded support email.** If your product is `MintAI`, your support email should be `support@mintai.com`, not a generic address.

### Subscription Management

* **Users must be able to cancel subscriptions directly from your product.** You can achieve this by integrating with the `Creem Cancel Subscription API` or by redirecting users to the `Creem Customer Portal`.

## 5. Refund Policy

Timely customer resolution is critical.

* **Respond to customer requests within 3 business days.**
* If you do not respond within this timeframe, Creem reserves the right to issue a refund on your behalf to ensure customer satisfaction.

<Tip>
  These policies are actively enforced. We encourage you to review your product and marketing materials to ensure full compliance. If you have any questions, please reach out to our support team.
</Tip>


# Prohibited Products
Source: https://docs.creem.io/faq/prohibited-products

Learn what products are prohibited on Creem.

<Warning>
  If you violate our terms of service or attempt to sell prohibited products, you risk getting your store placed in review or suspended.
</Warning>

As a general rule, we allow selling of digital goods that can be fulfilled through Creem’s website.

### Examples of acceptable products

Some examples of acceptable goods include:

Software & SaaS
eBooks
PDFs
Design assets
Photos
Audio
Video

### List of prohibited products

The following products and services are prohibited on Creem:

* Sexually-oriented or pornographic content of any kind, including NSFW chatbots
* IPTV services
* Physical goods of any kind
* Spyware or parental control apps
* Donations or charity giving where no product exists or where the price is greater than the product value
* Products or content for which you do not hold a proper license or intellectual property rights
* Marketplaces - where you use your Creem store to “partner” to sell others’ products
* Dating sites
* Private Label Rights (PLR) products or Master Resell Products (MRR) products - this includes any product which you’ve obtained a license to sell but do not hold the original IP rights
* Counterfeit goods
* Any products restricted by our payment processing partners
* Illegal or age restricted products such as: drugs and paraphernalia, alcohol, tobacco, vaping products
* Regulated products such as: CBD, gambling, weapons, ammunition, pay to play auctions, sweepstakes, lotteries, business-in-a-box, work-from-home, get-rich-quick schemes, etc.
* Regulated services such as: real estate, mortgage, lending, telemarketing, cellular/communication, door-to-door sales, bankruptcy, legal, merchant, debt-relief, collections, banking/financing, currency exchange, warranties, etc.
* Timeshares
* Pharmacies, pharmaceuticals and nutraceuticals
* Homework/Essay mills
* Multi-level marketing, pyramid, or IBO schemes
* NFT & Crypto assets products.
* Any other products that our providers deem too risky

### List of restricted products

These services will be subject to strict due diligence and are not guaranteed to be accepted.

* Services of any kind (including marketing, design, web development, consulting or other related services)
* Job boards
* Advertising in newsletters, on websites, or in social media posts

If you are unsure whether your content is prohibited, please contact Creem support with a description or example of the content before you start selling.


# Supported Countries
Source: https://docs.creem.io/faq/supported-countries

Creem supports merchants and affiliates in hundreds of countries. Find out if your country is supported for payouts and purchases.

Creem can offer services to merchants who can receive bank or Stripe payouts in one of the countries we support.

We currently allow purchases from all countries except those listed in our unsupported customer countries list.

<Info>
  If you don’t see your country listed by Bank Accounts or in the list below, sorry, you won’t be able to use Creem at this time
  We are always expanding our region support, and would love to hear from you.
</Info>

### Supported Countries

Local Bank Account transfers will be subject to transfer fees from 7EUR/USD to 1% of the payout amount, whichever is higher.

* Local Bank Account payouts are supported in the following countries:
  * Andorra
  * Australia
  * Bangladesh
  * Brazil
  * Bulgaria
  * Canada
  * Chile
  * China - [Transfer limits](https://docs.creem.io/finance/payouts#transfer-limits)
  * Colombia
  * Costa Rica
  * Egypt
  * Guatemala
  * Hong Kong
  * Hungary
  * Iceland
  * India
  * Indonesia
  * Israel
  * Japan
  * Kenya
  * Malaysia
  * Mexico
  * Morocco
  * Nepal
  * New Zealand
  * Nigeria
  * Pakistan
  * Philippines
  * Serbia
  * Singapore
  * South Africa
  * South Korea
  * Sri Lanka
  * Taiwan
  * Tanzania
  * Thailand
  * Turkey
  * Ukraine
  * United Arab Emirates
  * United States of America
  * Uruguay
  * Vietnam
  * Zambia
* Stripe Payouts supported in the following countries:
  * Austria
  * Belgium
  * Bulgaria
  * Croatia
  * Cyprus
  * Czech Republic
  * Denmark
  * Estonia
  * Finland
  * France
  * Germany
  * Greece
  * Hungary
  * Ireland
  * Italy
  * Iceland
  * Latvia
  * Liechtenstein
  * Lithuania
  * Luxembourg
  * Malta
  * Monaco
  * Netherlands
  * Norway
  * Poland
  * Portugal
  * Romania
  * Slovakia
  * Slovenia
  * Spain
  * Sweden
  * San Marino
  * Switzerland
  * United Kingdom

### Unsupported countries for purchases

We cannot accept payments from customers or Merchants in the following countries:

* Afghanistan
* Antarctica
* Belarus\*
* Burma (Myanmar)
* Central African Republic
* Cuba
* Crimea (Region of Ukraine)\*
* Democratic Republic of Congo
* Donetsk (Region of Ukraine)\*
* Haiti
* Iran
* Kherson (Region of Ukraine)\*
* Libya
* Luhansk (Region of Ukraine)\*
* Mali
* Netherlands Antilles
* Nicaragua
* North Korea
* Russia\*
* Somalia
* South Sudan
* Sudan
* Syria
* Venezuela
* Yemen
* Zaporizhzhia (Region of Ukraine)\*
* Zimbabwe


# Overview
Source: https://docs.creem.io/features/custom-fields/overview

Enable custom fields on product checkout sessions.

# Custom Fields with Creem

Welcome to Creem's Custom Fields documentation! This feature allows you to collect additional information from customers during checkout by adding customizable fields to your product purchase flow.

## Getting Started

Setting up custom fields for your product is straightforward and requires minimal configuration:

1. Navigate to Your Product Settings
   * Log into your Creem Dashboard
   * Go to "Products" section
   * Create a new product
   * Enable "Custom Fields" feature
2. Configure Your Custom Fields
   * Choose the field type (text, number, email, etc.)
   * Set the field name and label
   * Configure input validation rules
   * Save your configuration

## How It Works

When custom fields are configured, they automatically appear during the checkout process. The collected information is then:

* **Stored securely:** All custom field data is encrypted and stored securely
* **Accessible via Webhook:** Data is included in the `checkout.completed` webhook event
* **Available in Dashboard:** View responses in your merchant dashboard

## Common Use Cases

* **Integration IDs:** Collect user IDs from other platforms or systems
* **Contact Information:** Gather phone numbers, alternative email addresses, or social media handles
* **Customization Details:** Collect preferences, sizes, or specifications
* **Business Information:** Company names, tax IDs, or registration numbers
* **Event Details:** Dates, attendance information, or dietary preferences

## Best Practices

* Keep required fields to a minimum
* Use clear, descriptive field labels
* Select appropriate validation rules
* Consider mobile user experience

**Pro Tips**

* Use conditional fields when appropriate
* Group related fields together
* Test the checkout flow thoroughly

## Webhook Integration

Custom field data is automatically included in the `checkout.completed` webhook payload, making it easy to integrate with your systems.
[Learn more about the checkout.completed webhook](https://docs.creem.io/learn/webhooks/event-types).

**Need Help?**

Our support team is ready to assist you with setting up custom fields. Contact us at [support@creem.co](mailto:support@creem.co)


# Overview
Source: https://docs.creem.io/features/downloads/overview

Allow customers to download protected files after product purchase."


# File Downloads with Creem

Welcome to Creem's File Downloads documentation! This feature enables you to easily distribute digital files to customers after their purchase through our secure customer portal.

<Frame>
  <img style={{ borderRadius: '0.5rem' }} src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/file-download-demo-wbR7Ycp66MK0ZEggXoWIuoooQeFIC8.gif" />
</Frame>

## Getting Started

Setting up file downloads for your product is straightforward and requires minimal configuration:

1. Navigate to Your Product Settings
   * Log into your Creem Dashboard
   * Go to "Products" section
   * Create a new product
   * Enable "File Downloads" feature
2. Configure Your File Download
   * Upload your digital file(s)
   * Save your configuration

## How It Works

Once configured, the file download system works automatically. When a customer completes a purchase, they'll receive access to your files in multiple locations:

* **Email Receipt:** A secure download link appears in the purchase confirmation email that will lead the user to the customer portal

<Frame>
  <img style={{ borderRadius: '0.5rem' }} src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/email-file-download-DSw3vcQZYSE3h5fBRnwqgPqR0lKPG7.png" />
</Frame>

* **Customer Portal:** Customers can download files anytime through their portal

<Frame>
  <img style={{ borderRadius: '0.5rem' }} src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/customer-portal-download-1t1bqKjwxM32ibVnigolkmRuOvDXkU.png" />
</Frame>

## Best Practices

* Organize files with clear, descriptive names
* Compress large files when possible
* Include readme files for installation or usage instructions
* Regularly verify file integrity

**Pro Tips**

* Consider providing multiple file formats when relevant
* Include version numbers in file names if applicable

## Common Use Cases

* **Digital Products:** eBooks, music, videos, or software
* **Documentation:** User manuals, guides, or specifications
* **Resources:** Templates, assets, or tools
* **Educational Content:** Course materials or supplementary resources

## Security Features

Creem's file download system implements several security measures:

* Secure, expiring download links
* Protected file storage
* Download attempt monitoring
* Automated abuse prevention

**Need Help?**

Our support team is ready to assist you with setting up file downloads. Contact us at [support@creem.co](mailto:support@creem.co)


# Introduction
Source: https://docs.creem.io/features/introduction

Understand what are, and how to use product features.

Welcome to Creem's Product Features documentation! This guide will help you understand what product features are and how to effectively implement them in your products.

<Frame>
  <iframe width="560" height="315" src="https://www.youtube.com/embed/cf9zzYtwF7g" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen />
</Frame>

## What are product features?

Product features are powerful add-ons that enhance your product's functionality and value proposition. They are specialized components that can be attached to any product, providing additional benefits to your customers during or after their purchase.

## Available Features

Creem offers several powerful features that you can integrate into your products seamlessly:

* **License Keys:** Implement secure software licensing with automated key generation and validation
* **Private Notes:** Share important information automatically with customers post-purchase
* **Custom Fields:** Collect additional information from customers during checkout
* **File Downloads:** Securely distribute digital files and manage download access for customers

## Best Practices

* Only enable features that add value to your specific product
* Configure features before making your product live
* Test the customer experience thoroughly
* Keep documentation updated with feature changes

<Info>
  **Pro Tips**

  * Use features in combination for maximum impact
  * Consider your customer journey when configuring features
  * Monitor feature usage through analytics
  * Regularly review and update feature configurations
</Info>

## Integration Examples

Here's how different types of products typically use features:

| **Product Type** | **Recommended Features**      | **Common Use Case**                                    |
| ---------------- | ----------------------------- | ------------------------------------------------------ |
| Software         | License Keys, Private Notes   | Distribute activation keys and installation guides     |
| Digital Content  | Private Notes, File Downloads | Share access instructions and collect user preferences |
| Services         | Custom Fields, Private Notes  | Gather client information and share onboarding details |

Our support team is ready to assist you with implementing and configuring product features. Contact us at [support@creem.co](mailto:support@creem.co)

<CardGroup cols={2}>
  <Card title="Private Notes" icon="face-zipper" href="https://docs.creem.io/features/private-notes/overview">
    Create customers dynamically and manage their subscriptions.
  </Card>

  <Card title="License Keys" icon="key" href="https://docs.creem.io/features/licenses/introduction">
    Create checkout sessions with dynamic products and prices.
  </Card>

  <Card title="Custom Fields" icon="input-text" href="https://docs.creem.io/features/custom-fields/overview">
    Build interactive features and designs to guide your users.
  </Card>

  <Card title="File Downloads" icon="download" href="https://docs.creem.io/features/downloads/overview">
    Understand how our subscription object works and how to manage them.
  </Card>
</CardGroup>


# Activate License
Source: https://docs.creem.io/features/licenses/activate

Activate a license key from your customer."


## Activate License Endpoint

The activate endpoint is used to register a new device or instance with a valid license key. This is typically done when a user first sets up your application.

The activation endpoint is a crucial component of your license management system. Here's a deeper look at how it works and its benefits:

### Common Use Cases

* **Initial Software Setup:** When users first install your application and enter their license key
* **Device Migration:** When users need to activate your software on a new device
* **Multi-device Scenarios:** For users who need to use your software across multiple machines
* **Cloud Instance Deployment:** When spinning up new cloud instances that require license validation

### Benefits of the Activation System

* **Prevents Unauthorized Usage:** Each activation is tracked and counted against the license limit
* **User Flexibility:** Allows users to manage their own device activations within their quota
* **Usage Analytics:** Provides insights into how and where your software is being used
* **Fraud Prevention:** Helps identify and prevent license key sharing or abuse

### Activation Flow Example

Here's how a typical activation flow works:

1. User purchases your software and receives a license key
2. User installs your application on their device
3. Application prompts for license key during first launch
4. Application generates a unique instance name (usually based on device characteristics)
5. Activation request is sent to the API
6. Upon successful activation, the instance ID is stored locally for future validation

<aside>
  **Pro Implementation Tips**

  * Generate meaningful instance names that help users identify their devices
  * Store activation tokens securely using system keychains or encrypted storage
  * Implement automatic retry logic for failed activation attempts
  * Add clear user feedback for activation status and remaining device quota
</aside>

The activation endpoint is designed to be both secure and user-friendly, providing a smooth experience for legitimate users while maintaining strong protection against unauthorized usage.

### Endpoint Details

* **URL:** `https://test-api.creem.io/v1/licenses/activate`
* **Method:** POST
* **Authentication:** Requires API key in headers

### Request Parameters

The request body should include:

* **key** (required): The license key to activate
* **instance\_name** (required): A unique identifier for the device/installation

### Response Format

```json
{
  "id": "<string>",
  "mode": "test",
  "object": "<string>",
  "status": "active",
  "key": "ABC123-XYZ456-XYZ456-XYZ456",
  "activation": 5,
  "activation_limit": 1,
  "expires_at": "2023-09-13T00:00:00Z",
  "created_at": "2023-09-13T00:00:00Z",
  "instance": [
    {
      "id": "<string>",
      "mode": "test",
      "object": "license-instance",
      "name": "My Customer License Instance",
      "status": "active",
      "created_at": "2023-09-13T00:00:00Z"
    }
  ]
}
```

### Implementation Examples

* cURL Example:

  ```bash
  curl -X POST https://test-api.creem.io/v1/licenses/activate \
    -H "accept: application/json" \
    -H "x-api-key: YOUR_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "key": "ABC123-XYZ456-XYZ456-XYZ456",
      "instance_name": "johns-macbook-pro"
    }'
  ```

* Python Example:

  ```python
  import requests

  def activate_license(license_key, instance_name):
      url = "https://test-api.creem.io/v1/licenses/activate"
      headers = {
          "accept": "application/json",
          "x-api-key": "YOUR_API_KEY",
          "Content-Type": "application/json"
      }
      data = {
          "key": license_key,
          "instance_name": instance_name
      }
      
      response = requests.post(url, json=data, headers=headers)
      return response.json()
  ```

* JavaScript Example:

  ```jsx
  const activateLicense = async (licenseKey, instanceName) => {
    const response = await fetch('https://test-api.creem.io/v1/licenses/activate', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'x-api-key': 'YOUR_API_KEY',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key: licenseKey,
        instance_name: instanceName
      })
    });
    return await response.json();
  }
  ```

### Error Handling

Common error responses include:

* **400 Bad Request:** Invalid or missing parameters
* **401 Unauthorized:** Invalid API key
* **403 Forbidden:** License key has reached activation limit
* **404 Not Found:** Invalid license key

<aside>
  **Best Practices for Activation**

  * Store the returned instance\_id securely - you'll need it for future validation
  * Implement retry logic for network failures
  * Add clear error messages for users
  * Consider implementing offline activation for certain scenarios
</aside>


# Deactivate License
Source: https://docs.creem.io/features/licenses/deactivate

Deactivate a license key instance from your customer."


# License Key Deactivation with Creem

The deactivation endpoint allows you to remove a device's access to a license key. This documentation will guide you through implementing license deactivation in your application.

## Overview

License deactivation is essential for managing device transfers, subscription cancellations, and maintaining security of your software.

1. Key Deactivation Features
   * **Instance Management:** Remove specific device instances from active licenses
   * **Activation Slot Recovery:** Free up slots for new device activations
   * **Usage Tracking:** Monitor deactivation history and remaining slots
   * **Automatic Cleanup:** Clear associated device data upon deactivation

### Deactivation Flow Example

Here's how the deactivation process typically works:

1. User initiates deactivation (e.g., switching devices)
2. Application retrieves stored license key and instance ID
3. Sends deactivation request to Creem API
4. Cleans up local license data
5. Provides feedback to user about deactivation status

<aside>
  **Implementation Best Practices**

  * Always confirm deactivation with users before proceeding
  * Clear all local license data after successful deactivation
  * Implement proper error handling for failed deactivations
  * Keep records of deactivation history for support purposes
</aside>

### Endpoint Details

* **URL:** `https://test-api.creem.io/v1/licenses/deactivate`
* **Method:** POST
* **Authentication:** Requires API key in headers

### Request Parameters

The request body should include:

* **key** (required): The license key to deactivate
* **instance\_id** (required): The instance ID to deactivate

### Response Format

```json
{
  "id": "<string>",
  "mode": "test",
  "object": "<string>",
  "status": "active",
  "key": "ABC123-XYZ456-XYZ456-XYZ456",
  "activation": 5,
  "activation_limit": 1,
  "expires_at": "2023-09-13T00:00:00Z",
  "created_at": "2023-09-13T00:00:00Z",
  "instance": [
    {
      "id": "<string>",
      "mode": "test",
      "object": "license-instance",
      "name": "My Customer License Instance",
      "status": "active",
      "created_at": "2023-09-13T00:00:00Z"
    }
  ]
}
```

### Implementation Examples

* JavaScript Example:

  ```jsx
  const deactivateLicense = async (licenseKey, instanceId) => {
    const response = await fetch('https://test-api.creem.io/v1/licenses/deactivate', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'x-api-key': 'YOUR_API_KEY',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key: licenseKey,
        instance_id: instanceId
      })
    });
    return await response.json();
  }
  ```

* cURL Example:

  ```bash
  curl -X POST https://api.creem.io/v1/licenses/deactivate \
    -H "accept: application/json" \
    -H "x-api-key: YOUR_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "key": "ABC123-XYZ456-XYZ456-XYZ456",
      "instance_id": "inst_xyz123"
    }'
  ```

* Python Example:

  ```python
  import requests

  def deactivate_license(license_key, instance_id):
      url = "https://test-api.creem.io/v1/licenses/deactivate"
      headers = {
          "accept": "application/json",
          "x-api-key": "YOUR_API_KEY",
          "Content-Type": "application/json"
      }
      data = {
          "key": license_key,
          "instance_id": instance_id
      }
      
      response = requests.post(url, json=data, headers=headers)
      return response.json()
  ```

### Error Handling

Common error responses include:

* **400 Bad Request:** Invalid or missing parameters
* **401 Unauthorized:** Invalid API key
* **404 Not Found:** Invalid license key or instance ID
* **409 Conflict:** Instance already deactivated

<aside>
  **Deactivation Tips**

  * Implement confirmation dialogs before deactivation
  * Add proper error messaging for failed deactivations
  * Consider implementing a reactivation grace period
  * Maintain deactivation logs for customer support
</aside>


# Introduction
Source: https://docs.creem.io/features/licenses/introduction

Use the license key feature to enable access to your products."


<Frame>
  <img style={{ borderRadius: '0.5rem' }} src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/license%20keys-XBUgDtopz2145wlmInbpZsUlJHCZdd.png" />
</Frame>

# License Key Management with Creem

Welcome to Creem's License Key documentation! As a Merchant of Record specializing in Micro-SaaS and AI Businesses, we've built a powerful license key system that's both flexible and secure.

## Getting Started

Setting up license keys for your product is straightforward:

1. Configuring
   * Create a new product with a License key feature enabled
   * Configure settings related to the licenses
   * Set up your product integration or payment links for customer purchases
2. Dealing wiht a license after purchases
   * Enable the user to enter a license key in your application
   * Activate a license key instance
   * Validate a license key instance on subsequent usages

## Step-by-Step Tutorial: Implementing License Keys

Let's walk through the complete process of implementing license keys in your application. We'll cover everything from initial setup to handling customer interactions.

### Step 1: Creating Your Product

First, let's set up your product in the Creem dashboard:

1. **Navigate to Products:** Log into your Creem dashboard and click "Create New Product"
2. **Enable License Keys:** In the product settings, enable the "License Key Management" feature
3. **Configure License Settings:**
   * Set activation limits (e.g., 3 devices per license)
   * Define expiration periods (e.g., 1 year from purchase)

<Frame>
  <img style={{ borderRadius: '0.5rem' }} src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/license-key-AdvcFBwr9QNaTibjYiyqAvVjcaFqEj.gif" />
</Frame>

### Step 2: Customer Purchase Flow

When a customer purchases your product, here's what happens automatically:

* A unique license key is generated and associated with their purchase
* The key appears in their order confirmation page
* It's included in their email receipt
* The key is accessible in their customer portal

<Frame>
  <img style={{ borderRadius: '0.5rem' }} src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/license-key-email-receipt-3ZvZMimmpwgfxWV2ToQV5bTFvRP5oK.png" />
</Frame>

### Step 3: Implementing License Key Activation

Now comes the exciting part - implementing the license key system in your application!

1. Create a License Key Input form or input field where users can enter their license key. This could be during:

* Initial app setup
* First launch
* Account creation
* Premium feature access

2. Implement the Activation Endpoint

   ```jsx
   const activateLicense = async (licenseKey, instanceName) => {
     const response = await fetch('https://test-api.creem.io/v1/licenses/activate', {
       method: 'POST',
       headers: {
         'accept': 'application/json',
         'x-api-key': 'YOUR_API_KEY',
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({
         key: licenseKey,
         instance_name: instanceName
       })
     });
     return await response.json();
   }
   ```

<Tip>
  The InstanceName field is an arbitrary name of your choice.
  Merchants usually use the internal customer ID, or customer email for quality of life maintainibility
</Tip>

### Step 4: Ongoing License Validation

To ensure continued valid usage, implement regular license checks:

* Validate on application startup
* Check before accessing premium features
* Periodically verify license status (e.g., daily)
* Implementation Example:

  ```jsx
  const validateLicense = async (licenseKey, instanceId) => {
    const response = await fetch('https://test-api.creem.io/v1/licenses/validate', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'x-api-key': 'YOUR_API_KEY',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key: licenseKey,
        instance_id: instanceId
      })
    });
    return await response.json();
  }
  ```

### Step 5: Handling License Deactivation

There are several scenarios where you might need to deactivate a license:

* User requests to transfer their license to a new device
* Subscription cancellation
* Suspicious activity detection
* Deactivation Implementation:

  ```jsx
  const deactivateLicense = async (licenseKey, instanceId) => {
    const response = await fetch('https://test-api.creem.io/v1/licenses/deactivate', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'x-api-key': 'YOUR_API_KEY',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key: licenseKey,
        instance_id: instanceId
      })
    });
    return await response.json();
  }
  ```

<aside>
  **Pro Tips for Implementation**

  * Store the instance\_id securely after successful activation
  * Implement graceful error handling for network issues
  * Add clear user feedback for all license-related actions
  * Consider implementing an offline grace period
</aside>

<aside>
  **Common Pitfalls to Avoid**

  * Don't store API keys in client-side code
  * Never expose the full license validation logic to end users
  * Don't forget to handle edge cases (expired licenses, network errors)
</aside>

## Best Practices

* Always validate license keys on startup and critical operations
* Implement offline fallback mechanisms
* Cache validation results to prevent excessive API calls
* Securely store API keys and never expose them client-side

<aside>
  **Need Help?**

  Our support team is ready to assist you with license key implementation. Contact us at [support@creem.co](mailto:support@creem.co)
</aside>

## Security Considerations

Creem's license key system implements several security measures:

* Encrypted communication channels
* Automatic suspicious activity detection
* Regular security audits and updates

## API Reference

For detailed API documentation, visit:

* [License Key API Reference](http://docs.creem.io/api-reference/endpoint/validate-license)


# Validate License
Source: https://docs.creem.io/features/licenses/validate

Validate a license key from your customer."


# License Key Validation with Creem

The validation endpoint allows you to verify if a license key is still valid and active. This documentation will guide you through implementing license validation in your application.

## Overview

License validation is a crucial part of maintaining software security and ensuring proper usage of your product.

1. Key Validation Features
   * **Real-time Status:** Get immediate feedback on license validity
   * **Feature Access:** Check which features are enabled for the license
   * **Quota Management:** Track remaining usage quotas
   * **Expiration Checking:** Verify if the license is still within its valid period

### Validation Flow Example

Here's how the validation process typically works:

1. Application starts up or performs periodic check
2. Retrieves stored license key and instance ID
3. Sends validation request to Creem API
4. Processes response and updates application state
5. Handles any validation errors or expired licenses

<aside>
  **Implementation Best Practices**

  * Cache validation results locally to reduce API calls
  * Implement graceful degradation for offline scenarios
  * Add clear user feedback for validation status
  * Handle network errors and retry scenarios appropriately
</aside>

### Endpoint Details

* **URL:** `https://test-api.creem.io/v1/licenses/validate`
* **Method:** POST
* **Authentication:** Requires API key in headers

### Request Parameters

The request body should include:

* **key** (required): The license key to validate
* **instance\_id** (required): The instance ID received during activation

### Response Format

```json
{
  "id": "<string>",
  "mode": "test",
  "object": "<string>",
  "status": "active",
  "key": "ABC123-XYZ456-XYZ456-XYZ456",
  "activation": 5,
  "activation_limit": 1,
  "expires_at": "2023-09-13T00:00:00Z",
  "created_at": "2023-09-13T00:00:00Z",
  "instance": [
    {
      "id": "<string>",
      "mode": "test",
      "object": "license-instance",
      "name": "My Customer License Instance",
      "status": "active",
      "created_at": "2023-09-13T00:00:00Z"
    }
  ]
}
```

### Implementation Examples

* JavaScript Example:

  ```jsx
  const validateLicense = async (licenseKey, instanceId) => {
    const response = await fetch('https://test-api.creem.io/v1/licenses/validate', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'x-api-key': 'YOUR_API_KEY',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key: licenseKey,
        instance_id: instanceId
      })
    });
    return await response.json();
  }
  ```

* cURL Example:

  ```bash
  curl -X POST https://test-api.creem.io/v1/licenses/validate \
    -H "accept: application/json" \
    -H "x-api-key: YOUR_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "key": "MYAPP_12345",
      "instance_id": "inst_xyz123"
    }'
  ```

* Python Example:

  ```python
  import requests

  def validate_license(license_key, instance_id):
      url = "https://test-api.creem.io/v1/licenses/validate"
      headers = {
          "accept": "application/json",
          "x-api-key": "YOUR_API_KEY",
          "Content-Type": "application/json"
      }
      data = {
          "key": license_key,
          "instance_id": instance_id
      }
      
      response = requests.post(url, json=data, headers=headers)
      return response.json()
  ```

### Error Handling

Common error responses include:

* **400 Bad Request:** Invalid or missing parameters
* **401 Unauthorized:** Invalid API key
* **404 Not Found:** Invalid license key or instance ID
* **410 Gone:** License has been revoked or expired

<aside>
  **Validation Tips**

  * Implement a validation cache to prevent excessive API calls
  * Add retry logic with exponential backoff
  * Consider implementing offline grace periods
  * Keep logs of validation attempts for troubleshooting
</aside>


# Overview
Source: https://docs.creem.io/features/private-notes/overview

Display private notes for users after they complete a purchase of your product."


# Private Notes with Creem

Welcome to Creem's Private Notes documentation! This feature allows you to seamlessly include private notes that are automatically shared with customers after their purchase.

## Getting Started

Setting up private notes for your product is straightforward and requires minimal configuration:

1. Navigate to Your Product Settings
   * Log into your Creem Dashboard
   * Go to "Products" section
   * Create a new product
   * Enable "Private Notes" feature

<Frame>
  <img style={{ borderRadius: '0.5rem' }} src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/private-note-demo-w45RfXXJDCgwM3y6xMBbOjrPInh6bL.gif" />
</Frame>

2. Configure Your Private Note
   * Enter the note content that customers will receive
   * Save your configuration

## How It Works

Once configured, the private note system works automatically. When a customer completes a purchase, they'll receive your private note in multiple locations:

* **Email Receipt:** The private note appears in the purchase confirmation email

<Frame>
  <img style={{ borderRadius: '0.5rem' }} src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/customer-portal-private-note-ZbD01LtLx7H2IK5wBCNPGCkpjZE8sb.png" />
</Frame>

* **Customer Portal:** Customers can access the note anytime through their portal

<Frame>
  <img style={{ borderRadius: '0.5rem' }} src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/private-note-demo-w45RfXXJDCgwM3y6xMBbOjrPInh6bL.gif" />
</Frame>

* **Order Confirmation Page:** The note is displayed immediately after purchase (when no redirect URL is set)

<Frame>
  <img style={{ borderRadius: '0.5rem' }} src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/order-confirmation-private-note-sTU9x7YEiMSgCdOPhF99nk5AZPKBVM.png" />
</Frame>

## Best Practices

* Keep notes clear and concise
* Include relevant information for post-purchase actions
* Consider adding support contact information
* Use different notes as needed for different product versions

**Pro Tips**

* Use formatting to highlight important information
* Include next steps if applicable
* Consider different customer scenarios when writing your note

## Common Use Cases

* **Service Purchases:** Share onboarding information or next steps
* **Course Access:** Provide login credentials or access instructions
* **Digital Content:** Password to spreadsheets
* **Premium Customer Support:** Contact numbers, emails or other channels

<aside>
  **Need Help?**

  Our support team is ready to assist you with setting up private notes. Contact us at [support@creem.co](mailto:support@creem.co)
</aside>


# Merchant of Record
Source: https://docs.creem.io/finance/merchant-of-record

A quick overview of the Merchant of Record framework.

## Overview

A merchant of record (sometimes shortened to “MoR”) is a legal entity that takes on the responsibility of selling goods and services to end customers, handling everything from payments to compliance.

## What is a Merchant of Record?

A Merchant of Record (MoR) is the legal entity responsible for selling goods or services to end customers. When customers make a purchase through Creem, they are technically buying from us as the Merchant of Record. This means we handle all aspects of the transaction, including payment processing, sales tax collection, refund management, chargeback handling, etc.

## Is Creem a Merchant of Record?

<Tip>
  Yes!
  Creem acts as your Merchant of Record, taking on all the complex financial and legal responsibilities so you can focus on what matters most - building and growing your SaaS business.
</Tip>

We handle:

* **Payment processing and tax compliance across different markets**
* **Management of refunds and chargebacks**
* **Sales tax collection and remittance**

## Further reading

Want to learn more about how the Merchant of Record model works?

[Learn more about MoR](https://www.creem.io/blog/merchant-of-record).

Read our detailed guide on Understanding the Merchant of Record Business Model, where we break down the key benefits and explain why it's crucial for modern and lean SaaS businesses.


# Payments
Source: https://docs.creem.io/finance/payments

What happens when a payment is processed through Creem

## Benefits

Creem democratizes SaaS financial operations by serving as your merchant of record, enabling immediate payment acceptance, handling all the headaches with tax compliance, VAT requirements, and fraud prevention, while supporting global transactions with competitive, transparent pricing.

## Merchant of Record

As your merchant of record, Creem eliminates the complexities of managing international sales and compliance. We handle all the intricate details of tax collection, VAT requirements, and regulatory compliance, allowing you to focus on growing your business while we manage the financial backend. Our commitment to transparency means no hidden fees or surprise charges - just clear, competitive rates that help you scale confidently.

<CardGroup cols={1}>
  <Card title="Merchant of Record" icon="credit-card-front" href="/payments/merchant-of-record">
    Learn what is a Merchant of Record, and how that can help your business
  </Card>
</CardGroup>

In essence, you can focus entirely on growing your business while we meticulously handle every aspect of your financial operations, ensuring seamless transactions across borders.

Your business will appreciate our highly competitive rates and straightforward fee structure, making international expansion more accessible than ever.

## Payment Methods

Creem supports a wide range of payment methods to help you reach customers globally. Below is a list of currently supported payment methods, though this is not exhaustive as we are constantly working to add new options to our capabilities. You can expect new payment methods to be added frequently.

### Currently Supported Payment Methods

* Credit Cards
* Apple Pay
* Bancontact
* Blik
* Cartes Bancaires
* EPS
* Google Pay
* IDEAL
* Link
* MobilePay

<Tip>
  The payment methods displayed on a checkout page vary significantly based on several factors:

  * The type of product (One-Time Payment vs Subscription)
  * Your customer's location
  * Your customer's billing address
  * The price of your product
  * The device your customer is using to access the checkout page
</Tip>

We automatically optimize the checkout experience to show the most relevant payment methods for each customer, increasing conversion rates and providing a seamless payment experience.

<CardGroup cols={2}>
  <Card title="Global Reach" icon="globe">
    Accept payments from customers worldwide with localized payment methods.
  </Card>

  <Card title="Optimized Conversion" icon="chart-line">
    We show the right payment methods to the right customers at the right time.
  </Card>
</CardGroup>

## Learn more about Creem Finance operations

Create customers and subscriptions, manage your products, and much more. Check out our guides to get the most out of Creem.

<CardGroup cols={2}>
  <Card title="Payouts" icon="credit-card-front" href="/payments/payouts">
    Receive payments without any code or integration.
  </Card>

  <Card title="Standard Integration" icon="basket-shopping" href="/payments/refunds">
    Create checkout sessions dynamically in your app
  </Card>
</CardGroup>


# Payouts
Source: https://docs.creem.io/finance/payouts

How payouts from Creem work.

## Fees and Payout Schedule

Get familiar with the fees and payout schedule associated with using Creem.

## Platform Fee

When you make a sale using Creem, we take a small fee, known as the "platform fee", to cover the costs of credit card transaction fees, currency conversion fees, taxes (yes, we cover taxes) etc. The net sales will be paid out to your bank account.

[Learn more about our pricing](https://www.creem.io/pricing).

The platform fee is calculated on the total order value and collected when the order is placed.

Here's an example breakdown where someone in France (20% VAT) buys a digital product with a card.

| Description                             | Amount  |
| --------------------------------------- | ------- |
| Product price                           | \$20.00 |
| Tax (20% VAT)                           | \$4.00  |
| Total                                   | \$24.00 |
| Platform fee (3.9% + 0.40c)             | \$1.33  |
| Net profit (total - tax - platform fee) | \$18.67 |

## Payout Fees

Payouts do not incur any additional fees if no external services are used to transfer money to your bank account.

You can receive payouts without any transfer costs from SEPA countries and European Union. We plan to expand this list soon.

If your country is outside of the European Union region, Creem will charge from 7USD/EUR to 1% of the payout amount, whichever is higher, to cover international transfer costs.
Conversion rates are automatically applied by Stripe and other partners in case you registered a bank account that is not in the currency that you are charging products with.
In that case, a small conversion fee from our Partners will be applied, which is outside of our control.

### Stablecoin Payouts (USDC via Polygon)

Creem also supports payouts in USDC using the Polygon Network. This allows you to receive your funds quickly and securely in stablecoins, directly to your compatible wallet address.

* Supported stablecoin: **USDC**
* Network: **Polygon**
* Fee: **2% of the payout volume**

To use this option, ensure your wallet supports USDC on Polygon. When registering a payout account, select the stablecoin payout method and provide your wallet address. The payout will be processed in the next available payout window, subject to the 2% fee.

## Payout Schedule

Payouts are always executed twice per month:

* On the 1st day of the month
* On the 15th day of the month

To be eligible for a payout, you need to achieve a minimum balance of 50 USD or 50 EUR. Once you reach this threshold, the "withdraw" button will be enabled for you on your balance page.

When you click on the withdraw button, your store will be automatically added to our payout schedule queue, and your payout will be executed on the next available window (1st or 15th of the month).

After the payout is processed, you will see a new payout item on the payout activity tab of your balance page, with a reverse invoice available for download for tax purposes.

If the payout day falls on a weekend or a public holiday, delays might occur due to our banking partners, and the payout will be executed on the next business day.

## Transfer Limits

Creem is actively working to increase the number of banking partners it operates with.
At the moment, there are some countries in which transfer limits are imposed:

### China

* Individual recipient: UnionPay, Alipay
* Business recipient: Local Bank Account

Receiving via UnionPay:
You can receive up to 33,000 CNY per payout

Receiving via Alipay:
You can receive up to 50,000 CNY per payout and between 300,000—600,000 CNY per year

Receiving via Local Bank account:
Unlimited

## Important Note on Payout Availability

Please note that if you have applied for a payout, we will only be able to execute your available balance on that date. Stripe requires a 7-12 day hold on any payments received on your account for risk assessment purposes.

For example, if you are getting your payout executed on the 15th, only funds that were processed via payments before the 8th day of the calendar month will be available for withdrawal on that specific payout.

## Custom Pricing

If you're a fast-growing or established large-scale business, sell products lower than \$10, or have a business model that processes a high volume of transactions, [contact our sales team](https://www.creem.io/contact) for custom pricing.


# Refunds and Chargebacks
Source: https://docs.creem.io/finance/refunds

How Creem handles refunds and chargebacks.

Creem empowers sellers with the flexibility to establish their own refund policies while maintaining the right to process refunds within 60 days to prevent chargebacks.

## Refunds

At Creem, we believe in giving sellers the autonomy to determine refund policies that align with their business objectives and requirements. If you opt to offer refunds, they can be processed at any time through the Creem dashboard. The refunded amount will be deducted from your upcoming payout.

However, to protect against chargebacks, Creem reserves the right to issue refunds within 60 days of purchase at our discretion. Even if you maintain a "no refunds" policy, please note that customers retain the ability to initiate chargebacks against their purchases at any time.

## Chargebacks

A chargeback (also known as a charge reversal or dispute) occurs when a customer requests their credit card provider to reverse a charge on their statement. These disputes can arise for various reasons, with fraud being a common trigger.

As part of our commitment to transparent financial operations, Creem takes responsibility for managing chargebacks against your sales. When a chargeback occurs, we typically process a full refund on your behalf, deducting the refunded amount.

Common reasons for chargebacks include:

* **Fraudulent transactions using stolen credit card information, leading to charge cancellation by the credit card provider**
* **Customers failing to recognize the charge on their statement and requesting a reversal**
* **Customers disputing product delivery and bypassing the refund process by directly contacting their credit card provider**

In the event of a chargeback, Creem will provide comprehensive information to the payment provider to advocate on your behalf. However, our involvement is limited by legal constraints, and the final decision rests with the payment provider.

To maintain the integrity of our platform and protect all users, Creem may take action, including account suspension, if a store experiences an excessive number of chargebacks.


# How to cancel a subscription
Source: https://docs.creem.io/for-customers/how-to-cancel-subscription

Learn how to easily manage your orders.

#### How do I cancel subscriptions that I'm being charged for?

Subscriptions can be cancelled at any time, but you will also lose access to the service or software that you are paying for. You can manage subscriptions and cancel them via [my orders →](https://creem.io/my-orders/login)

### How do I request a refund from Creem?

Refunds are handled by the original merchant that you purchased your item from.
If there was a problem with the item that you paid for, please be respectful and attempt to contact the original seller using your email receipt.
You can find the merchant contact email on the bottom of the email receipt.

If a long-standing issue persists and you still couldn't resolve it with the seller that you purchased your item from you can speak to us. [Contact us→](https://creem.io/contact)

### Can I contact you about a charge?

If you have any questions about a charge you don't recognize, or you have noticed an issue with one of your payments or charges you can reach out to us any time and we can investigate for you. [Contact us→](https://www.creem.io/contact)


# How to update payment method
Source: https://docs.creem.io/for-customers/how-to-update-payment-method

Learn how to easily manage your active subscription.

#### How to change the card or payment method I'm using for a subscription?

Subscriptions can be have their payment methods updated at any time. You can manage subscriptions and update your payment method via [my orders →](https://creem.io/my-orders/login)

### Can I contact you about a charge?

If you have any questions about a charge you don't recognize, or you have noticed an issue with one of your payments or charges you can reach out to us any time and we can investigate for you. [Contact us→](https://www.creem.io/contact)


# Why did Creem charge me
Source: https://docs.creem.io/for-customers/why-creem-charged-me

Why do I have a charge from CREEM.IO* STORE?.

#### Find out why you see a charge from Creem.

Do you have a charge from Creem or CREEM.IO\* STORE and don’t know why? Don't worry, we’ll explain why this is normal.

You’ve probably noticed a charge from CREEM.IO\* STORE on your credit card or bank statement and not always understood why. We'll clear up why you are seeing these charges and why it's completely normal.

### What is Creem?

As a Merchant of Record, Creem is responsible for providing tax compliance and payment infrastructure to thousands of companies around the globe. We enable makers and merchants to sell digital products, subscriptions, software licenses, and courses with ease. We ensure payments between customer and merchant are safe, secure and simple.

### Why am I seeing charges from Creem or CREEM.IO\* STORE ?

If you are seeing charges on your bank or card statements from CREEM.IO then this relates to a recent purchase that you made for a digital product, subscription service or piece of software from one of our many merchants. You can access any item(s) you purchased by viewing your orders page and entering your email address, or login details. [Go to my orders →](https://creem.io/my-orders/login)

### Are you the merchant of record?

Yes.
We help companies to rid themselves of the burden and legal responsibility of collecting and reporting Tax and EU VAT. As a result Creem is a Merchant of Record, and this is why our name is appearing on your statements. [Learn more →](https://docs.creem.io/finance/merchant-of-record)

### Why are merchants selling via Creem?

Selling digital products online is complicated, so Creem is used by sellers across the globe to help simplify payments and tax. Your favorite merchants are using Creem so that we can handle the complicated financial admin for them and they can focus on building kick-ass digital goods for you to enjoy. [Learn more →](https://docs.creem.io/finance/payments)

### Can I contact you about a charge?

If you have any questions about a charge you don't recognize, or you have noticed an issue with one of your payments or charges you can reach out to us any time and we can investigate for you. [Contact us→](https://www.creem.io/contact)


# Affilliates
Source: https://docs.creem.io/integrations/affiliates

Create affiliate programs while processing transactions through Creem.

<Frame>
  <img style={{ borderRadius: '0.5rem' }} src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/affonso-creem-header-w8VVkJeYvH6pqIU4vAKZfUNeFbAGOP.png" />
</Frame>

## Overview

Welcome to the integration guide for Creem and Affonso! This partnership enables automated affiliate program management with seamless payment processing.

<Frame>
  <img style={{ borderRadius: '0.5rem' }} src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/affonso_affiliate_marketing_software-ezgif.com-video-to-gif-converter-BdEJUnHONBC320i0DV6sJttZLVU5vK.gif" />
</Frame>

This integration allows you to leverage Affonso's affiliate tracking and management alongside Creem's robust payment processing. Your affiliates can be automatically tracked, and their commissions paid separately from your business financials.

<Accordion title="What you'll learn.">
  How to integrate Affonso's affiliate management capabilities with Creem's payment processing to automate your affiliate program and scale your business.
</Accordion>

<Card title="Requirements" icon="gears">
  * A Creem account
  * An Affonso account
  * Your Creem API keys
</Card>

## Integration Steps

The below animation shows all the necessary steps to integrate your Creem account with Affonso in less than 2 minutes.

<Frame>
  <img style={{ borderRadius: '0.5rem' }} src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/affonso-demo-lOWhhy7QthodLdVQrikxlKIe17CFTF.gif" />
</Frame>

### 1. Installing the Creem plugin

<Accordion title="1.1 Access Plugin Installation.">
  Navigate to your Affonso dashboard and create a new Affiliate Program.
  After creating a new Affiliate Program:

  * Open the created affiliate program
  * Click the "Connect" tab
  * Click on the "Creem" tab
</Accordion>

<Accordion title="1.2 Configure API Keys.">
  You'll need to add your Creem API keys to establish the connection:

  * Within Creem dashboard, click on the "Developers" tab
  * Get your API keys from Creem's Developer Settings
  * Copy the API keys into Affonso dashboard
  * Click the connect button.
  * Copy the Webhook URL displayed
</Accordion>

### 2. Creating a Webhook to track affiliates

<Accordion title="2.1 Create new Creem webhook.">
  Within Creem dashboard, click on the "Developers" tab

  * On the "Developers" tab, click the "Webhooks" tab
  * Click the "Add Webhook" button
  * Name it appropriately (e.g. "Affonso Webhook", "Affiliates Webhook")
  * Paste the Webhook URL generated from step 1.2
</Accordion>

### 3. Add Affonso tracking capabilities into your product.

<Accordion title="3.1 Add affonso script.">
  ```html
  <!-- Place in <head> tag -->
  <script 
    async 
    defer
    src="https://affonso.io/js/pixel.js" 
    data-affonso="cm4ya9sik0009l9fbcvl9m05z" 
    data-cookie_duration="1">
  </script>
  ```

  This script is essential for Affonso to function. When a user visits your website through an affiliate link, it automatically creates a referral with the status "Visited link" and stores a referral cookie on their device.

  The script creates a global window\.Affonso object that you'll use in the next step to track successful signups.
</Accordion>

<Accordion title="3.2 Track User Signups.">
  ```html
  // After successful registration
  window.Affonso.signup(userEmail);
  ```

  When this function is called, Affonso system will:

  Create a new referral with status "LEAD" if a valid referral ID cookie exists
  Make the referral visible in both your and your affiliate's statistics

  <Note>
    Note: If your platform allows payments without user registration (e.g., direct checkout), you can skip this step and proceed to the next one for payment tracking.
  </Note>

  <Info>
    Best Practice: Call this function for all signups, regardless of the traffic source. The system will only create referrals when a valid referral ID cookie is present. Place the code:

    After successful registration for immediate tracking
    After email verification if you use double opt-in (DOI)
  </Info>
</Accordion>

<Tip>
  For more advanced tracking documentation, or further examples in several languages, visit [Affonso](https://affonso.io) documentation.
</Tip>

## Best Practices

* Always test the integration in a development environment first
* Implement proper error handling for affiliate tracking
* Monitor webhook deliveries and set up retry mechanisms
* Regularly verify commission calculations


# AI Negotiation bot
Source: https://docs.creem.io/integrations/ai-negotiation

Let your customers negotiate with an AI bot and increase your conversions.

<Frame>
  <img style={{ borderRadius: '0.5rem' }} src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/salesnip%20demo-3Qa40JZDWF5t7uKpphUb1oOpTVKNui.gif" />
</Frame>

## Overview

We are proud to partner with SaleSnip on the cutting edge of AI and payments.

<Frame>
  <img style={{ borderRadius: '0.5rem' }} src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/creem-salesnip-zy2s61vBKxBKz2azI348ZVZWmmPJPV.png" />
</Frame>

This integration allows you to leverage Salesnip's advanced AI negotiation bot alongside Creem's robust payment processing. Your customers can negotiate prices automatically, and upon agreement, seamlessly complete their purchase through Creem's secure checkout.

<Accordion title="What you'll learn.">
  How to integrate Salesnip's AI negotiation capabilities with Creem's payment processing to automate your sales process and boost conversions.
</Accordion>

<Card title="Requirements" icon="gears">
  * A Creem account
  * A Salesnip account
  * Your Creem API keys
  * A product created in Creem
</Card>

## Integration Steps

### 1. Installing the Creem plugin

<Accordion title="1.1 Access Plugin Installation.">
  Navigate to your Salesnip dashboard and locate the "Plugins" tab within your project settings.

  * Open your Salesnip dashboard
  * Go to your project settings
  * Click on the "Plugins" tab
  * Find and select the Creem plugin
</Accordion>

<Accordion title="1.2 Configure API Keys.">
  You'll need to add your Creem API keys to establish the connection:

  * Get your API keys from Creem's Developer Settings
  * Copy both Test and Live environment API keys
  * Paste them into the respective fields in Salesnip
</Accordion>

### 2. Creating Negotiation Sessions

<Accordion title="2.1 Session Creation API.">
  ```javascript
  import axios from 'axios';

  const config = {
    enviroment: 'test',
    projectId: '[SALESNIP_PROJECT_ID]',
    productId: '[CREEM_PRODUCT_ID]',
    minimumPrice: 100,
    callbacks: {
      success: "https://example.com/callback/creem",
    },
  };

  const session = await axios.post('https://api.salesnip.com/v1/sessions/creem', config, {
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': process.env.SALESNIP_API_KEY,
    },
  });
  ```
</Accordion>

### 3. Implementation Options

<CardGroup cols={2}>
  <Card title="Hosted Negotiation Page" icon="square-1">
    Redirect customers to a ready-made negotiation page hosted by Salesnip. Upon successful negotiation, they'll automatically move to Creem's checkout.

    <Frame>
      <img style={{ borderRadius: '0.5rem' }} src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/salesnip-hosted-UdnIuOn2SdgCGucfPBXsQLeKw39LnA.png" />
    </Frame>
  </Card>

  <Card title="Embedded Widget" icon="square-2">
    Integrate the negotiation interface directly into your application for a seamless experience. Users can negotiate and checkout without leaving your site.

    <Frame>
      <img style={{ borderRadius: '0.5rem' }} src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/salesnip-embedded-PlDoCgrqeE0itJXlnZpkXwmdy21LWL.png" />
    </Frame>
  </Card>
</CardGroup>

<Accordion title="Using Hosted Negotiation Page">
  To use the hosted negotiation page, simply use the URL that is returned on the session, from section 2.1, and redirect your user to it. Upon completing the negotiation, the user will be redirected to a Creem checkout session to complete the payment.
</Accordion>

<Accordion title="Using Embedded Negotiation Widget">
  To use the embedded Widget, add SalesSnip javascript script into your application, and simply open it using the session ID, that is also returned from the session of section 2.1.

  ```javascript

  // Add the script to your HTML
  <script>
  !function(e,n){if(!n.loaded){var t,a,r=n||{};for(r.__queue=[],(n=e.createElement("script")).type="text/javascript",n.async=!0,n.src="https://cdn.salesnip.com/v1/script.min.js",(o=e.getElementsByTagName("script")[0])?o.parentNode.insertBefore(n,o):e.head.appendChild(n),r.__handler=function(e){return function(){r.__queue.push([e].concat(Array.prototype.slice.call(arguments,0)))}},t="open on off".split(" "),a=0;a<t.length;a++){var i=t[a];r[i]=r.__handler(i)}var o=new Proxy(r,{get:function(e,n){return n in e||(e[n]=r.__handler(n)),e[n]}});window.salesnip=o,window.salesnip.loaded=1}}(document,window.salesnip||{});
  </script>

  // Initialize and open the widget after retrieving the session from step 2.1
  window.salesnip.open(session.id, {
    theme: {
      mode: "dark",
    })
  ```
</Accordion>

## Best Practices

* Always implement both test and live environment configurations
* Store API keys securely and never expose them in client-side code
* Set appropriate minimum prices to ensure profitable negotiations
* Test the complete flow in the test environment before going live

### Further Reading

For more advanced use cases and detailed documentation, check out SaleSnip resources:

* [Creem Plugin](https://docs.salesnip.com/docs/creem-plugin).
* [Creem x SaleSnip API Reference](https://docs.salesnip.com/api-reference/plugins/create-a-creem-session).


# Introduction
Source: https://docs.creem.io/introduction

Creem is the payment partner you always deserved, we strive for simplicity and straightforwardness on our APIs.

{/* {
          "group": "Customers",
          "pages": [
            "learn/customers/introduction",
            "learn/customers/customer-portal"
          ]
        },
        {
          "group": "Subscriptions",
          "pages": [
            "learn/subscriptions/introduction",
            "learn/subscriptions/managing",
            "learn/subscriptions/refunds-and-cancellations"
          ]
        },
        {
          "group": "Products",
          "pages": [
            "learn/products/introduction",
            "learn/products/prices",
            "learn/products/pricing-table"
          ]
        } */}

{/* <img
  className="block dark:hidden"
  src="/images/hero-light.svg"
  alt="Hero Light"
  /> */}

## Quickstart

The first step to start using Creem is to create an account and get your API key.

After that, feel free to explore our API reference for more details. Or to jump start into our straightforward tutorial.

<CardGroup cols={2}>
  <Card title="From 0 to Hero" icon="money-bill-trend-up" href="/quickstart">
    We'll guide you through the process of receiving your first payment in 10 minutes.
  </Card>

  <Card title="Webhooks" icon="webhook" href="/learn/webhooks/introduction">
    Understand how to receive updates on your application automatically.
  </Card>
</CardGroup>

## Guides

Create customers and subscriptions, manage your products, and much more. Check out our guides to get the most out of Creem.

<CardGroup cols={2}>
  <Card title="No-Code Payments" icon="credit-card-front" href="/quickstart">
    Receive payments without any code or integration.
  </Card>

  <Card title="Standard Integration" icon="basket-shopping" href="/checkout-flow">
    Create checkout sessions dynamically in your app
  </Card>
</CardGroup>


# One Time Payments
Source: https://docs.creem.io/learn/billing/one-time-payment

One Time Payments in Creem allow you to accept single, non-recurring payments for your products and services. This documentation will guide you through the key concepts and implementation details of the one-time payment system.

## Understanding One Time Payments

A one time payment represents a single transaction between you and your customer. When a customer makes a one time payment, they are charged once for the full amount of the purchase.

## Key Concepts

### Payment Status

A payment can be in different states throughout its lifecycle:

* **Pending:** The payment has been initiated but not yet completed
* **Paid:** The payment has been successfully processed
* **Refunded:** The payment has been refunded to the customer
* **Partially Refunded:** The payment has been partially refunded to the customer

## Creating a One Time Payment

To create a one time payment, you'll need to:

1. Set up a product in your Creem dashboard
2. Generate a checkout session for the payment
3. Direct your customer to the checkout URL

### Code Example

```jsx
const paymentCheckout = await axios.post(
  `https://api.creem.io/v1/checkouts`,
  {
    product_id: 'prod_your-product-id',
    request_id: 'your-request-id',
    metadata: {
      customerId: 'your-customer-id'
    }
  },
  {
    headers: { "x-api-key": `creem_123456789` },
  }
);
```

## Managing Payments

Creem provides several payment management features:

* **Refund payments:** Process full or partial refunds directly throught the Creem Dashboard
* **Payment history:** View detailed transaction history
* **Payment metadata:** Add custom data to payments for tracking
* **Payment Custom Fields:** Add custom input fields on your checkout session that your users can fill


# Seat Based Billing
Source: https://docs.creem.io/learn/billing/seat-based-billing

Seat Based Billing in Creem enables you to charge customers based on the number of seats or users they need, supporting both one-time payments and subscription models. This documentation explains how to implement and manage seat-based billing for your products.

## Understanding Seat Based Billing

Seat Based Billing allows you to set a per-seat price for your product and let customers purchase multiple seats. This is particularly useful for team-based products, enterprise software, or any service where pricing scales with the number of users.

Seat Based Billing in Creem works for both One Time Payments and Subscriptions seamlessly without any special setup.

## Key Concepts

### Per-Seat Pricing

In Seat Based Billing:

* **Base Price:** Set in the Creem dashboard as the price per individual seat
* **Units:** Represents the number of seats being purchased
* **Total Price:** Automatically calculated as (Base Price × Units)

## Implementation

To implement Seat Based Billing, you'll need to:

1. Create a product in your Creem dashboard where the price is the base seat price
2. Generate a checkout session with the desired number of seats
3. Direct your customer to the checkout URL

### Code Example

```javascript
const seatBasedCheckout = await axios.post(
  `https://api.creem.io/v1/checkouts`,
  {
    product_id: 'prod_your-product-id',
    units: 5, // Number of seats to purchase
  },
  {
    headers: { "x-api-key": `creem_123456789` },
  }
);
```

## Managing Seat Changes

You can manage seat quantities for your customers in subscriptions by:

* **Adding seats:** Modify the subscription through the dashboard or update subscription API
* **Reducing seats:** Modify the subscription through the dashboard or update subscription API

### Update Subscription API

If you wish to add or reduce the amount of seats in a given subscription, you can use the subscription API to make changes.
Usually, it is great practice for your system to store the subscription ID of a given customer. With the subscription ID, we can then query Creem API to get all information needed to update a subscription.

1. Querying subscription details
   * With the subscription ID, call the [GET Subscription Creem API](https://docs.creem.io/api-reference/endpoint/get-subscription).
   * Retrieve the Item ID from the subscription item.

<AccordionGroup>
  <Accordion icon="table-tree" title="Retrieve subscription details">
    Query the GET Subscription Creem API with the subscription ID

    ```javascript
    const subscriptionDetails = await axios.get(
      `https://api.creem.io/v1/subscriptions?subscription_id=sub_12312312312'`,
      {
        headers: { "x-api-key": `creem_123456789` },
      }
    );

    ```
  </Accordion>

  <Accordion icon="location-crosshairs" title="Parse the response">
    Parse, locate and store the Item ID of the subscription item, located under the items array.

    ```json
    {
      "id": "sub_2O4LbygGkNJJ6VrStIZz21",
      "object": "subscription",
      "product": {
        "id": "prod_6PyZn18alhCSGwhJXHBdQ4",
        "name": "This is a product",
        "description": "This is a product",
        "image_url": null,
        "price": 1000,
        "currency": "EUR",
        "billing_type": "recurring",
        "billing_period": "every-month",
        "status": "active",
        "tax_mode": "exclusive",
        "tax_category": "saas",
        "default_success_url": "",
        "created_at": "2025-01-10T06:18:31.583Z",
        "updated_at": "2025-01-10T06:18:31.583Z",
        "mode": "local"
      },
      "customer": {
        "id": "cust_3y4k2CELGsw7n9Eeeiw2hm",
        "object": "customer",
        "email": "alec@creem.io",
        "name": "Alec Erasmus",
        "country": "NL",
        "created_at": "2024-12-09T16:09:20.709Z",
        "updated_at": "2024-12-09T16:09:20.709Z",
        "mode": "local"
      },
      "items": [
        {
          "object": "subscription_item",
          "id": "sitem_3l8jhRR2jWWhIBbJrKLwPT",
          "product_id": "prod_6PyZn18alhCSGwhJXHBdQ4",
          "price_id": "pprice_3WBdYmRIFBgaXRM3Adcdpp",
          "units": 10,
          "created_at": "2025-01-10T08:49:13.790Z",
          "updated_at": "2025-01-10T08:49:13.790Z",
          "mode": "local"
        }
      ],
      "collection_method": "charge_automatically",
      "status": "active",
      "last_transaction_id": "tran_5jcJjZ1xEczUjqYiOjPSyd",
      "last_transaction_date": "2025-01-10T08:49:22.301Z",
      "next_transaction_date": "2025-02-10T08:49:10.000Z",
      "current_period_start_date": "2025-01-10T08:49:10.000Z",
      "current_period_end_date": "2025-02-10T08:49:10.000Z",
      "canceled_at": null,
      "created_at": "2025-01-10T08:49:13.777Z",
      "updated_at": "2025-01-10T08:49:19.991Z",
      "mode": "local"
    }
    ```
  </Accordion>
</AccordionGroup>

2. Make the subscription change
   * With the Item Id and Subscription ID, call the [UPDATE subscription API](https://docs.creem.io/api-reference/endpoint/get-subscription).
   * Use the `units` field to the desired amount of seats changed.

<Accordion icon="table-tree" title="Update Subscription">
  Update the Subscription with the desired units amount

  ```javascript
  const subscriptionDetails = await axios.post(
    `https://api.creem.io/v1/subscriptions/sub_123123`,
    {
      "items": [
        {
          "id": "sitem_123213123",
          "units": 2
        }
      ]
    },
    {
      headers: { "x-api-key": `creem_123456789` },
    }
  );

  ```
</Accordion>

### Manual subscription changes through the Creem Dashboard

You can also modify subscription seats through your Creem Dashboard as a merchant.
Simply click on a subscription, and upon the details sheet opening, click on the "Modify Subscription" button

<Frame>
  <img style={{ borderRadius: '0.5rem' }} src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/Screenshot%202025-01-10%20at%2015.56.28-aOLgNWFNoWZLLpytZ5Y5H94HMl8rxb.png" />
</Frame>

### Billing after subscription updates

The new amount will be charged upon subscription renewal. If you need pro-rata charges or different use cases, contact the Creem team.

<Warning>
  Remember to validate and track seat usage in your application to ensure customers don't exceed their purchased seat limit.
</Warning>


# Product Bundles
Source: https://docs.creem.io/learn/billing/subscriptions/bundles

Learn how to create and manage Product Bundles to organize your offerings in Creem

## Overview

Product Bundles are a powerful feature in Creem that allows you to group related products together. Similar to what other platforms call "Variants", Product Bundles help you organize your offerings in a structured and customer-friendly way.

<Frame>
  <img style={{ borderRadius: '0.5rem' }} src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/productbundles-6Pd04bHFE5xhpim3BE6Oef8Sa8E2wY.png" />
</Frame>

## Understanding Product Bundles

### What are Product Bundles?

Product Bundles are collections of related products that:

* Share similar characteristics
* Represent different tiers or levels of the same service
* Work together as part of a broader offering
* Enable streamlined product management

### Key Benefits

<CardGroup cols={3}>
  <Card title="Organized Product Structure" icon="layer-group">
    * Logical grouping of related products
    * Clear hierarchy for product offerings
    * Simplified product management
  </Card>

  <Card title="Enhanced Customer Experience" icon="user-check">
    * Easy product comparison
    * Clear visualization of different tiers
    * Simplified decision-making process
  </Card>

  <Card title="Flexible Management" icon="sliders">
    * Add or remove products from bundles
    * Adjust pricing and features dynamically
    * Maintain product relationships
  </Card>
</CardGroup>

## Real-World Example

### Professional Headshots Service Bundle

Here's how a photography business might structure their offerings using Product Bundles:

<Steps>
  <Step title="Basic Package">
    A starter option priced at \$99 that includes:

    * 3 retouched photos
    * 1 outfit change
  </Step>

  <Step title="Pro Package">
    A mid-tier option priced at \$199 that includes:

    * 6 retouched photos
    * 2 outfit changes
    * LinkedIn optimization
  </Step>

  <Step title="Enterprise Package">
    A premium option priced at \$499 that includes:

    * 15 retouched photos
    * Unlimited outfit changes
    * Full rights to all images
  </Step>
</Steps>

## Creating and Managing Bundles

### Create a New Bundle

Creating product bundles in Creem is extremely easy and can be done directly through the dashboard.

### Creating a Product Bundle

You can create product bundles by navigating to the products page and clicking on the bundles tab, or by navigating directly to [https://www.creem.io/dashboard/products/bundles](https://www.creem.io/dashboard/products/bundles)

When creating a new product bundle, you simply need to select which products should be part of it from the dropdown menu. This intuitive interface makes it easy to group related products together and create tiered offerings.

During bundle creation, you'll find two important toggles that enhance customer experience:

1. **Enable Self-Service Upgrades/Downgrades**: When enabled, customers can independently upgrade or downgrade between products within this bundle through the Customer Portal. This empowers customers to manage their subscriptions without requiring merchant intervention.

2. **Enable Upsells at Checkout**: When enabled, customers will see upgrade options for higher-tier products within the bundle during checkout. If this toggle is activated, the checkout description will display the product bundle description rather than the individual product description, providing a more cohesive presentation of your tiered offerings.

These options give you flexibility in how customers interact with your product tiers and can significantly improve conversion rates through strategic upsell opportunities.

<Frame caption="Product Bundle creation interface with options for enabling self-service upgrades and checkout upsells">
  <img style={{ borderRadius: '0.5rem' }} src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/productbundlesettings-SDz7O9b9FH9Gyr8t4QioCPSXaJUhSv.png" alt="Create Product Bundle interface showing product selection and upgrade options" />
</Frame>

<Frame caption="Customer Portal view showing available upgrade options within a product bundle">
  <img style={{ borderRadius: '0.5rem' }} src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/customerportalupgrade-8gZOGPLh3zWepBzknPJ7PbLKLQao4l.png" alt="Customer view on Customer Portal when doing an upgrade" />
</Frame>

## Best Practices

### Bundle Structure

1. **Logical Grouping**
   * Group products that naturally belong together
   * Maintain clear relationships between products
   * Use consistent naming conventions across tiers

2. **Value Proposition**
   * Clearly differentiate features between tiers
   * Maintain logical price progression
   * Highlight the benefits of each tier

3. **Bundle Organization**
   * Keep bundles focused and specific
   * Avoid mixing unrelated products
   * Maintain clear documentation of bundle contents


# Introduction
Source: https://docs.creem.io/learn/billing/subscriptions/introduction

Subscriptions in Creem allow you to create recurring payment plans for your products and services. This documentation will guide you through the key concepts and implementation details of the subscription system.

## Understanding Subscriptions

A subscription represents a recurring payment agreement between you and your customer. When a customer subscribes to your product, they agree to be billed periodically (monthly, yearly, etc.) until they cancel their subscription.

## Key Concepts

### Subscription Status

A subscription can be in different states throughout its lifecycle:

* **Active:** The subscription is current and payments are being processed normally
* **Past Due:** A payment attempt has failed but the subscription is still active and retrying.
* **Canceled:** The subscription has been terminated
* **Trialing:** The subscription is in a trial period before the first payment
* **Incomplete:** The subscription and checkout session was created but not paid

### Billing Cycles

Subscriptions operate on billing cycles that determine when payments are collected. You can set up various billing intervals:

* Monthly billing
* Yearly billing
* Custom intervals (quarterly, 6 months, etc.)

## Creating a Subscription

To create a subscription, you'll need to:

1. Set up a subscription product in your Creem dashboard
2. Generate a checkout session for the subscription
3. Direct your customer to the checkout URL

### Code Example

```jsx
const subscriptionCheckout = await axios.post(
  `https://api.creem.io/v1/checkouts`,
  {
    product_id: 'prod_your-subscription-id',
  },
  {
    headers: { "x-api-key": `creem_123456789` },
  }
);
```

For more details on checkout session options, navigate to our [Checkout Session Introduction](https://docs.creem.io/learn/checkout-session/introduction)

## Managing Subscriptions

Creem provides several ways to manage active subscriptions:

* **Update billing information:** Customers can update their payment method through the customer portal
* **Cancel subscriptions:** Customers or merchants can cancel at any time, through the Dashboard, customer portal or APIs
* **Change prices:** Merchants can update the price of a subscription, that takes into effect in the next billing cycle
* **Seat Based Billing:** Merchants can update the usage of a specific subscription based on seats or units through the Dashboard or API


# Subscription Upgrades
Source: https://docs.creem.io/learn/billing/subscriptions/upgrades

Learn how to manage subscription upgrades and downgrades using Product Bundles in Creem

## Overview

Subscription upgrades and downgrades in Creem provide a seamless experience for both merchants and customers. When paired with Product Bundles, this functionality becomes even more powerful, enabling self-service subscription management and strategic upsell opportunities.

<Frame>
  <img style={{ borderRadius: "0.5rem" }} src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/product-upgrades-IHSx20ijI5xkwzqJVCdOPLhZxNXuT0.png" />
</Frame>

## Enhanced Experience with Product Bundles

Product Bundles significantly improve the subscription management experience by:

* **Self-Service Management**: Customers can upgrade or downgrade their subscriptions independently through the Customer Portal
* **Transparent Tier Comparison**: Clear visualization of features and benefits across different subscription tiers
* **Streamlined Checkout Upsells**: Present upgrade options during the initial checkout process to increase conversion to higher tiers
* **Simplified Product Organization**: Group related subscription tiers logically for easier management

By implementing Product Bundles alongside your subscription offerings, you create a more intuitive experience that empowers customers while maximizing your revenue potential through strategic tier positioning.

<Card href="/learn/billing/subscriptions/bundles" title="Product Bundles" icon="layer-group">
  Discover how Product Bundles can transform your subscription strategy by
  organizing offerings into intuitive tiers, boosting conversions, and creating
  seamless upgrade paths for your customers.
</Card>

## Managing Subscription Changes

### Programmatic Upgrades

To upgrade or downgrade a subscription programmatically, use our [subscription upgrade endpoint](/api-reference/endpoint/upgrade-subscription):

<CodeGroup>
  ```bash upgrade.sh
  curl -X POST https://api.creem.io/v1/subscriptions/sub_123/upgrade \
    -H "x-api-key: creem_123456789" \
    -H "Content-Type: application/json" \
    -d '{
      "product_id": "prod_456",
      "update_behavior": "proration-charge"
    }'
  ```

  ```typescript upgrade.ts
  import axios from "axios";

  async function upgradeSubscription(
    subscriptionId: string,
    productId: string,
    updateBehavior:
      | "proration-charge-immediately"
      | "proration-charge"
      | "proration-none" = "proration-charge",
  ) {
    const response = await axios.post(
      `https://api.creem.io/v1/subscriptions/${subscriptionId}/upgrade`,
      {
        product_id: productId,
        update_behavior: updateBehavior,
      },
      {
        headers: {
          "x-api-key": "creem_123456789",
          "Content-Type": "application/json",
        },
      },
    );

    return response.data;
  }
  ```
</CodeGroup>

<ResponseField name="update_behavior" type="string" required={false}>
  Controls how the upgrade is processed: - `proration-charge-immediately`:
  Charge prorated amount right away. We'll calculate what your customer has used
  so far, charge them immediately for the difference, and start a new billing
  cycle from today. - `proration-charge`: Add prorated amount to next invoice.
  We'll calculate any unused time on the current subscription as credit, apply
  it to the new subscription price, and bill the difference on the next regular
  invoice while maintaining the original billing cycle. - `proration-none`: No
  proration, change takes effect on next billing cycle. No immediate charges
  will occur—when the current billing period ends, we'll simply start charging
  at the new subscription rate.
</ResponseField>

## Best Practices

1. **Upgrade Path**

   * Design clear upgrade paths
   * Highlight additional value at each tier
   * Make downgrades equally accessible

2. **Customer Experience**
   * Provide clear feature comparisons
   * Show pricing differences
   * Explain pro-rata billing


# null
Source: https://docs.creem.io/learn/billing/upsells





# Introduction
Source: https://docs.creem.io/learn/checkout-session/introduction

Create checkout sessions for each payment and user independently.

<Frame>
  <iframe width="560" height="315" src="https://www.youtube.com/embed/3eTSRXz9OdA" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen />
</Frame>

## Why use a checkout session?

With checkout sessions generated dynamically instead of just using a product payment link, you are able to pass a `request_id` to the session.

This allows you to track the payment status and the user that made the payment in your system in a more organized way, and gives you the flexibility to track that payment with any ID you choose instead of relying on Creem IDs.

## Create a checkout session

You can create a checkout session with a product ID

<Tip>
  You can find a product ID by going to the products tab and clicking on the product options and selecting "Copy ID".
</Tip>

Additionally, you can pass a `request_id` to the session to track the payment in your system.
You will also need the API key to authenticate the request.

<CodeGroup>
  ```javascript getCheckout.js
      const redirectUrl = await axios.post(
        `https://api.creem.io/v1/checkouts`,
          {
            product_id: 'prod_6tW66i0oZM7w1qXReHJrwg',
            request_id: 'your-request-id',
          },
          {
            headers: { "x-api-key": `creem_123456789` },
          },
      );
  ```

  ```bash getCheckout.sh
  curl -X POST https://api.creem.io/v1/checkouts \
    -H "x-api-key: creem_123456789"
    -D '{
      "product_id": "prod_6tW66i0oZM7w1qXReHJrwg",
      "request_id": "your-request-id"
      }'
  ```
</CodeGroup>

The above request will return a checkout session object with a `checkout_url` that you can use to redirect the user to the payment page.

Any payments made with this checkout session will have the `request_id` you provided on the Redirect URL, as well as the webhook event.

## Metadata

The `request_id` is only returned in the `checkout.completed` webhook (which is very useful for one-time payments), but it’s not sent with every new subscription transaction.

To make things easier, we also allow you to pass `metadata` in a checkoutSession with or without the `request_id`. This metadata will be saved in the Subscription object and returned with every subsequent webhook.

<CodeGroup>
  ```javascript getCheckout.js
      const redirectUrl = await axios.post(
        `https://api.creem.io/v1/checkouts`,
          {
            "request_id": "your-request-id",
            "product_id": "prod_your-product-id",
            "metadata": {
              "userId": "my_internal_customer_id",
              "any_key": "any_value"
            }
          },
          {
            headers: { "x-api-key": `creem_123456789` },
          },
      );
  ```

  ```bash getCheckout.sh
  curl -X 'POST' \
    'https://test-api.creem.io/v1/checkouts' \
      -H 'accept: application/json' \
      -H 'x-api-key: creem_123456789' \
      -H 'Content-Type: application/json' \
      -d '{
        "request_id": "your-request-id",
        "product_id": "prod_your-product-id",
        "metadata": {
          "userId": "my_internal_customer_id",
          "any_key": "any_value"
          }
      }'
  ```
</CodeGroup>

## Success URL

You can pass a custom `success_url` for each checkout\_session, which will override the `success_url` set on the product.

This allows you to dynamically redirect users to custom pages after each payment (useful for directing users to their specific account resources after payment).

<CodeGroup>
  ```javascript getCheckout.js
      const redirectUrl = await axios.post(
        `https://api.creem.io/v1/checkouts`,
          {
            "success_url": "https://example.com",
            "product_id": "prod_your-product-id",
          },
          {
            headers: { "x-api-key": `creem_123456789` },
          },
      );
  ```

  ```bash getCheckout.sh
  curl -X 'POST' \
    'https://test-api.creem.io/v1/checkouts' \
      -H 'accept: application/json' \
      -H 'x-api-key: creem_123456789' \
      -H 'Content-Type: application/json' \
      -d '{
        "product_id": "prod_your-product-id",
        "success_url": "https://example.com",
      }'
  ```
</CodeGroup>

## Customer Email

You can pass a `customer.email` directly in the checkout session.
This email will be pre-filled for the user on the checkout session page and cannot be changed.

This is useful if you want to ensure that the user completes the payment using the email they registered on your platform.

<CodeGroup>
  ```javascript getCheckout.js
      const redirectUrl = await axios.post(
        `https://api.creem.io/v1/checkouts`,
          {
            "customer": {
              "email": "yourUserEmail@gmail.com"
            },
            "product_id": "prod_your-product-id",
          },
          {
            headers: { "x-api-key": `creem_123456789` },
          },
      );
  ```

  ```bash getCheckout.sh
  curl -X 'POST' \
    'https://test-api.creem.io/v1/checkouts' \
      -H 'accept: application/json' \
      -H 'x-api-key: creem_123456789' \
      -H 'Content-Type: application/json' \
      -d '{
        "product_id": "prod_your-product-id",
        "customer": {
          "email": "yourUserEmail@gmail.com"
        },
      }'
  ```
</CodeGroup>

## Discount Codes

You can pass a `discount_code` directly in the checkout session.
This discount code will be pre-filled for the user on the checkout session page.

<CodeGroup>
  ```javascript getCheckout.js
      const redirectUrl = await axios.post(
        `https://api.creem.io/v1/checkouts`,
          {
            "product_id": "prod_your-product-id",
            "discount_code": "BF200XX",
          },
          {
            headers: { "x-api-key": `creem_123456789` },
          },
      );
  ```

  ```bash getCheckout.sh
  curl -X 'POST' \
    'https://test-api.creem.io/v1/checkouts' \
      -H 'accept: application/json' \
      -H 'x-api-key: creem_123456789' \
      -H 'Content-Type: application/json' \
      -d '{
        "product_id": "prod_your-product-id",
        "discount_code": "BF200XX",
      }'
  ```
</CodeGroup>

## Seat Based Billing

You can pass a `units` amount directly in the checkout session.
The product price will be used as the base price for one seat/unit of the product and the checkout session will reflect the (base price x units) to be charged.

<CodeGroup>
  ```javascript getCheckout.js
      const redirectUrl = await axios.post(
        `https://api.creem.io/v1/checkouts`,
          {
            "product_id": "prod_your-product-id",
            "units": 2,
          },
          {
            headers: { "x-api-key": `creem_123456789` },
          },
      );
  ```

  ```bash getCheckout.sh
  curl -X 'POST' \
    'https://test-api.creem.io/v1/checkouts' \
      -H 'accept: application/json' \
      -H 'x-api-key: creem_123456789' \
      -H 'Content-Type: application/json' \
      -d '{
        "product_id": "prod_your-product-id",
        "units": 2,
      }'
  ```
</CodeGroup>


# Return URLs
Source: https://docs.creem.io/learn/checkout-session/return-url

Understand how to redirect users back to your website after a successful payment.

## What is a Return/Redirect URL?

Return and Redirect URLs, are urls that your customer will be redirected to, after a successful payment.
They contain important information signed by creem, that you can use to verify the payment and the user.

Using these URLs, you can create a seamless experience for your users, by redirecting them back to your website after a successful payment.

<Tip>
  You have the optionality to use the information in the URL query parameters, or to use webhooks to receive updates on your application automatically, or both.
</Tip>

## How to set a Return/Redirect URL

<AccordionGroup>
  <Accordion icon="table-tree" title="Option 1: Set a success URL on the product creation.">
    When creating a product, you can optionally add a Return URL.
    This URL will be used as a default to every payment done to this product, in case you don't provide other URLs when creating a checkout session or using a payment link.

    <img style={{ borderRadius: '0.5rem' }} src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/product-return-url-Wx2o0b0XfQ2mWdcue6wXAh7LZywYal.png" />
  </Accordion>

  <Accordion icon="location-crosshairs" title="Option 2: Set a success URL when creating a checkout session">
    You can bypass the product Return URL by setting a success URL on the checkout session request by adding the `success_url` parameter.
  </Accordion>
</AccordionGroup>

## What is included on the Return URL?

A return URL will always contain the following query parameters, and will look like the following:

<Tip>
  `https://yourwebsite.com?checkout_id=ch_1QyIQDw9cbFWdA1ry5Qc6I&order_id=ord_4ucZ7Ts3r7EhSrl5yQE4G6&customer_id=cust_2KaCAtu6l3tpjIr8Nr9XOp&subscription_id=sub_ILWMTY6uBim4EB0uxK6WE&product_id=prod_6tW66i0oZM7w1qXReHJrwg&signature=044bd1691d254c4ad4b31b7f246330adf09a9f07781cd639979a288623f4394c?`
</Tip>

| Query parameter  | Description                                                                    |
| ---------------- | ------------------------------------------------------------------------------ |
| checkout\_id     | The ID of the checkout session created for this payment.                       |
| order\_id        | The ID of the order created after successful payment.                          |
| customer\_id     | The customer ID, based on the email that executed the successful payment.      |
| subscription\_id | The subscription ID of the product.                                            |
| product\_id      | The product ID that the payment is related to.                                 |
| request\_id      | **Optional** The request ID you provided when creating this checkout session.  |
| signature        | All previous parameters signed by creem using your API-key, verifiable by you. |

## How to verify Creem signature?

To verify the signature, you can use the following code snippet:

```javascript
export interface RedirectParams {
  request_id?: string | null;
  checkout_id?: string | null;
  order_id?: string | null;
  customer_id?: string | null;
  subscription_id?: string | null;
  product_id?: string | null;
}

  private generateSignature(params: RedirectParams, apiKey: string): string {
    const data = Object.entries(params)
      .map(([key, value]) => `${key}=${value}`)
      .concat(`salt=${apiKey}`)
      .join('|');
    return crypto.createHash('sha256').update(data).digest('hex');
  }
```

In summary, concatenate all parameters and the salt (your API-key) with a `|` separator, and hash it using SHA256. This will generate a signature that you can compare with the signature provided in the URL.


# Customer Portal
Source: https://docs.creem.io/learn/customers/customer-portal

Customers can cancel and refund subscriptions by themselves.

## What is a Customer Portal?

After every successful payment, your customers will receive an email with a link to their Customer Portal. This portal allows them to manage their subscriptions, payment methods, and personal information.

This email contains a magic link, to a completely different authentication mechanism, in which they are able to access their account which allows them to execute the aforementioned actions.

<AccordionGroup>
  <Accordion icon="receipt" title="Receipt Example">
    <img style={{ borderRadius: '0.5rem' }} src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/Screenshot%202024-12-17%20at%2023.26.24-zus6vfFFS6vdT5GSwjjXSbinB5KWZp.png" />
  </Accordion>

  <Accordion icon="right-to-bracket" title="Magic Link Login Example">
    <img style={{ borderRadius: '0.5rem' }} src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/magic-link-nq675ngtIqI95c6EeGiHPa8id6D1x1.png" />
  </Accordion>
</AccordionGroup>

## What can customers do in the Customer Portal?

### 1. Cancel a subscription

Upon entering the Customer Portal, customers can cancel their subscriptions by selecting an active subscription, and clicking on the **Manage Subscription** button.
This will open a details sheet on the right side of the screen, where a **Cancel Subscription** button is available.

This will immediately cancel their subscription and they will no longer be charged for it.

<img style={{ borderRadius: '0.5rem' }} src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/cancel-subscription-e7svTi3ym0foZze7gG8SOa6arqIj78.png" />

### 2. Request Invoice or Support

Customers using the customer portal, can copy all details of a specific payment, including order\_ID and request support from Creem team directly without contacting the merchant.

<img style={{ borderRadius: '0.5rem' }} src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/customer-portal-Klxod6wVtoF6JFJdeEDPOPPxDMJ31q.png" />

### 3. Request Customer Portal Login through the API

Merchants can generate a customer portal login for their users, using the API, providing the `customer_id`.
The API responds a URL, that the merchant can then use to redirect their customer to the customer portal.

<AccordionGroup>
  <Accordion title="Response">
    ```json
    {
      "customer_portal_link": "https://creem.io/my-orders/login/xxxxxxxxxx"
    }
    ```
  </Accordion>
</AccordionGroup>

<CodeGroup>
  ```javascript getCustomerPortalUrl.js
      const redirectUrl = await axios.post(
        `https://api.creem.io/v1/customers/billing`,
          {
            "customer_id": "cust_xxxxxxx",
          },
          {
            headers: { "x-api-key": `creem_123456789` },
          },
      );
  ```

  ```bash getCustomerPortalUrl.sh
  curl -X 'POST' \
    'https://api.creem.io/v1/customers/billing' \
    -H 'accept: application/json' \
    -H 'x-api-key: creem_123456789' \
    -H 'Content-Type: application/json' \
    -d '{
    "customer_id": "cust_xxxxxxx"
  }'

  ```
</CodeGroup>


# Introduction
Source: https://docs.creem.io/learn/customers/introduction

Customers can be queried by your application to refresh statuses and can do actions by themselves using the Customer Portal.

## Customer Actions

Customers have access to a separated portal where they can manage their subscriptions, payment methods, and personal information. This portal is called the Customer Portal.
Get more information about the Customer Portal [here](/learn/customers/customer-portal).

On the following page, you can also read more about customer receipts, refunds, and how Users access that information.

<Card title="Customer Portal" icon="users" href="/learn/customers/customer-portal">
  Understand how customers can manage their subscriptions and information.
</Card>

Customer objects can also be queried independently by your application so that you can synchronize specific customer data with their subscription statuses and transaction history.

For example, you can query a customer by their email address to refresh their subscription statuses and update your application's UI accordingly.

```bash
curl -X 'GET' \
  'http://api.creem.io/v1/customers?email=alecerasmus@gmail.com' \
  -H 'accept: application/json' \
  -H 'x-api-key: creem_123456789'
```

<AccordionGroup>
  <Accordion title="Sample Response Body">
    ```json
      {
          "id": "cust_3biFPNt4Cz5YRDSdIqs7kc",
          "object": "customer",
          "email": "alecerasmus2@gmail.com",
          "name": "Alec Erasmus",
          "country": "SE",
          "created_at": "2024-09-16T16:13:39.265Z",
          "updated_at": "2024-09-16T16:13:39.265Z",
          "mode": "local"
      }
    ```
  </Accordion>
</AccordionGroup>


# Branding Customization
Source: https://docs.creem.io/learn/customization/branding

Customize your checkout and email receipts with your brand logo, colors, and theme for a seamless customer experience.

# Branding Your Checkout & Receipts

Deliver a seamless, on-brand experience from your application to the checkout and beyond. Creem lets you customize your checkout flow and email receipts with your store's logo, colors, and theme—ensuring your customers always feel at home.

<Frame caption="Branded checkout example">
  <img style={{ borderRadius: '0.5rem', maxWidth: 600 }} src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/Screenshot%202025-05-07%20at%2022.54.09-yY6OBPt5K5S0Ek9WmsA3AXk3p06awN.png" alt="Example of a branded checkout with custom logo and colors" />
</Frame>

## Why Customize Branding?

* **Consistent brand experience** from your app to checkout and receipts
* **Build trust** with your customers
* **Increase conversion** by reducing friction and confusion

<Tip>
  Your logo and colors are used on both the checkout page and the email receipt sent after a successful payment.
</Tip>

## How to Update Your Store Branding

<Steps>
  <Step title="Open Account Settings">
    Click your profile icon in the top right corner, then select <b>Settings</b> for your current store.
  </Step>

  <Step title="Choose Branding Menu">
    In the settings sidebar, navigate to <b>Branding</b>.
  </Step>

  <Step title="Customize Your Branding">
    <ul>
      <li><b>Upload your logo</b> (used on checkout and email receipts)</li>
      <li><b>Select your default checkout theme</b> (light or dark)</li>
      <li><b>Pick your accent color</b> (used for buttons, upsells, and field borders)</li>
      <li><b>Set your accent hover color</b> (for button hover states)</li>
      <li><b>Choose your text color</b> (for dynamic buttons and component text)</li>
    </ul>
  </Step>

  <Step title="Save and Preview">
    Save your changes. You can preview your checkout with the new branding instantly.
  </Step>
</Steps>

<Frame caption="Branding settings UI">
  <img style={{ borderRadius: '0.5rem', maxWidth: 600 }} src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/Screenshot%202025-05-07%20at%2022.55.01-7k1fgfuPbZHiOKxelfiAjYJNXZHEXB.png" alt="Creem branding settings UI with logo upload and color pickers" />
</Frame>

## Test Mode vs Live Mode

You can safely experiment with different branding options in <b>test mode</b>—these changes won't affect your live checkout. When you're ready, switch to <b>live mode</b> and apply your final branding for real customers.

<CardGroup cols={2}>
  <Card title="Test Mode" icon="flask">
    Try out new logos, colors, and themes without impacting your live store. Perfect for previewing and iterating.
  </Card>

  <Card title="Live Mode" icon="rocket">
    Confident in your branding? Switch to live mode to update the experience for your customers.
  </Card>
</CardGroup>

## Programmatic Theme Selection

You can override the default checkout theme by appending <code>?theme=light</code> or <code>?theme=dark</code> to your checkout URL before redirecting your customers.

<Tip>
  Example: <code>[https://www.creem.io/payment/prod\_3pcofZ4pTXtuvdDb1j2MMp?theme=dark](https://www.creem.io/payment/prod_3pcofZ4pTXtuvdDb1j2MMp?theme=dark)</code>
</Tip>

## Best Practices

* Use a high-contrast logo with a transparent background for best results
* Choose accessible color combinations for text and buttons
* Preview your checkout and email receipts in both light and dark themes
* Test your branding in both test and live modes before going live

<aside>
  <b>Need help?</b> Reach out to our support team for guidance on branding best practices or troubleshooting.
</aside>


# Payment Links Customization
Source: https://docs.creem.io/learn/customization/payment-links

Learn how to use and customize Payment Links in Creem for no-code, flexible payment flows.

# Payment Links

Payment Links are the fastest way to start accepting payments with Creem—no code, no API, no SDK required. Just create a product, copy the link, and share it with your customers.

## Getting Started

To create your first payment link, follow our <a href="/quickstart">Quickstart</a> guide. You'll learn how to:

* Create a product in your Creem dashboard
* Instantly generate a payment link for that product

<Tip>
  After following the Quickstart, you'll have a product and a payment link ready to use—no coding required!
</Tip>

## Why Use Payment Links?

* **No-code:** Share a link, get paid—no integration work needed
* **Instant setup:** Go live in minutes
* **Customizable:** Add metadata and themes for advanced workflows
* **Perfect for:** Social media, email, chat, or anywhere you can paste a link

<CardGroup cols={2}>
  <Card title="No-Code Simplicity" icon="bolt">
    Start selling instantly by sharing a link. No API keys, SDKs, or developer time required.
  </Card>

  <Card title="Advanced Customization" icon="sliders">
    Pass custom data and themes via URL parameters for powerful, flexible workflows.
  </Card>
</CardGroup>

## Customizing Payment Links

You can extend the power of payment links by passing custom data and appearance options directly in the URL—no backend or API required.

### 1. Add Custom Metadata

Want to track a user, campaign, or any custom info with each payment? Just append metadata as query parameters:

**Example:**

```
https://creem.io/payment/prod_abc123?metadata[reference_user_id]=user1234&metadata[referral]=youtube
```

* This will save `reference_user_id: user1234` and `referral: youtube` as metadata on the payment.
* You can add as many metadata fields as you need, using the `metadata[key]=value` format.

<Tip>
  Metadata is available in your dashboard and webhooks, making it easy to connect payments to users, campaigns, or any workflow—no code required.
</Tip>

### 2. Set the Checkout Theme

You can control the appearance of the checkout by adding a `theme` parameter:

* `?theme=dark` for a dark checkout
* `?theme=light` for a light checkout

**Example:**

```
https://creem.io/payment/prod_abc123?theme=dark
```

You can combine theme and metadata parameters:

```
https://creem.io/pay/prod_abc123?theme=dark&metadata[reference_user_id]=user1234
```

<Frame caption="Dark themed checkout example">
  <img style={{ borderRadius: '0.5rem', maxWidth: 600 }} src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/Screenshot%202025-05-07%20at%2022.54.09-yY6OBPt5K5S0Ek9WmsA3AXk3p06awN.png" alt="Creem checkout page in dark theme" />
</Frame>

## Best Practices

* Use metadata to track users, campaigns, or any custom info
* Choose a theme that matches your brand or context
* Test your payment links before sharing widely
* Share links anywhere: email, chat, social, QR codes, and more

<aside>
  <b>Need help?</b> Our support team is here to help you get the most out of payment links. Reach out for advanced workflows or troubleshooting.
</aside>


# Event Types
Source: https://docs.creem.io/learn/webhooks/event-types

List of supported event types and their payloads.

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


# Introduction
Source: https://docs.creem.io/learn/webhooks/introduction

Use webhooks to notify your application about payment events."


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


# Verify Webhook Requests
Source: https://docs.creem.io/learn/webhooks/verify-webhook-requests

How to verify Creem signature on webhook objects.

## How to verify Creem signature?

Creem signature is sent in the `creem-signature` header of the webhook request. The signature is generated using the HMAC-SHA256 algorithm with the webhook secret as the key, and the request payload as the message.

<AccordionGroup>
  <Accordion title="Sample Webhook Header">
    ```json
    {
    'creem-signature': 'dd7bdd2cf1f6bac6e171c6c508c157b7cd3cc1fd196394277fb59ba0bdd9b87b'
    }
    ```
  </Accordion>
</AccordionGroup>

To verify the signature, you need to generate the signature using the same algorithm and compare it with the signature sent in the header. If the two signatures match, the request is authentic.

<Tip>
  You can find your webhook secret on the Developers>Webhook page.
</Tip>

<img style={{ borderRadius: '0.5rem' }} src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/Screenshot%202024-10-03%20at%2014.26.39-MtSMvooQi4OrZoh9eMyFZngfc0CrQn.png" />

To generate the signature, you can use the following code snippet:

```typescript
import * as crypto from 'crypto';

  generateSignature(payload: string, secret: string): string {
    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    return computedSignature;
  }
```

In the code snippet above, the `payload` is the request body, and the `secret` is the webhook secret.
Simply compare the generated Signature with the one received on the header to complete the verification process.


# Quickstart
Source: https://docs.creem.io/quickstart

Learn how to receive your first payment in under 10 minutes

## Prerequisites

To get the most out of this guide, you'll need to:

* **Create an account on Creem.io**

## 1. Create a product

<Frame>
  <iframe width="560" height="315" src="https://www.youtube.com/embed/pnGxjcbztH0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen />
</Frame>

Go over to the [products tab](https://creem.io/dashboard/products) and create a product.
You can add a name, description, and price to your product. Optionally you can also add a picture to your product that will be shown to users.

<AccordionGroup>
  <Accordion icon="browser" title="Product page">
    <img style={{ borderRadius: '0.5rem' }} src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/add-product-B0Khh16pSFp3DpwsuBrrExvlwovhMq.png" />
  </Accordion>

  <Accordion icon="file-spreadsheet" title="Adding product details">
    <img style={{ borderRadius: '0.5rem' }} src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/product-details-49DpCmOXRIuUOYulQXxmY6moAISQ9b.png" />
  </Accordion>
</AccordionGroup>

## 2. Copy the payment link from the product

After successfully creating your product, you can copy the payment link by clicking on the product **Share** button.
Simply send this link to your users and they will be able to pay you instantly.

<img style={{ borderRadius: '0.5rem' }} src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/product-share-vrV42jh8mnhvpUs1AeSyLtuJLZmBJo.png" />

## More use cases

If you are not planning to do a no-code integration, we strongly encourage you to check out our other guides.

Create checkout-sessions and prices dynamically, use webhooks to receive updates on your application automatically, and much more. Check out our guides to get the most out of Creem.

<CardGroup>
  <Card title="Standard Integration" icon="basket-shopping" href="/checkout-flow">
    Understand what you will receive when users complete a payment and get redirected back to your website.
  </Card>

  <Card title="Webhooks and Events" icon="square-code" href="/learn/webhooks/introduction">
    Set up webhooks to receive updates on your application automatically.
  </Card>
</CardGroup>


# Creem Next.js Template
Source: https://docs.creem.io/sdk/nextjs-template

A modern Next.js App Router template for integrating Creem subscriptions and payments with Prisma, Shadcn UI, Radix UI, and Tailwind.

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


# Typescript SDK
Source: https://docs.creem.io/sdk/typescript-sdk

Type-safe SDK for the Creem API – manage SaaS subscriptions, products, and revenue in TypeScript/Node.js environments.

<Tip>
  The Creem TypeScript SDK is available as an [npm package](https://www.npmjs.com/package/creem) for seamless integration with your TypeScript and Node.js projects.
  The SDK is also available on [GitHub](https://github.com/armitage-labs/creem-sdk) for those who prefer to explore the source code directly.
</Tip>

## Installation

Install with your preferred package manager:

```bash
npm install creem
# or
yarn add creem zod
# or
pnpm add creem
# or
bun add creem
```

> **Note:** If using Yarn, install `zod` as a peer dependency.

***

## Quick Start

```ts
import { Creem } from "creem";

const creem = new Creem();

async function main() {
  const product = await creem.retrieveProduct({
    productId: "<id>",
    xApiKey: "<api-key>",
  });
  console.log(product);
}

main();
```

***

## Functions Overview

The SDK exposes all major Creem API resources and operations:

* **Products:** `retrieveProduct`, `createProduct`, `searchProducts`
* **Customers:** `retrieveCustomer`, `generateCustomerLinks`
* **Subscriptions:** `retrieveSubscription`, `cancelSubscription`, `updateSubscription`, `upgradeSubscription`
* **Checkout:** `retrieveCheckout`, `createCheckout`
* **Licenses:** `activateLicense`, `deactivateLicense`, `validateLicense`
* **Discounts:** `retrieveDiscount`, `createDiscount`, `deleteDiscount`
* **Transactions:** `searchTransactions`

You can find a detailed documentation of all functions and their parameters in the [SDK README](https://github.com/armitage-labs/creem-sdk?tab=readme-ov-file#creem-sdk)

***

### Server Selection (Test Mode)

Use a specific server by index or URL, by default the SDK will use the production server:

```ts
const creem = new Creem({ serverIdx: 1 }); // 0: production, 1: test-mode
// or
const creem = new Creem({ serverURL: "https://api.creem.io" });
// or
const creem = new Creem({ serverURL: "https://test-api.creem.io" });
```

## Example: Deleting a Discount

<Tabs>
  <Tab title="Instance Method">
    ```ts
    import { Creem } from "creem";

    const creem = new Creem();

    async function run() {
      const result = await creem.deleteDiscount({
        id: "<discount-id>",
        xApiKey: "<api-key>",
      });

      // Handle the result
      console.log(result);
    }

    run();
    ```
  </Tab>

  <Tab title="Standalone Function">
    ```ts
    import { CreemCore } from "creem/core.js";
    import { deleteDiscount } from "creem/funcs/deleteDiscount.js";

    // Use `CreemCore` for best tree-shaking performance.
    // You can create one instance of it to use across an application.
    const creem = new CreemCore();

    async function run() {
      const res = await deleteDiscount(creem, {
        id: "<discount-id>",
        xApiKey: "<api-key>",
      });

      if (!res.ok) {
        throw res.error;
      }

      const { value: result } = res;

      // Handle the result
      console.log(result);
    }

    run();
    ```
  </Tab>
</Tabs>

***

### Retry Strategy

Override retry behavior per call or globally:

```ts
const creem = new Creem({
  retryConfig: {
    strategy: "backoff",
    backoff: { initialInterval: 1, maxInterval: 50, exponent: 1.1, maxElapsedTime: 100 },
    retryConnectionErrors: false,
  },
});
```

***

## Standalone Functions

All SDK methods are also available as named imports for minimal bundle size:

```ts
import { retrieveProduct } from "creem/funcs/retrieveProduct.js";

const product = await retrieveProduct({ productId: "<id>", xApiKey: "<api-key>" });
```

***

## References

* [Creem SDK on npm](https://www.npmjs.com/package/creem)
* [Creem API Docs](https://docs.creem.io/api-reference/introduction)
* [GitHub Releases](https://github.com/armitage-labs/creem-sdk)

***

> For feedback or issues, open a PR or issue on the [Creem SDK GitHub](https://github.com/creem-io/creem-sdk).


# Test Mode
Source: https://docs.creem.io/test-mode

Simulate payments and any functionality in a test environment

## Activating Test Mode

To use the test environment, simply click on the test mode button on the top navbar of the dashboard.

<img style={{ borderRadius: '0.5rem' }} src="https://nucn5fajkcc6sgrd.public.blob.vercel-storage.com/test-mode-uVKSqW0Pcc9Mbu6MN82q3PrEDQUEbm.png" />

All functionality on Creem will now be in test mode. You can create products, checkout sessions, and receive payments without any real money being involved.

Webhooks and API keys that you will see on the Developer tab will also be exclusively for the test environment.

## Using Test APIs

You can test and use any workflows for the test environment by using the test API endpoint:

```bash
https://test-api.creem.io
```

## Testing Payments

Use the test card `4242 4242 4242 4242` with any expiration and CVV