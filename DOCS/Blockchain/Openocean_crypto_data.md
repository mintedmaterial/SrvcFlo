---
description: The latest lightning fast API V4
---

# API V4

{% hint style="info" %}
View Github examples for [Backend](https://github.com/openocean-finance/OpenOcean-API-Examples/tree/main/backend/swap-api-demo) and [Frontend](https://github.com/openocean-finance/OpenOcean-API-Examples/tree/main/backend/swap-api-demo).
{% endhint %}

## Quote

* URL: <mark style="color:blue;">`https://open-api.openocean.finance/v4/:chain/quote`</mark>
* Method: get
* Params:

<table><thead><tr><th>Name</th><th width="176.52734375">Type</th><th width="221">Description</th></tr></thead><tbody><tr><td>chain<mark style="color:red;">*</mark></td><td>string</td><td>Chain name or Chain ID  (<a href="#get-dexes-list">supported chains</a>)</td></tr><tr><td>inTokenAddress<mark style="color:red;">*</mark></td><td>string</td><td>Input token address</td></tr><tr><td>outTokenAddress<mark style="color:red;">*</mark></td><td>string</td><td>Output token address</td></tr><tr><td>amountDecimals</td><td>string</td><td>Token amount with decimals. For example, if 1 USDT is input, use 1000000 (1 USDT * 10^6). </td></tr><tr><td>gasPriceDecimals</td><td>string</td><td>GasPrice with decimals. </td></tr><tr><td>slippage</td><td>string</td><td><p>Define the acceptable slippage level by inputting a percentage value within the range of <strong>0.05 to 50.</strong><br><br>e.g. 1% slippage set as 1</p><p>default value 1</p></td></tr><tr><td>disabledDexIds</td><td>string</td><td>Enter the 'index' number of dexs through <a href="#get-dexes-list">dexList</a> endpoint to disable single or multiple dexs separated by commas, e.g. <code>disabledDexIds</code>: "2,6,9".</td></tr><tr><td>enabledDexIds</td><td>string</td><td>Enter the 'index' number of dexs through <a href="#get-dexes-list">dexList</a>.<br><br>P.S. <code>enableDexIds</code> has higher priority compared with <code>disabledDexIds</code></td></tr></tbody></table>

{% hint style="warning" %}
<mark style="color:orange;">**‼Note:**</mark>

<mark style="color:orange;">**We are deprecating the use of**</mark><mark style="color:orange;">**&#x20;**</mark><mark style="color:orange;">**`amount`**</mark><mark style="color:orange;">**&#x20;**</mark><mark style="color:orange;">**and**</mark><mark style="color:orange;">**&#x20;**</mark><mark style="color:orange;">**`gasPrice`**</mark><mark style="color:orange;">**&#x20;**</mark><mark style="color:orange;">**parameters.**</mark>\ <mark style="color:orange;">**They will be replaced by**</mark><mark style="color:orange;">**&#x20;**</mark><mark style="color:orange;">**`amountDecimals`**</mark><mark style="color:orange;">**&#x20;**</mark><mark style="color:orange;">**and**</mark><mark style="color:orange;">**&#x20;**</mark><mark style="color:orange;">**`gasPriceDecimals`**</mark><mark style="color:orange;">**, respectively.**</mark>\ <mark style="color:orange;">**The previous parameters did not include token decimal, and going forward, all values must be passed with full decimals.**</mark>
{% endhint %}

**Example:**

* Request&#x20;

{% code title="with decimals" overflow="wrap" %}
```http
https://open-api.openocean.finance/v4/bsc/quote?inTokenAddress=0x55d398326f99059ff775485246999027b3197955&outTokenAddress=0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d&amountDecimals=5000000000000000000&gasPriceDecimals=1000000000
```
{% endcode %}

{% code title="without decimals" overflow="wrap" %}
```http
https://open-api.openocean.finance/v4/bsc/quote?inTokenAddress=0x55d398326f99059ff775485246999027b3197955&outTokenAddress=0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d&amount=5&gasPrice=1
```
{% endcode %}

* Response:

```javascript
{
    "code": 200,
    "data": {
        "inToken": {
            "address": "0x55d398326f99059ff775485246999027b3197955",
            "decimals": 18,
            "symbol": "USDT",
            "name": "Tether USD",
            "usd": "0.998546",
            "volume": 4.99273
        },
        "outToken": {
            "address": "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
            "decimals": 18,
            "symbol": "USDC",
            "name": "USD Coin",
            "usd": "0.999955",
            "volume": 4.993697212299812
        },
        "inAmount": "5000000000000000000",
        "outAmount": "4993921938787056372",
        "estimatedGas": "129211",
        "dexes": [
            {
                "dexIndex": 0,
                "dexCode": "Pancake",
                "swapAmount": "4979841669990999203"
            },
            {
                "dexIndex": 1,
                "dexCode": "PancakeV2",
                "swapAmount": "4974920727654969974"
            },
            {
                "dexIndex": 3,
                "dexCode": "Bakery",
                "swapAmount": "755767313321589992"
            },
            ...
        ],
        "path": {
            "from": "0x55d398326f99059fF775485246999027B3197955",
            "to": "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
            "parts": 10,
            "routes": [
                {
                    "parts": 10,
                    "percentage": 100,
                    "subRoutes": [
                        {
                            "from": "0x55d398326f99059fF775485246999027B3197955",
                            "to": "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
                            "parts": 25,
                            "dexes": [
                                {
                                    "dex": "PancakeV3",
                                    "id": "0x92b7807bF19b7DDdf89b706143896d05228f3121",
                                    "parts": 25,
                                    "percentage": 100
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        "save": -0.0018,
        "price_impact": "0.01%",
        "exchange": "0x6352a56caadC4F1E25CD6c75970Fa768A3304e64",
    }
}
```

### JavaScript Demo

```javascript
const axios = require('axios');
const chain = 'bsc';
const url = `https://open-api.openocean.finance/v4/${chain}/quote`;
const params = {
    inTokenAddress: '0x55d398326f99059ff775485246999027b3197955', // USDT token address
    outTokenAddress: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',// USDC token address
    amount: 1,   // without decimals
    gasPrice: 3  // without decimals
}
async function main() {
    try {
        const { data } = await axios.get(url, { params })
        if (data?.code === 200) console.log('quote success');

    } catch (error) {
        console.log(data);

    }
}
main();
```

Python Demo

```python
import requests

chain = 'bsc'
url = f'https://open-api.openocean.finance/v4/{chain}/quote'
params = {
    'inTokenAddress': '0x55d398326f99059ff775485246999027b3197955',
    'outTokenAddress': '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
    'amount': 1,
    'gasPrice': 3
}

def main():
    response = requests.get(url, params=params)
    
    if response.status_code == 200:
        data = response.json()
        print(data)
    else:
        print("Error occurred:", response.text)

if __name__ == "__main__":
    main()

```

### Go Demo

```go
package main

import (
	"fmt"
	"net/http"
	"encoding/json"
)

func main() {
	chain := "bsc"
	url := fmt.Sprintf("https://open-api.openocean.finance/v4/%s/quote", chain)
	params := map[string]string{
		"inTokenAddress":  "0x55d398326f99059ff775485246999027b3197955",
		"outTokenAddress": "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
		"amount":          "1",
		"gasPrice":        "3",
	}

	resp, err := http.Get(url)
	if err != nil {
		fmt.Println("quote fail")
		return
	}
	defer resp.Body.Close()

	var data map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&data)

	code, ok := data["code"].(float64)
	if !ok {
		fmt.Println("quote fail")
		return
	}

	if code == 200 {
		fmt.Println("quote success")
	} else {
		fmt.Println("quote fail")
	}
}
```

### JAVA Demo

```java
import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

public class Main {
    public static void main(String[] args) {
        String chain = "bsc";
        String url = "https://open-api.openocean.finance/v4/" + chain + "/quote";
        
        Map<String, Object> params = new HashMap<>();
        params.put("inTokenAddress", "0x55d398326f99059ff775485246999027b3197955");
        params.put("outTokenAddress", "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d");
        params.put("amount", 1);
        params.put("gasPrice", 3);
        
        try {
            URL apiUrl = new URL(url);
            HttpURLConnection connection = (HttpURLConnection) apiUrl.openConnection();
            connection.setRequestMethod("GET");
            
            ObjectMapper mapper = new ObjectMapper();
            JsonNode data = mapper.readTree(connection.getInputStream());
            
            if (data.has("code") && data.get("code").asInt() == 200) {
                System.out.println("quote success");
            } else {
                System.out.println("quote fail");
            }
        } catch (IOException e) {
            System.out.println("quote fail");
        }
    }
}
```

## **ReverseQuote (Optional)**&#x20;

<mark style="color:orange;">For</mark> <mark style="color:orange;"></mark><mark style="color:orange;">`/reverseQuote`</mark><mark style="color:orange;">, it's a buy flow — you're saying "I want to buy X amount of inToken on the frontend", and we calculate how much outToken you need to sell.</mark> <mark style="color:orange;"></mark><mark style="color:orange;">**In the request url, inToken & outToken reversed to the frontend.**</mark> <mark style="color:orange;"></mark><mark style="color:orange;">To clarify, we suggest using this params as a reference — we use real-time quote price to perform a reverse quote calculation and determine the required intoken amount.</mark>

<mark style="color:orange;">**\*Read above before use this endpoint.**</mark>

* URL: <mark style="color:blue;">`https://open-api.openocean.finance/v4/:chain/reverseQuote`</mark>
* Method: get
* Params:

**Example:**

In the following example, the user on the frontend is trying to swap **X USDC to receive 1 BNB**. The user inputs “1” as the amount of BNB they want to receive.

On the frontend:

* `inToken` = USDC
* `outToken` = BNB

However, in the `/reverseQuote` request URL:

* `inToken` = BNB (the token the user wants to receive)
* `outToken` = USDC (the token the user will pay)
* `amount` = 1 (the target amount of BNB to receive)

This structure allows us to calculate how much USDC is needed to get exactly 1 BNB.



* example request:

{% code overflow="wrap" %}
```http
https://open-api.openocean.finance/v4/bsc/reverseQuote?inTokenAddress=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE&outTokenAddress=0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d&amount=1&gasPrice=1
```
{% endcode %}

* response:

<pre class="language-json" data-overflow="wrap" data-full-width="false"><code class="lang-json"><strong>{
</strong>    "code": 200,
    "data": {
        "inToken": {
            "address": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
            "decimals": 18,
            "symbol": "BNB",
            "name": "Binance Coin",
            "usd": "590.65",
            "volume": 590.65
        },
        "outToken": {
            "address": "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
            "decimals": 18,
            "symbol": "USDC",
            "name": "USD Coin",
            "usd": "0.999891",
            "volume": 590.4153617786928
        },
        "inAmount": "1000000000000000000",
        "outAmount": "590479724068616340527",
        "estimatedGas": "174627",
        "dexes": [
            {
                "dexIndex": 0,
                "dexCode": "Pancake",
                "swapAmount": "105768054842854874312"
            },
            {
                "dexIndex": 1,
                "dexCode": "PancakeV2",
                "swapAmount": "586740154027055712470"
            },
            {
                "dexIndex": 3,
                "dexCode": "Bakery",
                "swapAmount": "272826180234288517124"
             .........

            {
                "dexIndex": 62,
                "dexCode": "Elk",
                "swapAmount": "9154889383782970466"
            }
        ],
        "path": {
            "from": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
            "to": "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
            "parts": 10,
            "routes": [
                {
                    "parts": 10,
                    "percentage": 100,
                    "subRoutes": [
                        {
                            "from":"0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
                            "to": "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
                            "parts": 25,
                            "dexes": [
                                {
                                    "dex": "PancakeV3",
                                    "id":"0xf2688Fb5B81049DFB7703aDa5e770543770612C4",
                                    "parts": 25,
                                    "percentage": 100,
                                    "fee": 0.0001
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        "save": 0,
        "price_impact": "-0.04%",
        "reverseAmount": 590548337625246000000
    }
}
</code></pre>

## SwapQuote

* URL: <mark style="color:blue;">`https://open-api.openocean.finance/v4/:chain/swap`</mark>
* Method: get
* Params:

<table><thead><tr><th width="168">parameter</th><th width="111.609375">type</th><th width="180.28125">example</th><th>description</th></tr></thead><tbody><tr><td>chain</td><td>string</td><td>bsc or 56</td><td>Chain name or Chain ID  (<a href="#get-dexes-list">supported chains</a>)</td></tr><tr><td>inTokenAddress</td><td>string</td><td>0x783C08b5F26E3daf8C4681F3bf49844e425b6393</td><td>Input token address</td></tr><tr><td>outTokenAddress</td><td>string</td><td>0xD81D45E7635400dDD9c028839e9a9eF479006B28</td><td>Output token address</td></tr><tr><td>amountDecimals</td><td>string</td><td>1000000</td><td>Token amount with decimals. For example, if 1 USDT is input, use 1000000 (1 USDT * 10^6). </td></tr><tr><td>gasPriceDecimals</td><td>string</td><td>1000000000</td><td>GasPrice with decimals.</td></tr><tr><td>slippage</td><td>string</td><td>1</td><td><p>Define the acceptable slippage level by inputting a percentage value within the range of <strong>0.05 to 50.</strong><br><br>e.g. 1% slippage set as 1</p><p>default value 1</p></td></tr><tr><td>account</td><td>string</td><td>0xaPbs...D9sh</td><td>user's wallet address.<br><mark style="color:orange;">*If this param is not included in the request url, the response will only return quotes, without the calldata/transaction body.</mark></td></tr><tr><td>referrer</td><td>string (Optional)</td><td>0xD4eb...37BB</td><td>An EOA wallet address used to identify partners and optionally receive a fee from users. <br>If no fee is set up, it serves purely as a tracking tool to help our dev team provide better support and insights.</td></tr><tr><td>referrerFee</td><td>number (Optional)</td><td>1</td><td><p>Specify the percentage of in-token you wish to receive from the transaction, within the range of 0% to 5%, with 1% represented as '1', in the range of 0.01 to 5.</p><p>e.g. 1.2% fee set as 1.2</p><p></p><p>By default, OpenOcean shares 20% of the fee. Please contact us if you wish to modify this rate.</p></td></tr><tr><td>enabledDexIds</td><td>string (Optional)</td><td>1</td><td><p>Enter the 'index' number of dexs through <a href="#get-dexes-list">dexList</a>  endpoint to enable the dexs to access.</p><p>Note: <code>enableDexIds</code> has higher priority compare with <code>disabledDexIds</code></p></td></tr><tr><td>disabledDexIds</td><td>string (Optional)<br></td><td>1</td><td>Enter the 'index' number of dexs through <a href="#get-dexes-list">dexList</a>  endpoint to disable single or multiple dexs separated by commas, e.g. <code>disabledDexIds</code>: "2,6,9".</td></tr><tr><td>sender</td><td>string (Optional)</td><td>0xaPbs...D9sh</td><td>If you want to set the receiving address, you will use the sender field. Sender is the sending address, and account is the receiving address</td></tr></tbody></table>

{% hint style="warning" %}
<mark style="color:orange;">**We are deprecating the use of**</mark><mark style="color:orange;">**&#x20;**</mark><mark style="color:orange;">**`amount`**</mark><mark style="color:orange;">**&#x20;**</mark><mark style="color:orange;">**and**</mark><mark style="color:orange;">**&#x20;**</mark><mark style="color:orange;">**`gasPrice`**</mark><mark style="color:orange;">**&#x20;**</mark><mark style="color:orange;">**parameters.**</mark>\ <mark style="color:orange;">**They will be replaced by**</mark><mark style="color:orange;">**&#x20;**</mark><mark style="color:orange;">**`amountDecimals`**</mark><mark style="color:orange;">**&#x20;**</mark><mark style="color:orange;">**and**</mark><mark style="color:orange;">**&#x20;**</mark><mark style="color:orange;">**`gasPriceDecimals`**</mark><mark style="color:orange;">**, respectively.**</mark>\ <mark style="color:orange;">**The previous parameters did not include token decimal, and going forward, all values must be passed with full decimals.**</mark>
{% endhint %}

**Example:**

* request:

{% code title="with decimals" overflow="wrap" %}
```http
https://open-api.openocean.finance/v4/bsc/swap?inTokenAddress=0x55d398326f99059ff775485246999027b3197955&outTokenAddress=0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d&amountDecimals=5000000000000000000&gasPriceDecimals=1000000000&slippage=1&account=0x9116780aEf4B376499358fa7dEeC00cCF64fA801&referrer=0xD4eb4cbB1ECbf96a1F0C67D958Ff6fBbB7B037BB
```
{% endcode %}

{% code title="without decimals" overflow="wrap" %}
```http
https://open-api.openocean.finance/v4/bsc/swap?inTokenAddress=0x55d398326f99059ff775485246999027b3197955&outTokenAddress=0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d&amount=5&gasPrice=1&slippage=1&account=0x9116780aEf4B376499358fa7dEeC00cCF64fA801&referrer=0xD4eb4cbB1ECbf96a1F0C67D958Ff6fBbB7B037BB
```
{% endcode %}

* response:

```javascript
{
    "code": 200,
    "data": {
        "inToken": {
            "address": "0x55d398326f99059ff775485246999027b3197955",
            "decimals": 18,
            "symbol": "USDT",
            "name": "Tether USD",
            "usd": "0.998546",
            "volume": 4.99273
        },
        "outToken": {
            "address": "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
            "decimals": 18,
            "symbol": "USDC",
            "name": "USD Coin",
            "usd": "0.999955",
            "volume": 4.993697212299812
        },
        "inAmount": "5000000000000000000",
        "outAmount": "4993921938787056372",
        "estimatedGas": 516812,
        "minOutAmount": "4943982719399185808",
        "from": "0x9116780aEf4B376499358fa7dEeC00cCF64fA801",
        "to": "0x6352a56caadC4F1E25CD6c75970Fa768A3304e64",
        "value": "0",
        "gasPrice": "1000000000",
        "data": "0x90411a32...",
        "chainId": 56,
        "rfqDeadline": 0,
        "gmxFee": 0,
        "price_impact": "0.01%"
    }
}

```

{% hint style="warning" %}
The`'estimatedGas'`in the returned response is only a reference. When sending transactions on-chain, use eth\_estimateGas \* 1.25 -1.5 as needed. If the ‘`estmateGas`’ fails, we don't recommend submitting the tx on-chain.&#x20;

We also recommend updating the '`gasprice'` parameter to avoid future failures due to the fluctuations of the on-chain gas price.
{% endhint %}



## Get TokenList

* URL: <mark style="color:blue;">`https://open-api.openocean.finance/v4/:chain/tokenList`</mark>
* Method: get
* Params:

<table><thead><tr><th width="135">parameter</th><th width="110">type</th><th width="104">example</th><th>description</th></tr></thead><tbody><tr><td>chain</td><td>string</td><td>bsc or 56</td><td>Chain name or Chain ID  (<a href="#get-dexes-list">supported chains</a>)</td></tr></tbody></table>

**Example:**

* Request:&#x20;

```http
https://open-api.openocean.finance/v4/bsc/tokenList
```

* Response:

```javascript
{
"code": 200,
"data": [ {       
    "id":2737,
    "code":"minu",
    "name":"Minu",
    "address":"0xf48f91df403976060cc05dbbf8a0901b09fdefd4",
    "decimals":18,"symbol":"Minu",
    "icon":"https://s3.openocean.finance/token_logos/logos/1708980043911_24176891326005867.jpg",
    "chain":"bsc","createtime":"2024-02-26T20:40:57.000Z",
    "hot":null,"sort":"2024-02-26T20:40:57.000Z",
    "chainId":null,
    "customSymbol":null,
    "customAddress":null,
    "usd":"6.38459e-7"}
    ...
    ]
}
```

## Get Dexes List <a href="#get-dexes-list" id="get-dexes-list"></a>

* URL: <mark style="color:blue;">`https://open-api.openocean.finance/v4/:chain/dexList`</mark>
* Method: get
* Params:

<table><thead><tr><th width="131">Parameter</th><th width="103">type</th><th width="118">example</th><th>description</th></tr></thead><tbody><tr><td>chain</td><td>string</td><td>bsc or 56</td><td>chain name or chain ID  (<a href="https://apis.openocean.finance/developer/developer-resources/supported-chains">support chain</a>)</td></tr></tbody></table>

**Example:**

* Request:&#x20;

```javascript
https://open-api.openocean.finance/v3/avax/dexList
```

Response:

```javascript
{
"code": 200,
"data": [
    {
        "index": 1,
        "code": "SushiSwap",
        "name": "SushiSwap"
    },
    {
        "index": 2,
        "code": "Pangolin",
        "name": "Pangolin"
    },
    ...
]  // Response
}
```

## Get GasPrice

* URL: <mark style="color:blue;">`https://open-api.openocean.finance/v4/:chain/gasPrice`</mark>
* Method: get
* Params:

<table><thead><tr><th width="131">parameter</th><th width="103">type</th><th width="118">example</th><th>description</th></tr></thead><tbody><tr><td>chain</td><td>string</td><td>bsc or 56</td><td>chain name or chain ID (<a href="#get-dexes-list">supported chains</a>)</td></tr></tbody></table>

**Example:**

* Request:&#x20;

```http
https://open-api.openocean.finance/v4/bsc/gasPrice
```

* Response (eth):

```javascript
{
    "code": 200,
    "data": {
        "base": 605865956,
        "standard": {
            "legacyGasPrice": 605865956,
            "maxPriorityFeePerGas": 500000000,
            "maxFeePerGas": 1366388318,
            "waitTimeEstimate": 45000
        },
        "fast": {
            "legacyGasPrice": 605865956,
            "maxPriorityFeePerGas": 2000000000,
            "maxFeePerGas": 3393491699,
            "waitTimeEstimate": 30000
        },
        "instant": {
            "legacyGasPrice": 605865956,
            "maxPriorityFeePerGas": 2000000000,
            "maxFeePerGas": 3393491699,
            "waitTimeEstimate": 30000
        },
        "low": {
            "legacyGasPrice": 605865956,
            "maxPriorityFeePerGas": 150400,
            "maxFeePerGas": 606016356,
            "waitTimeEstimate": 60000
        }
    },
    "without_decimals": {
        "base": 0.605865956,
        "standard": {
            "legacyGasPrice": 0.605865956,
            "maxPriorityFeePerGas": 0.5,
            "maxFeePerGas": 1.366388318,
            "waitTimeEstimate": 0.000045
        },
        "fast": {
            "legacyGasPrice": 0.605865956,
            "maxPriorityFeePerGas": 2,
            "maxFeePerGas": 3.393491699,
            "waitTimeEstimate": 0.00003
        },
        "instant": {
            "legacyGasPrice": 0.605865956,
            "maxPriorityFeePerGas": 2,
            "maxFeePerGas": 3.393491699,
            "waitTimeEstimate": 0.00003
        },
        "low": {
            "legacyGasPrice": 0.605865956,
            "maxPriorityFeePerGas": 0.0001504,
            "maxFeePerGas": 0.606016356,
            "waitTimeEstimate": 0.00006
        }
    }
}
```

* Response (other evm chain):

{% code overflow="wrap" %}
```javascript
{
 "code": 200,
 "data": {
  "standard": 1000000000,
  "fast": 1000000000,
  "instant": 1000000000
 },
 "without_decimals": {
  "standard": "1",
  "fast": "1",
  "instant": "1"
 }
}
```
{% endcode %}

{% hint style="info" %}
<mark style="color:orange;">Please be aware that when using</mark><mark style="color:orange;">`/quote`</mark> <mark style="color:orange;"></mark><mark style="color:orange;">and</mark><mark style="color:orange;">`/swap`</mark><mark style="color:orange;">in our API,</mark> <mark style="color:orange;"></mark><mark style="color:orange;">**the**</mark> [<mark style="color:orange;">**gasPrice**</mark>](https://docs.openocean.finance/dev/aggregator-api-and-sdk/aggregator-api-v3#price-quote) <mark style="color:orange;">**should set in GWEI without decimals.**</mark>

<mark style="color:orange;">e.g. 14 GWEI set as</mark> <mark style="color:orange;"></mark><mark style="color:orange;">`14`</mark>
{% endhint %}

## Get Transaction

* URL: <mark style="color:blue;">`https://open-api.openocean.finance/v4/:chain/getTransaction`</mark>
* Method: get
* Params:

<table><thead><tr><th>parameter</th><th width="109">type</th><th width="107">example</th><th>description</th></tr></thead><tbody><tr><td>chain</td><td>string</td><td>bsc or 56</td><td>Chain name or Chain ID          (<a href="#get-dexes-list">supported chains</a>)</td></tr><tr><td>hash</td><td>string</td><td></td><td>Hash from the OpenOcean contract on the blockchain</td></tr></tbody></table>

**Example:**

* Request:&#x20;

{% code overflow="wrap" %}
```http
https://open-api.openocean.finance/v4/bsc/getTransaction?hash=0x756b98a89714be5c640ea9922aba12e0c94bc30e5a17e111d1aa40373cc24782
```
{% endcode %}

* Response:

```javascript
{
  "code": 200,
  "data":  {
"id": 1194505,
"tx_id": null,
"block_number": 37495567,
"tx_index": 153,
"address": "0x6352a56caadC4F1E25CD6c75970Fa768A3304e64",
"tx_hash": "0x756b98a89714be5c640ea9922aba12e0c94bc30e5a17e111d1aa40373cc24782",
"tx_hash_url": "https://bscscan.com/tx/0x756b98a89714be5c640ea9922aba12e0c94bc30e5a17e111d1aa40373cc24782",
"sender": "0xB3cbefF0336BaA4863Cb51238bD6C35BDAaB3D84",
"receiver": "0xB3cbefF0336BaA4863Cb51238bD6C35BDAaB3D84",
"in_token_address": "0x8ea5219a16c2dbF1d6335A6aa0c6bd45c50347C5",
"in_token_symbol": "OOE",
"out_token_address": "0x55d398326f99059fF775485246999027B3197955",
"out_token_symbol": "USDT",
"referrer": "0x3487Ef9f9B36547e43268B8f0E2349a226c70b53",
"in_amount": "276240675000000000000",
"out_amount": "5913781972337104042",
"fee": "",
"referrer_fee": "",
"usd_valuation": 5.89409756,
"create_at": "2024-04-02T02:23:04.000Z",
"update_at": "2024-04-02T02:23:04.000Z",
"tx_fee": "0.000238858",
"tx_fee_valuation": "0.13744845",
"in_token_decimals": 18,
"out_token_decimals": 18,
"in_amount_value": "276.240675",
"out_amount_value": "5.913781972337104042",
"tx_profit": "0",
"tx_profit_valuation": "0",
"platform": null,
"status": 1
  }
}
```

## DecodeInputData

* URL: <mark style="color:blue;">`https://open-api.openocean.finance/v4/:chain/decodeInputData`</mark>
* Method: get
* Params:

<table><thead><tr><th>parameter</th><th width="112">type</th><th width="116">example</th><th>description</th></tr></thead><tbody><tr><td>chain</td><td>string</td><td>bsc or 56</td><td>Chain name or Chain ID          (<a href="#get-dexes-list">supported chains</a>)</td></tr><tr><td>data</td><td>string</td><td></td><td>inputData</td></tr><tr><td>method</td><td>string</td><td>swap</td><td>function name</td></tr></tbody></table>

**Example:**

* Request:&#x20;

{% code overflow="wrap" %}
```http
https://open-api.openocean.finance/v4/bsc/decodeInputData?data={000000xxxxxx}&method=swap
```
{% endcode %}

* response:

```javascript
  {
  "caller": "0x55877bD7F2EE37BDe55cA4B271A3631f3A7ef121",
  "desc": {
"srcToken": "0x8ea5219a16c2dbF1d6335A6aa0c6bd45c50347C5",
"dstToken": "0x55d398326f99059fF775485246999027B3197955",
"srcReceiver": "0xcE07D794FD313a1792E9bdef9912a949DfE99D75",
"dstReceiver": "0xB3cbefF0336BaA4863Cb51238bD6C35BDAaB3D84",
"amount": "276240675000000000000",
"minReturnAmount": "5854644152613733002",
"guaranteedAmount": "5913781972337104042",
"flags": "2",
"referrer": "0x3487Ef9f9B36547e43268B8f0E2349a226c70b53",
"permit": "0x"
  },
  "calls": [
{
  "target": "0",
  "gasLimit": "0",
  "value": "0",
  "data": "0xcac460ee00000000000000003b7c4580ce07d794fd313a1792e9bdef9912a949dfe99d750000000000000000000000008ea5219a16c2dbf1d6335a6aa0c6bd45c50347c50000000000000000000000008e50d726e2ea87a27fa94760d4e65d58c3ad8b44"
},
{
  "target": "0",
  "gasLimit": "0",
  "value": "0",
  "data": "0xcac460ee80000000000000003b8b87c08e50d726e2ea87a27fa94760d4e65d58c3ad8b44000000000000000000000000e9e7cea3dedca5984780bafc599bd69add087d5600000000000000000000000055877bd7f2ee37bde55ca4b271a3631f3a7ef121"
},
{
  "target": "0",
  "gasLimit": "0",
  "value": "0",
  "data": "0x8a6a1e8500000000000000000000000055d398326f99059ff775485246999027b3197955000000000000000000000000353c1f0bc78fbbc245b3c93ef77b1dcc5b77d2a00000000000000000000000000000000000000000000000005211f95f0c4314aa"
},
{
  "target": "0",
  "gasLimit": "0",
  "value": "0",
  "data": "0x9f86542200000000000000000000000055d398326f99059ff775485246999027b319795500000000000000000000000000000001000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000004400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000064d1660f9900000000000000000000000055d398326f99059ff775485246999027b3197955000000000000000000000000b3cbeff0336baa4863cb51238bd6c35bdaab3d84000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000"
}
  ]
}
```

