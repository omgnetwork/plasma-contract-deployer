# plasma-contract-deployer
Simple node service to deploy the plasma-contracts. Only one deployment can run at a time. Each deployment does the following:
1. Cleans up after any previous deployment
2. Clones the [plasma-contracts](https://github.com/omisego/plasma-contracts) repo with the given tag (or branch).
3. Runs `npm install` in the cloned repo.
4. Runs `npx truffle ` + deploy.args in the cloned repo.

The results of the last 5 deploys are stored in memory.

## Configuration
The following environment variables should be set, either in the container or sent to the deploy job:
 - `MIN_EXIT_PERIOD` Minimum exit period in seconds. **Required**.
 - `SOLC_VERSION` Solidity compiler version. Defaults to `0.4.25`
 - `ETH_CLIENT_HOST` Host of Ethereum client. Defaults to `127.0.0.1`
 - `ETH_CLIENT_PORT` Port of Ethereum client. Defaults to `8545`
 - `DEPLOYER_ADDRESS` Address of the `DEPLOYER` account. Defaults to `accounts[0]`
 - `DEPLOYER_PASSPHRASE` Passphrase of the `DEPLOYER` account.
 - `AUTHORITY_PASSPHRASE` Passphrase of the `AUTHORITY` account.
 - `AUTHORITY_ADDRESS_INITIAL_AMOUNT` The amount to fund the `AUTHORITY` account with (in wei). Defaults to 1 ETH.

# API

## Run a deployment
POST http://localhost:3333/deploy
```
{
	"deploy": {
		"id": "a6ff00e9feb18400551fef6c3e5900df",
		"args": ["migrate", "--quiet", "--network", "rinkeby"],
		"cwd": "/home/omg",
		"env": {
			"MIN_EXIT_PERIOD": 300
		}
	}
}
```
If no `id` is passed it will generate one.
Returns the deploy id e.g. `a6ff00e9feb18400551fef6c3e5900df`


## Get the status of a deploy
GET http://localhost:3333/deploy/:id/status

Returns what the deploy is currently doing, e.g.
- `Starting`
- `Cloning git repo...`
- `Running truffle...`
- `Exited`


## Check if the deploy succeeded
GET http://localhost:3333/deploy/:id/success

Returns `true` if the tests passed (i.e. exited with code 0), `false` otherwise.


## Get the output
GET http://localhost:3333/deploy/:id/output

Returns both stdout and stderr
```
{
    "stdout": "Compiling your contracts...",
    "stderr": "npm ERR! ...",
	"result": {
		"contract_addr": "0x8f2E86DBD4b174Cf42FF20a2e2A69d4D8c4c421E",
		"txhash_contract": "0x9d6760891302b49512d9e01ecde6bedb388a3269689b9e5e1c3303247c2757c8",
		"authority_addr": "0xA40D11b34654168451CF598a616F9c954E4BD852"
    }
}
```
