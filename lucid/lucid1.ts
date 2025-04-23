import {Blockfrost, Lucid, Crypto, fromText, Data, Addresses} from "https://deno.land/x/lucid/mod.ts";

const lucid = new Lucid({
    provider: new Blockfrost(
        "https://cardano-preview.blockfrost.io/api/v0",
        "previewK1s74gl73sqECTNmb3ngTOImgxrjIpFn",
    ),
});

const seed = "brief parrot real edge puzzle pledge goddess girl violin valid unique mushroom summer silver chimney screen cheese crawl trend indoor peanut execute initial tennis";
lucid.selectWalletFromSeed(seed, {addressType: "Base", index: 0});

const address = await lucid.wallet.address();
console.log("Wallet address: " + address);
const utxos = await lucid.wallet.getUtxos();

const utxo = utxos[0];
const assets = utxo.assets;

// for (const assetname in assets) {
//     console.log(`Assetname: ${assetname}, Value: ${assets[assetname]}`);
// }

// const [scriptUtxo] = await lucid.utxoAt("addr_test1qzf2tg7z07tt4zxnqj0suyw37te9we0xxn3s82569m09u2sm0x5chf2lg3mtnfzvn9g5ag3j2zg0gve4jg80tjwhf79qck749x");
// console.log(utxos)

const toAddress = "addr_test1qzldl9u0j6ap7mdugtdcre43f8dfrnv7uqd3a6furpyuzw3z70zawv8g3tyg7uh833x50geeul2vpyujyzac0d6dmgcsyu5akw";
// const amount = 5000000n;
const metadata = {msg: ["Nguyen Hong Sac_253"]};

/*
// =======Create Transaction========
const tx = await lucid.newTx()
    .payTo(toAddress, {lovelace: amount})
    .attachMetadata(674, metadata)
    .commit();

//=========Sign transaction
const signedTx = await tx.sign().commit();

//=========Submit transaction
const txHash = await signedTx.submit();
console.log(`txHas: ${txHash}`)
*/


//  Send native tokens
const { payment } = Addresses.inspect(
    await lucid.wallet.address(),
);

const mintingScripts = lucid.newScript(
    {
        type: "All",
        scripts: [
            { type: "Sig", keyHash: payment.hash },
            {
                type: "Before",
                slot: BigInt(78668654),
            },
        ],
    },
); 
const policyId = mintingScripts.toHash();
const assetName = "Nguyen Hong Sac_253"
const amount = 1n

async function createSendNativeTokens(toAddress: string, policyId: string, assetName: string, amount: bigint) {
    const tx = await lucid.newTx()
        .payTo(toAddress, {[policyId + fromText(assetName)] : amount})
        .attachMetadata(674, metadata)
        .commit();
    return tx;
}
const tx = await createSendNativeTokens(toAddress, policyId, assetName, amount);
let signedTx = await tx.sign().commit()
let txHash = await signedTx.submit()
console.log(`txHash: ${txHash}`)


async function createSendAdaWithDatum(toAddress:string, datum: any, amount: bigint) {
    const tx = await lucid.newTx()
        .payToWithData(toAddress, datum, {lovelace: amount})
        .commit();
    
    return tx;
}
/*
const deadline = BigInt(lucid.utils.unixTimeToSlots(Date.now() + 1));

// Set vesting deadline
const deadlineDate: Date = new Date("2026-04-22T20:00:00Z")
const deadlinePosIx = BigInt(deadlineDate.getTime());
// console.log(deadlinePosIx);
// console.log(BigInt(lucid.utils.unixTimeToSlots(deadlinePosIx)));
// console.log(deadline);

const {payment} = Addresses.inspect(address);

const VestingSchema = Data.Object({
    lock_until: Data.Integer(),
    beneficiary: Data.Bytes(),
});
type VestingSchema = typeof VestingSchema;

const d = {
    lock_until: deadlinePosIx,
    beneficiary: payment?.hash,
}

const datum = await Data.to<VestingSchema>(d, VestingSchema);
console.log(datum);

const tx = await createSendAdaWithDatum(toAddress, datum, amount);
let signedTx = await tx.sign().commit();
let txHash = await signedTx.submit();

console.log(`txHash: ${txHash}`)
*/
