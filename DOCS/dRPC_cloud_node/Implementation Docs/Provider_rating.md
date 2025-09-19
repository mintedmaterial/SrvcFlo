Provider rating
The core thing of DRPC’s load balancing algorithm is provider rating. The idea is this rating defines how well given provider matches for given request.

Rating dimension
We won’t list here the exact formulas as they can change often, but we will describe key features. The following logic will change often also, so we provide the current state as we’re writing this doc.

The initial concept to discuss is rating dimensions. Each provider can host many different networks and perform differently on different methods, so we actually need a lot of ratings per provider.

Essentially, our rating system is multidimensional. This means that each provider has several ratings, and each request utilizes one of these "rating dimensions" for load balancing.

A rating dimension can be described as a Go structure.

type RatingDimension struct {
	Kind         DimensionKind
	Method       string
	Chain        dshackle.ChainRef
	SourceRegion reducerstates.Region
}
Let’s describe what each field means.

Method. Directly represents the method of the request. Since different methods require varying amounts of time and effort to handle, it is essential to differentiate each method as one of the dimensions.
Chain is a network ID. Obviously, we need to have separate ratings for different chains
SourceRegion helps us to compare provider`s performance for requests originating from the same region. For example, providers in Europe typically have better ratings for requests from Europe than those from the US.
Kind is more of a way to filter some providers from our rating table defined by other parameters. We could, of course, filter providers before sampling, but maintaining separate tables for each kind is more efficient.
Public — filters only public providers that are free
Best latency — filters only top performers
All — does not filter out
For all different dimension of all providers we calculate the average performance of the provider in that dimension in terms of latency, errors and other features. We calculate it every second. Also we calculate bunch of different exponential moving average (EMA) for this performance averages and also use it as a features. We'll explain this below.

Rating calculation#
![alt text](image-2.png)

Our system updates ratings every 5 seconds on each dproxy independently, meaning the ratings could vary but not substantially.

The diagram below illustrates the basics of rating calculation. The rating consists several components:

Provider Performance Data: Calculated every second by averaging metrics like latency, error rates, EMAs, etc.
Machine Learning Algorithm: Trained on historical data to predict future performance and calculate ratings based on current performance metrics. The input includes various provider features and exponential moving averages (EMAs) with differing sensitivities to performance over time. This algorithm is not only predictive but also highly interpretable.
Rating Registry: The final rating is stored in the rating registry for subsequent use.
The parts of the pipeline
Performance of the providers as an input
Performance data is calculated based on the performance of a provider in the last second. Remember that we operate in a certain rating dimension and use data only from this dimension (chain, region, etc). Represented as an abstract number and a series of EMAs based on it, closely associated with latency and less so with error rates and other metrics by each dimension. So let's see what is inside the performance data.

Previous average latency. We use the average latency of the last second for each provider in each dimension.

Errors. We have very little tolerance for errors, so if a provider returns 10-20 errors, it will be heavily weighted within the ML algorithm and the next prediction of the performance will be very low.

EMAs. As described below, allow the ML algorithm to consider the 'history' of the provider's performance.

Exponential moving average
EMA is a term from signal processing. It can be represented as follows

y
t
=
α
x
t
+
(
1
−
α
)
y
t
−
1
y 
t
​
 =αx 
t
​
 +(1−α)y 
t−1
​
 
Our provider's performance is a time series. We can interpolate this time series by different EMAs. EMA smooths the series, which can be very noisy, but it retains the overall trend. With different alpha it "remember" past performance at varying points, allowing the algorithm to consider historical data within a specific timeframe.

Machine Learning Algorithm
The ML algorithm for now is Linear Regression on features of the providers. As we remember features are several things. It is the dimension (chain, method, region, etc.), average latencies, EMAs, errors, some other features that can be added or removed, as we retrain our algorithm quite often. We use Linear Regression because it's the very fast algorithm. Not very sophisticated, but the pros of this approach are speed.

Firstly, because there is such thing as domain drift - it is when data with time changes and algorithm need to be aligned with the current state of the whole system and data. Secondly, because we developing our algorithm to be more effective.

We use VowpalWabbit machine learning framework that is written in C++ with Go bindings. We train our model and inference it with this framework. It works very well on a large scale with a high load. It can be used for online learning. But now we don't use online learning. An inference model on millions of inputs takes less than half a second.

The Linear Regression predicts the performance number for each provider in each dimension for the next several seconds. Now it's 5 seconds. After we have this number we can calculate the rating. In each dimension usually there are several providers. We take the performance numbers of the providers and put them in Softmax function to get the probability distribution. So for us, Softmax is a probability density function.

Softmax
Softmax is a function that maps a vector of numbers to a probability distribution. It's not real probability but behaves like it.

σ
(
z
)
i
=
e
z
i
∑
j
=
1
K
e
z
j
σ(z) 
i
​
 = 
∑ 
j=1
K
​
 e 
z 
j
​
 
 
e 
z 
i
​
 
 
​
 
So basically our rating is probability distribution across providers in a given dimension, and we can use that probability to weight sampling where we decide which provider gets a request. If the probability of the provider is higher it gets a request with a higher probability.

But Softmax function is an exponential function means if we don't modify it, the distribution of the probability will be exponential. To handle that we have a parameter called temperature, it's unify distribution among providers, which means providers with bad performance get some probability anyway, and the best top provider doesn't take all requests.

Remember, that we don't want the situation where the winner takes all! It serves several goals - all providers get requests anyway, some more, some less and we can test the performance of all providers.

Sampling
On every request in a certain dimension, we take the rating for this dimension from the registry and random sample with weights of probability in rating to whom we give the request. But before there are routing strategies

