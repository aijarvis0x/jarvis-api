import { CronJob } from 'cron';
import { MarketContract, MintNftContract, web3 } from '../monad/rcp-monad.js';
import { db } from '../lib/pg.js';
import { MintNftEvent, TxStatus } from '../utils/monad-utils.js';
import { EventLog } from 'web3';
import dayjs from 'dayjs';
import { confirmedMintBot, updateNftOwner } from '../services/bot.service.js';
import { confirmItemCancelledMarket, confirmItemListedMarket, confirmItemSoldMarket, confirmItemUpdatePriceMarket, reUpdateOwner } from '../services/market.service.js';

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
    await _processMarketEvents(blocks, currentBlockNumber)
  } catch (error: any) {
    console.log(error.error);
  }
};


async function _listedNftEvent(event: EventLog) {
  try {
    console.log(event)

    await reUpdateOwner(event)
  } catch (error) {
    throw error
  }
}




const _processMarketEvents = async (
  blocks: BlockRange,
  currentBlockNumber?: number
): Promise<void> => {
  try {
    const pastEvents = await MarketContract.getPastEvents('allEvents', {
      fromBlock: blocks[0],
      toBlock: blocks[1]
    })
    console.log(`_processMarketEvents`, pastEvents.length)



    if (pastEvents == null || pastEvents.length == 0) {
      return
    }

    for (let i = 0; i < pastEvents.length; i++) {

      try {
        const event = pastEvents[i] as EventLog
        // console.log(event)

        switch (event.event) {
          case "Listed":
            await _listedNftEvent(event)
            console.log(`[_listedNftEvent] - done : ${event.transactionHash}`)
            break;

          default:
            break;
        }
      } catch (error) {
        console.log(error)
      }

    }


  } catch (error) {
    console.log(error);
  }
};


const isTxNotExist = async (txHash, logIndex) => {
  try {
    const selectQuery = `
    SELECT *
    FROM transactions
    WHERE tx_hash = $1 AND log_index = $2;
  `;
    const result = await db.pool.query(selectQuery, [txHash, logIndex]);

    if (result.rows.length === 0) {
      return true
    }
    return false
  } catch (error) {
    console.log(error)
    return false
  }
}


let blockStart: number = Number(process.env.RESCAN_LISTING_START) ?? 7096250;
let delayBlockNumber: number = 100;

let paused: boolean = false;


const transactionSuccessJob = new CronJob(
  '*/2 * * * * *',
  async function () {
    try {
      if (paused) {
        return;
      }
      paused = true;

      console.log(`currentBlockNumber`, await web3.eth.getBlockNumber())

      const currentBlockNumber: number = Number(
        await web3.eth.getBlockNumber()
      );
      if (currentBlockNumber) {
        let blockEnd = currentBlockNumber - delayBlockNumber;
        blockEnd = blockEnd - blockStart > 99 ? blockStart + 99 : blockEnd;

        console.log(`currentBlockNumber: ${currentBlockNumber}`);
        // console.log(`blockStart: ${blockStart}`);
        // console.log(`blockEnd: ${blockEnd}`);
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
