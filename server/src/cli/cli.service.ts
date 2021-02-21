import commandLineArgs from 'command-line-args';
import {InjectRepository} from "@nestjs/typeorm";
import {DocumentView} from "../entities/document-view.entity";
import {Repository} from "typeorm";
import {SimilarityEdge} from "../entities/count-edge.entity";
import {SimilarityEdgeVersion} from "../entities/count-edge.version.entity";
import {DocumentSimilarityService} from "../documents/similarity/document-similarity.service";
import {Inject} from "@nestjs/common";

export class CliService {
    constructor(
        @Inject(DocumentSimilarityService)
        private documentSimilarityService: DocumentSimilarityService
    ) {
    }

    async exec(customArgv?: string[]) {
        const args = commandLineArgs(
            {
                documents: {
                    type: String, multiple: true, defaultOption: true
                }
            },
            {
                argv: customArgv || process.argv
            }
        );
        const [doc1Name, doc2Name] = args.documents;
        console.log(
            await this.documentSimilarityService.compareDocumentsByName(
                doc1Name,
                doc2Name,

            )
        )
    }
}