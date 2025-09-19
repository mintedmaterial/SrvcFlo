# Automated Transactions

## What is an Automated Transaction?

Automated Transaction ensures that a specific function on the target smart contract gets reliably triggered. When you pre-define the inputs, it means that every time Gelato initiates the function call, it uses consistent, predetermined arguments.

<Note>
  Automation Transaction enable automation in conjunction with the various trigger types outlined on our [Trigger Types](/Web3-Functions/Introduction/Trigger-types) page.
</Note>

## Essential Roles for Automated Transactions

* **Consistency**: With set arguments, each function activation remains uniform.

* **Reliability**: Minimize errors from inconsistent arguments, ensuring predictable function behavior.
  Minimize errors from inconsistent arguments, ensuring predictable function behavior.

* **Simplicity**: Avoid the complexities of decision-making or added input stages during execution.

## Scenarios for Automated Transactions

* **Periodic Payments**: Automate regular payments, like subscriptions or salaries, where the amount and recipient remain constant.

* **Maintenance Operations**: Execute routine smart contract operations, such as refreshing oracles or updating interest rates, where the action does not change.
  Execute routine smart contract operations, such as refreshing oracles or updating interest rates, where the action does not change.

* **Trigger-Based Actions**: For actions that must occur in response to a specific event, a transaction can be scheduled to execute when the event is observed.

* **Automated Token Transfers**: Transfer tokens at specified intervals or when your contract's logic deems it necessary, without additional input or variation.
  Transfer tokens at specified intervals or when your contract's logic deems it necessary, without additional input or variation.

## Next Steps

Head over to the quick start on how to initiate an Automated Transaction:

<Card title="Initiate an Automated Transaction" icon="link" href="/Web3-Functions/How-To-Guides/Initiate-an-automated-transactions">
  Learn how to initiate an Automated Transaction.
</Card>


