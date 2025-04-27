import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { VideoService } from '../video/video.service';
import {
  Aptos,
  AptosConfig,
  Network,
  Account,
  Ed25519PrivateKey,
  PrivateKeyVariants,
  PrivateKey,
} from '@aptos-labs/ts-sdk';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class OracleService implements OnModuleInit {
  private client!: Aptos;
  private oracleAccount!: Account;
  private readonly logger = new Logger(OracleService.name);

  constructor(private readonly videoService: VideoService) {}

  async onModuleInit() {
    // 1) Initialize the client
    this.client = new Aptos(
      new AptosConfig({
        network: Network.MAINNET,
        fullnode: process.env.APTOS_RPC_URL!,
      }),
    );

    // 2) Create the private key and Account
    const rawKey = process.env.ORACLE_PRIVATE_KEY!.replace(/^0x/, '');
    const privateKey = new Ed25519PrivateKey(
      PrivateKey.formatPrivateKey(rawKey, PrivateKeyVariants.Ed25519),
    );
    this.oracleAccount = Account.fromPrivateKey({ privateKey });

    this.logger.log(
      `Oracle ready: ${this.oracleAccount.accountAddress.toString()}`,
    );
  }

  async reportUsage(
    videoId: string,
    proofCID: string,
    revenue: number,
    matchedSeconds: number,
  ): Promise<string> {
    // Persist off-chain
    await this.videoService.addProof(
      videoId,
      proofCID,
      revenue,
      matchedSeconds,
    );

    // Build payload
    const sender = this.oracleAccount.accountAddress.toString();
    const txnRequest = await this.client.transaction.build.simple({
      sender,
      data: {
        function: `${sender}::RoyaltyEngine::report_usage`,
        typeArguments: [],
        functionArguments: [videoId, proofCID, revenue, matchedSeconds],
      },
    });

    // Sign & submit
    const senderAuthenticator = this.client.transaction.sign({
      signer: this.oracleAccount,
      transaction: txnRequest,
    });
    const pendingTxn = await this.client.transaction.submit.simple({
      transaction: txnRequest,
      senderAuthenticator,
    });

    // Wait for finality
    await this.client.waitForTransaction({ transactionHash: pendingTxn.hash });
    this.logger.log(`On-chain report submitted: txHash=${pendingTxn.hash}`);
    return pendingTxn.hash;
  }
}
