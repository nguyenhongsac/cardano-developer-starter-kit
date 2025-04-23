#1-Cài đặt xxd nếu chưa có
apt upgrade
apt update
apt install xxd


#2-Tạo thư mục và Policy
mkdir policy
cardano-cli address key-gen \
    --verification-key-file policy/policy.vkey \
    --signing-key-file policy/policy.skey
	
touch policy/policy.script && echo "" > policy/policy.script

echo "{" >> policy/policy.script
echo "  \"keyHash\": \"$(cardano-cli address key-hash --payment-verification-key-file policy/policy.vkey)\"," >> policy/policy.script
echo "  \"type\": \"sig\"" >> policy/policy.script
echo "}" >> policy/policy.script

cardano-cli conway transaction policyid --script-file ./policy/policy.script > policy/policyID

#3-Tạo biến môi trường
testnet="--testnet-magic 2"
address=$(cat base.addr)
address_SKEY="payment.xsk"
cardano-cli query utxo --address $address $testnet

txhash="ee321281c8eac8f0a82c6b6f9ed959aaedce1be04f9196b4a5294dac8e5e1d8c"
txix="0"
policyid=$(cat policy/policyID)

realtokenname="NFT1"
tokenname=$(echo -n $realtokenname | xxd -b -ps -c 80 | tr -d '\n')
tokenamount="1"
output="2000000"
ipfs_hash="QmRE3Qnz5Q8dVtKghL4NBhJBH4cXPwfRge7HMiBhK92SJX"

#4-Tạo metadata
echo "{" >> metadata.json
echo "  \"721\": {" >> metadata.json
echo "    \"$(cat policy/policyID)\": {" >> metadata.json
echo "      \"$(echo $realtokenname)\": {" >> metadata.json
echo "        \"description\": \"This is my first NFT thanks to the Cardano foundation\"," >> metadata.json
echo "        \"name\": \"Cardano foundation NFT guide token\"," >> metadata.json
echo "        \"id\": \"1\"," >> metadata.json
echo "        \"image\": \"ipfs://$(echo $ipfs_hash)\"" >> metadata.json
echo "      }" >> metadata.json
echo "    }" >> metadata.json
echo "  }" >> metadata.json
echo "}" >> metadata.json


#4-Tạo giao dịch
cardano-cli conway transaction build \
$testnet \
--tx-in $txhash#$txix \
--tx-out $address+$output+"$tokenamount $policyid.$tokenname" \
--mint "$tokenamount $policyid.$tokenname" \
--mint-script-file policy/policy.script \
--change-address $address \
--metadata-json-file metadata.json  \
--out-file mint-nft.raw


#5-Tạo ký giao dịch
cardano-cli conway transaction sign  $testnet \
--signing-key-file $address_SKEY  \
--signing-key-file policy/policy.skey  \
--tx-body-file mint-nft.raw \
--out-file mint-nft.signed

#5-Gửi giao dịch 

cardano-cli conway transaction submit $testnet --tx-file mint-nft.signed 




#================= Burn token vừa tạo=============
#1-Truy vấn token nằm ở UTXO nào
cardano-cli query utxo $testnet --address $address 

#2- cập nhật biến môi trường
txhash="5a4925b330916e62307766802f5af4ce8b234c27de8271a901086c08733da0f1"
txix="0"
burnoutput="1000000"

#3-Tạo giao dịch
cardano-cli babbage transaction build \
 --testnet-magic 2 \
 --tx-in $txhash#$txix \
 --tx-out $address+$burnoutput \
 --mint="-10000 $policyid.$tokenname" \
 --minting-script-file policy/policy.script \
 --change-address $address \
 --witness-override 2 \
 --out-file burning.raw

#4-Ký giao dịch
cardano-cli conway transaction sign  $testnet \
--signing-key-file $address_SKEY  \
--signing-key-file policy/policy.skey  \
--tx-body-file burning.raw \
--out-file burning.signed

#5-Gửi giao dịch

cardano-cli conway transaction submit $testnet --tx-file burning.signed 