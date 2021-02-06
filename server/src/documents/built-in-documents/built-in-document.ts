import {promises as fs} from "fs";
import {startCase} from "lodash";
import {parse} from "path";
import {sha1} from "../../util/sha1";
import {Repository} from "typeorm";
import {Document} from "../../entities/document.entity";
import {DocumentView} from "../../entities/document-view.entity";
import {UploadToS3Service} from "../uploading/upload-to-s3.service";
import {HashService} from "../uploading/hash.service";

export class BuiltInDocument {
    constructor(
        public config: {
            filePath: string,
            global: boolean,
            for_testing: boolean
        }) {
    }

    async fileText() {
        return fs.readFile(this.config.filePath).then(result => JSON.stringify(result.toString()));
    }

    documentLabel() {
        return startCase(parse(this.config.filePath).name);
    }

    async contentHash() {
        return sha1(await this.fileText());
    }

    async upsert(
        {
            documentRepository,
            documentViewRepository
        }:
            {
                documentRepository: Repository<Document>,
                documentViewRepository: Repository<DocumentView>,
            }
    ) {

        const name = this.documentLabel();
        const exactlyTheSameVersion = await documentViewRepository.findOne({
            name: name,
            global: this.config.global,
            for_testing: this.config.for_testing
        });
        if (exactlyTheSameVersion) {
            return;
        }
        const convertedFile = await UploadToS3Service.upload( this.config.filePath, true );//asdfasdfasdfasdf

/*
        const presentButDifferentVersion = await documentViewRepository
            .findOne({name: name, creator_id: null});
*/

        const baseEntity: Partial<Document> = {
            name: name,
            hash: await HashService.hashS3(convertedFile.index().s3Key),
            global: this.config.global,
            creator_id: undefined,
            for_testing: this.config.for_testing,
            filename: convertedFile.index().s3Key
        };

        console.log(`Inserting ${name} for the first time`);
        await documentRepository.insert(baseEntity)
/*
        if (presentButDifferentVersion) {
            console.log(`Hash is different, updating ${presentButDifferentVersion.name}`);
            await documentRepository.insert({
                ...baseEntity,
                document_id: presentButDifferentVersion.rootId()
            });
        } else {
        }
*/
    }
}