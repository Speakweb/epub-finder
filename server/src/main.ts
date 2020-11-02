import {config} from 'dotenv';
config({path: '.env'});
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    await app.listen(process.env.HTTP_PORT);
}
bootstrap();