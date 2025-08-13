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
