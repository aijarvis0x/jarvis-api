import { CronJob } from 'cron';
import { MarketContract, MintNftContract, web3 } from '../monad/rcp-monad.js';
import { db } from '../lib/pg.js';
import { MintNftEvent, TxStatus } from '../utils/monad-utils.js';
import { EventLog } from 'web3';
import dayjs from 'dayjs';
import { confirmedMintBot, updateNftOwner } from '../services/bot.service.js';
import { confirmItemCancelledMarket, confirmItemListedMarket, confirmItemSoldMarket, confirmItemUpdatePriceMarket } from '../services/market.service.js';

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
    await _processNftEvents(blocks, currentBlockNumber);
    await _processMarketEvents(blocks, currentBlockNumber)
  } catch (error: any) {
    console.log(error.error);
  }
};


const _processNftEvents = async (
  blocks: BlockRange,
  currentBlockNumber?: number
): Promise<void> => {
  try {


    const pastEvents = await MintNftContract.getPastEvents('allEvents', {
      fromBlock: blocks[0],
      toBlock: blocks[1]
    })
    console.log(`_processNftEvents`, pastEvents.length)



    if (pastEvents == null || pastEvents.length == 0) {
      return
    }

    for (let i = 0; i < pastEvents.length; i++) {

      try {
        const event = pastEvents[i] as EventLog
        switch (event.event) {
          case "Minted":
            await _mintEvent(event)
            console.log(`[mintEvent] - done : ${event.transactionHash}`)
            break;

          case "Transfer":
            await _transferNftEvent(event)
            console.log(`[_transferNftEvent] - done : ${event.transactionHash}`)
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

async function _listedNftEvent(event: EventLog) {
  try {
    console.log(event)
    //check event exist
    if (!(await isTxNotExist(event.transactionHash, event.logIndex))) {
      return console.log(`[_listedNftEvent] Tx ${event.transactionHash} existed`)
    }
    await confirmItemListedMarket(event)
  } catch (error) {
    throw error
  }
}

async function _soldNftEvent(event: EventLog) {
  try {
    console.log(event)
    //check event exist
    if (!(await isTxNotExist(event.transactionHash, event.logIndex))) {
      return console.log(`[_soldNftEvent] Tx ${event.transactionHash} existed`)
    }
    await confirmItemSoldMarket(event)
  } catch (error) {
    throw error
  }
}

async function _updatePriceOrderEvent(event: EventLog) {
  try {
    console.log(event)
    //check event exist
    if (!(await isTxNotExist(event.transactionHash, event.logIndex))) {
      return console.log(`[_updatePriceOrderEvent] Tx ${event.transactionHash} existed`)
    }
    await confirmItemUpdatePriceMarket(event)
  } catch (error) {
    throw error
  }
}

async function _cancelledNftEvent(event: EventLog) {
  try {
    console.log(event)
    //check event exist
    if (!(await isTxNotExist(event.transactionHash, event.logIndex))) {
      return console.log(`[_cancelledNftEvent] Tx ${event.transactionHash} existed`)
    }
    await confirmItemCancelledMarket(event)
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

          case "Sold":
            await _soldNftEvent(event)
            console.log(`[_soldNftEvent] - done : ${event.transactionHash}`)
            break;

          case "Cancelled":
            await _cancelledNftEvent(event)
            console.log(`[_cancelledNftEvent] - done : ${event.transactionHash}`)
            break;

          case "PriceUpdated":
            await _updatePriceOrderEvent(event)
            console.log(`[_updatePriceOrderEvent] - done : ${event.transactionHash}`)
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

const _mintEvent = async (event: EventLog) => {
  // if(Number(event?.returnValues?.tokenId) != 513) {
  //   return
  // }

  console.log(event)

  //check event exist
  if (!(await isTxNotExist(event.transactionHash, event.logIndex))) {
    return console.log(`[mintEvent] Tx ${event.transactionHash} existed`)
  }

  // confirm mint bot
  await confirmedMintBot(String(event?.transactionHash), event.returnValues as MintNftEvent, event)

}

const _transferNftEvent = async (event: EventLog) => {
  // if(Number(event?.returnValues?.tokenId) != 513) {
  //   return
  // }

  console.log(event)
  // check event exist
  if (!(await isTxNotExist(event.transactionHash, event.logIndex))) {
    return console.log(`[_transferNftEvent] Tx ${event.transactionHash} existed`)
  }

  if(event?.returnValues?.to != process.env.NFT_CONTRACT_ADDRESS) {
    await updateNftOwner(event)
  }
}

let blockStart: number = Number(process.env.START_BLOCK) ?? 7096250;
let delayBlockNumber: number = 2;

let paused: boolean = false;


const transactionSuccessJob = new CronJob(
  '*/3 * * * * *',
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
