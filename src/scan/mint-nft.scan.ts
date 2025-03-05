import { CronJob } from 'cron';
import { MintNftContract, monadProvider } from '../monad/rcp-monad.js';

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

const _claimFundEvent = async (
  blocks: BlockRange,
  currentBlockNumber?: number
): Promise<void> => {
  try {

    const pastEvents = await MintNftContract.queryFilter("Minted", blocks[0], blocks[1])
    console.log(`pastEvents`, pastEvents?.length)

    if (pastEvents == null || pastEvents.length == 0) {
        return
    }

    for(let i = 0; i < pastEvents.length; i ++){
      const event = pastEvents[i]
      //check transaction existed?



      //confirm mint bot


    }





  } catch (error) {
    console.log(error);
  }
};

let blockStart: number = 6274837;
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


      const currentBlockNumber: number = Number(
        await monadProvider.getBlockNumber()
      );
      if (currentBlockNumber) {
        let blockEnd = currentBlockNumber - delayBlockNumber;
        blockEnd = blockEnd - blockStart > 1000 ? blockStart + 1000 : blockEnd;

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
