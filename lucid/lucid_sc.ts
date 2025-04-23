import {Blockfrost, Lucid, Crypto, fromText, Data} from "https://deno.land/x/lucid/mod.ts";

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
const toAddress = "addr_test1qzldl9u0j6ap7mdugtdcre43f8dfrnv7uqd3a6furpyuzw3z70zawv8g3tyg7uh833x50geeul2vpyujyzac0d6dmgcsyu5akw";

// AlwaySucceed
const alwaysSucceed = lucid.newScript({
    type: "PlutusV3",
    script: "588501010029800aba2aba1aab9faab9eaab9dab9a48888896600264653001300700198039804000cc01c0092225980099b8748008c01cdd500144c8cc896600266e1d2000300a375400d132325980098080014528c5900e1bae300e001300b375400d16402460160026016601800260106ea800a2c8030600e00260066ea801e29344d9590011",
});

const alwaysSucceedAddress = alwaysSucceed.toAddress();
console.log(`Always succeed address: ${alwaysSucceedAddress}`);

const Datum = () => Data.void();

const RedeemerSchema = Data.Object({
    msg: Data.Bytes,
});
const Redeemer = () => Data.to({ msg: fromText("Hello!")}, RedeemerSchema);

const lovelace_lock = 100_000_253n;
console.log(`Lovelace lock: ${lovelace_lock}`);


// Lock UTxO
export async function lockUtxo(lovelace:bigint): Promise<string> {
    const tx = await lucid.newTx()
        .payToContract(alwaysSucceedAddress, { Inline: Datum() }, { lovelace })
        .commit();
    const signedTx = await tx.sign().commit();
    const txHash = await signedTx.submit();

    return txHash;
}

// Unlock
export async function unlockUtxo(lovelace:bigint): Promise<string> {
    const utxo = (await lucid.utxosAt(alwaysSucceedAddress)).find((utxo) =>
        utxo.assets.lovelace >= lovelace && utxo.datum === Datum() && !utxo.scriptRef
    );
    console.log(utxo);
    if (!utxo) throw new Error(`No UTxo with lovelace >= ${lovelace} found`);

    const tx = await lucid.newTx()
        .collectFrom([utxo], Redeemer())
        .attachScript(alwaysSucceed)
        .commit();
    const signedTx = await tx.sign().commit();
    const txHash = await signedTx.submit();

    return txHash;
}

async function main() {
    try {
        // const txHash = await lockUtxo(lovelace_lock);
        // console.log(`txHash: ${txHash}`);

        const redeemTxHash = await unlockUtxo(lovelace_lock);
        console.log(`Transaction hash: ${redeemTxHash}`);
    } catch (error) {
        console.error("Error locking utxo:", error);
    }
}

main()