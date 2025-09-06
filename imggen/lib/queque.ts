import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null, // recommended for BullMQ with Upstash
});

export type AdsJobData = {
  headline: string;
  description: string;
  cta: string;
  iteration: number;          // e.g. 10
  productUrl: string;          // Cloudinary input url
  templateUrl: string;         // Cloudinary input url
  folderName: string;          // Cloudinary output folder name
};

export type AdsJobResult = { urls: string[] };

export const adsQueue = new Queue<AdsJobData, AdsJobResult>("ads-queue", { connection });
