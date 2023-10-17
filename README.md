# 1 init caliper-0.4.2-dpchain
set node version and npm version
```
npm   6.14.12
node  10.24.1
```
open terminal 
workdir caliper-0.4.2-dpcain/
```

npm run repoclean

npm run bootstrap
```
to install using node_modules. In china this step will waste time,be patient.

# 2 build  dpchain docker

in this case docker name is `zansan/dper:0.9`'

search it in docker-compose file to change you docker name

# 3 bind dpchain

workdir: caliper-0.4.2-dpcain/packages/caliper_cli
```
node caliper.js bind --caliper-bind-sut dp-chain:latest --caliper-bind-cwd ./../caliper-dp-chain/ 

```
# 4 run test case

```
node caliper.js launch manager \
--caliper-workspace ~/caliper/packages/caliper-tests-integration/dp-chain_tests \
--caliper-benchconfig ~/caliper/packages/caliper-tests-integration/dp-chain_tests/benchconfig.yaml \
--caliper-networkconfig ~/caliper/packages/caliper-tests-integration/dp-chain_tests/networkconfig.json
```