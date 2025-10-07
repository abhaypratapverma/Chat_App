import amqp from 'amqplib';

let channel: amqp.Channel | null = null;

export const connectRabbitMQ = async () => {
    try {
        const connection = await amqp.connect({
            protocol: 'amqp',
            hostname: process.env.Rabbitmq_Host,
            port: 5672,
            username: process.env.Rabbitmq_Username || 'guest',
            password: process.env.Rabbitmq_Password || 'guest',
        });
        channel = await connection.createChannel();
        console.log('✅ RabbitMQ connected successfully');
    } catch (error) {
        console.error('RabbitMQ connection failed:', error);
        process.exit(1);
    }
};

export const publishToQueue = async (queueName: string, message: string) => {
    if (!channel) {
        throw new Error('RabbitMQ channel is not initialized');
    }
    try {
        await channel.assertQueue(queueName, { durable: true });
        channel.sendToQueue(queueName, Buffer.from(message), { persistent: true });
        console.log(`Message sent to queue ${queueName}:`, message);
    } catch (error) {
        console.error('Failed to publish message to RabbitMQ:', error);
    }
}       