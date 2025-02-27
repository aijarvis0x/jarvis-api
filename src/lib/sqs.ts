import {
    SQSClient,
    SendMessageCommand,
    ReceiveMessageCommand,
    DeleteMessageCommand,
} from "@aws-sdk/client-sqs";
import { AWS_ACCESS_KEY, AWS_REGION, AWS_SECRET_ACCESS_KEY } from "../env.js";

export interface SQSConfig {
    queueUrl: string;
    maxMessages?: number;
    waitTimeSeconds?: number;
}

const sqsClient = () =>
    new SQSClient({
        region: AWS_REGION,
        credentials: {
            accessKeyId: AWS_ACCESS_KEY!,
            secretAccessKey: AWS_SECRET_ACCESS_KEY!,
        },
    });

export const sendMessage = async (
    queueUrl: string,
    message: string,
    delaySeconds: number = 0
): Promise<void> => {
    try {
        const client = sqsClient();
        const command = new SendMessageCommand({
            QueueUrl: queueUrl,
            MessageBody: message,
            DelaySeconds: delaySeconds,
        });

        await client.send(command);
        console.log("Message sent successfully:", message);
    } catch (error) {
        console.error("Error sending message:", error);
        throw error;
    }
};

export const receiveMessages = async (
    config: SQSConfig
): Promise<{ Body: string; ReceiptHandle: string }[]> => {
    try {
        const client = sqsClient();
        const command = new ReceiveMessageCommand({
            QueueUrl: config.queueUrl,
            MaxNumberOfMessages: config.maxMessages || 5,
            WaitTimeSeconds: config.waitTimeSeconds || 0,
        });

        const response = await client.send(command);

        if (!response.Messages) {
            console.log(`[${new Date()}] No messages received`);
            return [];
        }

        return response.Messages.map((message) => ({
            Body: message.Body!,
            ReceiptHandle: message.ReceiptHandle!,
        }));
    } catch (error) {
        console.error("Error receiving messages:", error);
        throw error;
    }
};



export const deleteMessage = async (
    queueUrl: string,
    receiptHandle: string,
): Promise<void> => {
    try {
        const client = sqsClient();
        const command = new DeleteMessageCommand({
            QueueUrl: queueUrl,
            ReceiptHandle: receiptHandle,
        });

        await client.send(command);
        console.log("Message deleted successfully.");
    } catch (error) {
        console.error("Error deleting message:", error);
        throw error;
    }
};
