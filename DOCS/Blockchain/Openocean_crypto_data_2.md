# Exact out

The goal of using "Exact Out" is to use "outAmount" to get desired "inAmount" on the frontend and receive the exact outAmount needed.&#x20;

In the following, it will use [OpenOcean’s `reverseQuote` API](https://apis.openocean.finance/developer/apis/swap-api/api-v4#reversequote-optional) to calculate the required `inAmount` based on a target `outAmount`, then construct a `swap` transaction to complete an on-chain swap.

## 1. Obtain `reverseQuote`

**✅ Description**

Call the `reverseQuote` API to return the actual input token amount required based on the desired output token and amount. Please refer it [here](https://apis.openocean.finance/developer/apis/swap-api/api-v4#reversequote-optional) to get more info.

**📍 Endpoint**

```
GET https://open-api.openocean.finance/v4/eth/reverseQuote
```

**📥 Parameters description：**

| Params             | Description                                                                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `inTokenAddress`   | Address of the input token (**token to be swapped into on the frontend**, same as `outTokenAddress` in `/swap` endpoint)                                                                   |
| `outTokenAddress`  | Address of the output token (**token the user wants to receive**, same as `inTokenAddress`  in `/swap` endpoint)                                                                           |
| `amountDecimals`   | Amount of output token with decimals (e.g., 10 USDT should be written as `10000000`)                                                                                                       |
| `gasPriceDecimals` | gas price with decimals (obtain via `/gasPrice` [here](https://apis.openocean.finance/developer/apis/swap-api/api-v4#get-gasprice)）                                                        |
| `slippage`         | <p>Set acceptable slippage by inputting a percentage value within the range of 0.05 to 50.</p><p></p><p>e.g. input "1" refer to "1%"<br></p><p>The default value of slippage is 1 (1%)</p> |

**Example:**

{% code overflow="wrap" %}
```http
GET https://open-api.openocean.finance/v4/eth/reverseQuote?inTokenAddress=0xdac17f958d2ee523a2206206994597c13d831ec7&outTokenAddress=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE&amountDecimals=10000000&gasPriceDecimals=5000000000&slippage=3
```
{% endcode %}

**Response snippet:**

```json
{
  "code": 200,
  "data": {
    "inAmount": "10000000",
    "outAmount": "3869897038672758",
    "reverseAmount": 4075971843471952,
    ...
  }
}
```

**Response params description:**

| Params          | Description                                                                            |
| --------------- | -------------------------------------------------------------------------------------- |
| `inAmount`      | Desired output token amount (equal to the input parameter `amountDecimals`)            |
| `outAmount`     | Estimated output amount (for reference only)                                           |
| `reverseAmount` | Actual amount of input tokens required (used as `amountDecimals` in  `/swap` endpoint) |

## 2. Call `/swap` endpoint to complete swaps

**✅ Description**

Use the response from `reverseQuote` endpoint to call the `/swap` endpoint, generate the transaction data, and complete the on-chain trade.

**📍Endpoint**

```
GET https://open-api.openocean.finance/v4/1/swap
```

**📥 Parameters description:**

| Params              | Description                                                                                                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `inTokenAddress`    | Address of the input token (The `outTokenAddress` from `reverseQuote` )                                                                                                                    |
| `outTokenAddress`   | Address of the output token (The `inTokenAddress` from `reverseQuote` )                                                                                                                    |
| `account`           | Receiving address (can be a third-party address)                                                                                                                                           |
| `sender`            | Address used to initiate the transaction (user address)                                                                                                                                    |
| `amountDecimals`    | Input amount (The `reverseAmount` from `reverseQuote` )                                                                                                                                    |
| `gasPriceDecimals`  | gas price with decimals (obtain via `/gasPrice` [here](https://apis.openocean.finance/developer/apis/swap-api/api-v4#get-gasprice))                                                        |
| `slippage`          | <p>Set acceptable slippage by inputting a percentage value within the range of 0.05 to 50.</p><p></p><p>e.g. input "1" refer to "1%"<br></p><p>The default value of slippage is 1 (1%)</p> |
| `outAmountDecimals` | Target exact-out output amount (The `inAmount`from `reverseQuote` )                                                                                                                        |

**Example:**

{% code overflow="wrap" %}
```http
GET https://open-api.openocean.finance/v4/1/swap?inTokenAddress=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE&outTokenAddress=0xdac17f958d2ee523a2206206994597c13d831ec7&account=0x7899a562e9B0116bA8242ab8ae8bF01e3A00E43D&sender=0x7899a562e9B0116bA8242ab8ae8bF01e3A00E43D&amountDecimals=4075971843471952&gasPriceDecimals=5000000000&slippage=3&outAmountDecimals=10000000
```
{% endcode %}

**Response snippet:**

```json
{
  "code": 200,
  "data": {
    "inAmount": "4075971843471952",
    "outAmount": "10000000",
    "value": "4075971843471952",
    "data": "...", // Can be used directly for on-chain execution
    ...
  }
}
```

***

### ✅Whole Flow Overview

1. Call `reverseQuote` with the target `outAmount` to calculate the required `inAmount`;
2. Use `reverseAmount` and `inAmount` to construct the `swap` endpoint request;
3. Call `swap`, retrieve the transaction data, and execute the on-chain trade.

***

### 🛠️Tips

*   You can obtain the latest `gasPriceDecimals` from:

    ```
    GET https://open-api.openocean.finance/v4/:chain/gasPrice
    ```
* Use the `price_impact` from the `reverseQuote` response to evaluate the output price quote if reasonable, such as set a threshold of price impact to avoid large losses;
* All amount fields must be adjusted based on the token’s `decimals` (e.g., USDT uses 6, ETH uses 18).

***

Reach out us in [API support group](https://t.me/OpenOceanAPI) if you'd like help wrapping this into a script (Python, JS, etc.) or building a front-end widget.
