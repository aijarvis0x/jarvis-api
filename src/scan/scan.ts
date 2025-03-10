import { CronJob } from 'cron';
import { MintNftContract, web3 } from '../monad/rcp-monad.js';
import { db } from '../lib/pg.js';
import { MintNftEvent, TxStatus } from '../utils/monad-utils.js';
import { EventLog } from 'web3';
import dayjs from 'dayjs';
import { confirmedMintBot } from '../services/bot.service.js';

const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

type BlockRange = [number, number];

const processEventBlock = async (
  blocks: BlockRange,
  currentBlockNumber: number
): Promise<void> => {
  try {
    console.log('\tScan from ', blocks[0], ' to ', blocks[blocks.length - 1])
    await _claimFundEvent(blocks, currentBlockNumber);
    await sleep(1000);
  } catch (error: any) {
    console.log(error.error);
  }
};

export const createTransaction = async (params: {
  txHash,
  status,
  sender,
  recipient,
  nonce,
  contractAddress,
  blockNumber,
  value,
  events,
  logs,
  confirmedAt,
}) => {
  try {
    const insertQuery = `
      INSERT INTO transactions
        (tx_hash, status, sender, recipient, nonce, contract_address, block_number, value, events, logs, confirmed_at)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `;

    const values = Object.values(params);

    await db.pool.query(insertQuery, values);

    return true

  } catch (error) {
    // console.log(error)
    return false
  }
}

const _claimFundEvent = async (
  blocks: BlockRange,
  currentBlockNumber?: number
): Promise<void> => {
  try {


    const pastEvents = await MintNftContract.getPastEvents('allEvents', {
      fromBlock: blocks[0],
      toBlock: blocks[1]
    })
    console.log(`pastEvents`, pastEvents)



    if (pastEvents == null || pastEvents.length == 0) {
      return
    }

    for (let i = 0; i < pastEvents.length; i++) {
      const event = pastEvents[i] as EventLog
      switch (event.event) {
        case "Minted":
          await mintEvent(event)
          break;

        default:
          break;
      }


    }





  } catch (error) {
    console.log(error);
  }
};

const mintEvent = async (event: EventLog) => {

      // confirm mint bot
      await confirmedMintBot(String(event?.transactionHash), event.returnValues as MintNftEvent, event)
}

let blockStart: number = 7096250;
let delayBlockNumber: number = 2;

let paused: boolean = false;


const transactionSuccessJob = new CronJob(
  '*/2 * * * * *',
  async function () {
    try {
      if (paused) {
        return;
      }
      paused = true;

      console.log(`currentBlockNumber` ,await web3.eth.getBlockNumber())

      const currentBlockNumber: number = Number(
        await web3.eth.getBlockNumber()
      );
      if (currentBlockNumber) {
        let blockEnd = currentBlockNumber - delayBlockNumber;
        blockEnd = blockEnd - blockStart > 99 ? blockStart + 99 : blockEnd;

        console.log(`currentBlockNumber: ${currentBlockNumber}`);
        console.log(`blockStart: ${blockStart}`);
        console.log(`blockEnd: ${blockEnd}`);
        await processEventBlock([blockStart, blockEnd], currentBlockNumber);

        blockStart = blockEnd;
      } else {
        await sleep(3000);
      }
      paused = false;
    } catch (e: any) {
      paused = false;
      console.error(e.message);
    }
  },
  null,
  true,
  'America/Los_Angeles'
);

transactionSuccessJob.start();
