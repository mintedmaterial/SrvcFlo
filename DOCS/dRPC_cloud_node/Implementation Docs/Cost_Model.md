Cost model
Execution flow requires cost model so it can deduct payments for made requests.

Cost model is represented by interface

type CostModel interface {
	LockCost([]RoutedRequest) error
	FinalizeCost([]RoutedRequest) error
}
As described in execution flow docs, it has 2 methods. Read more about how it works with execution flow here.

General algorithm
So given number of routed requests we want to define their cost. The simplest cost model would be just to use each call CU cost according to this table.

However, we need to take several facts into account:

We do not charge for requests to public providers. So, any requests to them cost 0.
Each provider has its own user on drpc.org and there is a link between their account and provider. So, if they make requests as a client, we do not charge them in case they make requests to their own provider.
Locking cost
Using algorithm described above we first deduct payments from client according to the best case scenario.

We use each routed request strategy call GetProviders(false) to get the providers that we will try to use for requests.

Finalizing cost
For each request we call GetProviders(true) to get actual providers that performed meaningful work. We then recalculate new cost according to this set of providers and compensate the difference (or deduct more if appropriate).

