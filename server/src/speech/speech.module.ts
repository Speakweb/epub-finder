import { Module } from '@nestjs/common';
import {TypeOrmModule} from "@nestjs/typeorm";
import {JsonCache} from "../entities/JsonCache";

@Module({
    imports: [
        TypeOrmModule.forFeature([JsonCache])
    ],
})
export class SpeechModule {}