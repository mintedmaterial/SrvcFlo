# wallet_getCapabilities

> Retrieves wallet capabilities and supported configurations for specified chain IDs.

## OpenAPI

````yaml Smart-Wallet-SDK/Smart-Wallet-Endpoints/wallet_getCapabilities.json post /smartwallet
paths:
  path: /smartwallet
  method: post
  servers:
    - url: https://api.gelato.digital
  request:
    security: []
    parameters:
      path: {}
      query:
        apiKey:
          schema:
            - type: string
              required: false
              description: API key for authentication.
      header: {}
      cookie: {}
    body:
      application/json:
        schemaArray:
          - type: object
            properties:
              id:
                allOf:
                  - type: number
                    default: 1
              jsonrpc:
                allOf:
                  - type: string
                    default: '2.0'
              method:
                allOf:
                  - type: string
                    default: wallet_getCapabilities
              params:
                allOf:
                  - type: array
                    description: Array containing a single GetCapabilitiesParams object
                    minItems: 1
                    maxItems: 1
                    items:
                      $ref: '#/components/schemas/GetCapabilitiesParams'
            required: true
            refIdentifier: '#/components/schemas/Request'
        examples:
          example:
            value:
              id: 1
              jsonrpc: '2.0'
              method: wallet_getCapabilities
              params:
                - chainIds:
                    - 123
  response:
    '200':
      application/json:
        schemaArray:
          - type: object
            properties:
              id:
                allOf:
                  - type: number
                    default: 1
              jsonrpc:
                allOf:
                  - type: string
                    default: '2.0'
              result:
                allOf:
                  - type: object
                    description: Object mapping chain IDs to their capabilities
                    additionalProperties:
                      $ref: '#/components/schemas/ChainCapabilities'
            refIdentifier: '#/components/schemas/Response'
        examples:
          example:
            value:
              id: 1
              jsonrpc: '2.0'
              result: {}
        description: Successful response
    '400':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - type: string
        examples:
          example:
            value:
              message: <string>
        description: Validation error
  deprecated: false
  type: path
components:
  schemas:
    GetCapabilitiesParams:
      type: object
      title: GetCapabilitiesParams
      properties:
        chainIds:
          type: array
          description: Array of chain IDs to get capabilities for
          items:
            type: number
      required:
        - chainIds
    ChainCapabilities:
      type: object
      title: ChainCapabilities
      properties:
        feeCollector:
          type: string
          description: Address of the fee collector contract
        tokens:
          type: array
          description: Array of supported tokens
          items:
            $ref: '#/components/schemas/Token'
        contracts:
          $ref: '#/components/schemas/Contracts'
    Token:
      type: object
      title: Token
      properties:
        address:
          type: string
          description: Token contract address
        symbol:
          type: string
          description: Token symbol
        decimals:
          type: number
          description: Token decimal places
      required:
        - address
        - symbol
        - decimals
    Contracts:
      type: object
      title: Contracts
      properties:
        delegation:
          $ref: '#/components/schemas/DelegationContracts'
    DelegationContracts:
      type: object
      title: DelegationContracts
      properties:
        gelato:
          type: array
          description: Array of Gelato delegation contracts
          items:
            $ref: '#/components/schemas/ContractInfo'
        kernel:
          type: array
          description: Array of Kernel delegation contracts
          items:
            $ref: '#/components/schemas/ContractInfo'
    ContractInfo:
      type: object
      title: ContractInfo
      properties:
        address:
          type: string
          description: Contract address
        version:
          type: string
          description: Contract version
      required:
        - address
        - version

````