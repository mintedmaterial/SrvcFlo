Rate limiting
We have rate limiting for public nodes (which are always free of charge), and no rate limiting for the paid tier. Because we charge users on per request basis, you can make as much paid requests as you want while you have enough CUs on your deposit.

For requests to free nodes we have following rules:

The Free Tier includes 210 million Compute Units (CU) per 30-day period, resetting every 30 days from the date of registration.
At normal conditions for free tier we have a limit of 120000 CUs per minute per IP. This is approximately 100 eth_call requests per second
If there is a high demand for free requests in a specific region, the limit may be reduced. The minimum limit is set at 50400 CUs per minute, which is equivalent to 40 eth_call requests.
Some methods cost 0 CU (like eth_chainId), but when rate limiting the minimum cost of every call is 10 CU, thus free methods could't be abused
