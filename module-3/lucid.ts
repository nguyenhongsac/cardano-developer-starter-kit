import {Blockfrost, Lucid, Crypto, fromText, Data, Addresses} from "https://deno.land/x/lucid/mod.ts";

const lucid = new Lucid({
    provider: new Blockfrost(
        "https://cardano-preview.blockfrost.io/api/v0",
        "previewK1s74gl73sqECTNmb3ngTOImgxrjIpFn",
    ),
});

// Connect wallet using seed phases
const seed = "brief parrot real edge puzzle pledge goddess girl violin valid unique mushroom summer silver chimney screen cheese crawl trend indoor peanut execute initial tennis";
lucid.selectWalletFromSeed(seed, {addressType: "Base", index: 0});

// Show wallet address and Ada
const address = await lucid.wallet.address();
console.log(`Wallet address: ${address}`);

// Get UTxOs
const utxos = await lucid.wallet.getUtxos();

// Count balance in wallet
let totalLovelace = 0n;
for (const utxo of utxos) {
  if (utxo.assets.lovelace) {
    totalLovelace += utxo.assets.lovelace;
  }
}

const totalAda = Number(totalLovelace) / 1_000_000;
console.log(`Wallet balance: ${totalAda}`);


// ===========Minting=========
async function createMintingScripts(slot_in:bigint) {
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
                    slot: BigInt(slot_in),
                },
            ],
        },
    ); 
    
    return mintingScripts;
}
async function mintToken(policyId:string, tokenName: string, amount: bigint, slot_in: bigint): Promise<string> {
    const unit = policyId + fromText(tokenName);
    
    const metadata = {
        [policyId] : {
            [tokenName]: {
                "class": "C2VN_BK03",
                "name": "BK03:253",
                "student_no": 253,
                "image": "ipfs://QmRE3Qnz5Q8dVtKghL4NBhJBH4cXPwfRge7HMiBhK92SJX",
            }
        }
    };

    const tx = await lucid.newTx()
        .mint({ [unit]: amount })
        .validTo(Date.now() + 200000)
        .attachScript(await createMintingScripts(slot_in))
        .attachMetadata(721, metadata)
        .commit();

    const signedTx = await tx.sign().commit();
    const txHash = await signedTx.submit();

    return txHash;
}
// ================End Minting==========


// ================Smart contract============
// AlwaySucceed script (script get from aiken/plutus.json)
const alwaysSucceed = lucid.newScript({
    type: "PlutusV3",
    script: "58af01010029800aba2aba1aab9faab9eaab9dab9a48888896600264653001300700198039804000cc01c0092225980099b8748008c01cdd500144c8cc896600266e1d2000300a375400d13232598009808001456600266e1d2000300c375400713371e6eb8c03cc034dd5180798069baa003375c601e601a6ea80222c805a2c8070dd7180700098059baa0068b2012300b001300b300c0013008375400516401830070013003375400f149a26cac80081",
});

const alwaysSucceedAddress = alwaysSucceed.toAddress();
console.log(`Always succeed address: ${alwaysSucceedAddress}`);


// Set datum and redeemer
const DatumSchema = Data.Object({
    msg: Data.Bytes,
});
const RedeemerSchema = Data.Object({
    msg: Data.Bytes,
});
const Datum = () => Data.to({ msg: fromText("Nguyen Hong Sac_253")}, DatumSchema);
const Redeemer = () => Data.to({ msg: fromText("Nguyen Hong Sac_253")}, RedeemerSchema);


// Lock UTxO
export async function lockUtxo(lovelace:bigint, policyId:string, tokenName: string, amount: bigint): Promise<string> {
    const unit = policyId + fromText(tokenName);

    const assets = {
        lovelace,
        [unit]: amount,
      };

    const tx = await lucid.newTx()
        .payToContract(alwaysSucceedAddress, { Inline: Datum() }, assets)
        .commit();
    const signedTx = await tx.sign().commit();
    const txHash = await signedTx.submit();

    return txHash;
}
export async function lockUtxoAda(lovelace:bigint): Promise<string> {

    const tx = await lucid.newTx()
        .payToContract(alwaysSucceedAddress, { Inline: Datum() }, { lovelace })
        .commit();
    const signedTx = await tx.sign().commit();
    const txHash = await signedTx.submit();

    return txHash;
}
export async function lockUtxoToken(policyId:string, tokenName: string, amount: bigint): Promise<string> {
    const unit = policyId + fromText(tokenName);

    const tx = await lucid.newTx()
        .payToContract(alwaysSucceedAddress, { Inline: Datum() }, {[unit] : amount})
        .commit();
    const signedTx = await tx.sign().commit();
    const txHash = await signedTx.submit();

    return txHash;
}

// Unlock
export async function unlockUtxo(redeemer: RedeemerSchema): Promise<string> {
    const utxo = (await lucid.utxosAt(alwaysSucceedAddress)).find((utxo) =>
        !utxo.scriptRef && utxo.datum === redeemer
    );
    console.log(`redeemer: ${redeemer}`);
    console.log(utxo);
    if (!utxo) throw new Error(`No UTxo found`);

    const tx = await lucid.newTx()
        .collectFrom([utxo], Redeemer())
        .attachScript(alwaysSucceed)
        .commit();

    const signedTx = await tx.sign().commit();
    const txHash = await signedTx.submit();

    return txHash;
}
// =================End Smart Contract==============

async function main() {
    try {
        // Get slot in and create policy
        const slot_in = BigInt(78722954)//BigInt(lucid.utils.unixTimeToSlots(Date.now() + 1000000));
        console.log(`Slot: ${slot_in}`);

        const mintingScripts = await createMintingScripts(slot_in);
        const policyId = mintingScripts.toHash();

        // Mint 500 Token
        const tokenName = "BK03:253";
        const amount = 500n;
        // const txHash = mintToken(policyId, tokenName, amount, slot_in);
        // console.log(`Mint: ${txHash}`);


        // Lock & Unlock
        // Set lovelace
        const lovelace_lock = 50_000_000n;
        console.log(`Lovelace lock: ${lovelace_lock}`);

        // const locktxHash = await lockUtxo(lovelace_lock, policyId, tokenName, amount);
        // console.log(`Lock UTxO, tx: ${locktxHash}`);

        // Lock 50 ada
        // const locktxHash = await lockUtxoAda(lovelace_lock);
        // console.log(`Lock UTxO, tx: ${locktxHash}`);

        // Lock 500 token
        // const locktxHash = await lockUtxoToken(lovelace_lock);
        // console.log(`Lock UTxO, tx: ${locktxHash}`);

        const redeemTxHash = await unlockUtxo(Redeemer());
        console.log(`Unlock UTxO, tx: ${redeemTxHash}`);
    } catch (error) {
        console.error("Error:", error);
    }
}

main()